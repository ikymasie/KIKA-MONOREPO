import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'external_auditor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestId, fileName, fileUrl } = body;

        if (!requestId || !fileName || !fileUrl) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }

        const auditorService = new AuditorService();
        const report = await auditorService.getAuditReport(requestId);

        return NextResponse.json(report);
    } catch (error: any) {
        console.error('Error fetching audit report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
