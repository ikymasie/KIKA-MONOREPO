export enum ResolutionStatus {
    PENDING = 'pending',
    IMPLEMENTED = 'implemented',
    SUPERSEDED = 'superseded',
    CANCELLED = 'cancelled',
}

export interface IAgmResolution {
    id: string;
    tenantId: string;
    year: number;
    date: Date | string;
    title: string;
    description: string;
    status: ResolutionStatus;
    meetingMinutesUrl?: string;
    metadata?: Record<string, any>;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IBoardMinute {
    id: string;
    tenantId: string;
    meetingDate: Date | string;
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
        dueDate?: Date | string;
    }>;
    documentUrl?: string;
    notes?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
