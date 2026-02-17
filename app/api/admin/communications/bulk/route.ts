import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member, MemberStatus } from '@/src/entities/Member';
import { MemberCommunication, CommunicationType, CommunicationDirection } from '@/src/entities/MemberCommunication';
import { getUserFromRequest } from '@/lib/auth-server';
import { In } from 'typeorm';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { memberIds, type, subject, content, filter } = body;

        if (!type || !content) {
            return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const communicationRepo = AppDataSource.getRepository(MemberCommunication);

        let targetMemberIds = memberIds;

        // If no specific IDs, use filter or all active members
        if (!targetMemberIds || targetMemberIds.length === 0) {
            const query: any = { tenantId: user.tenantId, status: MemberStatus.ACTIVE };
            if (filter?.employmentStatus) query.employmentStatus = filter.employmentStatus;

            const members = await memberRepo.find({
                where: query,
                select: ['id'],
            });
            targetMemberIds = members.map(m => m.id);
        }

        if (targetMemberIds.length === 0) {
            return NextResponse.json({ error: 'No members found for the communication' }, { status: 400 });
        }

        // Create communication logs
        const communications = targetMemberIds.map((memberId: string) =>
            communicationRepo.create({
                tenantId: user.tenantId,
                memberId,
                type: type as CommunicationType,
                direction: CommunicationDirection.OUTBOUND,
                subject,
                content,
                recordedById: user.id,
                metadata: { bulk: true },
            })
        );

        // In a real scenario, we would trigger SMS/Email service here
        // For now, we just save the logs to represent "sending"
        await communicationRepo.save(communications);

        return NextResponse.json({
            success: true,
            count: targetMemberIds.length,
            message: `Successfully initiated ${type} to ${targetMemberIds.length} members`,
        });
    } catch (error: any) {
        console.error('Bulk communication error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
