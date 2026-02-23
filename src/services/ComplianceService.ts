import { ComplianceScore, ComplianceRating } from '@/src/entities/ComplianceScore';
import { ComplianceIssue, ComplianceIssueStatus } from '@/src/entities/ComplianceIssue';
import { RegulatoryAlert } from '@/src/entities/RegulatoryAlert';
import { KYC } from '@/src/entities/KYC';
import { Member } from '@/src/entities/Member';
import { ByelawReview, ByelawReviewStatus } from '@/src/entities/ByelawReview';
import { Tenant } from '@/src/entities/Tenant';
import { RegulatorSettings } from '@/src/entities/RegulatorSettings';
import { ComplianceRule, ComplianceMetric, ComparisonOperator } from '@/src/entities/ComplianceRule';
import { ComplianceAudit, AuditStatus } from '@/src/entities/ComplianceAudit';
import { AlertType, AlertSeverity } from '@/src/entities/RegulatoryAlert';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

export class ComplianceService {
    /**
     * Calculate compliance score for a specific SACCO
     * Score is weighted average of:
     * - KYC compliance rate (25%)
     * - Financial reporting timeliness (25%)
     * - Bye-laws adherence (20%)
     * - Open compliance issues (20%)
     * - Regulatory alert resolution rate (10%)
     */
    static async calculateComplianceScore(
        tenantId: string,
        calculatedBy: string
    ): Promise<ComplianceScore> {
        // Calculate component scores
        const kycScore = await this.calculateKYCScore(tenantId);
        const reportingScore = await this.calculateReportingScore(tenantId);
        const bylawScore = await this.calculateBylawScore(tenantId);
        const issueScore = await this.calculateIssueScore(tenantId);
        const alertScore = await this.calculateAlertScore(tenantId);

        // Fetch thresholds from settings or use defaults
        const [[settings]] = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any;

        const thresholds = {
            excellent: Number(settings?.excellentThreshold || 90),
            good: Number(settings?.goodThreshold || 75),
            fair: Number(settings?.fairThreshold || 60),
            poor: Number(settings?.poorThreshold || 40),
        };

        const overallScore =
            kycScore * 0.25 +
            reportingScore * 0.25 +
            bylawScore * 0.2 +
            issueScore * 0.2 +
            alertScore * 0.1;

        let rating = ComplianceRating.CRITICAL;
        if (overallScore >= thresholds.excellent) rating = ComplianceRating.EXCELLENT;
        else if (overallScore >= thresholds.good) rating = ComplianceRating.GOOD;
        else if (overallScore >= thresholds.fair) rating = ComplianceRating.FAIR;
        else if (overallScore >= thresholds.poor) rating = ComplianceRating.POOR;

        // Create new compliance score record
        const scoreId = uuidv4();
        await execute(
            `INSERT INTO compliance_scores 
             (id, tenantId, overallScore, kycScore, reportingScore, bylawScore, issueScore, alertScore, rating, calculatedAt, calculatedBy, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
            [scoreId, tenantId, overallScore, kycScore, reportingScore, bylawScore, issueScore, alertScore, rating, calculatedBy]
        );

        const [[complianceScore]] = await query('SELECT * FROM compliance_scores WHERE id = ?', [scoreId]) as any;

        // Update tenant with latest score
        await execute(
            'UPDATE tenants SET currentComplianceScore = ?, complianceRating = ?, lastComplianceReviewDate = NOW(), updatedAt = NOW() WHERE id = ?',
            [overallScore, rating, tenantId]
        );

        return complianceScore as ComplianceScore;
    }

    /**
     * Calculate KYC compliance rate (0-100)
     * Based on percentage of members with fully verified KYC
     */
    private static async calculateKYCScore(tenantId: string): Promise<number> {
        const [[totalMembersResult]] = await query('SELECT COUNT(*) as count FROM members WHERE tenantId = ?', [tenantId]) as any;
        const totalMembers = Number(totalMembersResult?.count || 0);

        if (totalMembers === 0) return 100; // No members = perfect score

        const [[verifiedKYCResult]] = await query(`
            SELECT COUNT(*) as count 
            FROM kyc 
            INNER JOIN members m ON m.id = kyc.memberId 
            WHERE m.tenantId = ? AND kyc.identityVerified = true AND kyc.residenceVerified = true AND kyc.incomeVerified = true
        `, [tenantId]) as any;

        const verifiedKYCs = Number(verifiedKYCResult?.count || 0);

        return (verifiedKYCs / totalMembers) * 100;
    }

    /**
     * Calculate reporting timeliness score (0-100)
     * For now, returns a default score of 85
     * TODO: Implement actual reporting tracking
     */
    private static async calculateReportingScore(tenantId: string): Promise<number> {
        // Placeholder - would need reporting submission tracking
        return 85;
    }

    /**
     * Calculate bye-laws adherence score (0-100)
     * Based on approved bye-laws and compliance
     */
    private static async calculateBylawScore(tenantId: string): Promise<number> {
        const [[latestReview]] = await query(
            'SELECT * FROM byelaw_reviews WHERE tenantId = ? ORDER BY submittedAt DESC LIMIT 1',
            [tenantId]
        ) as any;

        if (!latestReview) return 50; // No bye-laws submitted = medium score

        if (latestReview.status === ByelawReviewStatus.APPROVED) {
            // Check if approval is recent (within 2 years)
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            const approvalDate = latestReview.approvalDate ? new Date(latestReview.approvalDate) : null;
            if (approvalDate && approvalDate > twoYearsAgo) {
                return 100;
            }
            return 80; // Approved but old
        }

        if (latestReview.status === ByelawReviewStatus.PENDING ||
            latestReview.status === ByelawReviewStatus.UNDER_REVIEW) {
            return 70; // Pending review
        }

        if (latestReview.status === ByelawReviewStatus.REVISION_REQUIRED) {
            return 60; // Needs revision
        }

        return 40; // Rejected
    }

    /**
     * Calculate issue score (0-100)
     * Based on number and severity of open compliance issues
     */
    private static async calculateIssueScore(tenantId: string): Promise<number> {
        const openIssues = await query(
            'SELECT severity FROM compliance_issues WHERE tenantId = ? AND status = ?',
            [tenantId, ComplianceIssueStatus.OPEN]
        ) as any[];

        if (openIssues.length === 0) return 100;

        // Weight issues by severity
        let weightedIssues = 0;
        openIssues.forEach(issue => {
            switch (issue.severity) {
                case 'critical':
                    weightedIssues += 4;
                    break;
                case 'high':
                    weightedIssues += 3;
                    break;
                case 'medium':
                    weightedIssues += 2;
                    break;
                case 'low':
                    weightedIssues += 1;
                    break;
            }
        });

        // Deduct 5 points per weighted issue, minimum 0
        return Math.max(0, 100 - (weightedIssues * 5));
    }

    /**
     * Calculate alert resolution score (0-100)
     * Based on percentage of resolved regulatory alerts
     */
    private static async calculateAlertScore(tenantId: string): Promise<number> {
        const [[totalAlertsResult]] = await query('SELECT COUNT(*) as count FROM regulatory_alerts WHERE tenantId = ?', [tenantId]) as any;
        const totalAlerts = Number(totalAlertsResult?.count || 0);

        if (totalAlerts === 0) return 100; // No alerts = perfect score

        const [[resolvedAlertsResult]] = await query('SELECT COUNT(*) as count FROM regulatory_alerts WHERE tenantId = ? AND isResolved = true', [tenantId]) as any;
        const resolvedAlerts = Number(resolvedAlertsResult?.count || 0);

        return (resolvedAlerts / totalAlerts) * 100;
    }

    /**
     * Get compliance score history for a SACCO
     */
    static async getComplianceScoreHistory(
        tenantId: string,
        limit: number = 10
    ): Promise<ComplianceScore[]> {
        const results = await query(`
            SELECT s.*, t.name as tenantName, u.firstName as calculatorFirstName, u.lastName as calculatorLastName 
            FROM compliance_scores s 
            LEFT JOIN tenants t ON t.id = s.tenantId 
            LEFT JOIN users u ON u.id = s.calculatedBy 
            WHERE s.tenantId = ? 
            ORDER BY s.calculatedAt DESC LIMIT ?
        `, [tenantId, limit]);

        return results.map((s: any) => ({
            ...s,
            tenant: s.tenantId ? { id: s.tenantId, name: s.tenantName } : undefined,
            calculator: s.calculatedBy ? { id: s.calculatedBy, firstName: s.calculatorFirstName, lastName: s.calculatorLastName } : undefined
        })) as ComplianceScore[];
    }

    /**
     * Get all compliance scores for all SACCOs
     */
    static async getAllComplianceScores(): Promise<ComplianceScore[]> {
        const results = await query(`
            SELECT score.*, t.name as tenantName, u.firstName as calculatorFirstName, u.lastName as calculatorLastName
            FROM compliance_scores score
            LEFT JOIN tenants t ON t.id = score.tenantId
            LEFT JOIN users u ON u.id = score.calculatedBy
            WHERE score.calculatedAt = (
                SELECT MAX(s.calculatedAt) 
                FROM compliance_scores s 
                WHERE s.tenantId = score.tenantId
            )
            ORDER BY score.overallScore ASC
        `);

        return results.map((s: any) => ({
            ...s,
            tenant: s.tenantId ? { id: s.tenantId, name: s.tenantName } : undefined,
            calculator: s.calculatedBy ? { id: s.calculatedBy, firstName: s.calculatorFirstName, lastName: s.calculatorLastName } : undefined
        })) as ComplianceScore[];
    }

    /**
     * Get detailed compliance metrics for a SACCO
     */
    static async getComplianceMetrics(tenantId: string) {
        const [[latestScore]] = await query(`
            SELECT s.*, t.name as tenantName, u.firstName as calculatorFirstName, u.lastName as calculatorLastName 
            FROM compliance_scores s 
            LEFT JOIN tenants t ON t.id = s.tenantId 
            LEFT JOIN users u ON u.id = s.calculatedBy 
            WHERE s.tenantId = ? 
            ORDER BY s.calculatedAt DESC LIMIT 1
        `, [tenantId]) as any;

        const [[openIssuesResult]] = await query('SELECT COUNT(*) as count FROM compliance_issues WHERE tenantId = ? AND status = ?', [tenantId, ComplianceIssueStatus.OPEN]) as any;
        const openIssuesCount = Number(openIssuesResult?.count || 0);

        const [[pendingKycResult]] = await query(`
            SELECT COUNT(*) as count 
            FROM kyc 
            INNER JOIN members m ON m.id = kyc.memberId 
            WHERE m.tenantId = ? AND (kyc.identityVerified = false OR kyc.residenceVerified = false OR kyc.incomeVerified = false)
        `, [tenantId]) as any;
        const pendingKYCCount = Number(pendingKycResult?.count || 0);

        const [[bylawReview]] = await query('SELECT * FROM byelaw_reviews WHERE tenantId = ? ORDER BY submittedAt DESC LIMIT 1', [tenantId]) as any;

        return {
            latestScore: latestScore ? {
                ...latestScore,
                tenant: latestScore.tenantId ? { id: latestScore.tenantId, name: latestScore.tenantName } : undefined,
                calculator: latestScore.calculatedBy ? { id: latestScore.calculatedBy, firstName: latestScore.calculatorFirstName, lastName: latestScore.calculatorLastName } : undefined
            } : null,
            openIssuesCount,
            pendingKYCCount,
            bylawReview,
        };
    }

    /**
     * Rule Engine: Evaluate all active rules for a tenant
     */
    static async evaluateRules(tenantId: string): Promise<void> {
        const activeRules = await query('SELECT * FROM compliance_rules WHERE isActive = true') as any[];

        if (activeRules.length === 0) return;

        // Fetch current metrics
        const kycScore = await this.calculateKYCScore(tenantId);
        const reportingScore = await this.calculateReportingScore(tenantId);
        const bylawScore = await this.calculateBylawScore(tenantId);
        const issueScore = await this.calculateIssueScore(tenantId);
        const alertScore = await this.calculateAlertScore(tenantId);
        const overallScore = kycScore * 0.25 + reportingScore * 0.25 + bylawScore * 0.2 + issueScore * 0.2 + alertScore * 0.1;

        for (const rule of activeRules) {
            let metricValue = 0;
            switch (rule.metric) {
                case ComplianceMetric.KYC_RATE: metricValue = kycScore; break;
                case ComplianceMetric.FINANCIAL_TIMELINESS: metricValue = reportingScore; break;
                case ComplianceMetric.BYLAW_ADHERENCE: metricValue = bylawScore; break;
                case ComplianceMetric.OPEN_ISSUES: metricValue = issueScore; break;
                case ComplianceMetric.COMPLIANCE_SCORE: metricValue = overallScore; break;
            }

            let triggered = false;
            const threshold = Number(rule.threshold || 0);
            switch (rule.operator) {
                case ComparisonOperator.LESS_THAN: triggered = metricValue < threshold; break;
                case ComparisonOperator.GREATER_THAN: triggered = metricValue > threshold; break;
                case ComparisonOperator.EQUALS: triggered = metricValue === threshold; break;
                case ComparisonOperator.LESS_THAN_OR_EQUAL: triggered = metricValue <= threshold; break;
                case ComparisonOperator.GREATER_THAN_OR_EQUAL: triggered = metricValue >= threshold; break;
            }

            if (triggered) {
                // Check if a similar unresolved alert already exists
                const title = `Automated Alert: ${rule.name}`;
                const [[existingAlert]] = await query(
                    'SELECT * FROM regulatory_alerts WHERE tenantId = ? AND type = ? AND title = ? AND isResolved = false LIMIT 1',
                    [tenantId, AlertType.COMPLIANCE_ISSUE, title]
                ) as any;

                if (!existingAlert) {
                    const id = uuidv4();
                    const metadata = { ruleId: rule.id, metric: rule.metric, value: metricValue };
                    await execute(
                        'INSERT INTO regulatory_alerts (id, tenantId, type, severity, title, description, metadata, isResolved, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                        [id, tenantId, AlertType.COMPLIANCE_ISSUE, rule.severity, title, `Rule "${rule.name}" triggered. Metric ${rule.metric} is ${metricValue}, which is ${rule.operator} ${rule.threshold}.`, JSON.stringify(metadata), false]
                    );
                }
            }
        }
    }

    /**
     * Audit Scheduler: Schedule a new audit
     */
    static async scheduleAudit(tenantId: string, auditorId: string, scheduledDate: Date): Promise<ComplianceAudit> {
        const id = uuidv4();
        await execute(
            'INSERT INTO compliance_audits (id, tenantId, auditorId, scheduledDate, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [id, tenantId, auditorId, scheduledDate, AuditStatus.PENDING]
        );

        const [[audit]] = await query('SELECT * FROM compliance_audits WHERE id = ? LIMIT 1', [id]) as any;
        return audit as ComplianceAudit;
    }

    /**
     * Audit Scheduler: Complete an audit
     */
    static async completeAudit(auditId: string, findings: string): Promise<ComplianceAudit> {
        const [[audit]] = await query('SELECT * FROM compliance_audits WHERE id = ? LIMIT 1', [auditId]) as any;

        if (!audit) throw new Error('Audit not found');

        // Capture current score
        const latestMetrics = await this.getComplianceMetrics(audit.tenantId);

        const complianceScoreAtTime = latestMetrics.latestScore?.overallScore || 0;

        await execute(
            'UPDATE compliance_audits SET status = ?, completedDate = NOW(), findings = ?, complianceScoreAtTime = ?, updatedAt = NOW() WHERE id = ?',
            [AuditStatus.COMPLETED, findings, complianceScoreAtTime, auditId]
        );

        const [[updatedAudit]] = await query('SELECT * FROM compliance_audits WHERE id = ? LIMIT 1', [auditId]) as any;
        return updatedAudit as ComplianceAudit;
    }

    /**
     * Rule Management
     */
    static async saveRule(ruleData: Partial<ComplianceRule>): Promise<ComplianceRule> {
        let id = ruleData.id;
        if (id) {
            await execute(
                'UPDATE compliance_rules SET name = ?, metric = ?, operator = ?, threshold = ?, severity = ?, isActive = ?, description = ?, updatedAt = NOW() WHERE id = ?',
                [ruleData.name, ruleData.metric, ruleData.operator, ruleData.threshold, ruleData.severity, ruleData.isActive ?? true, ruleData.description, id]
            );
        } else {
            id = uuidv4();
            await execute(
                'INSERT INTO compliance_rules (id, name, metric, operator, threshold, severity, isActive, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [id, ruleData.name, ruleData.metric, ruleData.operator, ruleData.threshold, ruleData.severity, ruleData.isActive ?? true, ruleData.description]
            );
        }

        const [[rule]] = await query('SELECT * FROM compliance_rules WHERE id = ? LIMIT 1', [id]) as any;
        return rule as ComplianceRule;
    }

    static async getRules(): Promise<ComplianceRule[]> {
        return await query('SELECT * FROM compliance_rules') as ComplianceRule[];
    }
}
