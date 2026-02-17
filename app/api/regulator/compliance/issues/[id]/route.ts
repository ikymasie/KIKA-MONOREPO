import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-server';
import { ComplianceIssue, ComplianceIssueStatus } from '@/src/entities/ComplianceIssue';
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

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const issueRepo = dataSource.getRepository(ComplianceIssue);

        const issue = await issueRepo.findOne({
            where: { id: params.id },
            relations: ['tenant', 'identifier'],
        });

        if (!issue) {
            return NextResponse.json({ error: 'Compliance issue not found' }, { status: 404 });
        }

        return NextResponse.json(issue);
    } catch (error: any) {
        console.error('Error fetching compliance issue:', error);
        return NextResponse.json(
            { error: 'Failed to fetch compliance issue', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, resolutionNotes } = body;

        const dataSource = await getDb();
        const issueRepo = dataSource.getRepository(ComplianceIssue);

        const issue = await issueRepo.findOne({ where: { id: params.id } });

        if (!issue) {
            return NextResponse.json({ error: 'Compliance issue not found' }, { status: 404 });
        }

        if (status) {
            issue.status = status as ComplianceIssueStatus;
            if (status === ComplianceIssueStatus.RESOLVED) {
                issue.resolutionDate = new Date();
            }
        }

        if (resolutionNotes) {
            issue.resolutionNotes = resolutionNotes;
        }

        await issueRepo.save(issue);

        return NextResponse.json(issue);
    } catch (error: any) {
        console.error('Error updating compliance issue:', error);
        return NextResponse.json(
            { error: 'Failed to update compliance issue', details: error.message },
            { status: 500 }
        );
    }
}
