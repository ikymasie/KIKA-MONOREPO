import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { generateDeductionRequest, listDeductionRequests } from '@/src/db/services/DeductionService';

export const dynamic = 'force-dynamic';
// Generate new deduction request
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { month, year } = await request.json();

        if (!month || !year) {
            return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
        }

        const deductionRequest = await generateDeductionRequest(user.tenantId, month, year);

        return NextResponse.json({
            success: true,
            deductionRequest: {
                id: deductionRequest.id,
                batchNumber: deductionRequest.batchNumber,
                month: deductionRequest.month,
                year: deductionRequest.year,
                totalMembers: deductionRequest.totalMembers,
                totalAmount: deductionRequest.totalAmount,
                status: deductionRequest.status,
                csvUrl: null, // Removed firebase CSV dependency for SQL migration simplicity here
            },
        });
    } catch (error: any) {
        console.error('Error generating deduction request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// List all deduction requests
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const requests = await listDeductionRequests(user.tenantId, 50);

        return NextResponse.json({ requests });
    } catch (error: any) {
        console.error('Error fetching deduction requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
