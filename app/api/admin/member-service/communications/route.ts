import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@/lib/errors';

// GET: Fetch communication history for a member
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) throw new BadRequestError('Member ID is required');

    const communications = await query(
        `SELECT c.*, u.firstName as recordedByFirstName, u.lastName as recordedByLastName 
         FROM member_communications c 
         LEFT JOIN users u ON u.id = c.recordedById 
         WHERE c.memberId = ? AND c.tenantId = ? 
         ORDER BY c.createdAt DESC`,
        [memberId, user.tenantId]
    ) as any[];

    return NextResponse.json({
        success: true,
        data: communications
    });
});

// POST: Log a new communication
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const body = await request.json();
    const { memberId, type, direction, subject, content, metadata } = body;

    if (!memberId || !type || !direction || !content) {
        throw new BadRequestError('Missing required fields');
    }

    const [[member]] = await query('SELECT id FROM members WHERE id = ? AND tenantId = ? LIMIT 1', [memberId, user.tenantId]) as any;
    if (!member) throw new NotFoundError('Member not found');

    const communicationId = uuidv4();
    const metadataString = metadata ? JSON.stringify(metadata) : null;

    await execute(
        `INSERT INTO member_communications (id, tenantId, memberId, type, direction, subject, content, recordedById, metadata, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [communicationId, user.tenantId, memberId, type, direction, subject || null, content, user.id, metadataString]
    );

    // Also update notification logs if it's an outbound automated message? 
    // Not needed here, this is for manual logging by reps.

    const [[communication]] = await query('SELECT * FROM member_communications WHERE id = ? LIMIT 1', [communicationId]) as any;

    return NextResponse.json({
        success: true,
        message: 'Communication logged successfully',
        data: communication
    });
});
