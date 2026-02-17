import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum MemberStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    DECEASED = 'deceased',
    RESIGNED = 'resigned',
    RETIRED = 'retired',
}

export enum EmploymentStatus {
    EMPLOYED = 'employed',
    SELF_EMPLOYED = 'self_employed',
    UNEMPLOYED = 'unemployed',
    RETIRED = 'retired',
}

@Entity('members')
@Index(['tenantId', 'memberNumber'], { unique: true })
@Index(['tenantId', 'nationalId'], { unique: true })
export class Member {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @OneToOne(() => require('./User').User)
    @JoinColumn({ name: 'userId' })
    user?: User;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant, (tenant: any) => tenant.members)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    memberNumber!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ nullable: true })
    middleName?: string;

    @Column()
    nationalId!: string;

    @Column({ nullable: true })
    passportNumber?: string;

    @Column({ type: 'date' })
    dateOfBirth!: Date;

    @Column()
    gender!: string;

    @Column()
    email!: string;

    @Column()
    @Index()
    phone!: string;


    @Column({ type: 'text', nullable: true })
    physicalAddress?: string;

    @Column({ type: 'text', nullable: true })
    postalAddress?: string;

    @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.ACTIVE })
    status!: MemberStatus;

    @Column({ type: 'enum', enum: EmploymentStatus })
    employmentStatus!: EmploymentStatus;

    @Column({ nullable: true })
    employer?: string;

    @Column({ nullable: true })
    employeeNumber?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    shareCapital!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    monthlyNetSalary!: number;

    @Column({ type: 'date' })
    joinDate!: Date;

    @Column({ type: 'date', nullable: true })
    exitDate?: Date;

    @Column({ type: 'text', nullable: true })
    exitReason?: string;

    @OneToOne(() => require('./KYC').KYC, (kyc: any) => kyc.member, { cascade: true })
    kyc?: any;

    @OneToMany(() => require('./Beneficiary').Beneficiary, (beneficiary: any) => beneficiary.member, { cascade: true })
    beneficiaries!: any[];

    @OneToMany(() => require('./Dependent').Dependent, (dependent: any) => dependent.member, { cascade: true })
    dependents!: any[];

    @OneToMany(() => require('./MemberSavings').MemberSavings, (savings: any) => savings.member)
    savings!: any[];

    @OneToMany(() => require('./Loan').Loan, (loan: any) => loan.member)
    loans!: any[];

    @OneToMany(() => require('./InsurancePolicy').InsurancePolicy, (policy: any) => policy.member)
    insurancePolicies!: any[];

    @OneToMany(() => require('./MemberBankAccount').MemberBankAccount, (account: any) => account.member, { cascade: true })
    bankAccounts!: any[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get fullName(): string {
        return this.middleName
            ? `${this.firstName} ${this.middleName} ${this.lastName}`
            : `${this.firstName} ${this.lastName}`;
    }

    get age(): number {
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
}
