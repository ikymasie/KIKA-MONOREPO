import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, ValidationError } from '@/lib/errors';

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

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);
    const order = await orderRepo.findOne({
        where: { id, tenantId: user.tenantId },
        relations: ['product']
    });

    if (!order) {
        throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.APPROVED && order.status !== OrderStatus.ORDERED) {
        throw new ValidationError('Order is not in a fulfillable state');
    }

    order.status = OrderStatus.IN_TRANSIT;
    order.deliveryNotes = notes || order.deliveryNotes;

    await orderRepo.save(order);

    return NextResponse.json(order);
});
