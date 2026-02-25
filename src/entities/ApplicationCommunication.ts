import type { SocietyApplication } from './SocietyApplication';
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
export class ApplicationCommunication {
    id?: string;
    applicationId?: string;
    application?: SocietyApplication;
    type?: CommunicationType;
    direction?: CommunicationDirection;
    subject?: string;
    content?: string;
    recordedById?: string;
    recordedBy?: User;
    createdAt?: Date;
}
