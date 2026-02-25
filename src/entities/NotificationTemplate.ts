import { NotificationEvent, NotificationChannel, NotificationPriority } from '@/lib/notification-types';
import type { UserRole } from './User';
export class NotificationTemplate {
    id?: string;
    event?: NotificationEvent;
    targetRole?: UserRole;
    channels?: NotificationChannel[];
    smsTemplate?: string;
    emailSubject?: string;
    emailTemplate?: string;
    placeholders?: string[];
    isActive?: boolean;
    priority?: NotificationPriority;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
