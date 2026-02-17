import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { AuditorAccessRequest } from './AuditorAccessRequest';

export enum AuditReportStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
}

@Entity('audit_reports')
export class AuditReport {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    requestId!: string;

    @ManyToOne(() => AuditorAccessRequest)
    @JoinColumn({ name: 'requestId' })
    request!: AuditorAccessRequest;

    @Column()
    fileName!: string;

    @Column()
    fileUrl!: string;

    @Column({
        type: 'enum',
        enum: AuditReportStatus,
        default: AuditReportStatus.DRAFT,
    })
    status!: AuditReportStatus;

    @Column({ type: 'timestamp', nullable: true })
    submittedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
