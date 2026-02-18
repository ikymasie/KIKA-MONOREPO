import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { TenantStatus as TenantStatusType } from '@/src/entities/Tenant';

export const dynamic = 'force-dynamic';
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { Tenant, TenantStatus } = await import('@/src/entities/Tenant');
        const { TenantStatusLog } = await import('@/src/entities/TenantStatusLog');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, reason, effectiveDate } = body;

        if (!status || !reason) {
            return NextResponse.json(
                { error: 'Missing required fields: status, reason' },
                { status: 400 }
            );
        }

        const dataSource = await getDb();
        const tenantRepo = dataSource.getRepository(Tenant);
        const statusLogRepo = dataSource.getRepository(TenantStatusLog);

        const tenant = await tenantRepo.findOne({ where: { id: params.id } });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const previousStatus = tenant.status;

        // Create status log
        const statusLog = statusLogRepo.create({
            tenantId: tenant.id,
            previousStatus,
            newStatus: status as TenantStatusType,
            reason,
            changedBy: user.id,
            changedAt: new Date(),
            effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
        });

        await statusLogRepo.save(statusLog);

        // Update tenant status
        tenant.status = status as TenantStatusType;
        await tenantRepo.save(tenant);

        // TODO: Send notification to tenant admins via notification system
        // Notification details: Tenant Status Changed
        // Priority: urgent
        // Channels: email, sms, in_app

        return NextResponse.json({ tenant, statusLog });
    } catch (error: any) {
        console.error('Error updating tenant status:', error);
        return NextResponse.json(
            { error: 'Failed to update tenant status', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { TenantStatusLog } = await import('@/src/entities/TenantStatusLog');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const statusLogRepo = dataSource.getRepository(TenantStatusLog);

        const statusHistory = await statusLogRepo.find({
            where: { tenantId: params.id },
            relations: ['changer'],
            order: { changedAt: 'DESC' },
        });

        return NextResponse.json(statusHistory);
    } catch (error: any) {
        console.error('Error fetching status history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch status history', details: error.message },
            { status: 500 }
        );
    }
}
