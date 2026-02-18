import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { ApplicationDocument, DocumentType } from '@/entities/ApplicationDocument';

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const docRepo = AppDataSource.getRepository(ApplicationDocument);
        const documents = await docRepo.find({
            where: { applicationId: params.id },
            relations: ['uploader'],
            order: { uploadedAt: 'DESC' }
        });

        return NextResponse.json(documents.map(doc => ({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSizeBytes,
            mimeType: doc.mimeType,
            uploadedBy: doc.uploader ? {
                id: doc.uploader.id,
                name: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
                email: doc.uploader.email
            } : null,
            uploadedAt: doc.uploadedAt
        })));

    } catch (error: any) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is regulator
        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { fileUrl, documentType, fileName } = body;

        if (!fileUrl) {
            return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
        }

        if (!documentType) {
            return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
        }

        // Validate that the URL is from Firebase Storage
        if (!fileUrl.includes('firebasestorage.googleapis.com')) {
            return NextResponse.json({ error: 'Invalid file URL. Must be from Firebase Storage' }, { status: 400 });
}

        // Save to database
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const docRepo = AppDataSource.getRepository(ApplicationDocument);

        // Extract file name from URL if not provided
        const extractedFileName = fileName || fileUrl.split('/').pop()?.split('?')[0] || 'document';

        const document = docRepo.create({
            applicationId: params.id,
            documentType,
            fileName: extractedFileName,
            fileUrl: fileUrl,
            uploadedBy: user.id
        });

        await docRepo.save(document);

        return NextResponse.json({
            success: true,
            document: {
                id: document.id,
                documentType: document.documentType,
                fileName: document.fileName,
                fileUrl: document.fileUrl,
                fileSize: document.fileSizeBytes,
                uploadedAt: document.uploadedAt
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error saving document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const docRepo = AppDataSource.getRepository(ApplicationDocument);
        const document = await docRepo.findOne({
            where: { id: documentId, applicationId: params.id }
        });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Delete from database
        await docRepo.remove(document);

        // Note: File deletion from filesystem can be added here if needed
        // For now, we'll keep files for audit purposes

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
