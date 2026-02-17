import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';
import { UserRole } from '@/src/entities/User';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { requestId: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        const { requestId } = params;

        if (!user || user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action } = body; // 'approve' or 'reject'

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
