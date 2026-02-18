import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { ComplianceIssue, ComplianceIssueStatus, ComplianceIssueSeverity } = await import('@/src/entities/ComplianceIssue');
        const { UserRole } = await import('@/src/entities/User');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const issueRepo = dataSource.getRepository(ComplianceIssue);

        // Get aggregated stats
        const totalIssues = await issueRepo.count();
        const openIssues = await issueRepo.count({
            where: { status: ComplianceIssueStatus.OPEN },
        });
        const criticalIssues = await issueRepo.count({
            where: { severity: ComplianceIssueSeverity.CRITICAL },
        });

        // Get issues by severity
        const issuesBySeverity = await issueRepo
            .createQueryBuilder('issue')
            .select('issue.severity', 'severity')
            .addSelect('COUNT(*)', 'count')
            .groupBy('issue.severity')
            .getRawMany();

        // Get issues by type
        const issuesByType = await issueRepo
            .createQueryBuilder('issue')
            .select('issue.issueType', 'type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('issue.issueType')
            .getRawMany();

        // Get recent issues
        const recentIssues = await issueRepo.find({
            relations: ['tenant', 'identifier'],
            order: { identifiedDate: 'DESC' },
            take: 10,
        });

        return NextResponse.json({
            stats: {
                totalIssues,
                openIssues,
                criticalIssues,
            },
            issuesBySeverity,
            issuesByType,
            recentIssues,
        });
    } catch (error: any) {
        console.error('Error fetching compliance dashboard:', error);
        return NextResponse.json(
            { error: 'Failed to fetch compliance dashboard', details: error.message },
            { status: 500 }
        );
    }
}
