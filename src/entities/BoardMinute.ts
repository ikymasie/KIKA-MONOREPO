import type { Tenant } from './Tenant';
export class BoardMinute {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    meetingDate?: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    attendees?: string[];
    agenda?: string[];
    decisions?: Array<{
        title: string;
        description: string;
        actionItem?: string;
        assignee?: string;
        dueDate?: Date;
    }>;
    documentUrl?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
