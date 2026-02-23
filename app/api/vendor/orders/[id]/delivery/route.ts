import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const POST = asyncHandler(async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const { id } = params;
    const body = await request.json();
    const { status, deliveryDate, notes } = body;

    const orders = await query('SELECT * FROM merchandise_orders WHERE id = ? AND tenantId = ? LIMIT 1', [id, user.tenantId]) as any[];
    const order = orders[0];

    if (!order) {
        throw new Error('Order not found');
    }

    if (status) {
        order.status = status;
    }

    if (deliveryDate) {
        order.deliveryDate = new Date(deliveryDate).toISOString().slice(0, 19).replace('T', ' ');
    }

    if (notes) {
        order.deliveryNotes = notes;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
    }
    if (deliveryDate) {
        updateFields.push('deliveryDate = ?');
        updateValues.push(order.deliveryDate);
    }
    if (notes) {
        updateFields.push('deliveryNotes = ?');
        updateValues.push(notes);
    }

    if (updateFields.length > 0) {
        const sql = `UPDATE merchandise_orders SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE id = ?`;
        updateValues.push(id);
        await execute(sql, updateValues);
    }

    return NextResponse.json(order);
});
