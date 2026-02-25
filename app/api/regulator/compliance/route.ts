import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/db/query';
import { ComplianceIssueStatus, ComplianceIssueSeverity } from '@/src/entities/ComplianceIssue';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const [totalRow, openRow, criticalRow] = await Promise.all([
            queryOne<any>('SELECT COUNT(*) as c FROM compliance_issues', []),
            queryOne<any>('SELECT COUNT(*) as c FROM compliance_issues WHERE status = ?', [ComplianceIssueStatus.OPEN]),
            queryOne<any>('SELECT COUNT(*) as c FROM compliance_issues WHERE severity = ?', [ComplianceIssueSeverity.CRITICAL]),
        ]);

        const issuesBySeverity = await query<any>('SELECT severity, COUNT(*) as count FROM compliance_issues GROUP BY severity', []);
        const issuesByType = await query<any>('SELECT issueType as type, COUNT(*) as count FROM compliance_issues GROUP BY issueType', []);
        const recentIssues = await query<any>(
            'SELECT i.*, t.name as tenantName FROM compliance_issues i LEFT JOIN tenants t ON i.tenantId = t.id ORDER BY i.identifiedDate DESC LIMIT 10',
            []
        );

        return NextResponse.json({
            stats: { totalIssues: Number(totalRow?.c || 0), openIssues: Number(openRow?.c || 0), criticalIssues: Number(criticalRow?.c || 0) },
            issuesBySeverity,
            issuesByType,
            recentIssues,
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch compliance dashboard', details: error.message }, { status: 500 });
    }
}
