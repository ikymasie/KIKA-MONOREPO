import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseProduct, MerchandiseProductStatus } from '@/src/entities/MerchandiseProduct';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const products = await productRepo.find({
        where: {
            tenantId: user.tenantId,
            status: MerchandiseProductStatus.ACTIVE
        },
        order: { createdAt: 'DESC' }
    });

    return NextResponse.json(products);
});

export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();
    const { productId, quantity, totalAmount, termMonths, monthlyInstallment } = body;

    if (!productId || !quantity || !totalAmount || !termMonths || !monthlyInstallment) {
        throw new BadRequestError('Missing required order fields');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);

    const product = await productRepo.findOne({
        where: { id: productId, tenantId: user.tenantId }
    });

    if (!product) {
        throw new BadRequestError('Product not found');
    }

    // Basic validation
    if (product.stockQuantity < quantity) {
        throw new BadRequestError('Insufficient stock for this product');
    }

    if (termMonths < (product.minimumTermMonths || 1) || termMonths > (product.maximumTermMonths || 12)) {
        throw new BadRequestError('Selected term is outside allowed limits');
    }

    // Generate Order Number
    const count = await orderRepo.count({ where: { tenantId: user.tenantId } });
    const tenantPrefix = user.tenantId?.substring(0, 4).toUpperCase() || 'UNKN';
    const orderNumber = `ORD-${tenantPrefix}-${(count + 1).toString().padStart(5, '0')}`;


    const order = orderRepo.create({
        tenantId: user.tenantId,
        memberId: user.id, // Assuming user.id is the memberId in this context
        productId,
        orderNumber,
        quantity,
        totalPrice: totalAmount,
        termMonths,
        monthlyInstallment,
        status: OrderStatus.PENDING,
    });

    await orderRepo.save(order);

    return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber
    });
});
