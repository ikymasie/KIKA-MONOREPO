import type { Tenant } from './Tenant';
import type { User } from './User';

export enum CertificateType {
    REGISTRATION = 'registration',
    RENEWAL = 'renewal',
    AMENDMENT = 'amendment',
}
export class Certificate {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    certificateNumber?: string;
    certificateType?: CertificateType;
    issuedDate?: Date;
    expiryDate?: Date;
    issuedBy?: string;
    issuer?: User;
    documentUrl?: string;
    metadata?: {
        registrationNumber?: string;
        registrationDate?: string;
        societyName?: string;
        address?: string;
        [key: string]: any;
    };
    createdAt?: Date;
    updatedAt?: Date;
}
