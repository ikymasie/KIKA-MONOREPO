import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { LoanProduct } from '@/src/entities/LoanProduct';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(LoanProduct);
        const products = await productRepo.find({
            where: { tenantId: user.tenantId },
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(LoanProduct);
        const product = productRepo.create({
            ...body,
            tenantId: user.tenantId
        });

        await productRepo.save(product);
        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
