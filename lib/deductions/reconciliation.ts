import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { ReconciliationStatus } from '@/src/enums/ReconciliationStatus';
import { MatchStatus, VarianceReason } from '@/src/entities/ReconciliationItem';
import { TransactionType, TransactionStatus } from '@/src/entities/Transaction';
import { SuspenseStatus } from '@/src/entities/SuspenseAccount';
import Papa from 'papaparse';
import { RowDataPacket } from 'mysql2/promise';

export interface MoFRecord {
    employeeNumber: string;
    nationalId: string;
    memberNumber: string;
    deductedAmount: number;
    status: string;
    reason?: string;
}

export class ReconciliationEngine {
    private tenantId: string;
    private month: number;
    private year: number;

    constructor(tenantId: string, month: number, year: number) {
        this.tenantId = tenantId;
        this.month = month;
        this.year = year;
    }

    async reconcile(mofCsvContent: string, deductionRequestId: string): Promise<any> {
        const mofRecords = this.parseMoFCSV(mofCsvContent);

        const deductionItems = await query<RowDataPacket & {
            id: string; memberId: string; memberNumber: string; nationalId: string;
            employeeNumber: string; currentAmount: number;
        }>(
            'SELECT id, memberId, memberNumber, nationalId, employeeNumber, currentAmount FROM deduction_items WHERE requestId = ?',
            [deductionRequestId]
        );

        const batchNumber = `REC-${this.tenantId.substring(0, 8)}-${this.year}${String(this.month).padStart(2, '0')}`;
        const batchId = uuidv4();

        await execute(
            `INSERT INTO reconciliation_batches 
             (id, tenantId, batchNumber, month, year, totalRecords, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [batchId, this.tenantId, batchNumber, this.month, this.year, mofRecords.length, ReconciliationStatus.IN_PROGRESS]
        );

        let matchedCount = 0, unmatchedCount = 0, varianceCount = 0;
        let totalExpected = 0, totalActual = 0;

        for (const mofRecord of mofRecords) {
            const deductionItem = deductionItems.find(
                item => item.employeeNumber === mofRecord.employeeNumber || item.nationalId === mofRecord.nationalId
            );

            let memberId: string | null = null;
            if (deductionItem) {
                memberId = deductionItem.memberId;
            } else {
                const member = await queryOne<RowDataPacket & { id: string }>(
                    'SELECT id FROM members WHERE nationalId = ? OR employeeNumber = ? LIMIT 1',
                    [mofRecord.nationalId, mofRecord.employeeNumber]
                );
                memberId = member?.id || null;
            }

            const expectedAmount = deductionItem?.currentAmount || 0;
            const actualAmount = mofRecord.deductedAmount;
            const variance = expectedAmount - actualAmount;

            let matchStatus: MatchStatus;
            let varianceReason: VarianceReason | undefined;

            if (!deductionItem) {
                matchStatus = MatchStatus.ORPHAN_IN_MOF;
                unmatchedCount++;
                await this.createSuspenseEntry(batchId, mofRecord, memberId);
            } else if (Math.abs(variance) < 0.01) {
                matchStatus = MatchStatus.MATCHED;
                matchedCount++;
            } else {
                matchStatus = MatchStatus.VARIANCE;
                varianceCount++;
                varianceReason = this.determineVarianceReason(mofRecord);
            }

            totalExpected += expectedAmount;
            totalActual += actualAmount;

            await execute(
                `INSERT INTO reconciliation_items 
                 (id, batchId, memberId, memberNumber, nationalId, employeeNumber, expectedAmount, 
                  requestedAmount, actualAmount, variance, matchStatus, varianceReason, requiresManualReview, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    uuidv4(), batchId, memberId, mofRecord.memberNumber, mofRecord.nationalId,
                    mofRecord.employeeNumber, expectedAmount, expectedAmount, actualAmount, variance,
                    matchStatus, varianceReason || null, matchStatus !== MatchStatus.MATCHED ? 1 : 0
                ]
            );
        }

