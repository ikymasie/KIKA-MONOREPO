import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'BWP'): string {
    return new Intl.NumberFormat('en-BW', {
        style: 'currency',
        currency,
    }).format(amount);
}

export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('en-BW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
    return new Intl.DateTimeFormat('en-BW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function generateMemberNumber(tenantCode: string, sequence: number): string {
    return `${tenantCode}-${String(sequence).padStart(6, '0')}`;
}

export function generateLoanNumber(tenantCode: string, year: number, sequence: number): string {
    return `${tenantCode}-LN-${year}-${String(sequence).padStart(4, '0')}`;
}

export function generatePolicyNumber(tenantCode: string, year: number, sequence: number): string {
    return `${tenantCode}-POL-${year}-${String(sequence).padStart(4, '0')}`;
}

export function calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export function calculateMonthlyInstallment(
    principal: number,
    annualRate: number,
    termMonths: number,
    method: 'flat_rate' | 'reducing_balance' = 'reducing_balance'
): number {
    if (method === 'flat_rate') {
        const totalInterest = (principal * annualRate * termMonths) / (12 * 100);
        return (principal + totalInterest) / termMonths;
    } else {
        const monthlyRate = annualRate / 12 / 100;
        if (monthlyRate === 0) return principal / termMonths;
        return (
            (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1)
        );
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
