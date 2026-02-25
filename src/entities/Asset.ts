import type { Tenant } from './Tenant';

export enum AssetType {
    LAND = 'land',
    BUILDING = 'building',
    EQUIPMENT = 'equipment',
    VEHICLE = 'vehicle',
    OTHER = 'other',
}

export enum AssetStatus {
    ACTIVE = 'active',
    DISPOSED = 'disposed',
    ENCUMBERED = 'encumbered',
}
export class Asset {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    name?: string;
    assetType?: AssetType;
    description?: string;
    purchasePrice?: number;
    purchaseDate?: Date;
    currentValuation?: number;
    lastValuationDate?: Date;
    status?: AssetStatus;
    collateralDetails?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
