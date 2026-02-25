import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query, execute } = await import("../../../../../src/db/query");
        const { v4: uuidv4 } = await import('uuid');
        const { getUserFromRequest } = await import("../../../../../lib/auth-server");


        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, initialMonthlyContribution } = body;

        if (!productId || !initialMonthlyContribution) {
            return NextResponse.json({ error: 'Product ID and initial contribution are required' }, { status: 400 });
        }

        const [member] = await query('SELECT id FROM members WHERE userId = ? LIMIT 1', [user.id]) as any;
        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const [product] = await query('SELECT id FROM savings_products WHERE id = ? LIMIT 1', [productId]) as any;
        if (!product) {
            return NextResponse.json({ error: 'Savings product not found' }, { status: 404 });
        }

        const [existing] = await query('SELECT id FROM member_savings WHERE memberId = ? AND productId = ? LIMIT 1', [member.id, product.id]) as any;
        if (existing) {
            return NextResponse.json({ error: 'You already have an active account for this product' }, { status: 400 });
        }

        const accountId = uuidv4();
        await execute(
            `INSERT INTO member_savings (id, memberId, productId, balance, monthlyContribution, isActive, createdAt, updatedAt) 
             VALUES (?, ?, ?, 0, ?, 1, NOW(), NOW())`,
            [accountId, member.id, product.id, Number(initialMonthlyContribution)]
        );

        const [newAccount] = await query('SELECT * FROM member_savings WHERE id = ? LIMIT 1', [accountId]) as any;

        return NextResponse.json({
            message: 'Application successful',
            account: newAccount
        });
    } catch (error: any) {
        console.error('Error applying for savings product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
