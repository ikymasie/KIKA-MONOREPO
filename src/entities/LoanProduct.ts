import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import type { Tenant } from './Tenant';

export enum LoanProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum InterestCalculationMethod {
    FLAT_RATE = 'flat_rate',
    REDUCING_BALANCE = 'reducing_balance',
    COMPOUND_INTEREST = 'compound_interest',
}

@Entity('loan_products')
export class LoanProduct {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant, (tenant: any) => tenant.loanProducts)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    name!: string;

    @Column()
    code!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    interestRate!: number;

    @Column({ type: 'enum', enum: InterestCalculationMethod, default: InterestCalculationMethod.REDUCING_BALANCE })
    interestMethod!: InterestCalculationMethod;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    minimumAmount!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    maximumAmount!: number;

    @Column({ type: 'int' })
    minimumTermMonths!: number;

    @Column({ type: 'int' })
    maximumTermMonths!: number;

    @Column({ type: 'int', default: 0 })
    requiredGuarantors!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    processingFeePercentage?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    insuranceFeePercentage?: number;

    @Column({ default: false })
    requiresCollateral!: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    penaltyRate?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 3 })
    savingsMultiplier!: number;

    @Column({ type: 'int', default: 12 })
    maxDurationMonths!: number;

    @Column({ type: 'int', default: 0 })
    gracePeriodDays!: number;

    @Column({ type: 'enum', enum: LoanProductStatus, default: LoanProductStatus.ACTIVE })
    status!: LoanProductStatus;

    @Column({ nullable: true })
    flyerUrl?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
