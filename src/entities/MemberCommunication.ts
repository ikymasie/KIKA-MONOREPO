import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Member } from './Member';
import { Tenant } from './Tenant';
import { User } from './User';

export enum CommunicationType {
    CALL = 'call',
    EMAIL = 'email',
    SMS = 'sms',
    IN_PERSON = 'in_person',
    WHATSAPP = 'whatsapp',
    OTHER = 'other',
}

export enum CommunicationDirection {
    INBOUND = 'inbound',
    OUTBOUND = 'outbound',
}

@Entity('member_communications')
@Index(['tenantId'])
@Index(['memberId'])
@Index(['type'])
@Index(['createdAt'])
export class MemberCommunication {
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

    @Column({ type: 'enum', enum: CommunicationType })
    type!: CommunicationType;

    @Column({ type: 'enum', enum: CommunicationDirection })
    direction!: CommunicationDirection;

    @Column({ nullable: true })
    subject?: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'uuid' })
    recordedById!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'recordedById' })
    recordedBy!: User;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;
}
