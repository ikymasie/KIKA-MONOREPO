import { NextRequest, NextResponse } from 'next/server';
import { ReconciliationEngine } from '@/lib/deductions/reconciliation';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
// List all reconciliation batches
export async function GET(request: NextRequest) {
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

        const batches = await batchRepo.find({
            where: { tenantId: user.tenantId },
            order: { createdAt: 'DESC' },
            take: 50,
        });

        return NextResponse.json({ batches });
    } catch (error: any) {
        console.error('Error fetching reconciliation batches:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Create new reconciliation from MoF CSV upload
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const deductionRequestId = formData.get('deductionRequestId') as string;
        const month = parseInt(formData.get('month') as string);
        const year = parseInt(formData.get('year') as string);

        if (!file || !month || !year) {
            return NextResponse.json(
                { error: 'File, month, and year are required' },
                { status: 400 }
            );
        }

        const csvContent = await file.text();

        const engine = new ReconciliationEngine(user.tenantId!, month, year);
        const batch = await engine.reconcile(csvContent, deductionRequestId);

        return NextResponse.json({
            success: true,
            batch: {
                id: batch.id,
                batchNumber: batch.batchNumber,
                totalRecords: batch.totalRecords,
                matchedRecords: batch.matchedRecords,
                varianceRecords: batch.varianceRecords,
                unmatchedRecords: batch.unmatchedRecords,
                totalExpected: batch.totalExpected,
                totalActual: batch.totalActual,
                totalVariance: batch.totalVariance,
            },
        });
    } catch (error: any) {
        console.error('Error creating reconciliation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
