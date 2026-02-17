import { AppDataSource } from '@/src/config/database';
import { LoanGuarantor, GuarantorStatus } from '@/src/entities/LoanGuarantor';
import { MemberSavings } from '@/src/entities/MemberSavings';
import { Member } from '@/src/entities/Member';
import { Loan } from '@/src/entities/Loan';

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
    const savingsRepo = AppDataSource.getRepository(MemberSavings);
    const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);

    // Get guarantor's total savings
    const memberSavings = await savingsRepo
        .createQueryBuilder('savings')
        .select('SUM(savings.currentBalance)', 'total')
        .where('savings.memberId = :guarantorId', { guarantorId })
        .getRawOne();

    const totalSavings = Number(memberSavings?.total || 0);

    // Get guarantor's currently locked savings
    const activeGuarantees = await guarantorRepo
        .createQueryBuilder('guarantor')
        .leftJoin('guarantor.loan', 'loan')
        .where('guarantor.guarantorMemberId = :guarantorId', { guarantorId })
        .andWhere('guarantor.status = :status', { status: GuarantorStatus.ACCEPTED })
        .andWhere('loan.status IN (:...activeStatuses)', {
            activeStatuses: ['active', 'disbursed', 'approved', 'committee_approved'],
        })
        .getMany();

    const lockedSavings = activeGuarantees.reduce(
        (sum, g) => sum + Number(g.guaranteedAmount || 0),
        0
    );

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
        return {
            success: false,
            message: capacityCheck.details,
        };
    }

    // Update the guarantor record with pledge details
    const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);
    const guarantor = await guarantorRepo.findOne({
        where: {
            loanId,
            guarantorMemberId: guarantorId,
        },
    });

    if (!guarantor) {
        return {
            success: false,
            message: 'Guarantor record not found',
        };
    }

    guarantor.pledgeAmount = amount;
    guarantor.status = GuarantorStatus.ACCEPTED;
    guarantor.acceptedAt = new Date();

    await guarantorRepo.save(guarantor);

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
    const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);

    const guarantor = await guarantorRepo.findOne({
        where: {
            loanId,
            guarantorMemberId: guarantorId,
        },
    });

    if (!guarantor) {
        return {
            success: false,
            message: 'Guarantor record not found',
        };
    }

    const releasedAmount = Number(guarantor.pledgeAmount || 0);

    guarantor.status = GuarantorStatus.RELEASED;
    guarantor.pledgeAmount = 0;

    await guarantorRepo.save(guarantor);

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
    const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);
    const memberRepo = AppDataSource.getRepository(Member);
    const loanRepo = AppDataSource.getRepository(Loan);

    const guarantor = await guarantorRepo.findOne({
        where: { loanId, guarantorMemberId: guarantorId },
    });

    if (!guarantor) {
        return { success: false, message: 'Guarantor record not found' };
    }

    const member = await memberRepo.findOne({ where: { id: guarantorId } });
    const loan = await loanRepo.findOne({
        where: { id: loanId },
        relations: ['member'],
    });

    if (!member || !loan) {
        return { success: false, message: 'Member or loan not found' };
    }

    // Set response deadline (7 days from now)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    guarantor.notificationSentAt = new Date();
    guarantor.responseDeadline = deadline;
    guarantor.notificationAttempts = (guarantor.notificationAttempts || 0) + 1;
    guarantor.notificationMethod = 'sms'; // TODO: Integrate with SMS service

    await guarantorRepo.save(guarantor);

    // TODO: Actually send SMS/email notification
    // const message = `You have been requested to guarantee a loan of P ${loan.principalAmount} for ${loan.member.fullName}. Please respond by ${deadline.toLocaleDateString()}. Login to KIKA to accept or reject.`;
    // await sendSMS(member.phone, message);

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
    const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);

    const guarantors = await guarantorRepo.find({
        where: { loanId, status: GuarantorStatus.PENDING },
    });

    if (guarantors.length === 0) {
        return {
            success: false,
            message: 'No pending guarantors found',
            guarantorsSent: 0,
        };
    }

    let successCount = 0;
    for (const guarantor of guarantors) {
        const result = await sendGuarantorNotification(
            guarantor.guarantorMemberId,
            loanId
        );
        if (result.success) successCount++;
    }

    return {
        success: true,
        message: `Sent notifications to ${successCount} out of ${guarantors.length} guarantors`,
        guarantorsSent: successCount,
    };
}
