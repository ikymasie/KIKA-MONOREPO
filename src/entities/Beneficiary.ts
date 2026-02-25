import type { Member } from './Member';

export enum BeneficiaryRelationship {
    SPOUSE = 'spouse',
    CHILD = 'child',
    PARENT = 'parent',
    SIBLING = 'sibling',
    OTHER = 'other',
}
export class Beneficiary {
    id: string;
    memberId?: string;
    member?: Member;
    firstName?: string;
    lastName?: string;
    relationship?: BeneficiaryRelationship;
    dateOfBirth?: Date;
    nationalId?: string;
    phone?: string;
    address?: string;
    allocationPercentage?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
