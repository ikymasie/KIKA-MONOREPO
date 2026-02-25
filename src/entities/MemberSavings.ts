import type { Member } from './Member';
import type { SavingsProduct } from './SavingsProduct';
export class MemberSavings {
    id?: string;
    memberId?: string;
    member?: Member;
    productId?: string;
    product?: SavingsProduct;
    balance?: number;
    monthlyContribution?: number;
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
