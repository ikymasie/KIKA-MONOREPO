import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseInvoice, InvoiceStatus } from '@/src/entities/MerchandiseInvoice';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, ValidationError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const invoiceRepo = AppDataSource.getRepository(MerchandiseInvoice);
    const invoices = await invoiceRepo.find({
        where: { tenantId: user.tenantId },
        relations: ['order', 'order.product', 'order.member'],
        order: { createdAt: 'DESC' }
    });

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

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const orderRepo = AppDataSource.getRepository(MerchandiseOrder);
    const order = await orderRepo.findOne({ where: { id: orderId, tenantId: user.tenantId } });

    if (!order) {
        throw new Error('Order not found');
    }

    const invoiceRepo = AppDataSource.getRepository(MerchandiseInvoice);
    const invoice = invoiceRepo.create({
        tenantId: user.tenantId,
        vendorId: user.id, // Assuming user.id is the vendor ID for now, or fetch from vendor entity
        orderId: order.id,
        invoiceNumber,
        amount: order.totalPrice,
        dueDate: new Date(dueDate),
        status: InvoiceStatus.SENT,
        notes
    });

    await invoiceRepo.save(invoice);

    return NextResponse.json(invoice, { status: 201 });
});
