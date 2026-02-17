import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Member } from './Member';

@Entity('kyc')
export class KYC {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @OneToOne(() => Member, (member) => member.kyc)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column({ nullable: true })
    proofOfIdentityUrl?: string;

    @Column({ nullable: true })
    proofOfResidenceUrl?: string;

    @Column({ nullable: true })
    proofOfIncomeUrl?: string;

    @Column({ nullable: true })
    bankStatementUrl?: string;

    @Column({ default: false })
    identityVerified!: boolean;

    @Column({ default: false })
    residenceVerified!: boolean;

    @Column({ default: false })
    incomeVerified!: boolean;

    @Column({ type: 'uuid', nullable: true })
    verifiedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get isFullyVerified(): boolean {
        return this.identityVerified && this.residenceVerified && this.incomeVerified;
    }
}
