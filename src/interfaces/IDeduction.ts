export enum DeductionRequestStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum ChangeReason {
    NEW_ENROLLMENT = 'new_enrollment',
    AMOUNT_CHANGE = 'amount_change',
    POLICY_MATURITY = 'policy_maturity',
    STATUS_CHANGE = 'status_change',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
}

export interface IDeductionRequest {
    id: string;
    tenantId: string;
    batchNumber: string;
    month: number;
    year: number;
    totalMembers: number;
    totalAmount: number;
    status: DeductionRequestStatus;
    submittedBy?: string;
    submittedAt?: Date | string;
    csvFileUrl?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IDeductionItem {
    id: string;
    requestId: string;
    memberId: string;
    memberNumber: string;
    nationalId: string;
    employeeNumber: string;
    currentAmount: number;
    previousAmount: number;
    changeReason: ChangeReason;
    isOverLimit: boolean;
    limitNotes?: string;
    breakdown?: any;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export enum ReconciliationStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum MatchStatus {
    MATCHED = 'matched',
    VARIANCE = 'variance',
    MISSING_IN_MOF = 'missing_in_mof',
    ORPHAN_IN_MOF = 'orphan_in_mof',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
}

export enum VarianceReason {
    INSUFFICIENT_FUNDS = 'insufficient_funds',
    DECEASED = 'deceased',
    TERMINATED = 'terminated',
    UNPAID_LEAVE = 'unpaid_leave',
    NET_PAY_TOO_LOW = 'net_pay_too_low',
    TIMING_DIFFERENCE = 'timing_difference',
    GARNISHEE_ORDER = 'garnishee_order',
    AMOUNT_MISMATCH = 'amount_mismatch',
    OTHER = 'other',
}

export interface IReconciliationBatch {
    id: string;
    tenantId: string;
    batchNumber: string;
    month: number;
    year: number;
    status: ReconciliationStatus;
    totalExpected: number;
    totalActual: number;
    totalVariance: number;
    totalRecords: number;
    matchedRecords: number;
    varianceRecords: number;
    unmatchedRecords: number;
    processedBy?: string;
    processedAt?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IReconciliationItem {
    id: string;
    batchId: string;
    memberId?: string;
    memberNumber?: string;
    nationalId?: string;
    expectedAmount: number;
    requestedAmount?: number;
    actualAmount: number;
    variance: number;
    matchStatus: MatchStatus;
    varianceReason?: VarianceReason;
    notes?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
