import type { Member } from './Member';
export class MemberBankAccount {
    id?: string;
    memberId?: string;
    member?: Member;
    bankName?: string;
    branchCode?: string;
    accountNumber?: string;
    accountHolderName?: string;
    accountType?: string;
    isPrimary?: boolean;
    isActive?: boolean;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
