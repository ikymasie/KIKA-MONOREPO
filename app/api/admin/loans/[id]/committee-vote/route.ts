import { NextRequest, NextResponse } from 'next/server';
import { recordVote, finalizeCommitteeDecision, generateMinutes } from '@/lib/committee-workflow';
import { getUserFromRequest } from '@/lib/auth-server';
import { getLoanById } from '@/src/db/services/LoanService';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { vote, notes, finalize, requiredQuorum } = await request.json();
        if (!vote || !['approve', 'reject'].includes(vote)) {
            return NextResponse.json({ error: 'Valid vote (approve/reject) is required' }, { status: 400 });
        }

        // Record vote (lib still handles the actual vote storage)
        const voteResult = await recordVote(params.id, user.id, vote, notes);
        if (!voteResult.success) return NextResponse.json({ error: voteResult.message }, { status: 400 });

        if (finalize) {
            const decision = await finalizeCommitteeDecision(params.id, requiredQuorum || 3);
            if (!decision.success) {
                return NextResponse.json({ message: voteResult.message, voteRecorded: true, finalized: false, reason: decision.message });
            }
            const minutesResult = await generateMinutes(params.id);
            return NextResponse.json({ message: decision.message, voteRecorded: true, finalized: true, result: decision.result, minutes: minutesResult.minutes });
        }

        return NextResponse.json({ message: voteResult.message, voteRecorded: true, finalized: false });
    } catch (error: any) {
        console.error('Committee vote API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to record committee vote' }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        return NextResponse.json({ votes: loan.committeeVotes ?? [], committeeApprovalDate: loan.committeeApprovalDate });
    } catch (error: any) {
        console.error('Get committee votes API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch committee votes' }, { status: 500 });
    }
}
