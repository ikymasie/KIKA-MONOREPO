import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MemberSavings } from '@/src/entities/MemberSavings';
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
