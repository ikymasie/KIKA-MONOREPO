import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { ApplicationStatus } from '@/src/interfaces/ISocietyApplication';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized/Forbidden' }, { status: 401 });
        }

        const { action, notes } = await request.json(); // 'approve' | 'reject' | 'request_info'

        const application = await queryOne<RowDataPacket>('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [params.id]);
        if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

        const previousStatus = application.status;
        let newStatus = previousStatus;
        let rejectionReasons = application.rejectionReasons;
        let finalDecisionAt = application.finalDecisionAt;
        let finalDecisionMakerId = application.finalDecisionMakerId;

        if (action === 'approve') {
            if (previousStatus === ApplicationStatus.SUBMITTED) {
                newStatus = ApplicationStatus.SECURITY_VETTING;
            } else {
                newStatus = ApplicationStatus.APPROVED;
                finalDecisionAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
                finalDecisionMakerId = user.id;
            }
        } else if (action === 'reject') {
            newStatus = ApplicationStatus.REJECTED;
            rejectionReasons = notes;
            finalDecisionAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
            finalDecisionMakerId = user.id;
        } else if (action === 'request_info') {
            newStatus = ApplicationStatus.INCOMPLETE;
            rejectionReasons = `Info Requested: ${notes}`;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Apply state updates using SQL
        await execute(
            `UPDATE society_applications SET 
                status = ?, rejectionReasons = ?, finalDecisionAt = ?, finalDecisionMakerId = ?, updatedAt = NOW()
             WHERE id = ?`,
            [newStatus, rejectionReasons, finalDecisionAt, finalDecisionMakerId, params.id]
        );

        // Record history
        await execute(
            `INSERT INTO application_status_history (id, applicationId, fromStatus, toStatus, changedBy, notes, action, changedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [uuidv4(), params.id, previousStatus, newStatus, user.id, notes || null, action]
        );

        const updated = await queryOne<RowDataPacket>('SELECT * FROM society_applications WHERE id = ? LIMIT 1', [params.id]);
        return NextResponse.json({ success: true, application: updated });
    } catch (error: any) {
        console.error('Error processing application action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
