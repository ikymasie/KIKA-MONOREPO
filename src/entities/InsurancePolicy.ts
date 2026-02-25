import type { Member } from './Member';
import type { InsuranceProduct } from './InsuranceProduct';
import type { InsuranceClaim } from './InsuranceClaim';

export enum PolicyStatus {
    ACTIVE = 'active',
    WAITING_PERIOD = 'waiting_period',
    LAPSED = 'lapsed',
    CANCELLED = 'cancelled',
}
export class InsurancePolicy {
    id?: string;
    policyNumber?: string;
    memberId?: string;
    member?: Member;
    productId?: string;
    product?: InsuranceProduct;
    monthlyPremium?: number;
    coverageAmount?: number;
    startDate?: Date;
    endDate?: Date;
    waitingPeriodEndDate?: Date;
    status?: PolicyStatus;
    monthsPaid?: number;
    claims?: InsuranceClaim[];
    createdAt?: Date;
    updatedAt?: Date;

    get isInWaitingPeriod(): boolean {
        if (!this.waitingPeriodEndDate) return false;
        return new Date() < new Date(this.waitingPeriodEndDate);
    }
}
