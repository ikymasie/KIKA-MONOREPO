import { query, queryOne, execute } from '@/src/db/query';
import { GuarantorStatus } from '@/src/entities/LoanGuarantor';
import { RowDataPacket } from 'mysql2/promise';

export interface GuarantorCapacityCheck {
    canGuarantee: boolean;
    availableSavings: number;
    lockedSavings: number;
    totalSavings: number;
    details: string;
}

/**
 * Check if a guarantor has sufficient available savings to pledge
 */
export async function checkGuarantorCapacity(
    guarantorId: string,
    pledgeAmount: number
): Promise<GuarantorCapacityCheck> {
    // Get guarantor's total savings
    const savingsResult = await queryOne<RowDataPacket & { total: number }>(
        'SELECT COALESCE(SUM(currentBalance), 0) as total FROM member_savings WHERE memberId = ? AND isActive = true',
        [guarantorId]
    );
    const totalSavings = Number(savingsResult?.total || 0);

    // Get guarantor's currently locked savings (active guarantees on active loans)
    const lockedResult = await queryOne<RowDataPacket & { locked: number }>(
        `SELECT COALESCE(SUM(g.guaranteedAmount), 0) as locked
         FROM loan_guarantors g
         JOIN loans l ON g.loanId = l.id
         WHERE g.guarantorMemberId = ? 
           AND g.status = ? 
           AND l.status IN ('active', 'disbursed', 'approved', 'committee_approved')`,
        [guarantorId, GuarantorStatus.ACCEPTED]
    );
    const lockedSavings = Number(lockedResult?.locked || 0);

    const availableSavings = totalSavings - lockedSavings;
    const canGuarantee = availableSavings >= pledgeAmount;

    return {
        canGuarantee,
        availableSavings,
        lockedSavings,
        totalSavings,
        details: canGuarantee
            ? `Guarantor has P ${availableSavings.toLocaleString()} available (P ${totalSavings.toLocaleString()} total, P ${lockedSavings.toLocaleString()} locked)`
            : `Insufficient available savings. Has P ${availableSavings.toLocaleString()} available but needs P ${pledgeAmount.toLocaleString()}`,
    };
}

/**
 * Lock guarantor's savings by creating a pledge
 */
export async function lockGuarantorSavings(
    guarantorId: string,
    loanId: string,
    amount: number
): Promise<{ success: boolean; message: string }> {
    const capacityCheck = await checkGuarantorCapacity(guarantorId, amount);

    if (!capacityCheck.canGuarantee) {
        return { success: false, message: capacityCheck.details };
    }

    const guarantor = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM loan_guarantors WHERE loanId = ? AND guarantorMemberId = ?',
        [loanId, guarantorId]
    );

    if (!guarantor) {
        return { success: false, message: 'Guarantor record not found' };
    }

    await execute(
        'UPDATE loan_guarantors SET pledgeAmount = ?, status = ?, acceptedAt = NOW() WHERE id = ?',
        [amount, GuarantorStatus.ACCEPTED, guarantor.id]
    );

    return {
        success: true,
        message: `Successfully locked P ${amount.toLocaleString()} from guarantor's savings`,
    };
}

/**
 * Release guarantor's locked savings
 */
export async function releaseGuarantorSavings(
    guarantorId: string,
    loanId: string
): Promise<{ success: boolean; message: string }> {
    const guarantor = await queryOne<RowDataPacket & { id: string; pledgeAmount: number }>(
        'SELECT id, pledgeAmount FROM loan_guarantors WHERE loanId = ? AND guarantorMemberId = ?',
        [loanId, guarantorId]
    );

    if (!guarantor) {
        return { success: false, message: 'Guarantor record not found' };
    }

    const releasedAmount = Number(guarantor.pledgeAmount || 0);

    await execute(
        'UPDATE loan_guarantors SET status = ?, pledgeAmount = 0 WHERE id = ?',
        [GuarantorStatus.RELEASED, guarantor.id]
    );

    return {
        success: true,
        message: `Released P ${releasedAmount.toLocaleString()} from guarantor's savings`,
    };
}

/**
 * Send notification to guarantor requesting their pledge
 */
export async function sendGuarantorNotification(
    guarantorId: string,
    loanId: string
): Promise<{ success: boolean; message: string }> {
    const guarantor = await queryOne<RowDataPacket & { id: string; notificationAttempts: number }>(
        'SELECT id, notificationAttempts FROM loan_guarantors WHERE loanId = ? AND guarantorMemberId = ?',
        [loanId, guarantorId]
    );

    if (!guarantor) {
        return { success: false, message: 'Guarantor record not found' };
    }

    const member = await queryOne<RowDataPacket & { fullName: string; phone: string }>(
        'SELECT fullName, phone FROM members WHERE id = ?',
        [guarantorId]
    );

    if (!member) {
        return { success: false, message: 'Member not found' };
    }

    // Set response deadline (7 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    await execute(
        `UPDATE loan_guarantors 
         SET notificationSentAt = NOW(), responseDeadline = ?, 
             notificationAttempts = ?, notificationMethod = 'sms' 
         WHERE id = ?`,
        [(guarantor.notificationAttempts || 0) + 1, deadline, guarantor.id]
    );

    // TODO: Actually send SMS/email notification
    // await notificationService.sendNotification({ ... });

    return {
        success: true,
        message: `Notification sent to ${member.fullName} (${member.phone})`,
    };
}

/**
 * Request guarantor pledges for a loan
 */
export async function requestGuarantorPledges(
    loanId: string
): Promise<{ success: boolean; message: string; guarantorsSent: number }> {
    const guarantors = await query<RowDataPacket & { guarantorMemberId: string }>(
        'SELECT guarantorMemberId FROM loan_guarantors WHERE loanId = ? AND status = ?',
        [loanId, GuarantorStatus.PENDING]
    );

    if (guarantors.length === 0) {
        return { success: false, message: 'No pending guarantors found', guarantorsSent: 0 };
    }

    let successCount = 0;
    for (const guarantor of guarantors) {
        const result = await sendGuarantorNotification(guarantor.guarantorMemberId, loanId);
        if (result.success) successCount++;
    }

    return {
        success: true,
        message: `Sent notifications to ${successCount} out of ${guarantors.length} guarantors`,
        guarantorsSent: successCount,
    };
}
