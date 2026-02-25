import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/src/db/query';
import { ClaimStatus } from '@/src/entities/InsuranceClaim';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || (!user.isRegulator() && !user.isGovernmentOfficer())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { ruling, action, isExGratia } = body;

        const claim = await queryOne<any>('SELECT id, status FROM insurance_claims WHERE id = ?', [params.id]);
        if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

        let newStatus: string;
        if (action === 'OVERTURN') {
            newStatus = ClaimStatus.APPROVED;
        } else if (action === 'UPHOLD') {
            newStatus = ClaimStatus.FINAL_REJECTION;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await execute(
            'UPDATE insurance_claims SET status = ?, regulatorRuling = ?, isExGratia = ?, updatedAt = NOW() WHERE id = ?',
            [newStatus, ruling, action === 'OVERTURN' ? (isExGratia || false) : false, params.id]
        );

        return NextResponse.json(await queryOne<any>('SELECT * FROM insurance_claims WHERE id = ?', [params.id]));
    } catch (error: any) {
        console.error('Error recording regulator ruling:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
