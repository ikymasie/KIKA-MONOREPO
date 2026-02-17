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
import { Tenant } from './Tenant';

export enum ResolutionStatus {
    PENDING = 'pending',
    IMPLEMENTED = 'implemented',
    SUPERSEDED = 'superseded',
    CANCELLED = 'cancelled',
}

@Entity('agm_resolutions')
@Index(['tenantId'])
@Index(['year'])
@Index(['status'])
export class AgmResolution {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'int' })
    year!: number;

    @Column({ type: 'date' })
    date!: Date;

    @Column()
    title!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({
        type: 'enum',
        enum: ResolutionStatus,
        default: ResolutionStatus.PENDING,
    })
    status!: ResolutionStatus;

    @Column({ nullable: true })
    meetingMinutesUrl?: string;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
