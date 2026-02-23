import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized/Forbidden' }, { status: 401 });
        }

        const application = await queryOne<RowDataPacket>('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [params.id]);

        if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Error fetching application details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
