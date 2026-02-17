import { ReconciliationBatch, ReconciliationStatus } from '@/src/entities/ReconciliationBatch';
import { ReconciliationItem, MatchStatus, VarianceReason } from '@/src/entities/ReconciliationItem';
import { DeductionRequest } from '@/src/entities/DeductionRequest';
import { DeductionItem } from '@/src/entities/DeductionItem';
import { Member } from '@/src/entities/Member';
import { Transaction, TransactionType, TransactionStatus } from '@/src/entities/Transaction';
import { getDb } from '@/lib/db';
import Papa from 'papaparse';
import { SuspenseAccount, SuspenseStatus } from '@/src/entities/SuspenseAccount';

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

    async reconcile(mofCsvContent: string, deductionRequestId: string): Promise<ReconciliationBatch> {
        const db = await getDb();
        const batchRepo = db.getRepository(ReconciliationBatch);
        const itemRepo = db.getRepository(ReconciliationItem);
        const memberRepo = db.getRepository(Member);
        const deductionItemRepo = db.getRepository(DeductionItem);

        // Parse MoF CSV
        const mofRecords = this.parseMoFCSV(mofCsvContent);

        // Get deduction request items
        const deductionItems = await deductionItemRepo.find({
            where: { requestId: deductionRequestId },
            relations: ['member'],
        });

        // Create reconciliation batch
        const batchNumber = `REC-${this.tenantId.substring(0, 8)}-${this.year}${String(this.month).padStart(2, '0')}`;

        const batch = batchRepo.create({
            tenantId: this.tenantId,
            batchNumber,
            month: this.month,
            year: this.year,
            totalRecords: mofRecords.length,
            status: ReconciliationStatus.IN_PROGRESS,
        });

        await batchRepo.save(batch);

        // Perform three-way matching
        const reconciliationItems: ReconciliationItem[] = [];
        let matchedCount = 0;
        let unmatchedCount = 0;
        let varianceCount = 0;
        let totalExpected = 0;
        let totalActual = 0;

        // Match MoF records with deduction items
        for (const mofRecord of mofRecords) {
            const deductionItem = deductionItems.find(
                (item) =>
                    item.employeeNumber === mofRecord.employeeNumber ||
                    item.nationalId === mofRecord.nationalId
            );

            const member = deductionItem?.member || await memberRepo.findOne({
                where: [
                    { nationalId: mofRecord.nationalId },
                    { employeeNumber: mofRecord.employeeNumber },
                ],
            });

            const expectedAmount = deductionItem?.currentAmount || 0;
            const requestedAmount = deductionItem?.currentAmount || 0;
            const actualAmount = mofRecord.deductedAmount;
            const variance = expectedAmount - actualAmount;

            let matchStatus: MatchStatus;
            let varianceReason: VarianceReason | undefined;

            if (!deductionItem) {
                matchStatus = MatchStatus.ORPHAN_IN_MOF;
                unmatchedCount++;

                // Create suspense account entry for orphan deduction
                await this.createSuspenseEntry(batch.id, mofRecord, member);
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

            const item = itemRepo.create({
                batchId: batch.id,
                memberId: member?.id,
                memberNumber: mofRecord.memberNumber,
                nationalId: mofRecord.nationalId,
                employeeNumber: mofRecord.employeeNumber,
                expectedAmount,
                requestedAmount,
                actualAmount,
                variance,
                matchStatus,
                varianceReason,
                requiresManualReview: matchStatus !== MatchStatus.MATCHED,
            });

            reconciliationItems.push(item);
        }

        // Check for missing records (in deduction but not in MoF)
        for (const deductionItem of deductionItems) {
            const foundInMoF = mofRecords.some(
                (r) =>
                    r.employeeNumber === deductionItem.employeeNumber ||
                    r.nationalId === deductionItem.nationalId
            );

            if (!foundInMoF) {
                unmatchedCount++;
                totalExpected += deductionItem.currentAmount;

                const item = itemRepo.create({
                    batchId: batch.id,
                    memberId: deductionItem.memberId,
                    memberNumber: deductionItem.memberNumber,
                    nationalId: deductionItem.nationalId,
                    employeeNumber: deductionItem.employeeNumber,
                    expectedAmount: deductionItem.currentAmount,
                    requestedAmount: deductionItem.currentAmount,
                    actualAmount: 0,
                    variance: deductionItem.currentAmount,
                    matchStatus: MatchStatus.MISSING_IN_MOF,
                    varianceReason: VarianceReason.MEMBER_TERMINATED,
                    requiresManualReview: true,
                });

                reconciliationItems.push(item);
            }
        }

        await itemRepo.save(reconciliationItems);

        // Update batch totals
        batch.matchedRecords = matchedCount;
        batch.unmatchedRecords = unmatchedCount;
        batch.varianceRecords = varianceCount;
        batch.totalExpected = totalExpected;
        batch.totalActual = totalActual;
        batch.totalVariance = totalExpected - totalActual;
        batch.status = ReconciliationStatus.COMPLETED;

        await batchRepo.save(batch);

        return batch;
    }

    private parseMoFCSV(csvContent: string): MoFRecord[] {
        const parsed = Papa.parse<any>(csvContent, {
            header: true,
            skipEmptyLines: true,
        });

        return parsed.data.map((row) => ({
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
            if (record.reason.includes('insufficient')) {
                return VarianceReason.INSUFFICIENT_FUNDS;
            }
            if (record.reason.includes('terminated')) {
                return VarianceReason.MEMBER_TERMINATED;
            }
            if (record.reason.includes('net pay')) {
                return VarianceReason.NET_PAY_TOO_LOW;
            }
        }
        return VarianceReason.OTHER;
    }

    async postJournals(batchId: string): Promise<void> {
        const db = await getDb();
        const itemRepo = db.getRepository(ReconciliationItem);
        const transactionRepo = db.getRepository(Transaction);
        const savingsRepo = db.getRepository(require('@/src/entities/MemberSavings').MemberSavings);
        const loanRepo = db.getRepository(require('@/src/entities/Loan').Loan);
        const policyRepo = db.getRepository(require('@/src/entities/InsurancePolicy').InsurancePolicy);
        const batchRepo = db.getRepository(ReconciliationBatch);
        const deductionItemRepo = db.getRepository(DeductionItem);

        const items = await itemRepo.find({
            where: { batchId, matchStatus: MatchStatus.MATCHED, journalPosted: false },
            relations: ['member'],
        });

        if (items.length === 0) {
            return;
        }

        // Get the reconciliation batch to find the linked deduction request
        const batch = await batchRepo.findOne({
            where: { id: batchId },
            relations: ['deductionRequest'],
        });

        if (!batch) {
            throw new Error('Reconciliation batch not found');
        }

        for (const item of items) {
            if (!item.member) continue;

            // Find the corresponding deduction item to get the breakdown
            const deductionItem = batch?.deductionRequest
                ? await deductionItemRepo.findOne({
                    where: {
                        requestId: batch.deductionRequest.id,
                        memberId: item.memberId,
                    },
                })
                : null;

            const breakdown = deductionItem?.breakdown || {};
            const actualAmount = Number(item.actualAmount);

            // Create main transaction record
            const transaction = transactionRepo.create({
                transactionNumber: `DED-${item.memberNumber}-${batch.year}${String(batch.month).padStart(2, '0')}`,
                transactionType: TransactionType.DEDUCTION,
                amount: actualAmount,
                transactionDate: new Date(),
                description: `Payroll deduction for ${batch.year}-${String(batch.month).padStart(2, '0')}`,
                memberId: item.memberId,
                tenantId: batch.tenantId,
                status: TransactionStatus.COMPLETED,
            });

            await transactionRepo.save(transaction);

            // Update member savings balances
            if (breakdown.savings && Number(breakdown.savings) > 0) {
                const memberSavings = await savingsRepo.find({
                    where: { memberId: item.memberId, isActive: true },
                });

                for (const savings of memberSavings) {
                    const contribution = Number(savings.monthlyContribution);
                    if (contribution > 0) {
                        const newBalance = Number(savings.currentBalance || 0) + contribution;
                        await savingsRepo.update(savings.id, {
                            currentBalance: newBalance,
                            lastContributionDate: new Date(),
                        });
                    }
                }
            }

            // Update loan balances
            if (breakdown.loanRepayment && Number(breakdown.loanRepayment) > 0) {
                const activeLoans = await loanRepo.find({
                    where: { memberId: item.memberId, status: require('@/src/entities/Loan').LoanStatus.ACTIVE },
                });

                for (const loan of activeLoans) {
                    const installment = Number(loan.monthlyInstallment);
                    if (installment > 0) {
                        const newBalance = Number(loan.outstandingBalance) - installment;
                        const newPaidAmount = Number(loan.paidAmount || 0) + installment;

                        await loanRepo.update(loan.id, {
                            outstandingBalance: Math.max(0, newBalance),
                            paidAmount: newPaidAmount,
                            lastPaymentDate: new Date(),
                        });

                        // Check if loan is fully paid
                        if (newBalance <= 0.01) {
                            await loanRepo.update(loan.id, {
                                status: require('@/src/entities/Loan').LoanStatus.CLOSED,
                                closedDate: new Date(),
                            });
                        }
                    }
                }
            }

            // Update insurance policy premiums
            if (breakdown.insurance && Number(breakdown.insurance) > 0) {
                const activePolicies = await policyRepo.find({
                    where: { memberId: item.memberId, status: require('@/src/entities/InsurancePolicy').PolicyStatus.ACTIVE },
                });

                for (const policy of activePolicies) {
                    const premium = Number(policy.monthlyPremium);
                    if (premium > 0) {
                        const newPaidPremiums = Number(policy.paidPremiums || 0) + premium;
                        await policyRepo.update(policy.id, {
                            paidPremiums: newPaidPremiums,
                            lastPremiumDate: new Date(),
                        });
                    }
                }
            }

            // Mark as posted
            item.journalPosted = true;
            await itemRepo.save(item);
        }

        // Mark batch as journals posted
        await batchRepo.update(batchId, { journalsPosted: true });
    }

    private async createSuspenseEntry(
        batchId: string,
        mofRecord: MoFRecord,
        member: Member | null
    ): Promise<void> {
        const db = await getDb();
        const suspenseRepo = db.getRepository(SuspenseAccount);
        const batchRepo = db.getRepository(ReconciliationBatch);

        const batch = await batchRepo.findOne({ where: { id: batchId } });
        if (!batch) return;

        const referenceNumber = `SUSP-${batch.year}${String(batch.month).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

        const suspenseEntry = suspenseRepo.create({
            tenantId: this.tenantId,
            referenceNumber,
            reconciliationBatchId: batchId,
            memberNumber: mofRecord.memberNumber,
            nationalId: mofRecord.nationalId,
            employeeNumber: mofRecord.employeeNumber,
            amount: mofRecord.deductedAmount,
            month: this.month,
            year: this.year,
            status: SuspenseStatus.PENDING,
            reason: 'Orphan deduction - found in MoF file but not in deduction request',
            daysInSuspense: 0,
        });

        await suspenseRepo.save(suspenseEntry);
    }
}
