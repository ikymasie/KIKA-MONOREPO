import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { ReconciliationBatch, ReconciliationStatus } from '@/src/entities/ReconciliationBatch';
import { ReconciliationItem, MatchStatus, VarianceReason } from '@/src/entities/ReconciliationItem';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { month, year, items } = data;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const batchRepo = AppDataSource.getRepository(ReconciliationBatch);
        const itemRepo = AppDataSource.getRepository(ReconciliationItem);
        const memberRepo = AppDataSource.getRepository(Member);

        // 1. Create Batch
        const batch = batchRepo.create({
            tenantId: user.tenantId,
            batchNumber: `RECON-${year}${String(month).padStart(2, '0')}-${Date.now().toString().slice(-4)}`,
            month,
            year,
            status: ReconciliationStatus.IN_PROGRESS,
            processedBy: user.id,
        });
        await batchRepo.save(batch);

        let totalExpected = 0;
        let totalActual = 0;
        const reconciliationItems: ReconciliationItem[] = [];

        // 2. Process Items
        for (const inputItem of items) {
            const member = await memberRepo.findOne({
                where: { tenantId: user.tenantId, memberNumber: inputItem.memberNumber }
            });

            const expected = Number(inputItem.expectedAmount || 0);
            const actual = Number(inputItem.actualAmount || 0);
            const variance = actual - expected;

            let matchStatus = MatchStatus.MATCHED;
            let varianceReason: VarianceReason | undefined;

            if (variance !== 0) {
                matchStatus = MatchStatus.VARIANCE;
                if (actual === 0) {
                    varianceReason = VarianceReason.INSUFFICIENT_FUNDS;
                } else if (actual < expected) {
                    varianceReason = VarianceReason.NET_PAY_TOO_LOW;
                } else {
                    varianceReason = VarianceReason.AMOUNT_MISMATCH;
                }
            }

            const reconItem = itemRepo.create({
                batchId: batch.id,
                memberId: member?.id,
                memberNumber: inputItem.memberNumber,
                nationalId: member?.nationalId,
                expectedAmount: expected,
                requestedAmount: expected,
                actualAmount: actual,
                variance,
                matchStatus,
                varianceReason,
                notes: inputItem.notes,
            });

            reconciliationItems.push(reconItem);
            totalExpected += expected;
            totalActual += actual;
        }

        await itemRepo.save(reconciliationItems);

        // 3. Update Batch Summary
        batch.totalExpected = totalExpected;
        batch.totalActual = totalActual;
        batch.totalVariance = totalActual - totalExpected;
        batch.totalRecords = reconciliationItems.length;
        batch.matchedRecords = reconciliationItems.filter(i => i.matchStatus === MatchStatus.MATCHED).length;
        batch.varianceRecords = reconciliationItems.filter(i => i.matchStatus === MatchStatus.VARIANCE).length;
        batch.unmatchedRecords = reconciliationItems.filter(i => i.matchStatus === MatchStatus.MISSING_IN_MOF || i.matchStatus === MatchStatus.ORPHAN_IN_MOF).length;
        batch.status = ReconciliationStatus.COMPLETED;
        batch.processedAt = new Date();

        await batchRepo.save(batch);

        return NextResponse.json({
            message: 'Reconciliation completed successfully',
            batchId: batch.id,
            summary: {
                totalExpected: batch.totalExpected,
                totalActual: batch.totalActual,
                totalVariance: batch.totalVariance,
                matchedPct: (batch.matchedRecords / batch.totalRecords) * 100
            }
        });
    } catch (error: any) {
        console.error('Reconciliation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
