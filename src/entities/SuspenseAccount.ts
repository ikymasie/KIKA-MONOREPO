import type { Tenant } from './Tenant';
import type { Member } from './Member';

export enum SuspenseStatus {
    PENDING = 'pending',
    ALLOCATED = 'allocated',
    REFUNDED = 'refunded',
    WRITTEN_OFF = 'written_off',
}
export class SuspenseAccount {
    id!: string;
    tenantId!: string;
    tenant!: Tenant;
    referenceNumber!: string;
    reconciliationBatchId?: string;
    memberNumber?: string;
    nationalId?: string;
    employeeNumber?: string;
    amount!: number;
    month!: number;
    year!: number;
    status!: SuspenseStatus;
    reason?: string;
    allocatedToMemberId?: string;
    allocatedToMember?: Member;
    allocatedBy?: string;
    allocatedAt?: Date;
    notes?: string;
    daysInSuspense!: number;
    createdAt!: Date;
    updatedAt!: Date;
}
