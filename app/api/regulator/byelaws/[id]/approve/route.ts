import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { ByelawReviewService } from '@/src/services/ByelawReviewService';

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
        const { notes } = body;

        const review = await ByelawReviewService.approveByelaws(
            params.id,
            user.id,
            notes
        );

        return NextResponse.json({
            message: 'Bye-laws approved successfully',
            review,
        });
    } catch (error: any) {
        console.error('Error approving bye-laws:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
