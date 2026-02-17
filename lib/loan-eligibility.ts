import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { Loan } from '@/src/entities/Loan';
import { LoanProduct } from '@/src/entities/LoanProduct';
import { MemberSavings } from '@/src/entities/MemberSavings';
import { LoanStatus } from '@/src/entities/Loan';

export interface EligibilityCheckResult {
    passed: boolean;
    checks: {
        savingsRatio: {
            passed: boolean;
            details: string;
            memberSavings: number;
            requiredSavings: number;
            maxLoanAmount: number;
        };
        activeLoan: {
            passed: boolean;
            details: string;
            activeLoansCount: number;
            activeLoans?: Array<{ loanNumber: string; outstandingBalance: number }>;
        };
        membershipDuration: {
            passed: boolean;
            details: string;
            joinDate: Date;
            monthsAsMember: number;
            requiredMonths: number;
        };
    };
    timestamp: Date;
}

/**
 * Check if member has sufficient savings for the requested loan amount
 */
export async function checkSavingsRatio(
    memberId: string,
    loanAmount: number,
    productId: string
): Promise<EligibilityCheckResult['checks']['savingsRatio']> {
    const savingsRepo = AppDataSource.getRepository(MemberSavings);
    const productRepo = AppDataSource.getRepository(LoanProduct);

    // Get product to find savings multiplier
    const product = await productRepo.findOne({ where: { id: productId } });
    if (!product) {
        throw new Error('Loan product not found');
    }

    // Get member's total savings across all products
    const memberSavings = await savingsRepo
        .createQueryBuilder('savings')
        .select('SUM(savings.currentBalance)', 'total')
        .where('savings.memberId = :memberId', { memberId })
        .getRawOne();

    const totalSavings = Number(memberSavings?.total || 0);
    const savingsMultiplier = Number(product.savingsMultiplier || 3);
    const maxLoanAmount = totalSavings * savingsMultiplier;
    const requiredSavings = loanAmount / savingsMultiplier;

    const passed = loanAmount <= maxLoanAmount;

    return {
        passed,
        details: passed
            ? `Member has sufficient savings (P ${totalSavings.toLocaleString()}) for loan of P ${loanAmount.toLocaleString()}`
            : `Insufficient savings. Member has P ${totalSavings.toLocaleString()} but needs P ${requiredSavings.toLocaleString()} for a loan of P ${loanAmount.toLocaleString()}`,
        memberSavings: totalSavings,
        requiredSavings,
        maxLoanAmount,
    };
}

/**
 * Check if member has any active loans
 */
export async function checkActiveLoanStatus(
    memberId: string,
    tenantId: string
): Promise<EligibilityCheckResult['checks']['activeLoan']> {
    const loanRepo = AppDataSource.getRepository(Loan);

    const activeLoans = await loanRepo.find({
        where: [
            { memberId, tenantId, status: LoanStatus.ACTIVE },
            { memberId, tenantId, status: LoanStatus.DISBURSED },
        ],
        select: ['loanNumber', 'outstandingBalance'],
    });

    const passed = activeLoans.length === 0;

    return {
        passed,
        details: passed
            ? 'No active loans found'
            : `Member has ${activeLoans.length} active loan(s)`,
        activeLoansCount: activeLoans.length,
        activeLoans: activeLoans.map(loan => ({
            loanNumber: loan.loanNumber,
            outstandingBalance: Number(loan.outstandingBalance),
        })),
    };
}

/**
 * Check if member has been a member for the required duration
 */
export async function checkMembershipDuration(
    memberId: string,
    requiredMonths: number = 6
): Promise<EligibilityCheckResult['checks']['membershipDuration']> {
    const memberRepo = AppDataSource.getRepository(Member);

    const member = await memberRepo.findOne({
        where: { id: memberId },
        select: ['joinDate'],
    });

    if (!member) {
        throw new Error('Member not found');
    }

    const joinDate = new Date(member.joinDate);
    const today = new Date();
    const monthsDiff =
        (today.getFullYear() - joinDate.getFullYear()) * 12 +
        (today.getMonth() - joinDate.getMonth());

    const passed = monthsDiff >= requiredMonths;

    return {
        passed,
        details: passed
            ? `Member has been active for ${monthsDiff} months`
            : `Member has only been active for ${monthsDiff} months, requires ${requiredMonths} months`,
        joinDate,
        monthsAsMember: monthsDiff,
        requiredMonths,
    };
}

/**
 * Run full eligibility check for a loan application
 */
export async function runFullEligibilityCheck(
    loanId: string
): Promise<EligibilityCheckResult> {
    const loanRepo = AppDataSource.getRepository(Loan);

    const loan = await loanRepo.findOne({
        where: { id: loanId },
        relations: ['member', 'product'],
    });

    if (!loan) {
        throw new Error('Loan not found');
    }

    // Run all checks
    const savingsRatioCheck = await checkSavingsRatio(
        loan.memberId,
        Number(loan.principalAmount),
        loan.productId
    );

    const activeLoanCheck = await checkActiveLoanStatus(
        loan.memberId,
        loan.tenantId
    );

    const membershipDurationCheck = await checkMembershipDuration(loan.memberId);

    // Determine overall pass/fail
    const passed =
        savingsRatioCheck.passed &&
        activeLoanCheck.passed &&
        membershipDurationCheck.passed;

    return {
        passed,
        checks: {
            savingsRatio: savingsRatioCheck,
            activeLoan: activeLoanCheck,
            membershipDuration: membershipDurationCheck,
        },
        timestamp: new Date(),
    };
}
