import { NextRequest, NextResponse } from 'next/server';
import { ReconciliationEngine } from '@/lib/deductions/reconciliation';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
// Post journals for a reconciliation batch
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { ReconciliationBatch } = await import('@/src/entities/ReconciliationBatch');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const batchRepo = db.getRepository(ReconciliationBatch);

        const batch = await batchRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Reconciliation batch not found' }, { status: 404 });
        }

        if (batch.journalsPosted) {
            return NextResponse.json({ error: 'Journals already posted for this batch' }, { status: 400 });
        }

        const engine = new ReconciliationEngine(user.tenantId!, batch.month, batch.year);
        await engine.postJournals(params.id);

        return NextResponse.json({
            success: true,
            message: 'Journals posted successfully',
        });
    } catch (error: any) {
        console.error('Error posting journals:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
