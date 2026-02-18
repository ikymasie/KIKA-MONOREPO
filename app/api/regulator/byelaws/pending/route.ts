import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { ByelawReviewService } = await import('@/src/services/ByelawReviewService');

    
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
