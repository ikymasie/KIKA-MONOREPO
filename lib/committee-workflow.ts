import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus, WorkflowStage } from '@/src/entities/Loan';
import { LoanWorkflowLog, WorkflowActionType } from '@/src/entities/LoanWorkflowLog';

export interface CommitteeVote {
    userId: string;
    vote: 'approve' | 'reject';
    notes?: string;
    timestamp: Date;
}

export interface VoteResult {
    approved: boolean;
    totalVotes: number;
    approveVotes: number;
    rejectVotes: number;
    quorumMet: boolean;
    requiredQuorum: number;
}

/**
 * Record a committee member's vote
 */
export async function recordVote(
    loanId: string,
    userId: string,
    vote: 'approve' | 'reject',
    notes?: string
): Promise<{ success: boolean; message: string }> {
    const loanRepo = AppDataSource.getRepository(Loan);

    const loan = await loanRepo.findOne({ where: { id: loanId } });

    if (!loan) {
        return { success: false, message: 'Loan not found' };
    }

    if (loan.status !== LoanStatus.AWAITING_COMMITTEE) {
        return {
            success: false,
            message: `Cannot vote on loan with status: ${loan.status}`,
        };
    }

    // Initialize votes array if it doesn't exist
    const votes = (loan.committeeVotes || []) as CommitteeVote[];

    // Check if user has already voted
    const existingVoteIndex = votes.findIndex(v => v.userId === userId);
    if (existingVoteIndex >= 0) {
        // Update existing vote
        votes[existingVoteIndex] = {
            userId,
            vote,
            notes,
            timestamp: new Date(),
        };
    } else {
        // Add new vote
        votes.push({
            userId,
            vote,
            notes,
            timestamp: new Date(),
        });
    }

    loan.committeeVotes = votes as any;
    await loanRepo.save(loan);

    // Log the vote
    const logRepo = AppDataSource.getRepository(LoanWorkflowLog);
    await logRepo.save({
        loanId,
        actionType: WorkflowActionType.COMMITTEE_VOTE,
        actionBy: userId,
        notes: `Voted: ${vote}${notes ? ` - ${notes}` : ''}`,
        metadata: { vote, notes },
    } as any);

    return {
        success: true,
        message: `Vote recorded: ${vote}`,
    };
}

/**
 * Check if quorum is met for committee voting
 */
export function checkQuorum(
    votes: CommitteeVote[],
    requiredQuorum: number = 3
): boolean {
    return votes.length >= requiredQuorum;
}

/**
 * Calculate the result of committee voting
 */
export function calculateVoteResult(
    votes: CommitteeVote[],
    requiredQuorum: number = 3
): VoteResult {
    const approveVotes = votes.filter(v => v.vote === 'approve').length;
    const rejectVotes = votes.filter(v => v.vote === 'reject').length;
    const quorumMet = checkQuorum(votes, requiredQuorum);

    // Loan is approved if quorum is met and majority voted to approve
    const approved = quorumMet && approveVotes > rejectVotes;

    return {
        approved,
        totalVotes: votes.length,
        approveVotes,
        rejectVotes,
        quorumMet,
        requiredQuorum,
    };
}

/**
 * Finalize committee decision and update loan status
 */
export async function finalizeCommitteeDecision(
    loanId: string,
    requiredQuorum: number = 3
): Promise<{ success: boolean; message: string; result: VoteResult }> {
    const loanRepo = AppDataSource.getRepository(Loan);

    const loan = await loanRepo.findOne({ where: { id: loanId } });

    if (!loan) {
        return {
            success: false,
            message: 'Loan not found',
            result: {} as VoteResult,
        };
    }

    const votes = (loan.committeeVotes || []) as CommitteeVote[];
    const result = calculateVoteResult(votes, requiredQuorum);

    if (!result.quorumMet) {
        return {
            success: false,
            message: `Quorum not met. Need ${requiredQuorum} votes, have ${result.totalVotes}`,
            result,
        };
    }

    // Update loan status based on vote result
    if (result.approved) {
        loan.status = LoanStatus.COMMITTEE_APPROVED;
        loan.workflowStage = WorkflowStage.DISBURSEMENT;
        loan.committeeApprovalDate = new Date();
    } else {
        loan.status = LoanStatus.REJECTED;
        loan.rejectionReason = `Rejected by credit committee (${result.rejectVotes} reject votes vs ${result.approveVotes} approve votes)`;
    }

    await loanRepo.save(loan);

    // Log the decision
    const logRepo = AppDataSource.getRepository(LoanWorkflowLog);
    await logRepo.save({
        loanId,
        actionType: WorkflowActionType.STATUS_CHANGE,
        fromStatus: LoanStatus.AWAITING_COMMITTEE,
        toStatus: loan.status,
        notes: result.approved
            ? `Committee approved (${result.approveVotes}/${result.totalVotes} votes)`
            : `Committee rejected (${result.rejectVotes}/${result.totalVotes} votes)`,
        metadata: { voteResult: result },
    } as any);

    return {
        success: true,
        message: result.approved
            ? 'Loan approved by committee'
            : 'Loan rejected by committee',
        result,
    };
}

/**
 * Generate official minutes document for committee meeting
 */
export async function generateMinutes(
    loanId: string
): Promise<{ success: boolean; minutes: any }> {
    const loanRepo = AppDataSource.getRepository(Loan);

    const loan = await loanRepo.findOne({
        where: { id: loanId },
        relations: ['member', 'product'],
    });

    if (!loan) {
        return { success: false, minutes: null };
    }

    const votes = (loan.committeeVotes || []) as CommitteeVote[];
    const result = calculateVoteResult(votes);

    const minutes = {
        loanNumber: loan.loanNumber,
        member: {
            name: loan.member.fullName,
            memberNumber: loan.member.memberNumber,
        },
        loanDetails: {
            product: loan.product.name,
            principalAmount: Number(loan.principalAmount),
            termMonths: loan.termMonths,
            interestRate: Number(loan.interestRate),
        },
        committeeVoting: {
            meetingDate: loan.committeeApprovalDate || new Date(),
            totalVotes: result.totalVotes,
            approveVotes: result.approveVotes,
            rejectVotes: result.rejectVotes,
            quorumMet: result.quorumMet,
            decision: result.approved ? 'APPROVED' : 'REJECTED',
            votes: votes.map(v => ({
                voterId: v.userId,
                vote: v.vote,
                notes: v.notes,
                timestamp: v.timestamp,
            })),
        },
        generatedAt: new Date(),
    };

    return {
        success: true,
        minutes,
    };
}
