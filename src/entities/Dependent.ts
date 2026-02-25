import type { Member } from './Member';

export enum DependentRelationship {
    SPOUSE = 'spouse',
    CHILD = 'child',
    PARENT = 'parent',
    SIBLING = 'sibling',
    EXTENDED_FAMILY = 'extended_family',
}
export class Dependent {
    id?: string;
    memberId?: string;
    member?: Member;
    firstName?: string;
    lastName?: string;
    relationship?: DependentRelationship;
    dateOfBirth?: Date;
    nationalId?: string;
    gender?: string;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;

    get age(): number | null {
        if (!this.dateOfBirth) return null;
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}
