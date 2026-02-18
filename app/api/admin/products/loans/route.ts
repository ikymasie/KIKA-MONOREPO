import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { LoanProduct } = await import('@/src/entities/LoanProduct');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(LoanProduct);
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
        const { LoanProduct } = await import('@/src/entities/LoanProduct');
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(LoanProduct);
        const product = productRepo.create({
            ...body,
            tenantId: user.tenantId
        });

        await productRepo.save(product);
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
