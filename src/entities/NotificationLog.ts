import { NotificationEvent, NotificationChannel, NotificationStatus } from '@/lib/notification-types';
import type { User } from './User';
import type { Tenant } from './Tenant';
export class NotificationLog {
    id?: string;
    event?: NotificationEvent;
    channel?: NotificationChannel;
    recipient?: string;
    userId?: string;
    user?: User;
    tenantId?: string;
    tenant?: Tenant;
    subject?: string;
    content?: string;
    status?: NotificationStatus;
    externalId?: string;
    metadata?: Record<string, any>;
    errorMessage?: string;
    retryCount?: number;
    sentAt?: Date;
}
