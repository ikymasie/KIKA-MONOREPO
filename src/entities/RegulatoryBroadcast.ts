import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

export enum BroadcastType {
    CIRCULAR = 'circular',
    POLICY_UPDATE = 'policy_update',
    ALERT = 'alert',
    ANNOUNCEMENT = 'announcement',
}

export enum BroadcastPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum BroadcastTargetAudience {
    ALL_TENANTS = 'all_tenants',
    SPECIFIC_TENANTS = 'specific_tenants',
    ADMINS_ONLY = 'admins_only',
}

@Entity('regulatory_broadcasts')
@Index(['broadcastType'])
@Index(['priority'])
@Index(['publishedAt'])
export class RegulatoryBroadcast {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'enum', enum: BroadcastType })
    broadcastType!: BroadcastType;

    @Column({ type: 'enum', enum: BroadcastPriority, default: BroadcastPriority.MEDIUM })
    priority!: BroadcastPriority;

    @Column({ type: 'enum', enum: BroadcastTargetAudience, default: BroadcastTargetAudience.ALL_TENANTS })
    targetAudience!: BroadcastTargetAudience;

    @Column({ type: 'json', nullable: true })
    targetTenantIds?: string[];

    @Column({ type: 'uuid' })
    createdBy!: string;

    @ManyToOne('User', { nullable: false })
    @JoinColumn({ name: 'createdBy' })
    creator!: any;

    @Column({ type: 'timestamp', nullable: true })
    publishedAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    expiresAt?: Date;

    @Column({ type: 'json', nullable: true })
    deliveryChannels!: ('email' | 'sms' | 'in_app')[];

    @Column({ type: 'json', nullable: true })
    deliveryStatus?: {
        email?: { sent: number; failed: number; total: number };
        sms?: { sent: number; failed: number; total: number };
        inApp?: { created: number; total: number };
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
