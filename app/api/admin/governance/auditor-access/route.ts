import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';
import { query } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);

        if (!user || user.role !== 'saccos_admin') {
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
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sql = `
            SELECT r.*, 
                   u.firstName AS auditorFirstName, u.lastName AS auditorLastName, u.email AS auditorEmail
            FROM auditor_access_requests r
            LEFT JOIN users u ON u.id = r.auditorId
            WHERE r.tenantId = ?
            ORDER BY r.createdAt DESC
        `;
        const requests = await query(sql, [user.tenantId]);

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Error fetching tenant access requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
