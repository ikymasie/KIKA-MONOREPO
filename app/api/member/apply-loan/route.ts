import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { LoanProduct } from '@/src/entities/LoanProduct';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(LoanProduct);

        // Find member to get tenantId
        const memberRepo = AppDataSource.getRepository(Member);
        const member = await memberRepo.findOne({ where: { userId: user.id } });

        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        const products = await productRepo.find({
            where: { tenantId: member.tenantId },
            order: { name: 'ASC' }
        });

        return NextResponse.json(products);
    } catch (error: any) {
        console.error('Member loan products API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, principalAmount, termMonths, purpose } = body;

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const productRepo = AppDataSource.getRepository(LoanProduct);
        const loanRepo = AppDataSource.getRepository(Loan);

        const member = await memberRepo.findOne({
            where: { userId: user.id },
            relations: ['tenant']
        });

        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        const product = await productRepo.findOne({
            where: { id: productId, tenantId: member.tenantId }
        });

        if (!product) {
            return NextResponse.json({ error: 'Loan product not found' }, { status: 404 });
        }

        // Create loan application
        const loan = new Loan();
        loan.tenantId = member.tenantId;
        loan.memberId = member.id;
        loan.productId = product.id;
        loan.principalAmount = Number(principalAmount);
        loan.interestRate = Number(product.interestRate);
        loan.termMonths = Number(termMonths);
        loan.purpose = purpose;
        loan.status = LoanStatus.PENDING;
        loan.applicationDate = new Date();

        // Basic calculation for monthly installment (Amortized approx)
        const monthlyRate = (loan.interestRate / 100) / 12;
        if (monthlyRate > 0) {
            loan.monthlyInstallment = (loan.principalAmount * monthlyRate * Math.pow(1 + monthlyRate, loan.termMonths)) / (Math.pow(1 + monthlyRate, loan.termMonths) - 1);
        } else {
            loan.monthlyInstallment = loan.principalAmount / loan.termMonths;
        }

        loan.loanNumber = `LN-${member.tenantId.substring(0, 4)}-${Date.now().toString().slice(-6)}`;
        loan.outstandingBalance = loan.principalAmount;

        await loanRepo.save(loan);

        return NextResponse.json({ message: 'Loan application submitted successfully', loanId: loan.id });
    } catch (error: any) {
        console.error('Member loan application error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit application' },
            { status: 500 }
        );
    }
}
