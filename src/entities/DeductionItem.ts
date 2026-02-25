import type { DeductionRequest } from './DeductionRequest';
import type { Member } from './Member';

export enum ChangeReason {
    NEW_ENROLLMENT = 'new_enrollment',
    STATUS_CHANGE = 'status_change',
    POLICY_MATURITY = 'policy_maturity',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
    AMOUNT_CHANGE = 'amount_change',
}
export class DeductionItem {
    id!: string;
    requestId!: string;
    request!: DeductionRequest;
    memberId!: string;
    member!: Member;
    memberNumber!: string;
    nationalId!: string;
    employeeNumber!: string;
    currentAmount!: number;
    previousAmount!: number;
    changeReason!: ChangeReason;
    breakdown?: {
        savings?: number;
        loanRepayment?: number;
        insurance?: number;
        merchandise?: number;
    };
    isOverLimit!: boolean;
    limitNotes?: string;
    createdAt!: Date;
}