        // Check for missing records (in deduction but not in MoF)
        for (const deductionItem of deductionItems) {
            const foundInMoF = mofRecords.some(
                r => r.employeeNumber === deductionItem.employeeNumber || r.nationalId === deductionItem.nationalId
            );

            if (!foundInMoF) {
                unmatchedCount++;
                totalExpected += deductionItem.currentAmount;

                await execute(
                    `INSERT INTO reconciliation_items 
                     (id, batchId, memberId, memberNumber, nationalId, employeeNumber, expectedAmount,
                      requestedAmount, actualAmount, variance, matchStatus, varianceReason, requiresManualReview, createdAt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1, NOW())`,
                    [
                        uuidv4(), batchId, deductionItem.memberId, deductionItem.memberNumber,
                        deductionItem.nationalId, deductionItem.employeeNumber, deductionItem.currentAmount,
                        deductionItem.currentAmount, deductionItem.currentAmount,
                        MatchStatus.MISSING_IN_MOF, VarianceReason.MEMBER_TERMINATED
                    ]
                );
            }
        }

        // Update batch totals
        await execute(
            `UPDATE reconciliation_batches 
             SET matchedRecords = ?, unmatchedRecords = ?, varianceRecords = ?,
                 totalExpected = ?, totalActual = ?, totalVariance = ?, status = ?, updatedAt = NOW()
             WHERE id = ?`,
            [matchedCount, unmatchedCount, varianceCount, totalExpected, totalActual,
                totalExpected - totalActual, ReconciliationStatus.COMPLETED, batchId]
        );

