import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/src/db/query';
import { MerchandiseProductStatus } from '@/src/interfaces/IMerchandise';
import { getUserFromRequest } from '@/lib/auth-server';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'saccos_admin') {
        throw new ForbiddenError('Only SACCOSS Admins can bulk upload products');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
        throw new BadRequestError('No file provided');
    }

    if (!file.name.endsWith('.csv')) {
        throw new BadRequestError('Invalid file type. Please upload a CSV file.');
    }

    const text = await file.text();
    const parseResult = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parseResult.errors.length > 0) {
        throw new BadRequestError(`CSV Parsing error: ${parseResult.errors[0].message}`);
    }

    const rows = parseResult.data as any[];
    const dataRows = rows;

    const results = {
        success: 0,
        errors: [] as string[]
    };

    let successCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
        try {
            const rowData = dataRows[i];

            // Validate and transform rowData
            if (!rowData.name || !rowData.sku || !rowData.retailPrice) {
                results.errors.push(`Row ${i + 1}: Missing required fields (name, sku, retailPrice)`);
                continue;
            }

            const productData = {
                id: uuidv4(),
                tenantId: user.tenantId,
                name: rowData.name,
                sku: rowData.sku,
                description: rowData.description || '',
                category: rowData.category || 'other',
                retailPrice: parseFloat(rowData.retailPrice),
                costPrice: parseFloat(rowData.costPrice || '0'),
                stockQuantity: parseInt(rowData.stockQuantity || '0'),
                minimumTermMonths: parseInt(rowData.minimumTermMonths || '1'),
                maximumTermMonths: parseInt(rowData.maximumTermMonths || '12'),
                interestRate: parseFloat(rowData.interestRate || '0'),
                imageUrl: rowData.imageUrl || '',
                status: (rowData.status as MerchandiseProductStatus) || MerchandiseProductStatus.ACTIVE
            };

            await execute(
                `INSERT INTO merchandise_products (
                    id, tenantId, name, sku, description, category, retailPrice, costPrice, stockQuantity, 
                    minimumTermMonths, maximumTermMonths, interestRate, imageUrl, status, createdAt, updatedAt
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    productData.id, productData.tenantId, productData.name, productData.sku, productData.description,
                    productData.category, productData.retailPrice, productData.costPrice, productData.stockQuantity,
                    productData.minimumTermMonths, productData.maximumTermMonths, productData.interestRate,
                    productData.imageUrl, productData.status
                ]
            );

            successCount++;
        } catch (err: any) {
            results.errors.push(`Row ${i + 2}: ${err.message}`);
        }
    }

    results.success = successCount;

    return NextResponse.json(results);
});
