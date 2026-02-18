import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MemberCommunication, CommunicationType, CommunicationDirection } from '@/src/entities/MemberCommunication';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
async function initDB() {
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }
}

// GET: Fetch communication history for a member
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    await initDB();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) throw new BadRequestError('Member ID is required');

    const commRepo = AppDataSource.getRepository(MemberCommunication);
    const communications = await commRepo.find({
        where: {
            memberId,
            tenantId: user.tenantId
        },
        relations: ['recordedBy'],
        order: { createdAt: 'DESC' }
    });

    return NextResponse.json({
        success: true,
        data: communications
    });
});

// POST: Log a new communication
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    await initDB();

    const body = await request.json();
    const { memberId, type, direction, subject, content, metadata } = body;

    if (!memberId || !type || !direction || !content) {
        throw new BadRequestError('Missing required fields');
    }

    const memberRepo = AppDataSource.getRepository(Member);
    const member = await memberRepo.findOne({ where: { id: memberId, tenantId: user.tenantId } });
    if (!member) throw new NotFoundError('Member not found');

    const commRepo = AppDataSource.getRepository(MemberCommunication);
    const communication = commRepo.create({
        tenantId: user.tenantId,
        memberId,
        type,
        direction,
        subject,
        content,
        recordedById: user.id,
        metadata
    });

    await commRepo.save(communication);

    // Also update notification logs if it's an outbound automated message? 
    // Not needed here, this is for manual logging by reps.

    return NextResponse.json({
        success: true,
        message: 'Communication logged successfully',
        data: communication
    });
});
