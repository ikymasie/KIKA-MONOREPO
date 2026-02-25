import type { SocietyApplication } from './SocietyApplication';
import { ApplicationStatus } from './SocietyApplication';
import type { User } from './User';
export class ApplicationStatusHistory {
    id!: string;
    applicationId!: string;
    application!: SocietyApplication;
    fromStatus?: ApplicationStatus;
    toStatus!: ApplicationStatus;
    changedBy!: string;
    user!: User;
    changedAt!: Date;
    notes?: string;
    action?: string; // 'approve', 'reject', 'request_info', 'submit', etc.
}
