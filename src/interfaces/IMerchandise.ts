export enum MerchandiseProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DISCONTINUED = 'discontinued'
}

export enum OrderStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export interface IMerchandiseProduct {
    id: string;
    tenantId: string;
    vendorId?: string;
    sku: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    imageUrl?: string;
    stockQuantity: number;
    minimumTermMonths: number;
    maximumTermMonths: number;
    allowAutoOrdering: boolean;
    reorderLevel: number;
    status: MerchandiseProductStatus;
    category?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IMerchandiseOrder {
    id: string;
    tenantId: string;
    memberId: string;
    productId: string;
    orderNumber: string;
    quantity: number;
    totalPrice: number;
    termMonths: number;
    monthlyInstallment: number;
    status: OrderStatus;
    rejectionReason?: string;
    deliveryDate?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
