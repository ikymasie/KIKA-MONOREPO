import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseProduct } from '@/src/entities/MerchandiseProduct';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const product = await productRepo.findOne({
        where: { id: params.id, tenantId: user.tenantId }
    });

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    return NextResponse.json(product);
});

export const PATCH = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'saccos_admin') {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const product = await productRepo.findOne({
        where: { id: params.id, tenantId: user.tenantId }
    });

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    Object.assign(product, body);
    await productRepo.save(product);

    return NextResponse.json(product);
});

export const DELETE = asyncHandler(async (request: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'saccos_admin') {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const product = await productRepo.findOne({
        where: { id: params.id, tenantId: user.tenantId }
    });

    if (!product) {
        throw new NotFoundError('Product not found');
    }

    await productRepo.remove(product);

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
});
