import { NextRequest, NextResponse } from 'next/server';
import { ReconciliationEngine } from '@/lib/deductions/reconciliation';

export const dynamic = 'force-dynamic';

// Post journals for a reconciliation batch
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { queryOne } = await import('@/src/db/query');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const batch = await queryOne<any>(
            'SELECT id, month, year, journalsPosted FROM reconciliation_batches WHERE id = ? AND tenantId = ?',
            [params.id, user.tenantId]
        );

        if (!batch) {
            return NextResponse.json({ error: 'Reconciliation batch not found' }, { status: 404 });
        }

        if (batch.journalsPosted) {
            return NextResponse.json({ error: 'Journals already posted for this batch' }, { status: 400 });
        }

        const engine = new ReconciliationEngine(user.tenantId!, batch.month, batch.year);
        await engine.postJournals(params.id);

        return NextResponse.json({ success: true, message: 'Journals posted successfully' });
    } catch (error: any) {
        console.error('Error posting journals:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
