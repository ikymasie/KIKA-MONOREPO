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
import type { FieldVisit } from './FieldVisit';
import type { User } from './User';
import type { Tenant } from './Tenant';

@Entity('field_reports')
export class FieldReport {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    visitId!: string;

    @OneToOne(() => require('./FieldVisit').FieldVisit, (visit: any) => visit.report)
    @JoinColumn({ name: 'visitId' })
    visit!: FieldVisit;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'uuid' })
    submittedById!: string;

    @ManyToOne(() => require('./User').User)
    @JoinColumn({ name: 'submittedById' })
    submittedBy!: User;

    @Column({ type: 'json' })
    cooperativePrinciplesChecklist!: {
        voluntaryMembership: boolean;
        democraticControl: boolean;
        memberEconomicParticipation: boolean;
        autonomyIndependence: boolean;
        educationTrainingInformation: boolean;
        cooperationAmongCooperatives: boolean;
        concernForCommunity: boolean;
        notes?: string;
    };

    @Column({ type: 'json', nullable: true })
    memberVerificationResults?: {
        verifiedCount: number;
        totalChecked: number;
        discrepancies: Array<{
            memberNumber: string;
            issue: string;
        }>;
    };

    @Column({ type: 'text' })
    generalFindings!: string;

    @Column({ type: 'text' })
    recommendations!: string;

    @Column({ type: 'json', nullable: true })
    attachments?: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
