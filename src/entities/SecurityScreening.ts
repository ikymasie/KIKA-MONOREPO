import type { SocietyApplication } from './SocietyApplication';
import type { User } from './User';
import type { RiskFlag } from './RiskFlag';

export enum ScreeningStatus {
    PENDING = 'pending',
    CLEARED = 'cleared',
    FAILED = 'failed',
    FLAGGED = 'flagged',
}

export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}
export class SecurityScreening {
    id?: string;
    applicationId?: string;
    application?: SocietyApplication;
    officerId?: string;
    officer?: User;
    checks?: {
        criminalRecordMatched: boolean;
        sanctionsListMatched: boolean;
        adverseMediaFound: boolean;
        pepStatusConfirmed: boolean;
        sourceOfWealthVerified: boolean;
    };
    riskLevel?: RiskLevel;
    status?: ScreeningStatus;
    notes?: string;
    riskFlags?: RiskFlag[];
    createdAt?: Date;
    updatedAt?: Date;
}
