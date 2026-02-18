import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin() || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Only SACCOSS Admins can upload logos' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, SVG, and WebP are allowed.' }, { status: 400 });
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large. Max 2MB allowed.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const extension = file.name.split('.').pop();
        const fileName = `logos/${user.tenantId}/${uuidv4()}.${extension}`;
        const bucket = adminStorage.bucket();
        const fileRef = bucket.file(fileName);

        await fileRef.save(buffer, {
            contentType: file.type,
            public: true,
            metadata: {
                firebaseStorageDownloadTokens: uuidv4(),
            }
        });

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Logo upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload logo' },
            { status: 500 }
        );
    }
}
