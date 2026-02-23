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
import type { Beneficiary } from './Beneficiary';
import type { Dependent } from './Dependent';
import type { InsurancePolicy } from './InsurancePolicy';
import type { KYC } from './KYC';
import type { Loan } from './Loan';
import type { MemberBankAccount } from './MemberBankAccount';
import type { MemberSavings } from './MemberSavings';
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
    id?: string;

    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @OneToOne('User')
    @JoinColumn({ name: 'userId' })
    user?: User;

    @Column({ type: 'uuid' })
    tenantId?: string;

    @ManyToOne('Tenant', 'members')
    @JoinColumn({ name: 'tenantId' })
    tenant?: Tenant;

    @Column()
    memberNumber?: string;

    @Column()
    firstName?: string;

    @Column()
    lastName?: string;

    @Column({ nullable: true })
    middleName?: string;

    @Column()
    nationalId?: string;

    @Column({ nullable: true })
    passportNumber?: string;

    @Column({ type: 'date' })
    dateOfBirth?: Date;

    @Column()
    gender?: string;

    @Column()
    email?: string;

    @Column()
    @Index()
    phone?: string;

    @Column({ type: 'text', nullable: true })
    physicalAddress?: string;

    @Column({ type: 'text', nullable: true })
    postalAddress?: string;

    @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.ACTIVE })
    status?: MemberStatus;

    @Column({ type: 'enum', enum: EmploymentStatus })
    employmentStatus?: EmploymentStatus;

    @Column({ nullable: true })
    employer?: string;

    @Column({ nullable: true })
    employeeNumber?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    shareCapital?: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    monthlyNetSalary?: number;

    @Column({ type: 'date' })
    joinDate?: Date;

    @Column({ type: 'date', nullable: true })
    exitDate?: Date;

    @Column({ type: 'text', nullable: true })
    exitReason?: string;

    @OneToOne('KYC', 'member', { cascade: true })
    kyc?: KYC;

    @OneToMany('Beneficiary', 'member', { cascade: true })
    beneficiaries?: Beneficiary[];

    @OneToMany('Dependent', 'member', { cascade: true })
    dependents?: Dependent[];

    @OneToMany('MemberSavings', 'member')
    savings?: MemberSavings[];

    @OneToMany('Loan', 'member')
    loans?: Loan[];

    @OneToMany('InsurancePolicy', 'member')
    insurancePolicies?: InsurancePolicy[];

    @OneToMany('MemberBankAccount', 'member', { cascade: true })
    bankAccounts?: MemberBankAccount[];

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    get fullName(): string {
        return this.middleName
            ? `${this.firstName} ${this.middleName} ${this.lastName}`
            : `${this.firstName} ${this.lastName}`;
    }

    get age(): number | null {
        if (!this.dateOfBirth) return null;
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
