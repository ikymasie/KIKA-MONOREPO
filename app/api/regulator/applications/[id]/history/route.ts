import { NextResponse, NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const history = await query<RowDataPacket>(
            `SELECT h.*, u.firstName, u.lastName, u.email
             FROM application_status_history h
             LEFT JOIN users u ON u.id = h.changedBy
             WHERE h.applicationId = ?
             ORDER BY h.changedAt DESC`,
            [params.id]
        );

        return NextResponse.json(history.map(entry => ({
            id: entry.id,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            action: entry.action,
            notes: entry.notes,
            changedAt: entry.changedAt,
            changedBy: entry.changedBy ? {
                id: entry.changedBy,
                name: `${entry.firstName} ${entry.lastName}`,
                email: entry.email
            } : null
        })));
    } catch (error: any) {
        console.error('Error fetching application history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
