import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum InvestigationStatus {
    OPEN = 'open',
    UNDER_REVIEW = 'under_review',
    COMPLETED = 'completed',
    CLOSED = 'closed',
}

export enum InvestigationSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

@Entity('investigations')
export class Investigation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'uuid' })
    officerId!: string;

    @ManyToOne(() => require('./User').User)
    @JoinColumn({ name: 'officerId' })
    officer!: User;

    @Column()
    subject!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'enum', enum: InvestigationStatus, default: InvestigationStatus.OPEN })
    status!: InvestigationStatus;

    @Column({ type: 'enum', enum: InvestigationSeverity, default: InvestigationSeverity.MEDIUM })
    severity!: InvestigationSeverity;

    @Column({ type: 'text', nullable: true })
    findings?: string;

    @Column({ type: 'text', nullable: true })
    recommendations?: string;

    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
