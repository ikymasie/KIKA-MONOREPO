import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { query, execute } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const documents = await query<RowDataPacket>(
            `SELECT d.*, u.firstName, u.lastName, u.email
             FROM application_documents d
             LEFT JOIN users u ON u.id = d.uploadedBy
             WHERE d.applicationId = ?
             ORDER BY d.uploadedAt DESC`,
            [params.id]
        );

        return NextResponse.json(documents.map(doc => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSizeBytes,
            mimeType: doc.mimeType,
            uploadedBy: doc.uploadedBy ? {
                id: doc.uploadedBy, name: `${doc.firstName} ${doc.lastName}`, email: doc.email
            } : null,
            uploadedAt: doc.uploadedAt
        })));
    } catch (error: any) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) return NextResponse.json({ error: 'Unauthorized/Forbidden' }, { status: 401 });

        const { fileUrl, documentType, fileName } = await request.json();
        if (!fileUrl) return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
        if (!documentType) return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
        if (!fileUrl.includes('firebasestorage.googleapis.com')) return NextResponse.json({ error: 'Invalid file URL. Must be from Firebase Storage' }, { status: 400 });

        const extractedFileName = fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';
        const id = uuidv4();

        await execute(
            `INSERT INTO application_documents (id, applicationId, documentType, fileName, fileUrl, uploadedBy, uploadedAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [id, params.id, documentType, extractedFileName, fileUrl, user.id]
        );

        return NextResponse.json({
            success: true,
            document: { id, documentType, fileName: extractedFileName, fileUrl, uploadedAt: new Date().toISOString() }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error saving document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) return NextResponse.json({ error: 'Unauthorized/Forbidden' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');
        if (!documentId) return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });

        const result = await execute('DELETE FROM application_documents WHERE id = ? AND applicationId = ?', [documentId, params.id]);
        if ((result as any).affectedRows === 0) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
