import type { AuditorAccessRequest } from './AuditorAccessRequest';
import type { User } from './User';
export class AuditWorkingPaper {
    id?: string;
    requestId?: string;
    request?: AuditorAccessRequest;
    fileName?: string;
    fileUrl?: string;
    uploadedById?: string;
    uploadedBy?: User;
    createdAt?: Date;
    updatedAt?: Date;
}
