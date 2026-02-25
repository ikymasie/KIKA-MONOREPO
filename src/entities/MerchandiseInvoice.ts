import type { MerchandiseOrder } from './MerchandiseOrder';
import type { Vendor } from './Vendor';
import type { Tenant } from './Tenant';

export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    PAID = 'paid',
    CANCELLED = 'cancelled',
    OVERDUE = 'overdue',
}
export class MerchandiseInvoice {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    vendorId?: string;
    vendor?: Vendor;
    orderId?: string;
    order?: MerchandiseOrder;
    invoiceNumber?: string;
    amount?: number;
    dueDate?: Date;
    status?: InvoiceStatus;
    paymentReference?: string;
    paidAt?: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
