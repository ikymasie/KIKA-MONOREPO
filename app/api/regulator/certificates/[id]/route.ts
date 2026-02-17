import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-server';
import { Certificate } from '@/src/entities/Certificate';
import { UserRole } from '@/src/entities/User';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const certRepo = dataSource.getRepository(Certificate);

        const certificate = await certRepo.findOne({
            where: { id: params.id },
            relations: ['tenant', 'issuer'],
        });

        if (!certificate) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        return NextResponse.json(certificate);
    } catch (error: any) {
        console.error('Error fetching certificate:', error);
        return NextResponse.json(
            { error: 'Failed to fetch certificate', details: error.message },
            { status: 500 }
        );
    }
}
