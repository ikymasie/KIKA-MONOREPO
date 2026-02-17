import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { ByelawReviewService } from '@/src/services/ByelawReviewService';
import { ByelawReviewStatus } from '@/src/entities/ByelawReview';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { status, notes } = body;

        if (!status || !notes) {
            return NextResponse.json(
                { error: 'status and notes are required' },
                { status: 400 }
            );
        }

        const review = await ByelawReviewService.submitReview({
            reviewId: params.id,
            status,
            notes,
            reviewedBy: user.id,
        });

        return NextResponse.json({
            message: 'Review submitted successfully',
            review,
        });
    } catch (error: any) {
        console.error('Error submitting bye-laws review:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
