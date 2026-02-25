import type { Tenant } from './Tenant';
import type { Vendor } from './Vendor';

export enum MerchandiseProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out_of_stock',
}

export enum MerchandiseCategory {
    ELECTRONICS = 'electronics',
    FURNITURE = 'furniture',
    APPLIANCES = 'appliances',
    AGRICULTURAL = 'agricultural',
    BUILDING_MATERIALS = 'building_materials',
    VEHICLES = 'vehicles',
    OTHER = 'other',
}
export class MerchandiseProduct {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    vendorId?: string;
    vendor?: Vendor;
    name?: string;
    sku?: string;
    description?: string;
    category?: MerchandiseCategory;
    retailPrice?: number;
    costPrice?: number;
    stockQuantity?: number;
    minimumTermMonths?: number;
    maximumTermMonths?: number;
    interestRate?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
    allowAutoOrdering?: boolean;
    reorderLevel?: number;
    status?: MerchandiseProductStatus;
    flyerUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;

    get markup(): number {
        return (this.retailPrice ?? 0) - (this.costPrice ?? 0);
    }

    get markupPercentage(): number {
        return this.costPrice ? (this.markup / this.costPrice) * 100 : 0;
    }
}
