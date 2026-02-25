import type { User } from './User';

export enum BroadcastType {
    CIRCULAR = 'circular',
    POLICY_UPDATE = 'policy_update',
    ALERT = 'alert',
    ANNOUNCEMENT = 'announcement',
}

export enum BroadcastPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum BroadcastTargetAudience {
    ALL_TENANTS = 'all_tenants',
    SPECIFIC_TENANTS = 'specific_tenants',
    ADMINS_ONLY = 'admins_only',
}
export class RegulatoryBroadcast {
    id?: string;
    title?: string;
    content?: string;
    broadcastType?: BroadcastType;
    priority?: BroadcastPriority;
    targetAudience?: BroadcastTargetAudience;
    targetTenantIds?: string[];
    createdBy?: string;
    creator?: User;
    publishedAt?: Date;
    expiresAt?: Date;
    deliveryChannels?: ('email' | 'sms' | 'in_app')[];
    deliveryStatus?: {
        email?: { sent: number; failed: number; total: number };
        sms?: { sent: number; failed: number; total: number };
        inApp?: { created: number; total: number };
    };
    createdAt?: Date;
    updatedAt?: Date;
}
