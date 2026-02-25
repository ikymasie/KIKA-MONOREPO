import { query, queryOne, execute } from '@/src/db/query';
import { LoanStatus, WorkflowStage } from '@/src/entities/Loan';
import { WorkflowActionType } from '@/src/entities/LoanWorkflowLog';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

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
    const loan = await queryOne<RowDataPacket & { id: string; status: string; committeeVotes: any }>(
        'SELECT id, status, committeeVotes FROM loans WHERE id = ?',
        [loanId]
    );

    if (!loan) {
        return { success: false, message: 'Loan not found' };
    }

    if (loan.status !== LoanStatus.AWAITING_COMMITTEE) {
        return {
            success: false,
            message: `Cannot vote on loan with status: ${loan.status}`,
        };
    }

    // Parse existing votes
    let votes: CommitteeVote[] = [];
    try {
        votes = typeof loan.committeeVotes === 'string'
            ? JSON.parse(loan.committeeVotes)
            : (loan.committeeVotes || []);
    } catch { votes = []; }

    // Check if user has already voted
    const existingVoteIndex = votes.findIndex(v => v.userId === userId);
    const newVote: CommitteeVote = { userId, vote, notes, timestamp: new Date() };
    if (existingVoteIndex >= 0) {
        votes[existingVoteIndex] = newVote;
    } else {
        votes.push(newVote);
    }

    await execute(
        'UPDATE loans SET committeeVotes = ? WHERE id = ?',
        [JSON.stringify(votes), loanId]
    );

    // Log the vote
    await execute(
        `INSERT INTO loan_workflow_logs (id, loanId, actionType, actionBy, notes, metadata, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
            uuidv4(), loanId, WorkflowActionType.COMMITTEE_VOTE, userId,
            `Voted: ${vote}${notes ? ` - ${notes}` : ''}`,
            JSON.stringify({ vote, notes })
        ]
    );

    return { success: true, message: `Vote recorded: ${vote}` };
}

/**
 * Check if quorum is met for committee voting
 */
export function checkQuorum(votes: CommitteeVote[], requiredQuorum: number = 3): boolean {
    return votes.length >= requiredQuorum;
}

/**
 * Calculate the result of committee voting
 */
export function calculateVoteResult(votes: CommitteeVote[], requiredQuorum: number = 3): VoteResult {
    const approveVotes = votes.filter(v => v.vote === 'approve').length;
    const rejectVotes = votes.filter(v => v.vote === 'reject').length;
    const quorumMet = checkQuorum(votes, requiredQuorum);
    const approved = quorumMet && approveVotes > rejectVotes;

    return { approved, totalVotes: votes.length, approveVotes, rejectVotes, quorumMet, requiredQuorum };
}

/**
 * Finalize committee decision and update loan status
 */
export async function finalizeCommitteeDecision(
    loanId: string,
    requiredQuorum: number = 3
): Promise<{ success: boolean; message: string; result: VoteResult }> {
    const loan = await queryOne<RowDataPacket & { id: string; status: string; committeeVotes: any }>(
        'SELECT id, status, committeeVotes FROM loans WHERE id = ?',
        [loanId]
    );

    if (!loan) {
        return { success: false, message: 'Loan not found', result: {} as VoteResult };
    }

    let votes: CommitteeVote[] = [];
    try {
        votes = typeof loan.committeeVotes === 'string'
            ? JSON.parse(loan.committeeVotes)
            : (loan.committeeVotes || []);
    } catch { votes = []; }

    const result = calculateVoteResult(votes, requiredQuorum);

    if (!result.quorumMet) {
        return {
            success: false,
            message: `Quorum not met. Need ${requiredQuorum} votes, have ${result.totalVotes}`,
            result,
        };
    }

    if (result.approved) {
        await execute(
            'UPDATE loans SET status = ?, workflowStage = ?, committeeApprovalDate = NOW() WHERE id = ?',
            [LoanStatus.COMMITTEE_APPROVED, WorkflowStage.DISBURSEMENT, loanId]
        );
    } else {
        const rejectionReason = `Rejected by credit committee (${result.rejectVotes} reject votes vs ${result.approveVotes} approve votes)`;
        await execute(
            'UPDATE loans SET status = ?, rejectionReason = ? WHERE id = ?',
            [LoanStatus.REJECTED, rejectionReason, loanId]
        );
    }

    const newStatus = result.approved ? LoanStatus.COMMITTEE_APPROVED : LoanStatus.REJECTED;

    // Log the decision
    await execute(
        `INSERT INTO loan_workflow_logs (id, loanId, actionType, fromStatus, toStatus, notes, metadata, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            uuidv4(), loanId, WorkflowActionType.STATUS_CHANGE,
            LoanStatus.AWAITING_COMMITTEE, newStatus,
            result.approved
                ? `Committee approved (${result.approveVotes}/${result.totalVotes} votes)`
                : `Committee rejected (${result.rejectVotes}/${result.totalVotes} votes)`,
            JSON.stringify({ voteResult: result })
        ]
    );

    return {
        success: true,
        message: result.approved ? 'Loan approved by committee' : 'Loan rejected by committee',
        result,
    };
}

/**
 * Generate official minutes document for committee meeting
 */
export async function generateMinutes(loanId: string): Promise<{ success: boolean; minutes: any }> {
    const loan = await queryOne<RowDataPacket & {
        id: string; loanNumber: string; principalAmount: number; termMonths: number;
        interestRate: number; committeeApprovalDate: Date; committeeVotes: any;
        memberFullName: string; memberNumber: string; productName: string;
    }>(
        `SELECT l.id, l.loanNumber, l.principalAmount, l.termMonths, l.interestRate,
                l.committeeApprovalDate, l.committeeVotes,
                m.fullName as memberFullName, m.memberNumber,
                p.name as productName
         FROM loans l
         LEFT JOIN members m ON l.memberId = m.id
         LEFT JOIN loan_products p ON l.productId = p.id
         WHERE l.id = ?`,
        [loanId]
    );

    if (!loan) {
        return { success: false, minutes: null };
    }

    let votes: CommitteeVote[] = [];
    try {
        votes = typeof loan.committeeVotes === 'string'
            ? JSON.parse(loan.committeeVotes)
            : (loan.committeeVotes || []);
    } catch { votes = []; }

    const result = calculateVoteResult(votes);

    const minutes = {
        loanNumber: loan.loanNumber,
        member: { name: loan.memberFullName || 'Unknown', memberNumber: loan.memberNumber || 'Unknown' },
        loanDetails: {
            product: loan.productName || 'Unknown',
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
            votes: votes.map(v => ({ voterId: v.userId, vote: v.vote, notes: v.notes, timestamp: v.timestamp })),
        },
        generatedAt: new Date(),
    };

    return { success: true, minutes };
}
