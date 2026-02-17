import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { LoanGuarantor, GuarantorStatus } from '@/src/entities/LoanGuarantor';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const memberRepo = db.getRepository(Member);
        const guarantorRepo = db.getRepository(LoanGuarantor);

        const member = await memberRepo.findOne({
            where: { userId: user.id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const requests = await guarantorRepo.find({
            where: { guarantorMemberId: member.id, status: GuarantorStatus.PENDING },
            relations: ['loan', 'loan.member', 'loan.product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Error fetching guarantor requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestId, status, rejectionReason } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const db = await getDb();
        const memberRepo = db.getRepository(Member);
        const guarantorRepo = db.getRepository(LoanGuarantor);

        const member = await memberRepo.findOne({
            where: { userId: user.id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const request_ = await guarantorRepo.findOne({
            where: { id: requestId, guarantorMemberId: member.id },
            relations: ['loan']
        });

        if (!request_) {
            return NextResponse.json({ error: 'Guarantor request not found' }, { status: 404 });
        }

        if (status === 'accepted') {
            request_.status = GuarantorStatus.ACCEPTED;
            request_.acceptedAt = new Date();
        } else if (status === 'rejected') {
            request_.status = GuarantorStatus.REJECTED;
            request_.rejectedAt = new Date();
            request_.rejectionReason = rejectionReason;
        } else {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await guarantorRepo.save(request_);

        return NextResponse.json({ message: `Request ${status} successfully` });
    } catch (error: any) {
        console.error('Error updating guarantor request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
