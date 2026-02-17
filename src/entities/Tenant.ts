import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import type { User } from './User';

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
    lastComplianceReviewDate?: Date;;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => require('./User').User, (user: any) => user.tenant)
    users!: User[];

    @OneToMany(() => require('./Member').Member, (member: any) => member.tenant)
    members!: any[];

    @OneToMany(() => require('./SavingsProduct').SavingsProduct, (product: any) => product.tenant)
    savingsProducts!: any[];

    @OneToMany(() => require('./LoanProduct').LoanProduct, (product: any) => product.tenant)
    loanProducts!: any[];

    @OneToMany(() => require('./InsuranceProduct').InsuranceProduct, (product: any) => product.tenant)
    insuranceProducts!: any[];

    @OneToMany(() => require('./MerchandiseProduct').MerchandiseProduct, (product: any) => product.tenant)
    merchandiseProducts!: any[];

    @OneToMany(() => require('./DeductionRequest').DeductionRequest, (request: any) => request.tenant)
    deductionRequests!: any[];

    @OneToMany(() => require('./Account').Account, (account: any) => account.tenant)
    accounts!: any[];
}
