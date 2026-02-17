import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-server';
import {
    RegulatoryBroadcast,
    BroadcastType,
    BroadcastPriority,
    BroadcastTargetAudience,
} from '@/src/entities/RegulatoryBroadcast';
import { User, UserRole } from '@/src/entities/User';
import { Tenant } from '@/src/entities/Tenant';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const broadcastType = searchParams.get('broadcastType') as BroadcastType | null;
        const priority = searchParams.get('priority') as BroadcastPriority | null;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const dataSource = await getDb();
        const broadcastRepo = dataSource.getRepository(RegulatoryBroadcast);

        const queryBuilder = broadcastRepo
            .createQueryBuilder('broadcast')
            .leftJoinAndSelect('broadcast.creator', 'creator')
            .orderBy('broadcast.publishedAt', 'DESC');

        if (broadcastType) {
            queryBuilder.andWhere('broadcast.broadcastType = :broadcastType', {
                broadcastType,
            });
        }

        if (priority) {
            queryBuilder.andWhere('broadcast.priority = :priority', { priority });
        }

        const [broadcasts, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return NextResponse.json({
            broadcasts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching broadcasts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch broadcasts', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            content,
            broadcastType,
            priority,
            targetAudience,
            targetTenantIds,
            deliveryChannels,
            expiresAt,
        } = body;

        if (!title || !content || !broadcastType) {
            return NextResponse.json(
                { error: 'Missing required fields: title, content, broadcastType' },
                { status: 400 }
            );
        }

        const dataSource = await getDb();
        const broadcastRepo = dataSource.getRepository(RegulatoryBroadcast);
        const userRepo = dataSource.getRepository(User);
        const tenantRepo = dataSource.getRepository(Tenant);

        const broadcast = broadcastRepo.create({
            title,
            content,
            broadcastType: broadcastType as BroadcastType,
            priority: priority as BroadcastPriority || BroadcastPriority.MEDIUM,
            targetAudience: targetAudience as BroadcastTargetAudience || BroadcastTargetAudience.ALL_TENANTS,
            targetTenantIds,
            createdBy: user.id,
            publishedAt: new Date(),
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            deliveryChannels: deliveryChannels || ['in_app'],
            deliveryStatus: {},
        });

        await broadcastRepo.save(broadcast);

        // Send broadcast to recipients
        let recipients: User[] = [];

        if (targetAudience === BroadcastTargetAudience.ALL_TENANTS || !targetAudience) {
            // Get all SACCOS admins
            recipients = await userRepo.find({
                where: { role: UserRole.SACCOS_ADMIN },
            });
        } else if (targetAudience === BroadcastTargetAudience.SPECIFIC_TENANTS && targetTenantIds) {
            // Get admins from specific tenants
            recipients = await userRepo
                .createQueryBuilder('user')
                .where('user.role = :role', { role: UserRole.SACCOS_ADMIN })
                .andWhere('user.tenantId IN (:...tenantIds)', { tenantIds: targetTenantIds })
                .getMany();
        }

        // TODO: Implement actual notification delivery via email/SMS/in-app
        // For now, just track that the broadcast was created
        const deliveryStatus = {
            email: { sent: 0, failed: 0, total: recipients.length },
            sms: { sent: 0, failed: 0, total: recipients.length },
            inApp: { created: recipients.length, total: recipients.length },
        };

        broadcast.deliveryStatus = deliveryStatus;
        await broadcastRepo.save(broadcast);

        return NextResponse.json(broadcast, { status: 201 });
    } catch (error: any) {
        console.error('Error creating broadcast:', error);
        return NextResponse.json(
            { error: 'Failed to create broadcast', details: error.message },
            { status: 500 }
        );
    }
}
