import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query, execute } = await import("@/src/db/query");
        const { v4: uuidv4 } = await import('uuid');
        const { getUserFromRequest } = await import("@/lib/auth-server");

        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { memberIds, type, subject, content, filter } = body;

        if (!type || !content) {
            return NextResponse.json({ error: 'Type and content are required' }, { status: 400 });
        }



        let targetMemberIds = memberIds;

        // If no specific IDs, use filter or all active members
        if (!targetMemberIds || targetMemberIds.length === 0) {
            let sql = 'SELECT id FROM members WHERE tenantId = ? AND status = ?';
            const params: any[] = [user.tenantId, 'active'];

            if (filter?.employmentStatus) {
                sql += ' AND employmentStatus = ?';
                params.push(filter.employmentStatus);
            }

            const members = await query(sql, params) as any[];
            targetMemberIds = members.map(m => m.id);
        }

        if (targetMemberIds.length === 0) {
            return NextResponse.json({ error: 'No members found for the communication' }, { status: 400 });
        }

        // Create communication logs
        // We will execute a batch insert
        if (targetMemberIds.length > 0) {
            const values = targetMemberIds.map((memberId: string) => [
                uuidv4(), user.tenantId, memberId, type, 'outbound', subject, content, user.id, JSON.stringify({ bulk: true })
            ]);

            // Create placeholders exactly matching the number of values
            const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(', ');
            const flatValues = values.flat();

            await execute(
                `INSERT INTO member_communications (id, tenantId, memberId, type, direction, subject, content, recordedById, metadata, createdAt, updatedAt)
                 VALUES ${placeholders}`,
                flatValues
            );
        }

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
