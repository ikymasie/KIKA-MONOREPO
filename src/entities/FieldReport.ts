import type { FieldVisit } from './FieldVisit';
import type { Tenant } from './Tenant';
import type { User } from './User';
export class FieldReport {
    id?: string;
    visitId?: string;
    visit?: FieldVisit;
    tenantId?: string;
    tenant?: Tenant;
    submittedById?: string;
    submittedBy?: User;
    cooperativePrinciplesChecklist?: {
        voluntaryMembership: boolean;
        democraticControl: boolean;
        memberEconomicParticipation: boolean;
        autonomyIndependence: boolean;
        educationTrainingInformation: boolean;
        cooperationAmongCooperatives: boolean;
        concernForCommunity: boolean;
        notes?: string;
    };
    memberVerificationResults?: {
        verifiedCount: number;
        totalChecked: number;
        discrepancies: Array<{
            memberNumber: string;
            issue: string;
        }>;
    };
    generalFindings?: string;
    recommendations?: string;
    attachments?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
