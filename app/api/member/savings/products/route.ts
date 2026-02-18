import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { SavingsProduct } = await import('@/src/entities/SavingsProduct');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const productRepo = AppDataSource.getRepository(SavingsProduct);
        const products = await productRepo.find({
            where: {
                tenantId: user.tenantId,
                status: 'active' as any // ProductStatus.ACTIVE
            },
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(products);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
