import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MerchandiseProduct, MerchandiseCategory, MerchandiseProductStatus } from '@/src/entities/MerchandiseProduct';
import { getUserFromRequest } from '@/lib/auth-server';
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

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const productRepo = AppDataSource.getRepository(MerchandiseProduct);
    const results = {
        success: 0,
        errors: [] as string[]
    };

    const productsToSave: MerchandiseProduct[] = [];

    for (let i = 0; i < dataRows.length; i++) {
        try {
            const rowData = dataRows[i];

            // Validate and transform rowData
            if (!rowData.name || !rowData.sku || !rowData.retailPrice) {
                results.errors.push(`Row ${i + 1}: Missing required fields (name, sku, retailPrice)`);
                continue;
            }

            const product = productRepo.create({
                tenantId: user.tenantId,
                name: rowData.name,
                sku: rowData.sku,
                description: rowData.description || '',
                category: (rowData.category as MerchandiseCategory) || MerchandiseCategory.OTHER,
                retailPrice: parseFloat(rowData.retailPrice),
                costPrice: parseFloat(rowData.costPrice || '0'),
                stockQuantity: parseInt(rowData.stockQuantity || '0'),
                minimumTermMonths: parseInt(rowData.minimumTermMonths || '1'),
                maximumTermMonths: parseInt(rowData.maximumTermMonths || '12'),
                interestRate: parseFloat(rowData.interestRate || '0'),
                imageUrl: rowData.imageUrl || '',
                status: (rowData.status as MerchandiseProductStatus) || MerchandiseProductStatus.ACTIVE
            });

            productsToSave.push(product);
        } catch (err: any) {
            results.errors.push(`Row ${i + 2}: ${err.message}`);
        }
    }

    if (productsToSave.length > 0) {
        await productRepo.save(productsToSave);
        results.success = productsToSave.length;
    }

    return NextResponse.json(results);
});
