import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { ByelawReviewService } = await import('@/src/services/ByelawReviewService');

    
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reason } = body;

        if (!reason) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        const review = await ByelawReviewService.rejectByelaws(
            params.id,
            user.id,
            reason
        );

        return NextResponse.json({
            message: 'Bye-laws rejected successfully',
            review,
        });
    } catch (error: any) {
        console.error('Error rejecting bye-laws:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
