import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { NotificationEvent, NotificationChannel, NotificationStatus } from '@/lib/notification-types';
import { User } from './User';
import { Tenant } from './Tenant';

@Entity('notification_logs')
@Index(['userId'])
@Index(['tenantId'])
@Index(['event'])
@Index(['status'])
@Index(['sentAt'])
export class NotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    event!: NotificationEvent;

    @Column({ type: 'varchar' })
    channel!: NotificationChannel;

    @Column()
    recipient!: string; // email or phone number

    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @ManyToOne('User', { nullable: true })
    @JoinColumn({ name: 'userId' })
    user?: User;

    @Column({ type: 'uuid', nullable: true })
    tenantId?: string;

    @ManyToOne('Tenant', { nullable: true })
    @JoinColumn({ name: 'tenantId' })
    tenant?: Tenant;

    @Column({ nullable: true })
    subject?: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'varchar' })
    status!: NotificationStatus;

    @Column({ nullable: true })
    externalId?: string; // SMS messageId or email ID from provider

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'text', nullable: true })
    errorMessage?: string;

    @Column({ type: 'int', default: 0 })
    retryCount!: number;

    @CreateDateColumn()
    sentAt!: Date;
}
