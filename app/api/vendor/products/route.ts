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

    const products = await query(
        'SELECT * FROM merchandise_products WHERE tenantId = ? ORDER BY createdAt DESC',
        [user.tenantId]
    );

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

    const productId = uuidv4();
    const newProduct = {
        id: productId,
        name,
        sku,
        category,
        retailPrice: parseFloat(retailPrice),
        costPrice: parseFloat(costPrice),
        stockQuantity: parseInt(stockQuantity || '0'),
        description,
        tenantId: user.tenantId,
        status: 'active'
    };

    await execute(
        `INSERT INTO merchandise_products (id, name, sku, category, retailPrice, costPrice, stockQuantity, description, tenantId, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [newProduct.id, newProduct.name, newProduct.sku, newProduct.category, newProduct.retailPrice, newProduct.costPrice, newProduct.stockQuantity, newProduct.description, newProduct.tenantId, newProduct.status]
    );

    return NextResponse.json(newProduct, { status: 201 });
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

    const products = await query('SELECT * FROM merchandise_products WHERE id = ? AND tenantId = ? LIMIT 1', [id, user.tenantId]) as any[];
    const product = products[0];

    if (!product) {
        throw new Error('Product not found');
    }

    Object.assign(product, updates);

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
    }

    if (updateFields.length > 0) {
        const sql = `UPDATE merchandise_products SET ${updateFields.join(', ')}, updatedAt = NOW() WHERE id = ?`;
        updateValues.push(id);
        await execute(sql, updateValues);
    }

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

    const products = await query('SELECT id FROM merchandise_products WHERE id = ? AND tenantId = ? LIMIT 1', [id, user.tenantId]) as any[];
    const product = products[0];

    if (!product) {
        throw new Error('Product not found');
    }

    await execute('DELETE FROM merchandise_products WHERE id = ?', [id]);

    return new NextResponse(null, { status: 204 });
});
