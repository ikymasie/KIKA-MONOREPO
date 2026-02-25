import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const certificateType = searchParams.get('certificateType');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = 'WHERE 1=1';
        const params: any[] = [];
        if (tenantId) { where += ' AND c.tenantId = ?'; params.push(tenantId); }
        if (certificateType) { where += ' AND c.certificateType = ?'; params.push(certificateType); }

        const countResult = await queryOne<any>(`SELECT COUNT(*) as total FROM certificates c ${where}`, params);
        const certificates = await query<any>(
            `SELECT c.*, t.name as tenantName FROM certificates c LEFT JOIN tenants t ON c.tenantId = t.id ${where} ORDER BY c.issuedDate DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return NextResponse.json({ certificates, pagination: { page, limit, total: Number(countResult?.total || 0), totalPages: Math.ceil(Number(countResult?.total || 0) / limit) } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch certificates', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { tenantId, certificateType, expiryDate, metadata } = body;
        if (!tenantId || !certificateType) return NextResponse.json({ error: 'Missing required fields: tenantId, certificateType' }, { status: 400 });

        const countRow = await queryOne<any>('SELECT COUNT(*) as c FROM certificates', []);
        const certificateNumber = `CERT-${new Date().getFullYear()}-${String(Number(countRow?.c || 0) + 1).padStart(6, '0')}`;
        const id = uuidv4();

        await execute(
            'INSERT INTO certificates (id, tenantId, certificateNumber, certificateType, issuedDate, expiryDate, issuedBy, metadata, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())',
            [id, tenantId, certificateNumber, certificateType, expiryDate ? new Date(expiryDate) : null, user.id, metadata ? JSON.stringify(metadata) : null]
        );

        // Generate and upload certificate document
        try {
            const { uploadFile } = await import('@/lib/firebase-storage');
            const certificateContent = `CERTIFICATE OF ${certificateType}\n\nTenant ID: ${tenantId}\nCertificate Number: ${certificateNumber}\nIssued: ${new Date().toISOString()}`;
            const blob = new Blob([certificateContent], { type: 'text/plain' });
            const file = new File([blob], `${certificateNumber}.txt`, { type: 'text/plain' });
            const documentUrl = await uploadFile(file, `certificates/${tenantId}/${certificateNumber}.txt`);
            await execute('UPDATE certificates SET documentUrl = ? WHERE id = ?', [documentUrl, id]);
        } catch (uploadError) {
            console.error('Failed to upload certificate:', uploadError);
        }

        return NextResponse.json(await queryOne<any>('SELECT * FROM certificates WHERE id = ?', [id]), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create certificate', details: error.message }, { status: 500 });
    }
}
