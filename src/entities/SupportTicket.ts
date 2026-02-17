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
import { Member } from './Member';
import { Tenant } from './Tenant';
import { User } from './User';

export enum TicketStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum TicketPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

@Entity('support_tickets')
@Index(['tenantId'])
@Index(['memberId'])
@Index(['status'])
export class SupportTicket {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column()
    subject!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column()
    category!: string;

    @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
    priority!: TicketPriority;

    @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
    status!: TicketStatus;

    @Column({ type: 'uuid', nullable: true })
    assignedToId?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assignedToId' })
    assignedTo?: User;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
