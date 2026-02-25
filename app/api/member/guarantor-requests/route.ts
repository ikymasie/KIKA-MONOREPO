import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/src/db/query';
import { GuarantorStatus } from '@/src/entities/LoanGuarantor';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const member = await queryOne<any>('SELECT id FROM members WHERE userId = ?', [user.id]);
        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const requests = await query<any>(
            `SELECT g.*,
                    l.loanNumber, l.principalAmount, l.termMonths, l.interestRate, l.status as loanStatus,
                    p.name as productName,
                    m.fullName as borrowerName, m.memberNumber as borrowerMemberNumber
             FROM loan_guarantors g
             JOIN loans l ON g.loanId = l.id
             LEFT JOIN loan_products p ON l.productId = p.id
             LEFT JOIN members m ON l.memberId = m.id
             WHERE g.guarantorMemberId = ? AND g.status = ?
             ORDER BY g.createdAt DESC`,
            [member.id, GuarantorStatus.PENDING]
        );

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Error fetching guarantor requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestId, status, rejectionReason } = body;

        if (!requestId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const member = await queryOne<any>('SELECT id FROM members WHERE userId = ?', [user.id]);
        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const guarantorRequest = await queryOne<any>(
            'SELECT id, status FROM loan_guarantors WHERE id = ? AND guarantorMemberId = ?',
            [requestId, member.id]
        );

        if (!guarantorRequest) {
            return NextResponse.json({ error: 'Guarantor request not found' }, { status: 404 });
        }

        if (status === 'accepted') {
            await execute(
                'UPDATE loan_guarantors SET status = ?, acceptedAt = NOW() WHERE id = ?',
                [GuarantorStatus.ACCEPTED, requestId]
            );
        } else if (status === 'rejected') {
            await execute(
                'UPDATE loan_guarantors SET status = ?, rejectedAt = NOW(), rejectionReason = ? WHERE id = ?',
                [GuarantorStatus.REJECTED, rejectionReason || null, requestId]
            );
        } else {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        return NextResponse.json({ message: `Request ${status} successfully` });
    } catch (error: any) {
        console.error('Error updating guarantor request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
