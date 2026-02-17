import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Member } from './Member';
import { InsuranceProduct } from './InsuranceProduct';
import { InsuranceClaim } from './InsuranceClaim';

export enum PolicyStatus {
    ACTIVE = 'active',
    WAITING_PERIOD = 'waiting_period',
    LAPSED = 'lapsed',
    CANCELLED = 'cancelled',
}

@Entity('insurance_policies')
export class InsurancePolicy {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    policyNumber!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => Member, (member) => member.insurancePolicies)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column({ type: 'uuid' })
    productId!: string;

    @ManyToOne(() => InsuranceProduct)
    @JoinColumn({ name: 'productId' })
    product!: InsuranceProduct;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    monthlyPremium!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    coverageAmount!: number;

    @Column({ type: 'date' })
    startDate!: Date;

    @Column({ type: 'date', nullable: true })
    endDate?: Date;

    @Column({ type: 'date', nullable: true })
    waitingPeriodEndDate?: Date;

    @Column({ type: 'enum', enum: PolicyStatus, default: PolicyStatus.WAITING_PERIOD })
    status!: PolicyStatus;

    @Column({ type: 'int', default: 0 })
    monthsPaid!: number;

    @OneToMany(() => InsuranceClaim, (claim) => claim.policy)
    claims!: InsuranceClaim[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get isInWaitingPeriod(): boolean {
        if (!this.waitingPeriodEndDate) return false;
        return new Date() < new Date(this.waitingPeriodEndDate);
    }
}
