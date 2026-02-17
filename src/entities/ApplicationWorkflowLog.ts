import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SocietyApplication, ApplicationStatus } from './SocietyApplication';
import { User } from './User';

@Entity('application_workflow_logs')
@Index(['applicationId'])
@Index(['createdAt'])
export class ApplicationWorkflowLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    applicationId!: string;

    @ManyToOne(() => SocietyApplication)
    @JoinColumn({ name: 'applicationId' })
    application?: SocietyApplication;

    @Column({ type: 'enum', enum: ApplicationStatus, nullable: true })
    fromStatus?: ApplicationStatus;

    @Column({ type: 'enum', enum: ApplicationStatus })
    toStatus!: ApplicationStatus;

    @Column({ type: 'uuid' })
    performedBy!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'performedBy' })
    performer?: User;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>; // Additional context (e.g., rejection reasons, appeal details)

    @CreateDateColumn()
    createdAt!: Date;

    // Helper methods
    get isApproval(): boolean {
        return this.toStatus === ApplicationStatus.APPROVED ||
            this.toStatus === ApplicationStatus.APPEAL_APPROVED;
    }

    get isRejection(): boolean {
        return this.toStatus === ApplicationStatus.REJECTED ||
            this.toStatus === ApplicationStatus.SECURITY_FAILED ||
            this.toStatus === ApplicationStatus.LEGAL_REJECTED ||
            this.toStatus === ApplicationStatus.APPEAL_REJECTED;
    }

    get actionDescription(): string {
        switch (this.toStatus) {
            case ApplicationStatus.SUBMITTED:
                return 'Application submitted';
            case ApplicationStatus.INCOMPLETE:
                return 'Marked as incomplete';
            case ApplicationStatus.UNDER_REVIEW:
                return 'File number assigned, routed for review';
            case ApplicationStatus.SECURITY_VETTING:
                return 'Routed to security vetting';
            case ApplicationStatus.SECURITY_VETTING:
                return 'Security clearance in progress';
            case ApplicationStatus.SECURITY_FAILED:
                return 'Security clearance failed';
            case ApplicationStatus.LEGAL_REVIEW:
                return 'Routed to legal review';
            case ApplicationStatus.LEGAL_REJECTED:
                return 'Legal review rejected';
            case ApplicationStatus.PENDING_DECISION:
                return 'Legal review approved, pending final decision';
            case ApplicationStatus.APPROVED:
                return 'Application approved';
            case ApplicationStatus.REJECTED:
                return 'Application rejected';
            case ApplicationStatus.APPEAL_LODGED:
                return 'Appeal lodged';
            case ApplicationStatus.APPEAL_APPROVED:
                return 'Appeal approved';
            case ApplicationStatus.APPEAL_REJECTED:
                return 'Appeal rejected';
            default:
                return 'Status updated';
        }
    }
}
