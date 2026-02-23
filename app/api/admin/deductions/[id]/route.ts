import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getDeductionRequest, listDeductionItems } from '@/src/db/services/DeductionService';

export const dynamic = 'force-dynamic';
// Get specific deduction request details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const deductionRequest = await getDeductionRequest(params.id, user.tenantId);

        if (!deductionRequest) {
            return NextResponse.json({ error: 'Deduction request not found' }, { status: 404 });
        }

        const items = await listDeductionItems(params.id);

        return NextResponse.json({
            deductionRequest,
            items,
        });
    } catch (error: any) {
        console.error('Error fetching deduction request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
