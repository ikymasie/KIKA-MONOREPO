import { NextRequest, NextResponse } from 'next/server';

import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get specific deduction request details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { DeductionRequest } = await import('@/src/entities/DeductionRequest');
        const { DeductionItem } = await import('@/src/entities/DeductionItem');
        // If DeltaDeductionEngine is used in other methods (like POST/PUT not visible here causing error), import it. 
        // But wait, the file I viewed ONLY had GET?
        // Let me check file content again.


        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const requestRepo = db.getRepository(DeductionRequest);
        const itemRepo = db.getRepository(DeductionItem);

        const deductionRequest = await requestRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
        });

        if (!deductionRequest) {
            return NextResponse.json({ error: 'Deduction request not found' }, { status: 404 });
        }

        const items = await itemRepo.find({
            where: { requestId: params.id },
            relations: ['member'],
            order: { memberNumber: 'ASC' },
        });

        return NextResponse.json({
            deductionRequest,
            items,
        });
    } catch (error: any) {
        console.error('Error fetching deduction request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
