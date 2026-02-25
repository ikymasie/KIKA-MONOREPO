import { NextRequest, NextResponse } from 'next/server';
import { DeltaDeductionEngine } from '@/lib/deductions/delta-engine';

export const dynamic = 'force-dynamic';

// Submit deduction request to MoF
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { queryOne } = await import('@/src/db/query');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const deductionRequest = await queryOne<any>(
            'SELECT id, month, year FROM deduction_requests WHERE id = ? AND tenantId = ?',
            [params.id, user.tenantId]
        );

        if (!deductionRequest) {
            return NextResponse.json({ error: 'Deduction request not found' }, { status: 404 });
        }

        const engine = new DeltaDeductionEngine(user.tenantId!, deductionRequest.month, deductionRequest.year);
        await engine.submitRequest(params.id, user.id);

        return NextResponse.json({ success: true, message: 'Deduction request submitted successfully' });
    } catch (error: any) {
        console.error('Error submitting deduction request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
