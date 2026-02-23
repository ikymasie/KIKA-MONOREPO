import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized/Forbidden' }, { status: 401 });
        }

        const applications = await query<RowDataPacket>(
            'SELECT id, proposedName, applicationType, status, createdAt AS submittedAt, primaryContactName, primaryContactEmail FROM society_applications ORDER BY createdAt DESC'
        );

        return NextResponse.json(applications);
    } catch (error: any) {
        console.error('Applications fetch error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch applications' }, { status: 500 });
    }
}
