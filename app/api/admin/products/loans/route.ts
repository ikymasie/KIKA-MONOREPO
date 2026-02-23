import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listLoanProducts } from '@/src/db/services/LoanService';
import { execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const products = await listLoanProducts(user.tenantId!, false);
        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const id = uuidv4();

        await execute(
            `INSERT INTO loan_products (
                id, tenantId, name, code, description, interestRate, interestMethod,
                minimumAmount, maximumAmount, minimumTermMonths, maximumTermMonths,
                requiredGuarantors, processingFeePercentage, insuranceFeePercentage,
                requiresCollateral, penaltyRate, savingsMultiplier, maxDurationMonths,
                gracePeriodDays, status, flyerUrl, createdAt, updatedAt
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id, user.tenantId, body.name, body.code, body.description ?? null,
                body.interestRate, body.interestMethod ?? 'reducing_balance',
                body.minimumAmount, body.maximumAmount,
                body.minimumTermMonths, body.maximumTermMonths,
                body.requiredGuarantors ?? 0,
                body.processingFeePercentage ?? null, body.insuranceFeePercentage ?? null,
                body.requiresCollateral ? 1 : 0,
                body.penaltyRate ?? null,
                body.savingsMultiplier ?? 3, body.maxDurationMonths ?? 12,
                body.gracePeriodDays ?? 0,
                body.status ?? 'active',
                body.flyerUrl ?? null,
            ]
        );

        const { queryOne } = await import('@/src/db/query');
        const created = await queryOne('SELECT * FROM loan_products WHERE id = ? LIMIT 1', [id]);
        return NextResponse.json(created);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
