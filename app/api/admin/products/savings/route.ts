import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { SavingsProduct } = await import('@/src/entities/SavingsProduct');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(SavingsProduct);
        const products = await productRepo.find({
            where: { tenantId: user.tenantId },
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { SavingsProduct } = await import('@/src/entities/SavingsProduct');
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Parse withdrawal restrictions into JSON object
        const withdrawalRestrictions: any = {};
        if (body.maxWithdrawalsPerMonth) {
            withdrawalRestrictions.maxWithdrawalsPerMonth = parseInt(body.maxWithdrawalsPerMonth);
        }
        if (body.minBalanceAfterWithdrawal) {
            withdrawalRestrictions.minBalanceAfterWithdrawal = parseFloat(body.minBalanceAfterWithdrawal);
        }
        if (body.noticePeriodDays) {
            withdrawalRestrictions.noticePeriodDays = parseInt(body.noticePeriodDays);
        }

        // Convert string booleans to actual booleans
        const isShareCapital = body.isShareCapital === 'true' || body.isShareCapital === true;
        const allowWithdrawals = body.allowWithdrawals === 'true' || body.allowWithdrawals === true;

        const productRepo = AppDataSource.getRepository(SavingsProduct);
        const product = productRepo.create({
            name: body.name,
            code: body.code,
            description: body.description,
            interestRate: parseFloat(body.interestRate),
            minimumBalance: parseFloat(body.minimumBalance || 0),
            maximumBalance: body.maximumBalance ? parseFloat(body.maximumBalance) : undefined,
            isShareCapital,
            allowWithdrawals,
            minMonthlyContribution: parseFloat(body.minMonthlyContribution || 0),
            withdrawalRestrictions: Object.keys(withdrawalRestrictions).length > 0 ? withdrawalRestrictions : undefined,
            interestEarningThreshold: parseFloat(body.interestEarningThreshold || 0),
            status: body.status || 'active',
            flyerUrl: body.flyerUrl,
            tenantId: user.tenantId
        });

        await productRepo.save(product);
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
