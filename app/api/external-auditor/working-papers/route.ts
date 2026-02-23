import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'external_auditor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('requestId');

        if (!requestId) {
            return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
        }

        const auditorService = new AuditorService();
        const workingPapers = await auditorService.getWorkingPapers(requestId);

        return NextResponse.json(workingPapers);
    } catch (error: any) {
        console.error('Error fetching working papers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
        const workingPaper = await auditorService.uploadWorkingPaper({
            requestId,
            fileName,
            fileUrl,
            uploadedById: user.id,
        });

        return NextResponse.json(workingPaper, { status: 201 });
    } catch (error: any) {
        console.error('Error uploading working paper:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
