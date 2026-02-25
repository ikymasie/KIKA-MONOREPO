import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/src/db/query';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const certificate = await queryOne<any>(
            'SELECT c.*, t.name as tenantName FROM certificates c LEFT JOIN tenants t ON c.tenantId = t.id WHERE c.id = ?',
            [params.id]
        );
        if (!certificate) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });

        return NextResponse.json(certificate);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch certificate', details: error.message }, { status: 500 });
    }
}
