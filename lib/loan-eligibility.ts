import { query, queryOne } from '@/src/db/query';
import { LoanStatus } from '@/src/entities/Loan';
import { RowDataPacket } from 'mysql2/promise';

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
    // Get product to find savings multiplier
    const product = await queryOne<RowDataPacket & { savingsMultiplier: number }>(
        'SELECT savingsMultiplier FROM loan_products WHERE id = ?',
        [productId]
    );
    if (!product) throw new Error('Loan product not found');

    // Get member's total savings across all products
    const savingsResult = await queryOne<RowDataPacket & { total: number }>(
        'SELECT COALESCE(SUM(currentBalance), 0) as total FROM member_savings WHERE memberId = ?',
        [memberId]
    );

    const totalSavings = Number(savingsResult?.total || 0);
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
    const activeLoans = await query<RowDataPacket & { loanNumber: string; outstandingBalance: number }>(
        `SELECT loanNumber, outstandingBalance FROM loans 
         WHERE memberId = ? AND tenantId = ? AND status IN (?, ?)`,
        [memberId, tenantId, LoanStatus.ACTIVE, LoanStatus.DISBURSED]
    );

    const passed = activeLoans.length === 0;

    return {
        passed,
        details: passed ? 'No active loans found' : `Member has ${activeLoans.length} active loan(s)`,
        activeLoansCount: activeLoans.length,
        activeLoans: activeLoans.map(loan => ({
            loanNumber: loan.loanNumber || 'UNKNOWN',
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
    const member = await queryOne<RowDataPacket & { joinDate: Date }>(
        'SELECT joinDate FROM members WHERE id = ?',
        [memberId]
    );

    if (!member) throw new Error('Member not found');

    const joinDate = new Date(member.joinDate!);
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
export async function runFullEligibilityCheck(loanId: string): Promise<EligibilityCheckResult> {
    const loan = await queryOne<RowDataPacket & {
        id: string; memberId: string; productId: string;
        principalAmount: number; tenantId: string;
    }>(
        'SELECT id, memberId, productId, principalAmount, tenantId FROM loans WHERE id = ?',
        [loanId]
    );

    if (!loan) throw new Error('Loan not found');

    const [savingsRatioCheck, activeLoanCheck, membershipDurationCheck] = await Promise.all([
        checkSavingsRatio(loan.memberId, Number(loan.principalAmount), loan.productId),
        checkActiveLoanStatus(loan.memberId, loan.tenantId),
        checkMembershipDuration(loan.memberId),
    ]);

    const passed = savingsRatioCheck.passed && activeLoanCheck.passed && membershipDurationCheck.passed;

    return {
        passed,
        checks: { savingsRatio: savingsRatioCheck, activeLoan: activeLoanCheck, membershipDuration: membershipDurationCheck },
        timestamp: new Date(),
    };
}
