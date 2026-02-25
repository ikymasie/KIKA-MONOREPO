import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
        const { AlertGenerationService } = await import("../../../../src/services/AlertGenerationService");

        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const severity = searchParams.get('severity');
        const isResolved = searchParams.get('resolved');

        let sql = `
            SELECT a.*, t.name as tenantName 
            FROM regulatory_alerts a
            LEFT JOIN tenants t ON t.id = a.tenantId
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (severity) {
            conditions.push('a.severity = ?');
            params.push(severity);
        }

        if (isResolved !== null) {
            const resolved = isResolved === 'true' ? 1 : 0;
            conditions.push('a.isResolved = ?');
            params.push(resolved);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY a.createdAt DESC LIMIT 50';

        const alerts = await query(sql, params) as any[];

        return NextResponse.json(
            alerts.map(alert => ({
                id: alert.id,
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                description: alert.description,
                metadata: alert.metadata ? (typeof alert.metadata === 'string' ? JSON.parse(alert.metadata) : alert.metadata) : null,
                isResolved: alert.isResolved,
                resolvedAt: alert.resolvedAt,
                createdAt: alert.createdAt,
                tenant: alert.tenantName ? {
                    id: alert.tenantId,
                    name: alert.tenantName
                } : null
            }))
        );

    } catch (error: any) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
        const { AlertGenerationService } = await import("../../../../src/services/AlertGenerationService");
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Trigger alert generation
        await AlertGenerationService.generateAlerts();

        return NextResponse.json({ success: true, message: 'Alerts generated successfully' });

    } catch (error: any) {
        console.error('Error generating alerts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
