import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as OrderStatus | null;
    const memberId = searchParams.get('memberId');

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);
    const query = orderRepo.createQueryBuilder('order')
        .leftJoinAndSelect('order.member', 'member')
        .leftJoinAndSelect('order.product', 'product')
        .where('order.tenantId = :tenantId', { tenantId: user.tenantId });

    if (status) {
        query.andWhere('order.status = :status', { status });
    }

    if (memberId) {
        query.andWhere('order.memberId = :memberId', { memberId });
    }

    const orders = await query.orderBy('order.createdAt', 'DESC').getMany();

    return NextResponse.json(orders);
});

export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'saccos_admin') {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);

    // Generate order number if not provided
    if (!body.orderNumber) {
        const count = await orderRepo.count({ where: { tenantId: user.tenantId } });
        const tenantPrefix = user.tenantId?.substring(0, 4).toUpperCase() || 'UNKN';
        body.orderNumber = `ORD-${tenantPrefix}-${(count + 1).toString().padStart(5, '0')}`;
    }

    const order = orderRepo.create({
        ...body,
        tenantId: user.tenantId,
        status: body.status || OrderStatus.PENDING
    });

    await orderRepo.save(order);

    return NextResponse.json(order);
});
