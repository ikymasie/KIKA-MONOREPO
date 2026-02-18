import { NextRequest, NextResponse } from 'next/server';

import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
// Generate new deduction request
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { DeductionRequest } = await import('@/src/entities/DeductionRequest');
        const { DeltaDeductionEngine } = await import('@/lib/deductions/delta-engine');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { month, year } = await request.json();

        if (!month || !year) {
            return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
        }

        const engine = new DeltaDeductionEngine(user.tenantId!, month, year);
        const deductionRequest = await engine.generateDeductionRequest();

        // Generate and upload CSV
        const csvContent = await engine.generateCSV(deductionRequest.id);
        const csvUrl = await engine.uploadCSV(deductionRequest.id, csvContent);

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
                csvUrl,
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
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { DeductionRequest } = await import('@/src/entities/DeductionRequest');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const requestRepo = db.getRepository(DeductionRequest);

        const requests = await requestRepo.find({
            where: { tenantId: user.tenantId },
            order: { createdAt: 'DESC' },
            take: 50,
        });

        return NextResponse.json({ requests });
    } catch (error: any) {
        console.error('Error fetching deduction requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
