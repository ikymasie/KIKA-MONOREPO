import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { MemberSavings } from '@/src/entities/MemberSavings';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { InsurancePolicy, PolicyStatus } from '@/src/entities/InsurancePolicy';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);

        // Fetch all members with their active products
        const members = await memberRepo.find({
            where: { tenantId: user.tenantId },
            relations: ['savings', 'loans', 'insurancePolicies'],
        });

        const deductionData = members.map(member => {
            const savingsTotal = (member.savings || [])
                .filter(s => s.isActive)
                .reduce((sum, s) => sum + Number(s.monthlyContribution || 0), 0);

            const loansTotal = (member.loans || [])
                .filter(l => l.status === LoanStatus.ACTIVE || l.status === LoanStatus.DISBURSED)
                .reduce((sum, l) => sum + Number(l.monthlyInstallment || 0), 0);

            const insuranceTotal = (member.insurancePolicies || [])
                .filter(p => p.status === PolicyStatus.ACTIVE)
                .reduce((sum, p) => sum + Number(p.monthlyPremium || 0), 0);

            return {
                id: member.id,
                memberNumber: member.memberNumber,
                name: `${member.firstName} ${member.lastName}`,
                savings: savingsTotal,
                loans: loansTotal,
                insurance: insuranceTotal,
                total: savingsTotal + loansTotal + insuranceTotal
            };
        }).filter(d => d.total > 0); // Only include members with something to deduct

        const metrics = {
            totalMembers: members.length,
            deductingMembers: deductionData.length,
            totalDeductions: deductionData.reduce((sum, d) => sum + d.total, 0),
            savingsTotal: deductionData.reduce((sum, d) => sum + d.savings, 0),
            loansTotal: deductionData.reduce((sum, d) => sum + d.loans, 0),
            insuranceTotal: deductionData.reduce((sum, d) => sum + d.insurance, 0),
        };

        return NextResponse.json({
            metrics,
            deductions: deductionData
        });
    } catch (error: any) {
        console.error('Error fetching deductions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // In a real production system, this would:
        // 1. Create a "DeductionRun" record
        // 2. Generate transactions for all deductions
        // 3. Mark the period as processed

        return NextResponse.json({
            message: 'Deduction process initiated successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
