import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { SocietyApplication, ApplicationStatus } from './SocietyApplication';
import { User } from './User';

@Entity('application_status_history')
@Index(['applicationId'])
@Index(['changedAt'])
export class ApplicationStatusHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    applicationId!: string;

    @ManyToOne(() => SocietyApplication, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'applicationId' })
    application!: SocietyApplication;

    @Column({
        type: 'enum',
        enum: ApplicationStatus,
        nullable: true,
    })
    fromStatus?: ApplicationStatus;

    @Column({
        type: 'enum',
        enum: ApplicationStatus,
    })
    toStatus!: ApplicationStatus;

    @Column({ type: 'uuid' })
    changedBy!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'changedBy' })
    user!: User;

    @CreateDateColumn()
    changedAt!: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    action?: string; // 'approve', 'reject', 'request_info', 'submit', etc.
}
