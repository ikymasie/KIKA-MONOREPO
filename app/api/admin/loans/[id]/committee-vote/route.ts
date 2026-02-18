import { NextRequest, NextResponse } from 'next/server';
import {
recordVote,
    finalizeCommitteeDecision,
    generateMinutes,
} from '@/lib/committee-workflow';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Loan } = await import('@/src/entities/Loan');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { vote, notes, finalize, requiredQuorum } = body;

        if (!vote || !['approve', 'reject'].includes(vote)) {
            return NextResponse.json(
                { error: 'Valid vote (approve/reject) is required' },
                { status: 400 }
            );
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Record the vote
        const voteResult = await recordVote(params.id, user.id, vote, notes);

        if (!voteResult.success) {
            return NextResponse.json({ error: voteResult.message }, { status: 400 });
        }

        // If finalize flag is set, finalize the decision
        if (finalize) {
            const decision = await finalizeCommitteeDecision(
                params.id,
                requiredQuorum || 3
            );

            if (!decision.success) {
                return NextResponse.json(
                    {
                        message: voteResult.message,
                        voteRecorded: true,
                        finalized: false,
                        reason: decision.message,
                    },
                    { status: 200 }
                );
            }

            // Generate minutes
            const minutesResult = await generateMinutes(params.id);

            return NextResponse.json({
                message: decision.message,
                voteRecorded: true,
                finalized: true,
                result: decision.result,
                minutes: minutesResult.minutes,
            });
        }

        // Just return vote confirmation
        return NextResponse.json({
            message: voteResult.message,
            voteRecorded: true,
            finalized: false,
        });
    } catch (error: any) {
        console.error('Committee vote API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to record committee vote' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { Loan } = await import('@/src/entities/Loan');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const loanRepo = AppDataSource.getRepository(Loan);
        const loan = await loanRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
        });

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        return NextResponse.json({
            votes: loan.committeeVotes || [],
            committeeApprovalDate: loan.committeeApprovalDate,
        });
    } catch (error: any) {
        console.error('Get committee votes API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch committee votes' },
            { status: 500 }
        );
    }
}
