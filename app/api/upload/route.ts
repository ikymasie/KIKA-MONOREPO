import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const subDirectory = formData.get('path') as string || 'misc';

        if (!file) {
            return NextResponse.json({ error: 'No files specified' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Map subDirectory exactly as the firebase paths were or use a logical convention
        const safeDir = path.basename(subDirectory) || 'misc';

        // Define path saving into the public/uploads directory.
        // NGINX will serve this naturally in a real prod environment,
        // but for Next.js standalone dev, saving to public/ means it's available.
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDirectory);

        // Ensure directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Generate a safe unique filename to avoid overwrites
        const sanitizeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const finalName = `${Date.now()}-${sanitizeName}`;
        const filePath = path.join(uploadDir, finalName);

        // Write the file
        await fs.writeFile(filePath, buffer);

        // Return the relative URL which can be saved to the database 
        // and served directly by Next.js from the public directory
        const fileUrl = `/uploads/${subDirectory}/${finalName}`;

        return NextResponse.json({ url: fileUrl });
    } catch (e: any) {
        console.error("File upload error:", e);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
