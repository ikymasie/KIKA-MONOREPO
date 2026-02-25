export enum VendorStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}
export class Vendor {
    id?: string;
    name?: string;
    code?: string;
    registrationNumber?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    bankName?: string;
    bankAccountNumber?: string;
    status?: VendorStatus;
    createdAt?: Date;
    updatedAt?: Date;
}
