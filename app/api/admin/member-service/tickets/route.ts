import { NextRequest, NextResponse } from 'next/server';
import { query, execute, buildSetClause } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@/lib/errors';

// GET: List tickets
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let sql = `
        SELECT t.*, m.firstName as memberFirstName, m.lastName as memberLastName, u.firstName as agentFirstName, u.lastName as agentLastName
        FROM support_tickets t
        LEFT JOIN members m ON m.id = t.memberId
        LEFT JOIN users u ON u.id = t.assignedToId
        WHERE t.tenantId = ?
    `;
    const params: any[] = [user.tenantId];

    if (memberId) {
        sql += ' AND t.memberId = ?';
        params.push(memberId);
    }
    if (status) {
        sql += ' AND t.status = ?';
        params.push(status);
    }
    if (category) {
        sql += ' AND t.category = ?';
        params.push(category);
    }

    sql += ' ORDER BY t.createdAt DESC';

    const tickets = await query(sql, params) as any[];

    return NextResponse.json({
        success: true,
        data: tickets
    });
});

// POST: Create a new support ticket
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const body = await request.json();
    const { memberId, subject, description, category, priority } = body;

    if (!memberId || !subject || !description || !category) {
        throw new BadRequestError('Missing required fields');
    }

    const [member] = await query('SELECT id FROM members WHERE id = ? AND tenantId = ? LIMIT 1', [memberId, user.tenantId]) as any;
    if (!member) throw new NotFoundError('Member not found');

    const ticketId = uuidv4();
    const assignedToId = user.id; // Default to creator
    const finalPriority = priority || 'medium';

    await execute(
        `INSERT INTO support_tickets (id, tenantId, memberId, subject, description, category, priority, status, assignedToId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, NOW(), NOW())`,
        [ticketId, user.tenantId, memberId, subject, description, category, finalPriority, assignedToId]
    );

    const [ticket] = await query('SELECT * FROM support_tickets WHERE id = ? LIMIT 1', [ticketId]) as any;

    return NextResponse.json({
        success: true,
        message: 'Ticket created successfully',
        data: ticket
    });
});

// PATCH: Update ticket
export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const body = await request.json();
    const { id, status, priority, assignedToId, metadata } = body;

    if (!id) throw new BadRequestError('Ticket ID is required');

    const [ticket] = await query('SELECT * FROM support_tickets WHERE id = ? AND tenantId = ? LIMIT 1', [id, user.tenantId]) as any;
    if (!ticket) throw new NotFoundError('Ticket not found');

    const updates: any = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedToId) updates.assignedToId = assignedToId;
    if (metadata) {
        const existingMetadata = typeof ticket.metadata === 'string' ? JSON.parse(ticket.metadata) : (ticket.metadata || {});
        updates.metadata = JSON.stringify({ ...existingMetadata, ...metadata });
    }

    if (Object.keys(updates).length > 0) {
        const { clause, values } = buildSetClause(updates);
        await execute(`UPDATE support_tickets SET ${clause}, updatedAt = NOW() WHERE id = ?`, [...values, id]);
    }

    const [updatedTicket] = await query('SELECT * FROM support_tickets WHERE id = ? LIMIT 1', [id]) as any;

    return NextResponse.json({
        success: true,
        message: 'Ticket updated successfully',
        data: updatedTicket
    });
});
