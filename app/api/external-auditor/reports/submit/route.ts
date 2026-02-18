import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AuditorService } = await import('@/src/services/AuditorService');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.EXTERNAL_AUDITOR) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestId, fileName, fileUrl } = body;

        if (!requestId || !fileName || !fileUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const auditorService = new AuditorService();
        const auditReport = await auditorService.submitAuditReport({
            requestId,
            fileName,
            fileUrl,
        });

        return NextResponse.json(auditReport, { status: 201 });
    } catch (error: any) {
        console.error('Error submitting audit report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AuditorService } = await import('@/src/services/AuditorService');
        const { AppDataSource } = await import('@/src/config/database');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const auditorService = new AuditorService();
        const report = await auditorService.getAuditReport(requestId);

        return NextResponse.json(report);
    } catch (error: any) {
        console.error('Error fetching audit report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
