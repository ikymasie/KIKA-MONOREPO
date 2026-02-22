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

export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

@Entity('savings_products')
export class SavingsProduct {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant, (tenant: any) => tenant.savingsProducts)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    name!: string;

    @Column()
    code!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    interestRate!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    minimumBalance!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    maximumBalance?: number;

    @Column({ default: false })
    isShareCapital!: boolean;

    @Column({ default: true })
    allowWithdrawals!: boolean;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    minMonthlyContribution!: number;

    @Column({ type: 'json', nullable: true })
    withdrawalRestrictions?: {
        maxWithdrawalsPerMonth?: number;
        minBalanceAfterWithdrawal?: number;
        noticePeriodDays?: number;
    };

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    interestEarningThreshold!: number;

    @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.ACTIVE })
    status!: ProductStatus;

    @Column({ nullable: true })
    flyerUrl?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
