import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, ValidationError } from '@/lib/errors';

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
    const { notes } = body;

    const orders = await query('SELECT * FROM merchandise_orders WHERE id = ? AND tenantId = ? LIMIT 1', [id, user.tenantId]) as any[];
    const order = orders[0];

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status !== 'approved' && order.status !== 'ordered') {
        throw new ValidationError('Order is not in a fulfillable state');
    }

    order.status = 'in_transit';
    order.deliveryNotes = notes || order.deliveryNotes;

    await execute(
        'UPDATE merchandise_orders SET status = ?, deliveryNotes = ?, updatedAt = NOW() WHERE id = ?',
        [order.status, order.deliveryNotes, id]
    );

    return NextResponse.json(order);
});
