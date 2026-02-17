import { AppDataSource } from '@/lib/db';
import { RegulatoryAlert, AlertType, AlertSeverity } from '@/entities/RegulatoryAlert';
import { Tenant, TenantStatus } from '@/entities/Tenant';
import { Account } from '@/entities/Account';
import { Loan } from '@/entities/Loan';
import { ComplianceScore } from '@/entities/ComplianceScore';
import { ByelawReview, ByelawReviewStatus } from '@/entities/ByelawReview';
import { ComplianceIssue, ComplianceIssueStatus, ComplianceIssueSeverity } from '@/entities/ComplianceIssue';
import { KYC } from '@/entities/KYC';

export class AlertGenerationService {
    /**
     * Generate alerts for all SACCOs based on current metrics
     */
    static async generateAlerts(): Promise<void> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenants = await AppDataSource.getRepository(Tenant).find({
            where: { status: TenantStatus.ACTIVE }
        });

        for (const tenant of tenants) {
            await this.checkLiquidityBreach(tenant);
            await this.checkHighRisk(tenant);
            await this.checkCapitalAdequacy(tenant);
            await this.checkComplianceScore(tenant);
            await this.checkPendingKYC(tenant);
            await this.checkByelawReview(tenant);
            await this.checkCriticalIssues(tenant);
        }
    }

    /**
     * Check for liquidity ratio breaches
     */
    private static async checkLiquidityBreach(tenant: Tenant): Promise<void> {
        const assets = await AppDataSource.getRepository(Account)
            .createQueryBuilder('account')
            .select('SUM(account.balance)', 'total')
            .where('account.tenantId = :tenantId', { tenantId: tenant.id })
            .getRawOne();

        const loans = await AppDataSource.getRepository(Loan)
            .createQueryBuilder('loan')
            .select('SUM(loan.outstandingBalance)', 'outstanding')
            .where('loan.tenantId = :tenantId', { tenantId: tenant.id })
            .getRawOne();

        const totalAssets = parseFloat(assets?.total || '0');
        const outstanding = parseFloat(loans?.outstanding || '0');

        const liquidityRatio = outstanding > 0 ? (totalAssets / outstanding) * 100 : 100;

        // Critical: < 10%, High: < 15%, Medium: < 20%
        if (liquidityRatio < 10) {
            await this.createAlert(tenant.id, {
                type: AlertType.LIQUIDITY_BREACH,
                severity: AlertSeverity.CRITICAL,
                title: 'Critical Liquidity Breach',
                description: `${tenant.name} has a critically low liquidity ratio of ${liquidityRatio.toFixed(2)}% (minimum required: 15%)`,
                metadata: { liquidityRatio, threshold: 15 }
            });
        } else if (liquidityRatio < 15) {
            await this.createAlert(tenant.id, {
                type: AlertType.LIQUIDITY_BREACH,
                severity: AlertSeverity.HIGH,
                title: 'Liquidity Ratio Below Minimum',
                description: `${tenant.name} has a liquidity ratio of ${liquidityRatio.toFixed(2)}% (minimum required: 15%)`,
                metadata: { liquidityRatio, threshold: 15 }
            });
        } else if (liquidityRatio < 20) {
            await this.createAlert(tenant.id, {
                type: AlertType.LIQUIDITY_BREACH,
                severity: AlertSeverity.MEDIUM,
                title: 'Low Liquidity Warning',
                description: `${tenant.name} has a liquidity ratio of ${liquidityRatio.toFixed(2)}%, approaching minimum threshold`,
                metadata: { liquidityRatio, threshold: 15 }
            });
        }
    }

    /**
     * Check for high-risk ratings
     */
    private static async checkHighRisk(tenant: Tenant): Promise<void> {
        const assets = await AppDataSource.getRepository(Account)
            .createQueryBuilder('account')
            .select('SUM(account.balance)', 'total')
            .where('account.tenantId = :tenantId', { tenantId: tenant.id })
            .getRawOne();

        const loans = await AppDataSource.getRepository(Loan)
            .createQueryBuilder('loan')
            .select('SUM(loan.outstandingBalance)', 'outstanding')
            .where('loan.tenantId = :tenantId', { tenantId: tenant.id })
            .getRawOne();

        const totalAssets = parseFloat(assets?.total || '0');
        const outstanding = parseFloat(loans?.outstanding || '0');
        const liquidityRatio = outstanding > 0 ? (totalAssets / outstanding) * 100 : 100;

        if (liquidityRatio < 15) {
            await this.createAlert(tenant.id, {
                type: AlertType.HIGH_RISK_RATING,
                severity: AlertSeverity.HIGH,
                title: 'High Risk Rating',
                description: `${tenant.name} has been classified as high risk due to poor financial metrics`,
                metadata: { liquidityRatio, riskRating: 'High' }
            });
        }
    }

    /**
     * Check capital adequacy
     */
    private static async checkCapitalAdequacy(tenant: Tenant): Promise<void> {
        const assets = await AppDataSource.getRepository(Account)
            .createQueryBuilder('account')
            .select('SUM(account.balance)', 'total')
            .where('account.tenantId = :tenantId', { tenantId: tenant.id })
            .getRawOne();

        const loans = await AppDataSource.getRepository(Loan)
            .createQueryBuilder('loan')
            .select('SUM(loan.outstandingBalance)', 'outstanding')
            .where('loan.tenantId = :tenantId', { tenantId: tenant.id })
            .getRawOne();

        const totalAssets = parseFloat(assets?.total || '0');
        const totalLoans = parseFloat(loans?.outstanding || '0');

        const capitalAdequacy = totalAssets > 0
            ? ((totalAssets - totalLoans) / totalAssets) * 100
            : 0;

        // Minimum capital adequacy: 10%
        if (capitalAdequacy < 8) {
            await this.createAlert(tenant.id, {
                type: AlertType.CAPITAL_ADEQUACY,
                severity: AlertSeverity.CRITICAL,
                title: 'Critical Capital Adequacy',
                description: `${tenant.name} has critically low capital adequacy of ${capitalAdequacy.toFixed(2)}% (minimum: 10%)`,
                metadata: { capitalAdequacy, threshold: 10 }
            });
        } else if (capitalAdequacy < 10) {
            await this.createAlert(tenant.id, {
                type: AlertType.CAPITAL_ADEQUACY,
                severity: AlertSeverity.HIGH,
                title: 'Low Capital Adequacy',
                description: `${tenant.name} has capital adequacy of ${capitalAdequacy.toFixed(2)}% (minimum: 10%)`,
                metadata: { capitalAdequacy, threshold: 10 }
            });
        }
    }

    /**
     * Check for low compliance scores
     */
    private static async checkComplianceScore(tenant: Tenant): Promise<void> {
        if (tenant.currentComplianceScore !== undefined && tenant.currentComplianceScore !== null) {
            if (tenant.currentComplianceScore < 40) {
                await this.createAlert(tenant.id, {
                    type: AlertType.LOW_COMPLIANCE_SCORE,
                    severity: AlertSeverity.CRITICAL,
                    title: 'Critical Compliance Score',
                    description: `${tenant.name} has a critical compliance score of ${tenant.currentComplianceScore}. Immediate action required.`,
                    metadata: { score: tenant.currentComplianceScore, rating: tenant.complianceRating }
                });
            } else if (tenant.currentComplianceScore < 60) {
                await this.createAlert(tenant.id, {
                    type: AlertType.LOW_COMPLIANCE_SCORE,
                    severity: AlertSeverity.HIGH,
                    title: 'Low Compliance Score',
                    description: `${tenant.name} has a low compliance score of ${tenant.currentComplianceScore}.`,
                    metadata: { score: tenant.currentComplianceScore, rating: tenant.complianceRating }
                });
            }
        }
    }

    /**
     * Check for pending KYC verifications
     */
    private static async checkPendingKYC(tenant: Tenant): Promise<void> {
        const kycRepo = AppDataSource.getRepository(KYC);

        // Count unverified KYC records for this tenant
        // Note: Assuming KYC has tenantId or link to Member which has tenantId
        // From previous context, KYCVerificationService uses query builder for this
        const pendingCount = await kycRepo.createQueryBuilder('kyc')
            .innerJoin('members', 'm', 'm.id = kyc.memberId')
            .where('m.tenantId = :tenantId', { tenantId: tenant.id })
            .andWhere('(kyc.identityVerified = false OR kyc.residenceVerified = false OR kyc.incomeVerified = false)')
            .getCount();

        if (pendingCount > 50) {
            await this.createAlert(tenant.id, {
                type: AlertType.PENDING_KYC_VERIFICATION,
                severity: AlertSeverity.HIGH,
                title: 'High Number of Pending KYC',
                description: `${tenant.name} has ${pendingCount} pending member KYC verifications.`,
                metadata: { pendingCount }
            });
        }
    }

    /**
     * Check for overdue bye-laws reviews
     */
    private static async checkByelawReview(tenant: Tenant): Promise<void> {
        const byelawRepo = AppDataSource.getRepository(ByelawReview);

        const overdueReview = await byelawRepo.findOne({
            where: {
                tenantId: tenant.id,
                status: ByelawReviewStatus.PENDING
            },
            order: { submittedAt: 'ASC' }
        });

        if (overdueReview) {
            const daysPending = Math.floor((new Date().getTime() - overdueReview.submittedAt.getTime()) / (1000 * 60 * 60 * 24));

            if (daysPending > 30) {
                await this.createAlert(tenant.id, {
                    type: AlertType.OVERDUE_BYELAW_REVIEW,
                    severity: AlertSeverity.HIGH,
                    title: 'Overdue Bye-laws Review',
                    description: `${tenant.name} has a bye-laws submission pending for ${daysPending} days.`,
                    metadata: { reviewId: overdueReview.id, daysPending }
                });
            }
        }
    }

    /**
     * Check for critical compliance issues
     */
    private static async checkCriticalIssues(tenant: Tenant): Promise<void> {
        const issueRepo = AppDataSource.getRepository(ComplianceIssue);

        const criticalCount = await issueRepo.count({
            where: {
                tenantId: tenant.id,
                status: ComplianceIssueStatus.OPEN,
                severity: ComplianceIssueSeverity.CRITICAL
            }
        });

        if (criticalCount > 0) {
            await this.createAlert(tenant.id, {
                type: AlertType.COMPLIANCE_ISSUE,
                severity: AlertSeverity.CRITICAL,
                title: 'Critical Compliance Issues',
                description: `${tenant.name} has ${criticalCount} open critical compliance issues.`,
                metadata: { criticalCount }
            });
        }
    }

    /**
     * Create an alert if it doesn't already exist (avoid duplicates)
     */
    private static async createAlert(
        tenantId: string,
        alertData: {
            type: AlertType;
            severity: AlertSeverity;
            title: string;
            description: string;
            metadata?: Record<string, any>;
        }
    ): Promise<void> {
        const alertRepo = AppDataSource.getRepository(RegulatoryAlert);

        // Check if similar unresolved alert exists
        const existing = await alertRepo.findOne({
            where: {
                tenantId,
                type: alertData.type,
                isResolved: false
            }
        });

        if (!existing) {
            const alert = alertRepo.create({
                tenantId,
                ...alertData
            });
            await alertRepo.save(alert);
        }
    }
}
