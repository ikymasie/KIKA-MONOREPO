import type { Member } from './Member';
import type { MerchandiseProduct } from './MerchandiseProduct';
import type { Tenant } from './Tenant';

export enum OrderStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    ORDERED = 'ordered',
    IN_TRANSIT = 'in_transit',
    READY_FOR_COLLECTION = 'ready_for_collection',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}
export class MerchandiseOrder {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    orderNumber?: string;
    memberId?: string;
    member?: Member;
    productId?: string;
    product?: MerchandiseProduct;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    termMonths?: number;
    interestRate?: number;
    monthlyInstallment?: number;
    amountPaid?: number;
    outstandingBalance?: number;
    status?: OrderStatus;
    approvalDate?: Date;
    deliveryDate?: Date;
    approvedBy?: string;
    deliveryNotes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
