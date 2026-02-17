import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { ByelawReviewService } from '@/src/services/ByelawReviewService';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const pendingReviews = await ByelawReviewService.getPendingReviews(limit);

        return NextResponse.json({
            reviews: pendingReviews,
            count: pendingReviews.length,
        });
    } catch (error: any) {
        console.error('Error fetching pending bye-laws reviews:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
