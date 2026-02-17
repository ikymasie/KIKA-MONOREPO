import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToOne,
} from 'typeorm';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum FieldVisitStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('field_visits')
export class FieldVisit {
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

    @Column({ type: 'timestamp' })
    scheduledDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    actualDate?: Date;

    @Column({ type: 'enum', enum: FieldVisitStatus, default: FieldVisitStatus.SCHEDULED })
    status!: FieldVisitStatus;

    @Column({ type: 'text' })
    purpose!: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @OneToOne(() => require('./FieldReport').FieldReport, (report: any) => report.visit)
    report?: any; // Use any or Import type for the type hint

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
