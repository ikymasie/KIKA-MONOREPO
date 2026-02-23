import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getLoanById } from '@/src/db/services/LoanService';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        // Fetch joined member + product + guarantors
        const [members, products, guarantors] = await Promise.all([
            query<RowDataPacket>('SELECT id, memberNumber, firstName, lastName, email, phone, nationalId, employer FROM members WHERE id = ? LIMIT 1', [loan.memberId]),
            query<RowDataPacket>('SELECT id, name, code, interestRate, savingsMultiplier FROM loan_products WHERE id = ? LIMIT 1', [loan.productId]),
            query<RowDataPacket>(
                `SELECT lg.*, m.id AS gmId, m.memberNumber AS gmNumber, m.firstName AS gmFirst, m.lastName AS gmLast
                 FROM loan_guarantors lg LEFT JOIN members m ON m.id = lg.guarantorMemberId
                 WHERE lg.loanId = ?`,
                [loan.id]
            ),
        ]);

        const member = members[0] ?? null;
        const product = products[0] ?? null;

        return NextResponse.json({
            ...loan,
            member: member ? {
                id: member.id, memberNumber: member.memberNumber || 'Unknown',
                firstName: member.firstName || '', lastName: member.lastName || '',
                fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member',
                email: member.email || '', phone: member.phone || '',
                nationalId: member.nationalId || '', employer: member.employer || '',
            } : {
                id: '', memberNumber: 'Unknown',
                firstName: '', lastName: '',
                fullName: 'Unknown Member',
                email: '', phone: '',
                nationalId: '', employer: '',
            },
            product: product ? {
                id: product.id, name: product.name || 'Unknown', code: product.code || '',
                interestRate: Number(product.interestRate || 0),
                savingsMultiplier: Number(product.savingsMultiplier || 0),
            } : {
                id: '', name: 'Unknown', code: '',
                interestRate: 0,
                savingsMultiplier: 0,
            },
            guarantors: guarantors.map(g => ({
                id: g.id,
                guarantorMember: g.gmId ? {
                    id: g.gmId, memberNumber: g.gmNumber,
                    firstName: g.gmFirst, lastName: g.gmLast,
                    fullName: `${g.gmFirst} ${g.gmLast}`,
                } : null,
                guaranteedAmount: Number(g.guaranteedAmount),
                status: g.status,
                acceptedAt: g.acceptedAt,
                rejectedAt: g.rejectedAt,
                rejectionReason: g.rejectionReason,
            })),
        });
    } catch (error: any) {
        console.error('Loan detail API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch loan details' }, { status: 500 });
    }
}
