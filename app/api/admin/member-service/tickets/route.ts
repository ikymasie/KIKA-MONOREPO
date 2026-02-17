import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { SupportTicket, TicketStatus, TicketPriority } from '@/src/entities/SupportTicket';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

async function initDB() {
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }
}

// GET: List tickets
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    await initDB();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const status = searchParams.get('status') as TicketStatus;
    const category = searchParams.get('category');

    const ticketRepo = AppDataSource.getRepository(SupportTicket);
    const query = ticketRepo.createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.member', 'member')
        .leftJoinAndSelect('ticket.assignedTo', 'assignedTo')
        .where('ticket.tenantId = :tenantId', { tenantId: user.tenantId });

    if (memberId) query.andWhere('ticket.memberId = :memberId', { memberId });
    if (status) query.andWhere('ticket.status = :status', { status });
    if (category) query.andWhere('ticket.category = :category', { category });

    const tickets = await query.orderBy('ticket.createdAt', 'DESC').getMany();

    return NextResponse.json({
        success: true,
        data: tickets
    });
});

// POST: Create a new support ticket
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    await initDB();

    const body = await request.json();
    const { memberId, subject, description, category, priority } = body;

    if (!memberId || !subject || !description || !category) {
        throw new BadRequestError('Missing required fields');
    }

    const memberRepo = AppDataSource.getRepository(Member);
    const member = await memberRepo.findOne({ where: { id: memberId, tenantId: user.tenantId } });
    if (!member) throw new NotFoundError('Member not found');

    const ticketRepo = AppDataSource.getRepository(SupportTicket);
    const ticket = ticketRepo.create({
        tenantId: user.tenantId,
        memberId,
        subject,
        description,
        category,
        priority: priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
        assignedToId: user.id // Default to creator
    });

    await ticketRepo.save(ticket);

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

    await initDB();

    const body = await request.json();
    const { id, status, priority, assignedToId, metadata } = body;

    if (!id) throw new BadRequestError('Ticket ID is required');

    const ticketRepo = AppDataSource.getRepository(SupportTicket);
    const ticket = await ticketRepo.findOne({ where: { id, tenantId: user.tenantId } });

    if (!ticket) throw new NotFoundError('Ticket not found');

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedToId) ticket.assignedToId = assignedToId;
    if (metadata) ticket.metadata = { ...ticket.metadata, ...metadata };

    await ticketRepo.save(ticket);

    return NextResponse.json({
        success: true,
        message: 'Ticket updated successfully',
        data: ticket
    });
});
