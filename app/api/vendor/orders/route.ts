import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);

    // In a real scenario, we would filter by product.vendorId
    // Assuming the user.tenantId might be used differently for vendors or they have a direct association
    // For now, listing all orders to demonstrate functionality, but production would filter by assigned products
    const orders = await orderRepo.find({
        where: { tenantId: user.tenantId }, // This is a simplification
        relations: ['product', 'member'],
        order: { createdAt: 'DESC' }
    });

    return NextResponse.json(orders);
});

export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const { id, status } = await request.json();

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);
    const order = await orderRepo.findOne({ where: { id } });

    if (!order) {
        throw new Error('Order not found');
    }

    order.status = status as OrderStatus;
    await orderRepo.save(order);

    return NextResponse.json(order);
});