        return await queryOne('SELECT * FROM reconciliation_batches WHERE id = ?', [batchId]);
    }

    private parseMoFCSV(csvContent: string): MoFRecord[] {
        const parsed = Papa.parse<any>(csvContent, { header: true, skipEmptyLines: true });
        return parsed.data.map(row => ({
            employeeNumber: row['Employee Number'] || '',
            nationalId: row['National ID'] || '',
            memberNumber: row['Member Number'] || '',
            deductedAmount: parseFloat(row['Deducted Amount'] || '0'),
            status: row['Status'] || 'success',
            reason: row['Reason'],
        }));
    }

    private determineVarianceReason(record: MoFRecord): VarianceReason {
        if (record.status === 'failed' && record.reason) {
            if (record.reason.includes('insufficient')) return VarianceReason.INSUFFICIENT_FUNDS;
            if (record.reason.includes('terminated')) return VarianceReason.MEMBER_TERMINATED;
            if (record.reason.includes('net pay')) return VarianceReason.NET_PAY_TOO_LOW;
        }
        return VarianceReason.OTHER;
    }

    async postJournals(batchId: string): Promise<void> {
        const batch = await queryOne<RowDataPacket & {
            id: string; tenantId: string; month: number; year: number; deductionRequestId: string;
        }>(
            'SELECT id, tenantId, month, year, deductionRequestId FROM reconciliation_batches WHERE id = ?',
            [batchId]
        );

        if (!batch) throw new Error('Reconciliation batch not found');

        const items = await query<RowDataPacket & {
            id: string; memberId: string; memberNumber: string; actualAmount: number;
        }>(
            'SELECT id, memberId, memberNumber, actualAmount FROM reconciliation_items WHERE batchId = ? AND matchStatus = ? AND journalPosted = false',
            [batchId, MatchStatus.MATCHED]
        );

        if (items.length === 0) return;

        for (const item of items) {
            const actualAmount = Number(item.actualAmount);

            // Get breakdown from deduction item
            let breakdown: any = {};
            if (batch.deductionRequestId) {
                const deductionItem = await queryOne<RowDataPacket & { breakdown: any }>(
                    'SELECT breakdown FROM deduction_items WHERE requestId = ? AND memberId = ?',
                    [batch.deductionRequestId, item.memberId]
                );
                if (deductionItem?.breakdown) {
                    try {
                        breakdown = typeof deductionItem.breakdown === 'string'
                            ? JSON.parse(deductionItem.breakdown)
                            : deductionItem.breakdown;
                    } catch { breakdown = {}; }
                }
            }

            // Create main transaction record
            const txId = uuidv4();
            await execute(
                `INSERT INTO transactions 
                 (id, transactionNumber, transactionType, amount, transactionDate, description, memberId, tenantId, status, createdAt)
                 VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, NOW())`,
                [
                    txId, `DED-${item.memberNumber}-${batch.year}${String(batch.month).padStart(2, '0')}`,
                    TransactionType.DEDUCTION, actualAmount,
                    `Payroll deduction for ${batch.year}-${String(batch.month).padStart(2, '0')}`,
                    item.memberId, batch.tenantId, TransactionStatus.COMPLETED
                ]
            );

            // Update member savings
            if (breakdown.savings && Number(breakdown.savings) > 0) {
                await execute(
                    `UPDATE member_savings 
                     SET currentBalance = currentBalance + monthlyContribution, lastContributionDate = NOW()
                     WHERE memberId = ? AND isActive = true AND monthlyContribution > 0`,
                    [item.memberId]
                );
            }

            // Update loan balances
            if (breakdown.loanRepayment && Number(breakdown.loanRepayment) > 0) {
                const activeLoans = await query<RowDataPacket & { id: string; monthlyInstallment: number; outstandingBalance: number }>(
                    "SELECT id, monthlyInstallment, outstandingBalance FROM loans WHERE memberId = ? AND status = 'active' AND monthlyInstallment > 0",
                    [item.memberId]
                );
                for (const loan of activeLoans) {
                    const newBalance = Number(loan.outstandingBalance) - Number(loan.monthlyInstallment);
                    await execute(
                        'UPDATE loans SET outstandingBalance = ?, paidAmount = paidAmount + ?, lastPaymentDate = NOW() WHERE id = ?',
                        [Math.max(0, newBalance), Number(loan.monthlyInstallment), loan.id]
                    );
                    if (newBalance <= 0.01) {
                        await execute("UPDATE loans SET status = 'closed', closedDate = NOW() WHERE id = ?", [loan.id]);
                    }
                }
            }

            // Update insurance policy premiums
            if (breakdown.insurance && Number(breakdown.insurance) > 0) {
                await execute(
                    "UPDATE insurance_policies SET paidPremiums = paidPremiums + monthlyPremium, lastPremiumDate = NOW() WHERE memberId = ? AND status = 'active' AND monthlyPremium > 0",
                    [item.memberId]
                );
            }

            // Mark item as posted
            await execute('UPDATE reconciliation_items SET journalPosted = true WHERE id = ?', [item.id]);
        }

        // Mark batch as journals posted
        await execute('UPDATE reconciliation_batches SET journalsPosted = true WHERE id = ?', [batchId]);
    }

    private async createSuspenseEntry(
        batchId: string,
        mofRecord: MoFRecord,
        memberId: string | null
    ): Promise<void> {
        const batch = await queryOne<RowDataPacket & { year: number; month: number }>(
            'SELECT year, month FROM reconciliation_batches WHERE id = ?',
            [batchId]
        );
        if (!batch) return;

        const referenceNumber = `SUSP-${batch.year}${String(batch.month).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

        await execute(
            `INSERT INTO suspense_accounts 
             (id, tenantId, referenceNumber, reconciliationBatchId, memberNumber, nationalId, employeeNumber,
              amount, month, year, status, reason, daysInSuspense, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
            [
                uuidv4(), this.tenantId, referenceNumber, batchId,
                mofRecord.memberNumber, mofRecord.nationalId, mofRecord.employeeNumber,
                mofRecord.deductedAmount, this.month, this.year,
                SuspenseStatus.PENDING, 'Orphan deduction - found in MoF file but not in deduction request'
            ]
        );
    }
}
