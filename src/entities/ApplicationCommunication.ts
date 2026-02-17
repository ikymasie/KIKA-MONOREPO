import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SocietyApplication } from './SocietyApplication';
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

@Entity('application_communications')
@Index(['applicationId'])
@Index(['type'])
@Index(['createdAt'])
export class ApplicationCommunication {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    applicationId!: string;

    @ManyToOne(() => SocietyApplication)
    @JoinColumn({ name: 'applicationId' })
    application?: SocietyApplication;

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

    @CreateDateColumn()
    createdAt!: Date;
}
