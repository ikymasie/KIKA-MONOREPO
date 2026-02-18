import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseProduct, MerchandiseProductStatus, MerchandiseCategory } from '@/src/entities/MerchandiseProduct';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);

    // In a real scenario, we would filter by vendorId
    // For now, filtering by tenantId as a proxy if vendorId is not 1:1 with user
    const products = await productRepo.find({
        where: { tenantId: user.tenantId },
        order: { createdAt: 'DESC' }
    });

    return NextResponse.json(products);
});

export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();
    const { name, sku, category, retailPrice, costPrice, stockQuantity, description } = body;

    if (!name || !sku || !category || !retailPrice || !costPrice) {
        throw new ValidationError('Missing required fields');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);

    const product = productRepo.create({
        name,
        sku,
        category: category as MerchandiseCategory,
        retailPrice: parseFloat(retailPrice),
        costPrice: parseFloat(costPrice),
        stockQuantity: parseInt(stockQuantity || '0'),
        description,
        tenantId: user.tenantId,
        status: MerchandiseProductStatus.ACTIVE
    });

    await productRepo.save(product);

    return NextResponse.json(product, { status: 201 });
});

export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
        throw new ValidationError('Product ID is required');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const product = await productRepo.findOne({ where: { id, tenantId: user.tenantId } });

    if (!product) {
        throw new Error('Product not found');
    }

    Object.assign(product, updates);
    await productRepo.save(product);

    return NextResponse.json(product);
});

export const DELETE = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        throw new ValidationError('Product ID is required');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const product = await productRepo.findOne({ where: { id, tenantId: user.tenantId } });

    if (!product) {
        throw new Error('Product not found');
    }

    await productRepo.remove(product);

    return new NextResponse(null, { status: 204 });
});
