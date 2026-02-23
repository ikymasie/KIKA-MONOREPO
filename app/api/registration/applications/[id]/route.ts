import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const application = await queryOne<RowDataPacket>(
            `SELECT a.*, u.firstName AS applicantFirstName, u.lastName AS applicantLastName, u.email AS applicantEmail
             FROM society_applications a
             LEFT JOIN users u ON u.id = a.applicantId
             WHERE a.id = ? LIMIT 1`,
            [params.id]
        );

        if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        return NextResponse.json({
            ...application,
            applicant: application.applicantId ? {
                id: application.applicantId,
                firstName: application.applicantFirstName,
                lastName: application.applicantLastName,
                email: application.applicantEmail
            } : null
        });
    } catch (error: any) {
        console.error('Error fetching application:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
