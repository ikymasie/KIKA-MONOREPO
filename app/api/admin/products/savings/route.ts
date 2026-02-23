import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listSavingsProducts } from '@/src/db/services/SavingsService';
import { execute, queryOne } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const products = await listSavingsProducts(user.tenantId!, false);
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

        const isShareCapital = body.isShareCapital === true || body.isShareCapital === 'true';
        const allowWithdrawals = body.allowWithdrawals !== false && body.allowWithdrawals !== 'false';

        const withdrawalRestrictions: Record<string, unknown> = {};
        if (body.maxWithdrawalsPerMonth) withdrawalRestrictions.maxWithdrawalsPerMonth = parseInt(body.maxWithdrawalsPerMonth);
        if (body.minBalanceAfterWithdrawal) withdrawalRestrictions.minBalanceAfterWithdrawal = parseFloat(body.minBalanceAfterWithdrawal);
        if (body.noticePeriodDays) withdrawalRestrictions.noticePeriodDays = parseInt(body.noticePeriodDays);

        const id = uuidv4();
        await execute(
            `INSERT INTO savings_products (
                id, tenantId, name, code, description, interestRate, minimumBalance, maximumBalance,
                isShareCapital, allowWithdrawals, minMonthlyContribution, withdrawalRestrictions,
                interestEarningThreshold, status, flyerUrl, createdAt, updatedAt
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                id, user.tenantId, body.name, body.code,
                body.description ?? null,
                parseFloat(body.interestRate ?? 0),
                parseFloat(body.minimumBalance ?? 0),
                body.maximumBalance ? parseFloat(body.maximumBalance) : null,
                isShareCapital ? 1 : 0,
                allowWithdrawals ? 1 : 0,
                parseFloat(body.minMonthlyContribution ?? 0),
                Object.keys(withdrawalRestrictions).length ? JSON.stringify(withdrawalRestrictions) : null,
                parseFloat(body.interestEarningThreshold ?? 0),
                body.status ?? 'active',
                body.flyerUrl ?? null,
            ]
        );

        const created = await queryOne('SELECT * FROM savings_products WHERE id = ? LIMIT 1', [id]);
        return NextResponse.json(created);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
