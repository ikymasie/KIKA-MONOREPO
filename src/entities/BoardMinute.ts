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

@Entity('board_minutes')
@Index(['tenantId'])
@Index(['meetingDate'])
export class BoardMinute {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'date' })
    meetingDate!: Date;

    @Column({ type: 'time', nullable: true })
    startTime?: string;

    @Column({ type: 'time', nullable: true })
    endTime?: string;

    @Column({ nullable: true })
    location?: string;

    @Column({ type: 'json', nullable: true })
    attendees?: string[];

    @Column({ type: 'json', nullable: true })
    agenda?: string[];

    @Column({ type: 'json', nullable: true })
    decisions?: Array<{
        title: string;
        description: string;
        actionItem?: string;
        assignee?: string;
        dueDate?: Date;
    }>;

    @Column({ nullable: true })
    documentUrl?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
