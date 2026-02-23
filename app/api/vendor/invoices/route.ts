import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const invoicesData = await query(`
        SELECT mi.*, 
               mo.id as orderId, mo.status as orderStatus, mo.totalAmount, mo.quantity, mo.orderDate,
               p.id as productId, p.name as productName, p.sku as productSku,
               m.id as memberId, m.firstName as memberFirstName, m.lastName as memberLastName, m.memberNumber
        FROM merchandise_invoices mi
        LEFT JOIN merchandise_orders mo ON mo.id = mi.orderId
        LEFT JOIN merchandise_products p ON p.id = mo.productId
        LEFT JOIN members m ON m.id = mo.memberId
        WHERE mi.tenantId = ?
        ORDER BY mi.createdAt DESC
    `, [user.tenantId]) as any[];

    const invoices = invoicesData.map((inv: any) => ({
        id: inv.id,
        tenantId: inv.tenantId,
        vendorId: inv.vendorId,
        orderId: inv.orderId,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        dueDate: inv.dueDate,
        status: inv.status,
        notes: inv.notes,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        order: inv.orderId ? {
            id: inv.orderId,
            status: inv.orderStatus,
            totalAmount: inv.totalAmount,
            quantity: inv.quantity,
            orderDate: inv.orderDate,
            product: inv.productId ? {
                id: inv.productId,
                name: inv.productName,
                sku: inv.productSku,
            } : null,
            member: inv.memberId ? {
                id: inv.memberId,
                firstName: inv.memberFirstName,
                lastName: inv.memberLastName,
                memberNumber: inv.memberNumber,
            } : null
        } : null
    }));

    return NextResponse.json(invoices);
});

export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();
    const { orderId, invoiceNumber, dueDate, notes } = body;

    if (!orderId || !invoiceNumber || !dueDate) {
        throw new ValidationError('Missing required fields');
    }

    const orders = await query('SELECT * FROM merchandise_orders WHERE id = ? AND tenantId = ? LIMIT 1', [orderId, user.tenantId]) as any[];
    const order = orders[0];

    if (!order) {
        throw new Error('Order not found');
    }

    const newInvoiceId = uuidv4();
    const invoice = {
        id: newInvoiceId,
        tenantId: user.tenantId,
        vendorId: user.id, // Assuming user.id is the vendor ID for now, or fetch from vendor entity
        orderId: order.id,
        invoiceNumber,
        amount: order.totalAmount || order.totalPrice, // Note: updated to try totalAmount first
        dueDate: new Date(dueDate).toISOString().slice(0, 19).replace('T', ' '),
        status: 'sent',
        notes
    };

    await execute(
        `INSERT INTO merchandise_invoices (id, tenantId, vendorId, orderId, invoiceNumber, amount, dueDate, status, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [invoice.id, invoice.tenantId, invoice.vendorId, invoice.orderId, invoice.invoiceNumber, invoice.amount, invoice.dueDate, invoice.status, invoice.notes]
    );

    return NextResponse.json(invoice, { status: 201 });
});
