import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne } from '@/src/db/query';
import { listLoanProducts, createLoan } from '@/src/db/services/LoanService';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const member = await queryOne<RowDataPacket>('SELECT id, tenantId FROM members WHERE userId = ? LIMIT 1', [user.id]);
        if (!member) return NextResponse.json({ error: 'Member record not found' }, { status: 404 });

        const products = await listLoanProducts(member.tenantId, true);
        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Member loan products API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { productId, principalAmount, termMonths, purpose } = await request.json();
        if (!productId || !principalAmount || !termMonths) {
            return NextResponse.json({ error: 'productId, principalAmount, and termMonths are required' }, { status: 400 });
        }

        const member = await queryOne<RowDataPacket>('SELECT id, tenantId FROM members WHERE userId = ? LIMIT 1', [user.id]);
        if (!member) return NextResponse.json({ error: 'Member record not found' }, { status: 404 });

        const product = await queryOne<RowDataPacket>(
            'SELECT * FROM loan_products WHERE id = ? AND tenantId = ? AND status = \'active\' LIMIT 1',
            [productId, member.tenantId]
        );
        if (!product) return NextResponse.json({ error: 'Loan product not found' }, { status: 404 });

        const principal = Number(principalAmount);
        const term = Number(termMonths);
        const rate = Number(product.interestRate);
        const monthlyRate = (rate / 100) / 12;
        const monthly = monthlyRate > 0
            ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
            : principal / term;

        const loanNumber = `LN-${member.tenantId.substring(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;

        const loan = await createLoan({
            tenantId: member.tenantId,
            memberId: member.id,
            productId,
            loanNumber,
            principalAmount: principal,
            interestRate: rate,
            termMonths: term,
            monthlyInstallment: monthly,
            totalAmountDue: principal,
            purpose: purpose ?? null,
            applicationDate: new Date().toISOString().slice(0, 10),
        });

        return NextResponse.json({ message: 'Loan application submitted successfully', loanId: loan.id });
    } catch (error: any) {
        console.error('Member loan application error:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit application' }, { status: 500 });
    }
}
