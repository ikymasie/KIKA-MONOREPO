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

export enum InsuranceProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum CoverageType {
    INDIVIDUAL = 'individual',
    FAMILY = 'family',
    EXTENDED = 'extended',
}

@Entity('insurance_products')
export class InsuranceProduct {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant, (tenant: any) => tenant.insuranceProducts)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    name!: string;

    @Column()
    code!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'enum', enum: CoverageType })
    coverageType!: CoverageType;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    monthlyPremium!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    coverageAmount!: number;

    @Column({ type: 'int', default: 6 })
    waitingPeriodMonths!: number;

    @Column({ type: 'int', nullable: true })
    maxDependents?: number;

    @Column({ type: 'int', nullable: true })
    maxDependentAge?: number;

    @Column({ nullable: true })
    underwriter?: string;

    @Column({ nullable: true })
    policyNumber?: string;

    @Column({ type: 'enum', enum: InsuranceProductStatus, default: InsuranceProductStatus.ACTIVE })
    status!: InsuranceProductStatus;

    @Column({ nullable: true })
    flyerUrl?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
