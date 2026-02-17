import { AppDataSource } from '@/src/config/database';
import { ComplianceScore, ComplianceRating } from '@/src/entities/ComplianceScore';
import { ComplianceIssue, ComplianceIssueStatus } from '@/src/entities/ComplianceIssue';
import { RegulatoryAlert } from '@/src/entities/RegulatoryAlert';
import { KYC } from '@/src/entities/KYC';
import { Member } from '@/src/entities/Member';
import { ByelawReview, ByelawReviewStatus } from '@/src/entities/ByelawReview';
import { Tenant } from '@/src/entities/Tenant';

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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const complianceScoreRepo = AppDataSource.getRepository(ComplianceScore);
        const tenantRepo = AppDataSource.getRepository(Tenant);

        // Calculate component scores
        const kycScore = await this.calculateKYCScore(tenantId);
        const reportingScore = await this.calculateReportingScore(tenantId);
        const bylawScore = await this.calculateBylawScore(tenantId);
        const issueScore = await this.calculateIssueScore(tenantId);
        const alertScore = await this.calculateAlertScore(tenantId);

        // Calculate weighted overall score
        const overallScore =
            kycScore * 0.25 +
            reportingScore * 0.25 +
            bylawScore * 0.2 +
            issueScore * 0.2 +
            alertScore * 0.1;

        const rating = ComplianceScore.getRatingFromScore(overallScore);

        // Create new compliance score record
        const complianceScore = complianceScoreRepo.create({
            tenantId,
            overallScore,
            kycScore,
            reportingScore,
            bylawScore,
            issueScore,
            alertScore,
            rating,
            calculatedAt: new Date(),
            calculatedBy,
        });

        await complianceScoreRepo.save(complianceScore);

        // Update tenant with latest score
        await tenantRepo.update(tenantId, {
            currentComplianceScore: overallScore,
            complianceRating: rating,
            lastComplianceReviewDate: new Date(),
        });

        return complianceScore;
    }

    /**
     * Calculate KYC compliance rate (0-100)
     * Based on percentage of members with fully verified KYC
     */
    private static async calculateKYCScore(tenantId: string): Promise<number> {
        const memberRepo = AppDataSource.getRepository(Member);
        const kycRepo = AppDataSource.getRepository(KYC);

        const totalMembers = await memberRepo.count({ where: { tenantId } });
        if (totalMembers === 0) return 100; // No members = perfect score

        const verifiedKYCs = await kycRepo
            .createQueryBuilder('kyc')
            .innerJoin('kyc.member', 'member')
            .where('member.tenantId = :tenantId', { tenantId })
            .andWhere('kyc.identityVerified = :verified', { verified: true })
            .andWhere('kyc.residenceVerified = :verified', { verified: true })
            .andWhere('kyc.incomeVerified = :verified', { verified: true })
            .getCount();

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
        const bylawRepo = AppDataSource.getRepository(ByelawReview);

        const latestReview = await bylawRepo.findOne({
            where: { tenantId },
            order: { submittedAt: 'DESC' },
        });

        if (!latestReview) return 50; // No bye-laws submitted = medium score

        if (latestReview.status === ByelawReviewStatus.APPROVED) {
            // Check if approval is recent (within 2 years)
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            if (latestReview.approvalDate && latestReview.approvalDate > twoYearsAgo) {
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
        const issueRepo = AppDataSource.getRepository(ComplianceIssue);

        const openIssues = await issueRepo.find({
            where: {
                tenantId,
                status: ComplianceIssueStatus.OPEN,
            },
        });

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
        const alertRepo = AppDataSource.getRepository(RegulatoryAlert);

        const totalAlerts = await alertRepo.count({ where: { tenantId } });
        if (totalAlerts === 0) return 100; // No alerts = perfect score

        const resolvedAlerts = await alertRepo.count({
            where: { tenantId, isResolved: true },
        });

        return (resolvedAlerts / totalAlerts) * 100;
    }

    /**
     * Get compliance score history for a SACCO
     */
    static async getComplianceScoreHistory(
        tenantId: string,
        limit: number = 10
    ): Promise<ComplianceScore[]> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const complianceScoreRepo = AppDataSource.getRepository(ComplianceScore);

        return await complianceScoreRepo.find({
            where: { tenantId },
            order: { calculatedAt: 'DESC' },
            take: limit,
            relations: ['tenant', 'calculator'],
        });
    }

    /**
     * Get all compliance scores for all SACCOs
     */
    static async getAllComplianceScores(): Promise<ComplianceScore[]> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const complianceScoreRepo = AppDataSource.getRepository(ComplianceScore);

        // Get latest score for each tenant
        const scores = await complianceScoreRepo
            .createQueryBuilder('score')
            .leftJoinAndSelect('score.tenant', 'tenant')
            .leftJoinAndSelect('score.calculator', 'calculator')
            .where((qb) => {
                const subQuery = qb
                    .subQuery()
                    .select('MAX(s.calculatedAt)')
                    .from(ComplianceScore, 's')
                    .where('s.tenantId = score.tenantId')
                    .getQuery();
                return 'score.calculatedAt = ' + subQuery;
            })
            .orderBy('score.overallScore', 'ASC')
            .getMany();

        return scores;
    }

    /**
     * Get detailed compliance metrics for a SACCO
     */
    static async getComplianceMetrics(tenantId: string) {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const latestScore = await AppDataSource.getRepository(ComplianceScore).findOne({
            where: { tenantId },
            order: { calculatedAt: 'DESC' },
            relations: ['tenant', 'calculator'],
        });

        const openIssuesCount = await AppDataSource.getRepository(ComplianceIssue).count({
            where: { tenantId, status: ComplianceIssueStatus.OPEN },
        });

        const pendingKYCCount = await AppDataSource.getRepository(KYC)
            .createQueryBuilder('kyc')
            .innerJoin('kyc.member', 'member')
            .where('member.tenantId = :tenantId', { tenantId })
            .andWhere('(kyc.identityVerified = :notVerified OR kyc.residenceVerified = :notVerified OR kyc.incomeVerified = :notVerified)',
                { notVerified: false })
            .getCount();

        const bylawReview = await AppDataSource.getRepository(ByelawReview).findOne({
            where: { tenantId },
            order: { submittedAt: 'DESC' },
        });

        return {
            latestScore,
            openIssuesCount,
            pendingKYCCount,
            bylawReview,
        };
    }
}
