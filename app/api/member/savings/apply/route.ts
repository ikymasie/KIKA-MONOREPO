import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { MemberSavings } = await import('@/src/entities/MemberSavings');
        const { Member } = await import('@/src/entities/Member');
        const { SavingsProduct } = await import('@/src/entities/SavingsProduct');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, initialMonthlyContribution } = body;

        if (!productId || !initialMonthlyContribution) {
            return NextResponse.json({ error: 'Product ID and initial contribution are required' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Find the member record for this user
        const memberRepo = AppDataSource.getRepository(Member);
        const member = await memberRepo.findOne({
            where: { userId: user.id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const productRepo = AppDataSource.getRepository(SavingsProduct);
        const product = await productRepo.findOne({ where: { id: productId } });

        if (!product) {
            return NextResponse.json({ error: 'Savings product not found' }, { status: 404 });
        }

        // Check if member already has this product
        const savingsRepo = AppDataSource.getRepository(MemberSavings);
        const existing = await savingsRepo.findOne({
            where: { memberId: member.id, productId: product.id }
        });

        if (existing) {
            return NextResponse.json({ error: 'You already have an active account for this product' }, { status: 400 });
        }

        // Create the new savings account
        // In a real system, this might go through an approval workflow, 
        // but for now we'll allow direct activation.
        const newAccount = savingsRepo.create({
            memberId: member.id,
            productId: product.id,
            balance: 0,
            monthlyContribution: Number(initialMonthlyContribution),
            isActive: true
        });

        await savingsRepo.save(newAccount);

        return NextResponse.json({
            message: 'Application successful',
            account: newAccount
        });
    } catch (error: any) {
        console.error('Error applying for savings product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
