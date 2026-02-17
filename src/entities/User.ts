import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

export enum UserRole {
    // Department of Co-operative Development (DCD) - Ministry of Trade and Industry
    // Handles registration, bye-laws, and cooperative compliance
    DCD_DIRECTOR = 'dcd_director',
    DCD_FIELD_OFFICER = 'dcd_field_officer',
    DCD_COMPLIANCE_OFFICER = 'dcd_compliance_officer',

    // Bank of Botswana (BoB) - Central Bank
    // Provides prudential supervision for deposit-taking SACCOs
    BOB_PRUDENTIAL_SUPERVISOR = 'bob_prudential_supervisor',
    BOB_FINANCIAL_AUDITOR = 'bob_financial_auditor',
    BOB_COMPLIANCE_OFFICER = 'bob_compliance_officer',

    // Shared Regulatory Functions
    DEDUCTION_OFFICER = 'deduction_officer', // Government payroll integration

    // Government Registration Officers (work with DCD)
    REGISTRY_CLERK = 'registry_clerk',
    INTELLIGENCE_LIAISON = 'intelligence_liaison',
    LEGAL_OFFICER = 'legal_officer',
    REGISTRAR = 'registrar',
    DIRECTOR_COOPERATIVES = 'director_cooperatives',
    MINISTER_DELEGATE = 'minister_delegate',

    // Tenant Tier
    SACCOS_ADMIN = 'saccos_admin',
    LOAN_OFFICER = 'loan_officer',
    ACCOUNTANT = 'accountant',
    MEMBER_SERVICE_REP = 'member_service_rep',
    CREDIT_COMMITTEE = 'credit_committee',

    // Member Tier
    MEMBER = 'member',

    // Applicants
    SOCIETY_APPLICANT = 'society_applicant',
    COOPERATIVE_APPLICANT = 'cooperative_applicant',

    // External
    EXTERNAL_AUDITOR = 'external_auditor',
    VENDOR = 'vendor',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['firebaseUid'], { unique: true })
@Index(['phone'])
export class User {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    email!: string;

    @Column({ nullable: true, unique: true })
    firebaseUid?: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ type: 'enum', enum: UserRole })
    role!: UserRole;

    @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
    status!: UserStatus;

    @Column({ nullable: true })
    phone?: string;

    @Column({ default: false })
    mfaEnabled!: boolean;

    @Column({ nullable: true })
    mfaSecret?: string;

    @Column({ type: 'uuid', nullable: true, length: 36, collation: 'utf8mb4_0900_ai_ci' })
    tenantId?: string;

    @ManyToOne('Tenant', 'users', { nullable: true })
    @JoinColumn({ name: 'tenantId' })
    tenant?: any;

    @Column({ type: 'timestamp', nullable: true })
    lastLoginAt?: Date;

    @Column({ type: 'json', nullable: true })
    permissions?: Record<string, boolean>;

    @Column({ type: 'json', nullable: true })
    notificationPreferences?: Record<string, any>;

    // Password Management
    @Column({ nullable: true })
    temporaryPassword?: string; // Hashed temporary password for first login

    @Column({ default: false })
    mustChangePassword!: boolean; // Force password change on next login

    @Column({ type: 'timestamp', nullable: true })
    passwordChangedAt?: Date; // Track when password was last changed

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    isRegulator(): boolean {
        return [
            // DCD roles
            UserRole.DCD_DIRECTOR,
            UserRole.DCD_FIELD_OFFICER,
            UserRole.DCD_COMPLIANCE_OFFICER,
            // BoB roles
            UserRole.BOB_PRUDENTIAL_SUPERVISOR,
            UserRole.BOB_FINANCIAL_AUDITOR,
            UserRole.BOB_COMPLIANCE_OFFICER,
            // Shared
            UserRole.DEDUCTION_OFFICER,
        ].includes(this.role);
    }

    isDCD(): boolean {
        return [
            UserRole.DCD_DIRECTOR,
            UserRole.DCD_FIELD_OFFICER,
            UserRole.DCD_COMPLIANCE_OFFICER,
        ].includes(this.role);
    }

    isBoB(): boolean {
        return [
            UserRole.BOB_PRUDENTIAL_SUPERVISOR,
            UserRole.BOB_FINANCIAL_AUDITOR,
            UserRole.BOB_COMPLIANCE_OFFICER,
        ].includes(this.role);
    }

    isGovernmentOfficer(): boolean {
        return [
            UserRole.REGISTRY_CLERK,
            UserRole.INTELLIGENCE_LIAISON,
            UserRole.LEGAL_OFFICER,
            UserRole.REGISTRAR,
            UserRole.DIRECTOR_COOPERATIVES,
            UserRole.MINISTER_DELEGATE,
        ].includes(this.role);
    }

    isApplicant(): boolean {
        return [
            UserRole.SOCIETY_APPLICANT,
            UserRole.COOPERATIVE_APPLICANT,
        ].includes(this.role);
    }

    isTenantAdmin(): boolean {
        return [
            UserRole.SACCOS_ADMIN,
            UserRole.LOAN_OFFICER,
            UserRole.ACCOUNTANT,
            UserRole.MEMBER_SERVICE_REP,
            UserRole.CREDIT_COMMITTEE,
        ].includes(this.role);
    }
}
