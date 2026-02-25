import type { Member } from './Member';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum CommunicationType {
    CALL = 'call',
    EMAIL = 'email',
    SMS = 'sms',
    IN_PERSON = 'in_person',
    WHATSAPP = 'whatsapp',
    OTHER = 'other',
}

export enum CommunicationDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}
export class MemberCommunication {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    memberId?: string;
    member?: Member;
    type?: CommunicationType;
    direction?: CommunicationDirection;
    subject?: string;
    content?: string;
    recordedById?: string;
    recordedBy?: User;
    metadata?: Record<string, any>;
    createdAt?: Date;
}
