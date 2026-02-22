import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { User } from './User';
import { Member } from './Member';
import { SavingsProduct } from './SavingsProduct';
import { LoanProduct } from './LoanProduct';
import { InsuranceProduct } from './InsuranceProduct';
import { MerchandiseProduct } from './MerchandiseProduct';
import { DeductionRequest } from './DeductionRequest';
import { Account } from './Account';

export enum TenantStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    INACTIVE = 'inactive',
}

@Entity('tenants')
export class Tenant {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    name!: string;

    @Column({ unique: true })
    code!: string;

    @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.ACTIVE })
    status!: TenantStatus;

    @Column({ nullable: true })
    registrationNumber?: string;

    @Column({ type: 'date', nullable: true })
    registrationDate?: Date;

    @Column({ nullable: true })
    address?: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ nullable: true })
    email?: string;

    @Column({ type: 'json', nullable: true })
    bylaws?: Record<string, any>;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    maxBorrowingLimit!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    regulatorDeductionCap?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 40.00 })
    maxDeductionPercentage!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
    liquidityRatioTarget!: number;

    @Column({ type: 'json', nullable: true })
    kycConfiguration?: {
        documentChecklist: string[];
        customFields: Array<{ name: string; type: string; required: boolean }>;
    };

    @Column({ nullable: true })
    logoUrl?: string;

    @Column({ nullable: true, default: '#0ea5e9' })
    primaryColor?: string;

    @Column({ nullable: true, default: '#d946ef' })
    secondaryColor?: string;

    @Column({ type: 'json', nullable: true })
    brandingSettings?: {
        sidebarTheme?: 'light' | 'dark' | 'custom';
        accentColor?: string;
        faviconUrl?: string;
    };

    @Column({ type: 'json', nullable: true })
    workflowConfiguration?: {
        makerCheckerEnabled: boolean;
        approvalHierarchy: string[];
    };

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    currentComplianceScore?: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    complianceRating?: string;

    @Column({ type: 'timestamp', nullable: true })
    lastComplianceReviewDate?: Date;

    @Column({ type: 'boolean', default: false })
    isMaintenanceMode!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => User, (user) => user.tenant)
    users!: User[];

    @OneToMany(() => Member, (member) => member.tenant)
    members!: Member[];

    @OneToMany(() => SavingsProduct, (product) => product.tenant)
    savingsProducts!: SavingsProduct[];

    @OneToMany(() => LoanProduct, (product) => product.tenant)
    loanProducts!: LoanProduct[];

    @OneToMany(() => InsuranceProduct, (product) => product.tenant)
    insuranceProducts!: InsuranceProduct[];

    @OneToMany(() => MerchandiseProduct, (product) => product.tenant)
    merchandiseProducts!: MerchandiseProduct[];

    @OneToMany(() => DeductionRequest, (request) => request.tenant)
    deductionRequests!: DeductionRequest[];

    @OneToMany(() => Account, (account) => account.tenant)
    accounts!: Account[];
}
