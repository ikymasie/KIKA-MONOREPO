import type { SocietyApplication } from './SocietyApplication';
export class ApplicationMember {
    id?: string;
    applicationId?: string;
    application?: SocietyApplication;
    fullName?: string;
    idNumber?: string;
    citizenship?: string; // Botswana Citizen, Resident, Non-Resident
    isOfficeBearer?: boolean;
    officeBearerPosition?: string; // Chairperson, Secretary, Treasurer, etc.
    residentialAddress?: string;

    // Security vetting (for office bearers only)
    securityCleared?: boolean;
    securityClearedAt?: Date;
    securityNotes?: string;
    createdAt?: Date;

    // Helper methods
    get isBotswanaResident(): boolean {
        return this.citizenship === 'Botswana Citizen' || this.citizenship === 'Resident';
    }
}
