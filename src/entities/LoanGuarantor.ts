import type { Loan } from './Loan';
import type { Member } from './Member';

export enum GuarantorStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    RELEASED = 'released',
}
export class LoanGuarantor {
    id?: string;
    loanId?: string;
    loan?: Loan;
    guarantorMemberId?: string;
    guarantorMember?: Member;
    guaranteedAmount?: number;
    status?: GuarantorStatus;
    acceptedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    pledgedSavingsId?: string;
    pledgeAmount?: number;
    notificationSentAt?: Date;
    responseDeadline?: Date;
    notificationMethod?: string;
    notificationAttempts?: number;
    createdAt?: Date;
}
