import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AuditorService } = await import('@/src/services/AuditorService');
        const { UserRole } = await import('@/src/entities/User');

        const user = await getUserFromRequest(request);

        if (!user || user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestId, action } = body; // 'approve' or 'reject'

        if (!requestId) {
            return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
        }

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const auditorService = new AuditorService();
        // Ideally verify that the requestId belongs to the user's tenant

        let result;
        if (action === 'approve') {
            result = await auditorService.approveAccessRequest(requestId, user.id);
        } else {
            result = await auditorService.rejectAccessRequest(requestId);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error updating access request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { UserRole } = await import('@/src/entities/User');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const auditorRepo = AppDataSource.getRepository('AuditorAccessRequest');
        const requests = await auditorRepo.find({
            where: { tenantId: user.tenantId },
            relations: ['auditor'],
            order: { createdAt: 'DESC' },
        });

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Error fetching tenant access requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
