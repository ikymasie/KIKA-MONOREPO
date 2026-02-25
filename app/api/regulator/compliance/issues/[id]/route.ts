import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/src/db/query';
import { ComplianceIssueStatus } from '@/src/entities/ComplianceIssue';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const issue = await queryOne<any>(
            'SELECT i.*, t.name as tenantName FROM compliance_issues i LEFT JOIN tenants t ON i.tenantId = t.id WHERE i.id = ?',
            [params.id]
        );
        if (!issue) return NextResponse.json({ error: 'Compliance issue not found' }, { status: 404 });

        return NextResponse.json(issue);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch compliance issue', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { status, resolutionNotes } = body;

        const issue = await queryOne<any>('SELECT id FROM compliance_issues WHERE id = ?', [params.id]);
        if (!issue) return NextResponse.json({ error: 'Compliance issue not found' }, { status: 404 });

        const updates: string[] = ['updatedAt = NOW()'];
        const values: any[] = [];
        if (status) {
            updates.push('status = ?');
            values.push(status);
            if (status === ComplianceIssueStatus.RESOLVED) {
                updates.push('resolutionDate = NOW()');
            }
        }
        if (resolutionNotes) {
            updates.push('resolutionNotes = ?');
            values.push(resolutionNotes);
        }

        await execute(`UPDATE compliance_issues SET ${updates.join(', ')} WHERE id = ?`, [...values, params.id]);

        return NextResponse.json(await queryOne<any>('SELECT * FROM compliance_issues WHERE id = ?', [params.id]));
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update compliance issue', details: error.message }, { status: 500 });
    }
}
