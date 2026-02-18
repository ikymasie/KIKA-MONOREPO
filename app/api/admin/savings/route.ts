import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { MemberSavings } = await import('@/src/entities/MemberSavings');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const savingsRepo = AppDataSource.getRepository(MemberSavings);
        const savings = await savingsRepo.find({
            where: { product: { tenantId: user.tenantId } },
            relations: ['member', 'product'],
            order: { createdAt: 'DESC' }
        });

        // Calculate some aggregate metrics
        const totalSavings = savings.reduce((sum, s) => sum + Number(s.balance), 0);
        const activeAccounts = savings.filter(s => s.isActive).length;

        return NextResponse.json({
            savings,
            metrics: {
                totalSavings,
                activeAccounts
            }
        });
    } catch (error: any) {
        console.error('Error fetching admin savings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
