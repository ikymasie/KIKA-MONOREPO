import { AppDataSource } from '@/src/config/database';
import { ByelawReview, ByelawReviewStatus } from '@/src/entities/ByelawReview';
import { Tenant } from '@/src/entities/Tenant';

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
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        return await reviewRepo.find({
            where: [
                { status: ByelawReviewStatus.PENDING },
                { status: ByelawReviewStatus.UNDER_REVIEW },
            ],
            relations: ['tenant'],
            order: { submittedAt: 'ASC' },
            take: limit,
        });
    }

    /**
     * Get bye-law review by ID
     */
    static async getReviewById(reviewId: string): Promise<ByelawReview | null> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        return await reviewRepo.findOne({
            where: { id: reviewId },
            relations: ['tenant', 'reviewer'],
        });
    }

    /**
     * Submit a bye-laws review
     */
    static async submitReview(submission: ByelawReviewSubmission): Promise<ByelawReview> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        const review = await reviewRepo.findOne({
            where: { id: submission.reviewId },
        });

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        review.status = submission.status;
        review.reviewNotes = submission.notes;
        review.reviewedBy = submission.reviewedBy;
        review.reviewedAt = new Date();

        await reviewRepo.save(review);

        return review;
    }

    /**
     * Approve bye-laws
     */
    static async approveByelaws(
        reviewId: string,
        userId: string,
        notes?: string
    ): Promise<ByelawReview> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);
        const tenantRepo = AppDataSource.getRepository(Tenant);

        const review = await reviewRepo.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        review.status = ByelawReviewStatus.APPROVED;
        review.reviewedBy = userId;
        review.reviewedAt = new Date();
        review.approvalDate = new Date();

        if (notes) {
            review.reviewNotes = notes;
        }

        await reviewRepo.save(review);

        // Note: Tenant entity doesn't have bylaws field yet
        // This can be added in future if needed

        return review;
    }

    /**
     * Reject bye-laws
     */
    static async rejectByelaws(
        reviewId: string,
        userId: string,
        reason: string
    ): Promise<ByelawReview> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        const review = await reviewRepo.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        review.status = ByelawReviewStatus.REJECTED;
        review.reviewedBy = userId;
        review.reviewedAt = new Date();
        review.rejectionReason = reason;

        await reviewRepo.save(review);

        return review;
    }

    /**
     * Request revision for bye-laws
     */
    static async requestRevision(
        reviewId: string,
        userId: string,
        notes: string
    ): Promise<ByelawReview> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        const review = await reviewRepo.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new Error('Bye-law review not found');
        }

        review.status = ByelawReviewStatus.REVISION_REQUIRED;
        review.reviewedBy = userId;
        review.reviewedAt = new Date();
        review.reviewNotes = notes;

        await reviewRepo.save(review);

        return review;
    }

    /**
     * Get bye-laws review history for a SACCO
     */
    static async getReviewHistory(tenantId: string): Promise<ByelawReview[]> {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        return await reviewRepo.find({
            where: { tenantId },
            relations: ['reviewer'],
            order: { submittedAt: 'DESC' },
        });
    }

    /**
     * Get bye-laws review statistics
     */
    static async getReviewStatistics() {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        const totalReviews = await reviewRepo.count();
        const pending = await reviewRepo.count({
            where: { status: ByelawReviewStatus.PENDING },
        });
        const underReview = await reviewRepo.count({
            where: { status: ByelawReviewStatus.UNDER_REVIEW },
        });
        const approved = await reviewRepo.count({
            where: { status: ByelawReviewStatus.APPROVED },
        });
        const rejected = await reviewRepo.count({
            where: { status: ByelawReviewStatus.REJECTED },
        });
        const revisionRequired = await reviewRepo.count({
            where: { status: ByelawReviewStatus.REVISION_REQUIRED },
        });

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
