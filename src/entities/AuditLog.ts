export enum AuditAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    LOGOUT = 'logout',
    APPROVE = 'approve',
    REJECT = 'reject',
    DISBURSE = 'disburse',
    RECONCILE = 'reconcile',
    EXPORT = 'export',
    IMPORT = 'import',
}
export class AuditLog {
    id?: string;
    tenantId?: string;
    userId?: string;
    userEmail?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    description?: string;
    createdAt?: Date;
}
