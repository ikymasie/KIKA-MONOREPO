/**
 * src/interfaces/IMember.ts
 *
 * Plain TypeScript interface for the `members` table row.
 * Used by MemberService and any code that works with raw SQL results.
 */

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

export interface IMember {
    id: string;
    userId?: string;
    tenantId: string;
    memberNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    nationalId: string;
    passportNumber?: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    physicalAddress?: string;
    postalAddress?: string;
    status: MemberStatus;
    employmentStatus: EmploymentStatus;
    employer?: string;
    employeeNumber?: string;
    shareCapital: number;
    monthlyNetSalary: number;
    joinDate: string;
    exitDate?: string;
    exitReason?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMemberCreateInput {
    tenantId: string;
    userId?: string;
    memberNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    nationalId: string;
    passportNumber?: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    physicalAddress?: string;
    postalAddress?: string;
    employmentStatus: EmploymentStatus;
    employer?: string;
    employeeNumber?: string;
    shareCapital?: number;
    monthlyNetSalary?: number;
    joinDate: string;
    status?: MemberStatus;
}

export type IMemberUpdateInput = Partial<
    Pick<
        IMember,
        | 'firstName'
        | 'lastName'
        | 'middleName'
        | 'email'
        | 'phone'
        | 'physicalAddress'
        | 'postalAddress'
        | 'employmentStatus'
        | 'employer'
        | 'employeeNumber'
        | 'monthlyNetSalary'
        | 'shareCapital'
        | 'passportNumber'
        | 'gender'
    >
>;

export interface IMemberListFilters {
    status?: MemberStatus;
    search?: string;
}

export interface IMemberPagination {
    page?: number;
    limit?: number;
}

/** Computed full name utility (pure function, no class). */
export function getMemberFullName(member: Pick<IMember, 'firstName' | 'middleName' | 'lastName'>): string {
    return member.middleName
        ? `${member.firstName} ${member.middleName} ${member.lastName}`
        : `${member.firstName} ${member.lastName}`;
}
