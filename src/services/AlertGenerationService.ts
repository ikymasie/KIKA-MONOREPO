
import { query, execute } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export class AlertGenerationService {
    /**
     * Generate alerts for all SACCOs based on current metrics
     */
    static async generateAlerts(): Promise<void> {
        const tenants = await query(
            'SELECT * FROM tenants WHERE status = ?',
            ['active']
        ) as any[];

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
    private static async checkLiquidityBreach(tenant: any): Promise<void> {
        const [[assets]] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [tenant.id]) as any;
        const [[loans]] = await query('SELECT SUM(outstandingBalance) as outstanding FROM loans WHERE tenantId = ?', [tenant.id]) as any;

        const totalAssets = parseFloat(assets?.total || '0');
        const outstanding = parseFloat(loans?.outstanding || '0');

        const liquidityRatio = outstanding > 0 ? (totalAssets / outstanding) * 100 : 100;

        // Critical: < 10%, High: < 15%, Medium: < 20%
        if (liquidityRatio < 10) {
            await this.createAlert(tenant.id, {
                type: 'liquidity_breach',
                severity: 'critical',
                title: 'Critical Liquidity Breach',
                description: `${tenant.name} has a critically low liquidity ratio of ${liquidityRatio.toFixed(2)}% (minimum required: 15%)`,
                metadata: { liquidityRatio, threshold: 15 }
            });
        } else if (liquidityRatio < 15) {
            await this.createAlert(tenant.id, {
                type: 'liquidity_breach',
                severity: 'high',
                title: 'Liquidity Ratio Below Minimum',
                description: `${tenant.name} has a liquidity ratio of ${liquidityRatio.toFixed(2)}% (minimum required: 15%)`,
                metadata: { liquidityRatio, threshold: 15 }
            });
        } else if (liquidityRatio < 20) {
            await this.createAlert(tenant.id, {
                type: 'liquidity_breach',
                severity: 'medium',
                title: 'Low Liquidity Warning',
                description: `${tenant.name} has a liquidity ratio of ${liquidityRatio.toFixed(2)}%, approaching minimum threshold`,
                metadata: { liquidityRatio, threshold: 15 }
            });
        }
    }

    /**
     * Check for high-risk ratings
     */
    private static async checkHighRisk(tenant: any): Promise<void> {
        const [[assets]] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [tenant.id]) as any;
        const [[loans]] = await query('SELECT SUM(outstandingBalance) as outstanding FROM loans WHERE tenantId = ?', [tenant.id]) as any;

        const totalAssets = parseFloat(assets?.total || '0');
        const outstanding = parseFloat(loans?.outstanding || '0');
        const liquidityRatio = outstanding > 0 ? (totalAssets / outstanding) * 100 : 100;

        if (liquidityRatio < 15) {
            await this.createAlert(tenant.id, {
                type: 'high_risk_rating',
                severity: 'high',
                title: 'High Risk Rating',
                description: `${tenant.name} has been classified as high risk due to poor financial metrics`,
                metadata: { liquidityRatio, riskRating: 'High' }
            });
        }
    }

    /**
     * Check capital adequacy
     */
    private static async checkCapitalAdequacy(tenant: any): Promise<void> {
        const [[assets]] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [tenant.id]) as any;
        const [[loans]] = await query('SELECT SUM(outstandingBalance) as outstanding FROM loans WHERE tenantId = ?', [tenant.id]) as any;

        const totalAssets = parseFloat(assets?.total || '0');
        const totalLoans = parseFloat(loans?.outstanding || '0');

        const capitalAdequacy = totalAssets > 0
            ? ((totalAssets - totalLoans) / totalAssets) * 100
            : 0;

        // Minimum capital adequacy: 10%
        if (capitalAdequacy < 8) {
            await this.createAlert(tenant.id, {
                type: 'capital_adequacy',
                severity: 'critical',
                title: 'Critical Capital Adequacy',
                description: `${tenant.name} has critically low capital adequacy of ${capitalAdequacy.toFixed(2)}% (minimum: 10%)`,
                metadata: { capitalAdequacy, threshold: 10 }
            });
        } else if (capitalAdequacy < 10) {
            await this.createAlert(tenant.id, {
                type: 'capital_adequacy',
                severity: 'high',
                title: 'Low Capital Adequacy',
                description: `${tenant.name} has capital adequacy of ${capitalAdequacy.toFixed(2)}% (minimum: 10%)`,
                metadata: { capitalAdequacy, threshold: 10 }
            });
        }
    }

    /**
     * Check for low compliance scores
     */
    private static async checkComplianceScore(tenant: any): Promise<void> {
        if (tenant.currentComplianceScore !== undefined && tenant.currentComplianceScore !== null) {
            if (tenant.currentComplianceScore < 40) {
                await this.createAlert(tenant.id, {
                    type: 'low_compliance_score',
                    severity: 'critical',
                    title: 'Critical Compliance Score',
                    description: `${tenant.name} has a critical compliance score of ${tenant.currentComplianceScore}. Immediate action required.`,
                    metadata: { score: tenant.currentComplianceScore, rating: tenant.complianceRating }
                });
            } else if (tenant.currentComplianceScore < 60) {
                await this.createAlert(tenant.id, {
                    type: 'low_compliance_score',
                    severity: 'high',
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
    private static async checkPendingKYC(tenant: any): Promise<void> {
        const [[result]] = await query(`
            SELECT COUNT(*) as count 
            FROM kyc
            INNER JOIN members m ON m.id = kyc.memberId
            WHERE m.tenantId = ? AND (kyc.identityVerified = false OR kyc.residenceVerified = false OR kyc.incomeVerified = false)
        `, [tenant.id]) as any;

        const pendingCount = Number(result?.count || 0);

        if (pendingCount > 50) {
            await this.createAlert(tenant.id, {
                type: 'pending_kyc_verification',
                severity: 'high',
                title: 'High Number of Pending KYC',
                description: `${tenant.name} has ${pendingCount} pending member KYC verifications.`,
                metadata: { pendingCount }
            });
        }
    }

    /**
     * Check for overdue bye-laws reviews
     */
    private static async checkByelawReview(tenant: any): Promise<void> {
        const [[overdueReview]] = await query(
            'SELECT * FROM byelaw_reviews WHERE tenantId = ? AND status = ? ORDER BY submittedAt ASC LIMIT 1',
            [tenant.id, 'pending']
        ) as any;

        const submittedAt = overdueReview?.submittedAt ? new Date(overdueReview.submittedAt) : undefined;
        if (overdueReview && submittedAt) {
            const daysPending = Math.floor((new Date().getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));

            if (daysPending > 30) {
                await this.createAlert(tenant.id, {
                    type: 'overdue_byelaw_review',
                    severity: 'high',
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
    private static async checkCriticalIssues(tenant: any): Promise<void> {
        const [[result]] = await query(
            'SELECT COUNT(*) as count FROM compliance_issues WHERE tenantId = ? AND status = ? AND severity = ?',
            [tenant.id, 'open', 'critical']
        ) as any;

        const criticalCount = Number(result?.count || 0);

        if (criticalCount > 0) {
            await this.createAlert(tenant.id, {
                type: 'compliance_issue',
                severity: 'critical',
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
        tenantId: string | undefined,
        alertData: {
            type: string;
            severity: string;
            title: string;
            description: string;
            metadata?: Record<string, any>;
        }
    ): Promise<void> {
        if (!tenantId) return;

        // Check if similar unresolved alert exists
        const [[existing]] = await query(
            'SELECT * FROM regulatory_alerts WHERE tenantId = ? AND type = ? AND isResolved = false LIMIT 1',
            [tenantId, alertData.type]
        ) as any;

        if (!existing) {
            const id = uuidv4();
            await execute(
                'INSERT INTO regulatory_alerts (id, tenantId, type, severity, title, description, metadata, isResolved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [id, tenantId, alertData.type, alertData.severity, alertData.title, alertData.description, alertData.metadata ? JSON.stringify(alertData.metadata) : null, false]
            );
        }
    }
}
