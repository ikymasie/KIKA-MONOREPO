/**
 * Dashboard utility functions for formatting and calculations
 */

/**
 * Format amount in Botswana Pula
 */
export function formatCurrency(amount: number): string {
    return `P ${amount.toLocaleString('en-BW', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * Format large numbers with K/M suffixes
 */
export function formatCompactNumber(num: number): string {
    if (num >= 1000000) {
        return `P ${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `P ${(num / 1000).toFixed(1)}K`;
    }
    return formatCurrency(num);
}

/**
 * Calculate liquidity ratio (savings / loans)
 */
export function calculateLiquidityRatio(totalSavings: number, totalLoans: number): number {
    if (totalLoans === 0) return 100;
    return (totalSavings / totalLoans) * 100;
}

/**
 * Calculate Portfolio at Risk (PAR)
 * PAR = (Outstanding balance of loans overdue > 30 days) / Total outstanding loan portfolio
 */
export function calculatePAR(loans: Array<{ balance: number; daysOverdue: number }>): number {
    const totalBalance = loans.reduce((sum, loan) => sum + loan.balance, 0);
    if (totalBalance === 0) return 0;

    const overdueBalance = loans
        .filter(loan => loan.daysOverdue > 30)
        .reduce((sum, loan) => sum + loan.balance, 0);

    return (overdueBalance / totalBalance) * 100;
}

/**
 * Format member number with prefix
 */
export function formatMemberNumber(id: string, prefix: string = 'GGE'): string {
    // Pad ID to 6 digits
    const paddedId = id.padStart(6, '0');
    return `${prefix}-${paddedId}`;
}

/**
 * Calculate days until a date
 */
export function daysUntil(date: Date): number {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
}
