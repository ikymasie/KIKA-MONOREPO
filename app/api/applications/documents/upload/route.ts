import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { SocietyApplicationService } from '@/src/services/SocietyApplicationService';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');

        if (!applicationId) {
            return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
        }

        const documents = await SocietyApplicationService.getDocuments(applicationId);
        return NextResponse.json(documents);
    } catch (error: any) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, ...docData } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
        }

        const document = await SocietyApplicationService.addDocument(applicationId, docData, user.id);
        return NextResponse.json(document, { status: 201 });
    } catch (error: any) {
        console.error('Error adding document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing document id' }, { status: 400 });
        }

        await SocietyApplicationService.removeDocument(id, user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error removing document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
