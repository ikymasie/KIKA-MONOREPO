import type { Member } from './Member';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum TicketPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}
export class SupportTicket {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    memberId?: string;
    member?: Member;
    subject?: string;
    description?: string;
    category?: string;
    priority?: TicketPriority;
    status?: TicketStatus;
    assignedToId?: string;
    assignedTo?: User;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
