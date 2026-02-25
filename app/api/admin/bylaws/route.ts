import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("../../../../src/db/query");
        const { getUserFromRequest } = await import("../../../../lib/auth-server");

        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [bylaws, reviews] = await Promise.all([
            query('SELECT * FROM bylaws WHERE tenantId = ? ORDER BY createdAt DESC', [user.tenantId]),
            query('SELECT * FROM byelaw_reviews WHERE tenantId = ? ORDER BY submittedAt DESC', [user.tenantId]),
        ]);

        return NextResponse.json({ bylaws, reviews });
    } catch (error: any) {
        console.error('Bylaws GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { execute, query } = await import("../../../../src/db/query");
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
        const { v4: uuidv4 } = await import('uuid');

        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { documentUrl, version, notes } = body;

        if (!documentUrl || !version) {
            return NextResponse.json({ error: 'Document URL and version are required' }, { status: 400 });
        }

        const reviewId = uuidv4();
        await execute(
            `INSERT INTO byelaw_reviews (id, tenantId, bylawDocumentUrl, version, submittedAt, status, reviewNotes, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, NOW(), 'pending', ?, NOW(), NOW())`,
            [reviewId, user.tenantId, documentUrl, parseInt(version), notes || null]
        );

        const [[newReview]] = await query('SELECT * FROM byelaw_reviews WHERE id = ? LIMIT 1', [reviewId]) as any;

        return NextResponse.json(newReview, { status: 201 });
    } catch (error: any) {
        console.error('Bylaws POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
