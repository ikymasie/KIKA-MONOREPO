import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import type { Member } from './Member';

@Entity('kyc')
export class KYC {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @OneToOne(() => require('./Member').Member, (member: any) => member.kyc)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    // --- Identity Documents ---
    @Column({ nullable: true })
    omangNumber?: string;

    @Column({ type: 'date', nullable: true })
    omangExpiryDate?: Date;

    @Column({ nullable: true })
    omangFrontUrl?: string;

    @Column({ nullable: true })
    omangBackUrl?: string;

    @Column({ nullable: true })
    passportNumber?: string;

    @Column({ type: 'date', nullable: true })
    passportExpiryDate?: Date;

    @Column({ nullable: true })
    passportUrl?: string;

    // For Expatriates
    @Column({ nullable: true })
    workPermitNumber?: string;

    @Column({ type: 'date', nullable: true })
    workPermitExpiryDate?: Date;

    @Column({ nullable: true })
    workPermitUrl?: string;

    @Column({ nullable: true })
    residencePermitNumber?: string;

    @Column({ type: 'date', nullable: true })
    residencePermitExpiryDate?: Date;

    @Column({ nullable: true })
    residencePermitUrl?: string;

    // For Minors
    @Column({ nullable: true })
    birthCertificateNumber?: string;

    @Column({ nullable: true })
    birthCertificateUrl?: string;

    @Column({ nullable: true })
    guardianOmangUrl?: string;

    // --- Proof of Residence ---
    @Column({ nullable: true }) // 'water', 'electricity', 'lease', 'affidavit', 'chief_letter'
    residenceProofType?: string;

    @Column({ nullable: true })
    proofOfResidenceUrl?: string;

    @Column({ type: 'date', nullable: true })
    residenceDocumentDate?: Date;

    // --- Source of Funds / Income ---
    @Column({ nullable: true }) // 'salary', 'business', 'other'
    incomeSourceType?: string;

    @Column({ nullable: true })
    proofOfIncomeUrl?: string; // Payslip or Bank Statement

    @Column({ nullable: true })
    sourceOfFundsAffidavitUrl?: string;

    // --- PIP / PEP Declaration ---
    @Column({ default: false })
    isPip!: boolean;

    @Column({ nullable: true })
    pipPosition?: string; // e.g., "MP", "Minister", "Judge"

    @Column({ type: 'date', nullable: true })
    pipDeclarationDate?: Date;

    // --- Verification Status & Metadata ---
    @Column({ default: false })
    identityVerified!: boolean;

    @Column({ type: 'uuid', nullable: true })
    identityVerifiedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    identityVerifiedAt?: Date;

    @Column({ default: false })
    residenceVerified!: boolean;

    @Column({ type: 'uuid', nullable: true })
    residenceVerifiedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    residenceVerifiedAt?: Date;

    @Column({ default: false })
    incomeVerified!: boolean;

    @Column({ type: 'uuid', nullable: true })
    incomeVerifiedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    incomeVerifiedAt?: Date;

    @Column({ default: false })
    pipVerified!: boolean;

    @Column({ type: 'uuid', nullable: true })
    pipVerifiedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    pipVerifiedAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get isFullyVerified(): boolean {
        // Basic requirement: Identity + Residence + Income
        // If PIP, then PIP must also be verified
        const base = this.identityVerified && this.residenceVerified && this.incomeVerified;
        if (this.isPip) {
            return base && this.pipVerified;
        }
        return base;
    }
}
