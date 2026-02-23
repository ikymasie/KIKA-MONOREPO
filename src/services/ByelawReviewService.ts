import { ByelawReview, ByelawReviewStatus } from '@/src/entities/ByelawReview';
import { Tenant } from '@/src/entities/Tenant';
import { query, queryOne, execute } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export interface ByelawReviewSubmission {
    reviewId: string;
    status: ByelawReviewStatus;
    notes: string;
    reviewedBy: string;
}

export class ByelawReviewService {
    /**
     * Get all pending bye-laws reviews
     */
    static async getPendingReviews(limit: number = 50): Promise<ByelawReview[]> {
        const results = await query(
            `SELECT r.*, t.name as tenantName 
             FROM byelaw_reviews r 
             LEFT JOIN tenants t ON t.id = r.tenantId 
             WHERE r.status IN (?, ?) 
             ORDER BY r.submittedAt ASC 
             LIMIT ?`,
            [ByelawReviewStatus.PENDING, ByelawReviewStatus.UNDER_REVIEW, limit]
        );

        return results.map((r: any) => ({
            ...r,
            tenant: r.tenantId ? { id: r.tenantId, name: r.tenantName } : undefined
        })) as ByelawReview[];
    }

    /**
     * Get bye-law review by ID
     */
    static async getReviewById(reviewId: string): Promise<ByelawReview | null> {
        const [[review]] = await query(`
            SELECT r.*, t.name as tenantName, u.firstName as reviewerFirstName, u.lastName as reviewerLastName 
            FROM byelaw_reviews r 
            LEFT JOIN tenants t ON t.id = r.tenantId 
            LEFT JOIN users u ON u.id = r.reviewedBy 
            WHERE r.id = ? LIMIT 1
        `, [reviewId]) as any;

        if (!review) return null;

        return {
            ...review,
            tenant: review.tenantId ? { id: review.tenantId, name: review.tenantName } : undefined,
            reviewer: review.reviewedBy ? { id: review.reviewedBy, firstName: review.reviewerFirstName, lastName: review.reviewerLastName } : undefined
        } as ByelawReview;
    }

    /**
     * Submit a bye-laws review
     */
    static async submitReview(submission: ByelawReviewSubmission): Promise<ByelawReview> {
        const [[review]] = await query('SELECT * FROM byelaw_reviews WHERE id = ? LIMIT 1', [submission.reviewId]) as any;

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        await execute(
            'UPDATE byelaw_reviews SET status = ?, reviewNotes = ?, reviewedBy = ?, reviewedAt = NOW(), updatedAt = NOW() WHERE id = ?',
            [submission.status, submission.notes, submission.reviewedBy, submission.reviewId]
        );

        return (await this.getReviewById(submission.reviewId))!;
    }

    /**
     * Approve bye-laws
     */
    static async approveByelaws(
        reviewId: string,
        userId: string,
        notes?: string
    ): Promise<ByelawReview> {
        const [[review]] = await query('SELECT * FROM byelaw_reviews WHERE id = ? LIMIT 1', [reviewId]) as any;

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        await execute(
            'UPDATE byelaw_reviews SET status = ?, reviewedBy = ?, reviewNotes = COALESCE(?, reviewNotes), reviewedAt = NOW(), approvalDate = NOW(), updatedAt = NOW() WHERE id = ?',
            [ByelawReviewStatus.APPROVED, userId, notes || null, reviewId]
        );

        return (await this.getReviewById(reviewId))!;
    }

    /**
     * Reject bye-laws
     */
    static async rejectByelaws(
        reviewId: string,
        userId: string,
        reason: string
    ): Promise<ByelawReview> {
        const [[review]] = await query('SELECT * FROM byelaw_reviews WHERE id = ? LIMIT 1', [reviewId]) as any;

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        await execute(
            'UPDATE byelaw_reviews SET status = ?, reviewedBy = ?, rejectionReason = ?, reviewedAt = NOW(), updatedAt = NOW() WHERE id = ?',
            [ByelawReviewStatus.REJECTED, userId, reason, reviewId]
        );

        return (await this.getReviewById(reviewId))!;
    }

    /**
     * Request revision for bye-laws
     */
    static async requestRevision(
        reviewId: string,
        userId: string,
        notes: string
    ): Promise<ByelawReview> {
        const [[review]] = await query('SELECT * FROM byelaw_reviews WHERE id = ? LIMIT 1', [reviewId]) as any;

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        await execute(
            'UPDATE byelaw_reviews SET status = ?, reviewedBy = ?, reviewNotes = ?, reviewedAt = NOW(), updatedAt = NOW() WHERE id = ?',
            [ByelawReviewStatus.REVISION_REQUIRED, userId, notes, reviewId]
        );

        return (await this.getReviewById(reviewId))!;
    }

    /**
     * Get bye-laws review history for a SACCO
     */
    static async getReviewHistory(tenantId: string): Promise<ByelawReview[]> {
        const results = await query(`
            SELECT r.*, u.firstName as reviewerFirstName, u.lastName as reviewerLastName 
            FROM byelaw_reviews r 
            LEFT JOIN users u ON u.id = r.reviewedBy 
            WHERE r.tenantId = ? 
            ORDER BY r.submittedAt DESC
        `, [tenantId]);

        return results.map((r: any) => ({
            ...r,
            reviewer: r.reviewedBy ? { id: r.reviewedBy, firstName: r.reviewerFirstName, lastName: r.reviewerLastName } : undefined
        })) as ByelawReview[];
    }

    /**
     * Get bye-laws review statistics
     */
    static async getReviewStatistics() {
        const [[totalResult]] = await query('SELECT COUNT(*) as count FROM byelaw_reviews') as any;
        const totalReviews = Number(totalResult?.count || 0);

        const [[pendingResult]] = await query('SELECT COUNT(*) as count FROM byelaw_reviews WHERE status = ?', [ByelawReviewStatus.PENDING]) as any;
        const pending = Number(pendingResult?.count || 0);

        const [[underReviewResult]] = await query('SELECT COUNT(*) as count FROM byelaw_reviews WHERE status = ?', [ByelawReviewStatus.UNDER_REVIEW]) as any;
        const underReview = Number(underReviewResult?.count || 0);

        const [[approvedResult]] = await query('SELECT COUNT(*) as count FROM byelaw_reviews WHERE status = ?', [ByelawReviewStatus.APPROVED]) as any;
        const approved = Number(approvedResult?.count || 0);

        const [[rejectedResult]] = await query('SELECT COUNT(*) as count FROM byelaw_reviews WHERE status = ?', [ByelawReviewStatus.REJECTED]) as any;
        const rejected = Number(rejectedResult?.count || 0);

        const [[revisionResult]] = await query('SELECT COUNT(*) as count FROM byelaw_reviews WHERE status = ?', [ByelawReviewStatus.REVISION_REQUIRED]) as any;
        const revisionRequired = Number(revisionResult?.count || 0);

        return {
            totalReviews,
            pending,
            underReview,
            approved,
            rejected,
            revisionRequired,
            approvalRate: totalReviews > 0 ? (approved / totalReviews) * 100 : 0,
        };
    }
}
