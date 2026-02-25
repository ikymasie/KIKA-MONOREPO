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
export class Member {
    id?: string;
    userId?: string;
    user?: User;
    tenantId?: string;
    tenant?: Tenant;
    memberNumber?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    nationalId?: string;
    passportNumber?: string;
    dateOfBirth?: Date;
    gender?: string;
    email?: string;
    phone?: string;
    physicalAddress?: string;
    postalAddress?: string;
    status?: MemberStatus;
    employmentStatus?: EmploymentStatus;
    employer?: string;
    employeeNumber?: string;
    shareCapital?: number;
    monthlyNetSalary?: number;
    joinDate?: Date;
    exitDate?: Date;
    exitReason?: string;
    kyc?: KYC;
    beneficiaries?: Beneficiary[];
    dependents?: Dependent[];
    savings?: MemberSavings[];
    loans?: Loan[];
    insurancePolicies?: InsurancePolicy[];
    bankAccounts?: MemberBankAccount[];
    createdAt?: Date;
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
