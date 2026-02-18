import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { MerchandiseProduct } from '@/src/entities/MerchandiseProduct';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, NotFoundError, BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);
    const order = await orderRepo.findOne({
        where: { id: params.id, tenantId: user.tenantId },
        relations: ['member', 'product']
    });

    if (!order) {
        throw new NotFoundError('Order not found');
    }

    return NextResponse.json(order);
});

export const PATCH = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'saccos_admin') {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();
    const { status } = body;

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    return await AppDataSource.transaction(async (transactionalEntityManager) => {
        const orderRepo = transactionalEntityManager.getRepository(MerchandiseOrder);
        const productRepo = transactionalEntityManager.getRepository(MerchandiseProduct);

        const order = await orderRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
            relations: ['product']
        });

        if (!order) {
            throw new NotFoundError('Order not found');
        }

        const oldStatus = order.status;

        // Business Logic: Decrement stock when order is DELIVERED (if it wasn't already decremented)
        // Note: In some systems this happens at 'ORDERED' or 'APPROVED' state.
        // For KIKA, let's say it happens at DELIVERED to reflect physical stock leaving the warehouse.
        if (status === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
            const product = order.product;
            if (product) {
                if (product.stockQuantity < order.quantity) {
                    throw new BadRequestError(`Insufficient stock for product: ${product.name}. Available: ${product.stockQuantity}`);
                }
                product.stockQuantity -= order.quantity;
                await productRepo.save(product);
            }
        }

        // Business Logic: Restore stock if order is CANCELLED after being DELIVERED
        if (status === OrderStatus.CANCELLED && oldStatus === OrderStatus.DELIVERED) {
            const product = order.product;
            if (product) {
                product.stockQuantity += order.quantity;
                await productRepo.save(product);
            }
        }

        Object.assign(order, body);
        await orderRepo.save(order);

        // --- Notifications & Auto-Ordering ---
        try {
            const { notificationService } = require('@/lib/notification-service');
            const { NotificationEvent } = require('@/lib/notification-types');

            // 1. Notify Member of status change
            if (status && status !== oldStatus) {
                await notificationService.sendNotification({
                    event: NotificationEvent.MEMBER_ORDER_STATUS_UPDATE,
                    recipientRole: 'member',
                    recipientEmail: order.member?.email,
                    recipientPhone: order.member?.phone,
                    userId: order.memberId,
                    tenantId: order.tenantId,
                    data: {
                        orderNumber: order.orderNumber,
                        status: status.toUpperCase(),
                        productName: order.product?.name
                    }
                });
            }

            // 2. Check for Auto-Ordering if stock dropped
            if (status === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
                const product = order.product;
                if (product && product.allowAutoOrdering && product.stockQuantity <= product.reorderLevel && product.vendor?.email) {
                    await notificationService.sendNotification({
                        event: NotificationEvent.VENDOR_NEW_ORDER,
                        recipientRole: 'vendor',
                        recipientEmail: product.vendor.email,
                        tenantId: order.tenantId,
                        data: {
                            productName: product.name,
                            sku: product.sku,
                            currentStock: product.stockQuantity,
                            reorderLevel: product.reorderLevel
                        }
                    });
                }
            }
        } catch (notifError) {
            console.error('[Merchandise API] Notification failed:', notifError);
        }

        return NextResponse.json(order);
    });
});
