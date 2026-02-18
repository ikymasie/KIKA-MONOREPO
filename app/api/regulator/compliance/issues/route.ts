import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
    ComplianceIssue,
    ComplianceIssueType,
    ComplianceIssueSeverity,
    ComplianceIssueStatus,
} from '@/src/entities/ComplianceIssue';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { UserRole } = await import('@/src/entities/User');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const severity = searchParams.get('severity') as ComplianceIssueSeverity | null;
        const status = searchParams.get('status') as ComplianceIssueStatus | null;
        const issueType = searchParams.get('issueType') as ComplianceIssueType | null;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const dataSource = await getDb();
        const issueRepo = dataSource.getRepository(ComplianceIssue);

        const queryBuilder = issueRepo
            .createQueryBuilder('issue')
            .leftJoinAndSelect('issue.tenant', 'tenant')
            .leftJoinAndSelect('issue.identifier', 'identifier')
            .orderBy('issue.identifiedDate', 'DESC');

        if (tenantId) {
            queryBuilder.andWhere('issue.tenantId = :tenantId', { tenantId });
        }

        if (severity) {
            queryBuilder.andWhere('issue.severity = :severity', { severity });
        }

        if (status) {
            queryBuilder.andWhere('issue.status = :status', { status });
        }

        if (issueType) {
            queryBuilder.andWhere('issue.issueType = :issueType', { issueType });
        }

        const [issues, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return NextResponse.json({
            issues,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching compliance issues:', error);
        return NextResponse.json(
            { error: 'Failed to fetch compliance issues', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { tenantId, issueType, severity, description, attachments } = body;

        if (!tenantId || !issueType || !severity || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const dataSource = await getDb();
        const issueRepo = dataSource.getRepository(ComplianceIssue);

        const issue = issueRepo.create({
            tenantId,
            issueType,
            severity,
            description,
            identifiedBy: user.id,
            identifiedDate: new Date(),
            status: ComplianceIssueStatus.OPEN,
            attachments,
        });

        await issueRepo.save(issue);

        // TODO: Send alert to tenant admins via notification system
        // Notification details: Compliance Issue Identified
        // Priority: based on severity (critical/high = high, otherwise medium)
        // Channels: email, in_app

        return NextResponse.json(issue, { status: 201 });
    } catch (error: any) {
        console.error('Error creating compliance issue:', error);
        return NextResponse.json(
            { error: 'Failed to create compliance issue', details: error.message },
            { status: 500 }
        );
    }
}
