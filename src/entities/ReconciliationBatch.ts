import type { DeductionRequest } from './DeductionRequest';
import type { Tenant } from './Tenant';
import type { ReconciliationItem } from './ReconciliationItem';
import { ReconciliationStatus } from '../enums/ReconciliationStatus';
export class ReconciliationBatch {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    batchNumber?: string;
    month?: number;
    year?: number;
    mofFileUrl?: string;
    deductionRequestId?: string;
    deductionRequest?: DeductionRequest;
    totalRecords?: number;
    matchedRecords?: number;
    unmatchedRecords?: number;
    varianceRecords?: number;
    totalExpected?: number;
    totalActual?: number;
    totalVariance?: number;
    status?: ReconciliationStatus;
    processedBy?: string;
    processedAt?: Date;
    journalsPosted?: boolean;
    items?: ReconciliationItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
