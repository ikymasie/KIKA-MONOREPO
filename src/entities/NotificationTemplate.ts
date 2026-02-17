import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { NotificationEvent, NotificationChannel, NotificationPriority } from '@/lib/notification-types';
import { UserRole } from './User';

@Entity('notification_templates')
@Index(['event', 'targetRole'], { unique: true })
export class NotificationTemplate {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar' })
    event!: NotificationEvent;

    @Column({ type: 'varchar' })
    targetRole!: UserRole;

    @Column({ type: 'simple-array' })
    channels!: NotificationChannel[];

    @Column({ type: 'text', nullable: true })
    smsTemplate?: string;

    @Column({ nullable: true })
    emailSubject?: string;

    @Column({ type: 'text', nullable: true })
    emailTemplate?: string;

    @Column({ type: 'simple-array' })
    placeholders!: string[];

    @Column({ default: true })
    isActive!: boolean;

    @Column({ type: 'varchar' })
    priority!: NotificationPriority;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
