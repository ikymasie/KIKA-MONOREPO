import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendClaimNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { InsuranceClaim, ClaimStatus } = await import('@/src/entities/InsuranceClaim');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');

        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { action, notes, approvedAmount, rejectionReason, queryReason } = body;

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);
        const claim = await claimRepo.findOne({
            where: { id },
            relations: ['policy', 'policy.member']
        });

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        const now = new Date();

        switch (action) {
            case 'VERIFY':
                if (user.role !== UserRole.MEMBER_SERVICE_REP && user.role !== UserRole.SACCOS_ADMIN) {
                    return NextResponse.json({ error: 'Only Claims Clerks or Admins can verify' }, { status: 403 });
                }
                claim.status = ClaimStatus.IN_REVIEW;
                claim.verifiedBy = user.id;
                claim.verifiedAt = now;
                break;

            case 'QUERY':
                claim.status = ClaimStatus.QUERIED;
                claim.queryReason = queryReason || notes;
                break;

            case 'APPROVE':
                if (user.role !== UserRole.SACCOS_ADMIN) {
                    return NextResponse.json({ error: 'Only Managers can approve claims' }, { status: 403 });
                }
                claim.status = ClaimStatus.APPROVED;
                claim.adjudicatedBy = user.id;
                claim.adjudicatedAt = now;
                claim.approvedAmount = approvedAmount || claim.claimAmount;
                break;

            case 'REJECT':
                if (user.role !== UserRole.SACCOS_ADMIN) {
                    return NextResponse.json({ error: 'Only Managers can reject claims' }, { status: 403 });
                }
                claim.status = ClaimStatus.REJECTED;
                claim.adjudicatedBy = user.id;
                claim.adjudicatedAt = now;
                claim.rejectionReason = rejectionReason || notes;
                break;

            case 'DISBURSE':
                if (user.role !== UserRole.ACCOUNTANT && user.role !== UserRole.SACCOS_ADMIN) {
                    return NextResponse.json({ error: 'Only Accountants can disburse payments' }, { status: 403 });
                }
                claim.status = ClaimStatus.PAID;
                claim.disbursedBy = user.id;
                claim.disbursedAt = now;
                claim.paidAt = now;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (notes) {
            // Append notes if needed or use a specific field
            claim.committeeReviewNotes = (claim.committeeReviewNotes || '') + `\n[${now.toISOString()}] ${user.role}: ${notes}`;
        }

        await claimRepo.save(claim);

        // Notify member of status change
        if (claim.policy?.member?.phone) {
            await sendClaimNotification(
                claim.policy.member.phone,
                claim.claimNumber,
                claim.status,
                claim.approvedAmount || claim.claimAmount
            );
        }

        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error processing claim action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
