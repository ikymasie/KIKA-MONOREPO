import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const ordersData = await query(`
        SELECT mo.*, 
               p.name as productName, p.sku as productSku, p.retailPrice, p.costPrice, p.description as productDescription,
               m.firstName as memberFirstName, m.lastName as memberLastName, m.memberNumber, m.email as memberEmail, m.phone as memberPhone
        FROM merchandise_orders mo
        LEFT JOIN merchandise_products p ON p.id = mo.productId
        LEFT JOIN members m ON m.id = mo.memberId
        WHERE mo.tenantId = ?
        ORDER BY mo.createdAt DESC
    `, [user.tenantId]) as any[];

    const orders = ordersData.map((order: any) => ({
        id: order.id,
        status: order.status,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        tenantId: order.tenantId,
        productId: order.productId,
        memberId: order.memberId,
        product: order.productId ? {
            id: order.productId,
            name: order.productName,
            sku: order.productSku,
            retailPrice: order.retailPrice,
            costPrice: order.costPrice,
            description: order.productDescription,
        } : null,
        member: order.memberId ? {
            id: order.memberId,
            firstName: order.memberFirstName,
            lastName: order.memberLastName,
            memberNumber: order.memberNumber,
            email: order.memberEmail,
            phone: order.memberPhone,
        } : null
    }));

    return NextResponse.json(orders);
});

export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const { id, status } = await request.json();

    const orders = await query('SELECT * FROM merchandise_orders WHERE id = ? LIMIT 1', [id]) as any[];
    const order = orders[0];

    if (!order) {
        throw new Error('Order not found');
    }

    await execute('UPDATE merchandise_orders SET status = ?, updatedAt = NOW() WHERE id = ?', [status, id]);
    order.status = status;

    return NextResponse.json(order);
});
