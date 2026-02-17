import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from './User';

@Entity('regulator_settings')
export class RegulatorSettings {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 20.00 })
    saccosApplicationFee!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 500.00 })
    religiousSocietyApplicationFee!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 250.00 })
    generalSocietyApplicationFee!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 250.00 })
    burialSocietyApplicationFee!: number;

    // Annual Fees
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 50.00 })
    annualReturnFee!: number;

    // Penalties
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 500.00 })
    lateFilingPenaltyFee!: number;

    // Administrative Fees
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 100.00 })
    changeOfNameFee!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 20.00 })
    changeOfOfficersFee!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 20.00 })
    inspectionFee!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 20.00 })
    certifiedCopyFee!: number;

    // Workflow Configuration: Maps application stages to responsible user roles
    @Column({ type: 'json', nullable: true })
    workflowConfig?: Record<string, string>; // e.g., { "security_vetting": "intelligence_liaison", "legal_review": "legal_officer" }

    @Column({ type: 'uuid', nullable: true })
    updatedById?: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'updatedById' })
    updatedBy?: User;

    @UpdateDateColumn()
    updatedAt!: Date;
}
