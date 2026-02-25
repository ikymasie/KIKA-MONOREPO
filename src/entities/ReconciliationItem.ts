import type { ReconciliationBatch } from './ReconciliationBatch';
import type { Member } from './Member';

export enum MatchStatus {
    MATCHED = 'matched',
    VARIANCE = 'variance',
    MISSING_IN_MOF = 'missing_in_mof',
    ORPHAN_IN_MOF = 'orphan_in_mof',
}

export enum VarianceReason {
    INSUFFICIENT_FUNDS = 'insufficient_funds',
    MEMBER_TERMINATED = 'member_terminated',
    NET_PAY_TOO_LOW = 'net_pay_too_low',
    AMOUNT_MISMATCH = 'amount_mismatch',
    OTHER = 'other',
}
export class ReconciliationItem {
    id?: string;
    batchId?: string;
    batch?: ReconciliationBatch;
    memberId?: string;
    member?: Member;
    memberNumber?: string;
    nationalId?: string;
    employeeNumber?: string;
    expectedAmount?: number;
    requestedAmount?: number;
    actualAmount?: number;
    variance?: number;
    matchStatus?: MatchStatus;
    varianceReason?: VarianceReason;
    notes?: string;
    requiresManualReview?: boolean;
    journalPosted?: boolean;
    createdAt?: Date;
}
