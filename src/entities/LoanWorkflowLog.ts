import type { Loan } from './Loan';
import type { User } from './User';

export enum WorkflowActionType {
    ELIGIBILITY_CHECK = 'eligibility_check',
    GUARANTOR_PLEDGE = 'guarantor_pledge',
    GUARANTOR_REJECT = 'guarantor_reject',
    OFFICER_ASSIGN = 'officer_assign',
    OFFICER_REVIEW = 'officer_review',
    COMMITTEE_VOTE = 'committee_vote',
    DISBURSEMENT = 'disbursement',
    STATUS_CHANGE = 'status_change',
    REJECTION = 'rejection',
}
export class LoanWorkflowLog {
    id?: string;
    loanId?: string;
    loan?: Loan;
    fromStatus?: string;
    toStatus?: string;
    actionType?: WorkflowActionType;
    actionBy?: string;
    actionByUser?: User;
    notes?: string;
    metadata?: {
        eligibilityResults?: any;
        guarantorId?: string;
        committeeVote?: any;
        disbursementDetails?: any;
        [key: string]: any;
    };
    timestamp?: Date;
}
