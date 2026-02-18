import { DeductionRequest, DeductionRequestStatus } from '@/src/entities/DeductionRequest';
import { DeductionItem, ChangeReason } from '@/src/entities/DeductionItem';
import { Member, MemberStatus, EmploymentStatus } from '@/src/entities/Member';
import { MemberSavings } from '@/src/entities/MemberSavings';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { InsurancePolicy, PolicyStatus } from '@/src/entities/InsurancePolicy';
import { MerchandiseOrder, OrderStatus } from '@/src/entities/MerchandiseOrder';
import { getDb } from '@/lib/db';
import Papa from 'papaparse';

export interface DeductionBreakdown {
    memberId: string;
    memberNumber: string;
    nationalId: string;
    employeeNumber: string;
    savings: number;
    loanRepayment: number;
    insurance: number;
    merchandise: number;
    total: number;
    changeReason: ChangeReason;
    isOverLimit: boolean;
    limitNotes?: string;
}

export class DeltaDeductionEngine {
    private tenantId: string;
    private month: number;
    private year: number;

    constructor(tenantId: string, month: number, year: number) {
        this.tenantId = tenantId;
        this.month = month;
        this.year = year;
    }

    async generateDeductionRequest(): Promise<DeductionRequest> {
        const db = await getDb();
        const memberRepo = db.getRepository(Member);
        const savingsRepo = db.getRepository(MemberSavings);
        const loanRepo = db.getRepository(Loan);
        const policyRepo = db.getRepository(InsurancePolicy);
        const orderRepo = db.getRepository(MerchandiseOrder);
        const requestRepo = db.getRepository(DeductionRequest);
        const itemRepo = db.getRepository(DeductionItem);

        // Check for duplicate submission for this period
        const existingRequest = await requestRepo.findOne({
            where: {
                tenantId: this.tenantId,
                month: this.month,
                year: this.year,
                status: DeductionRequestStatus.SUBMITTED,
            },
        });

        if (existingRequest) {
            throw new Error(`Deduction request for ${this.year}-${String(this.month).padStart(2, '0')} has already been submitted`);
        }

        // Get all active members
        const members = await memberRepo.find({
            where: {
                tenantId: this.tenantId,
                status: MemberStatus.ACTIVE,
                employmentStatus: EmploymentStatus.EMPLOYED,
            },
        });

        const breakdowns: DeductionBreakdown[] = [];

        for (const member of members) {
            const breakdown = await this.calculateMemberDeduction(member);

            // Only include if there's a change from previous month
            if (breakdown.total > 0 && await this.hasChanged(member.id, breakdown.total)) {
                breakdowns.push(breakdown);
            }
        }

        // Create deduction request
        const batchNumber = `${this.tenantId.substring(0, 8)}-${this.year}${String(this.month).padStart(2, '0')}`;

        const request = requestRepo.create({
            tenantId: this.tenantId,
            batchNumber,
            month: this.month,
            year: this.year,
            totalMembers: breakdowns.length,
            totalAmount: breakdowns.reduce((sum, b) => sum + b.total, 0),
            status: DeductionRequestStatus.DRAFT,
        });

        await requestRepo.save(request);

        // Validate against regulator cap if configured
        await this.validateRegulatorCap(request.totalAmount);

        // Create deduction items with previous amounts
        const items = await Promise.all(
            breakdowns.map(async (breakdown) => {
                const previousDeduction = await this.getPreviousMonthDeduction(breakdown.memberId);
                const previousAmount = previousDeduction ? Number(previousDeduction.currentAmount) : 0;

                return itemRepo.create({
                    requestId: request.id,
                    memberId: breakdown.memberId,
                    memberNumber: breakdown.memberNumber,
                    nationalId: breakdown.nationalId,
                    employeeNumber: breakdown.employeeNumber,
                    currentAmount: breakdown.total,
                    previousAmount,
                    changeReason: breakdown.changeReason,
                    isOverLimit: breakdown.isOverLimit,
                    limitNotes: breakdown.limitNotes,
                    breakdown: {
                        savings: breakdown.savings,
                        loanRepayment: breakdown.loanRepayment,
                        insurance: breakdown.insurance,
                        merchandise: breakdown.merchandise,
                    },
                });
            })
        );

        await itemRepo.save(items);

        // Update insurance policy statuses
        try {
            const { InsuranceService } = require('@/lib/insurance-service');
            await InsuranceService.processWaitingPeriods();
            await InsuranceService.detectLapsedPolicies();
        } catch (error) {
            console.error('Failed to run insurance automation during deduction cycle:', error);
        }

        return request;
    }

    private async calculateMemberDeduction(member: Member): Promise<DeductionBreakdown> {
        const db = await getDb();
        const savingsRepo = db.getRepository(MemberSavings);
        const loanRepo = db.getRepository(Loan);
        const policyRepo = db.getRepository(InsurancePolicy);
        const orderRepo = db.getRepository(MerchandiseOrder);

        let savings = 0;
        let loanRepayment = 0;
        let insurance = 0;
        let merchandise = 0;

        // Calculate savings contributions
        const memberSavings = await savingsRepo.find({
            where: { memberId: member.id, isActive: true },
        });
        savings = memberSavings.reduce((sum: number, s: MemberSavings) => sum + Number(s.monthlyContribution), 0);

        // Calculate loan repayments
        const activeLoans = await loanRepo.find({
            where: { memberId: member.id, status: LoanStatus.ACTIVE },
        });
        loanRepayment = activeLoans.reduce((sum: number, l: Loan) => sum + Number(l.monthlyInstallment), 0);

        // Calculate insurance premiums
        const activePolicies = await policyRepo.find({
            where: { memberId: member.id, status: PolicyStatus.ACTIVE },
        });
        insurance = activePolicies.reduce((sum: number, p: InsurancePolicy) => sum + Number(p.monthlyPremium), 0);

        // Calculate merchandise installments
        const activeOrders = await orderRepo.find({
            where: { memberId: member.id, status: OrderStatus.DELIVERED },
        });
        merchandise = activeOrders.reduce((sum: number, o: MerchandiseOrder) => sum + Number(o.monthlyInstallment), 0);

        const currentTotal = savings + loanRepayment + insurance + merchandise;

        // Determine change reason based on comparison with previous month
        const changeReason = await this.determineChangeReason(
            member.id,
            currentTotal,
            { savings, loanRepayment, insurance, merchandise },
            member.status
        );

        return {
            memberId: member.id,
            memberNumber: member.memberNumber,
            nationalId: member.nationalId,
            employeeNumber: member.employeeNumber || '',
            savings,
            loanRepayment,
            insurance,
            merchandise,
            total: currentTotal,
            changeReason,
            ...(await this.checkDeductionLimit(member, currentTotal)),
        };
    }

    private async checkDeductionLimit(member: Member, tenantTotal: number): Promise<{ isOverLimit: boolean; limitNotes?: string }> {
        const db = await getDb();
        const memberRepo = db.getRepository(Member);
        const itemRepo = db.getRepository(DeductionItem);
        const requestRepo = db.getRepository(DeductionRequest);
        const tenantRepo = db.getRepository(require('@/src/entities/Tenant').Tenant);

        const tenant = await tenantRepo.findOne({ where: { id: this.tenantId } });
        const maxPct = Number(tenant?.maxDeductionPercentage || 40);
        const salary = Number(member.monthlyNetSalary || 0);

        if (salary === 0) {
            return {
                isOverLimit: tenantTotal > 0,
                limitNotes: 'Member net salary is not recorded (P0.00). Any deduction is flagged as over limit.'
            };
        }

        const maxDeduction = salary * (maxPct / 100);

        // Find this person in other tenants
        const otherMembers = await memberRepo.find({
            where: { nationalId: member.nationalId },
        });

        let otherSaccosTotal = 0;
        const otherTenantNotes: string[] = [];

        for (const otherMember of otherMembers) {
            if (otherMember.tenantId === this.tenantId) continue;

            // Get the latest deduction for this month in the other tenant
            const otherRequest = await requestRepo.findOne({
                where: {
                    tenantId: otherMember.tenantId,
                    month: this.month,
                    year: this.year,
                },
                order: { createdAt: 'DESC' }
            });

            if (otherRequest) {
                const otherItem = await itemRepo.findOne({
                    where: { requestId: otherRequest.id, memberId: otherMember.id }
                });

                if (otherItem) {
                    const amount = Number(otherItem.currentAmount);
                    otherSaccosTotal += amount;
                    if (amount > 0) {
                        const otherTenant = await tenantRepo.findOne({ where: { id: otherMember.tenantId } });
                        otherTenantNotes.push(`P${amount.toFixed(2)} at ${otherTenant?.name || 'Other SACCOS'}`);
                    }
                }
            }
        }

        const grandTotal = tenantTotal + otherSaccosTotal;
        const isOverLimit = grandTotal > maxDeduction;

        let limitNotes = `Limit: P${maxDeduction.toFixed(2)} (${maxPct}% of P${salary.toFixed(2)}). `;
        if (otherSaccosTotal > 0) {
            limitNotes += `Combined Total: P${grandTotal.toFixed(2)} (${otherTenantNotes.join(', ')}). `;
        } else {
            limitNotes += `Total: P${grandTotal.toFixed(2)}. `;
        }

        if (isOverLimit) {
            limitNotes += 'EXCEEDED.';
        } else {
            limitNotes += 'Within limit.';
        }

        return { isOverLimit, limitNotes };
    }

    private async determineChangeReason(
        memberId: string,
        currentTotal: number,
        currentBreakdown: { savings: number; loanRepayment: number; insurance: number; merchandise: number },
        memberStatus: MemberStatus
    ): Promise<ChangeReason> {
        const previousDeduction = await this.getPreviousMonthDeduction(memberId);

        // New enrollment - no previous deduction
        if (!previousDeduction) {
            return ChangeReason.NEW_ENROLLMENT;
        }

        const previousTotal = Number(previousDeduction.currentAmount || 0);
        const previousBreakdown = previousDeduction.breakdown || {};

        // Status change - member terminated or status changed
        if (memberStatus !== MemberStatus.ACTIVE) {
            return ChangeReason.STATUS_CHANGE;
        }

        // Policy maturity - deduction went to zero or significantly reduced
        if (previousTotal > 0 && currentTotal === 0) {
            return ChangeReason.POLICY_MATURITY;
        }

        // Check if specific product categories changed (could indicate maturity)
        const loanChanged = Math.abs((currentBreakdown.loanRepayment || 0) - Number(previousBreakdown.loanRepayment || 0)) > 0.01;
        const insuranceChanged = Math.abs((currentBreakdown.insurance || 0) - Number(previousBreakdown.insurance || 0)) > 0.01;

        if (loanChanged && currentBreakdown.loanRepayment === 0 && Number(previousBreakdown.loanRepayment || 0) > 0) {
            return ChangeReason.POLICY_MATURITY; // Loan paid off
        }

        if (insuranceChanged && currentBreakdown.insurance === 0 && Number(previousBreakdown.insurance || 0) > 0) {
            return ChangeReason.POLICY_MATURITY; // Insurance ended
        }

        // Manual adjustment - savings contribution changed
        const savingsChanged = Math.abs((currentBreakdown.savings || 0) - Number(previousBreakdown.savings || 0)) > 0.01;
        if (savingsChanged) {
            return ChangeReason.MANUAL_ADJUSTMENT;
        }

        // Amount change - any other change in total
        return ChangeReason.AMOUNT_CHANGE;
    }

    private async hasChanged(memberId: string, currentTotal: number): Promise<boolean> {
        const previousDeduction = await this.getPreviousMonthDeduction(memberId);

        // Include if:
        // 1. New member with deductions (no previous record)
        // 2. Amount has changed from previous month
        // 3. Previous had deductions but current is 0 (need to notify MoF to stop)
        if (!previousDeduction) {
            return currentTotal > 0;
        }

        const previousTotal = Number(previousDeduction.currentAmount || 0);
        const variance = Math.abs(currentTotal - previousTotal);

        // Consider changed if variance is more than P0.01
        return variance >= 0.01;
    }

    private async getPreviousMonthDeduction(memberId: string): Promise<DeductionItem | null> {
        const db = await getDb();
        const itemRepo = db.getRepository(DeductionItem);
        const requestRepo = db.getRepository(DeductionRequest);

        // Calculate previous month
        let prevMonth = this.month - 1;
        let prevYear = this.year;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear -= 1;
        }

        // Find previous month's request
        const prevRequest = await requestRepo.findOne({
            where: {
                tenantId: this.tenantId,
                month: prevMonth,
                year: prevYear,
                status: DeductionRequestStatus.COMPLETED,
            },
        });

        if (!prevRequest) {
            return null;
        }

        // Find member's item in previous request
        return await itemRepo.findOne({
            where: {
                requestId: prevRequest.id,
                memberId,
            },
        });
    }

    async generateCSV(requestId: string): Promise<string> {
        const db = await getDb();
        const requestRepo = db.getRepository(DeductionRequest);
        const itemRepo = db.getRepository(DeductionItem);

        const request = await requestRepo.findOne({
            where: { id: requestId },
        });

        if (!request) {
            throw new Error('Deduction request not found');
        }

        const items = await itemRepo.find({
            where: { requestId },
            relations: ['member'],
        });

        // Format for MoF CSV specification
        const csvData = items.map((item: DeductionItem) => ({
            'Employee Number': item.employeeNumber,
            'National ID': item.nationalId,
            'Member Number': item.memberNumber,
            'Full Name': item.member?.fullName || '',
            'Deduction Amount': item.currentAmount.toFixed(2),
            'Effective Month': `${this.year}-${String(this.month).padStart(2, '0')}`,
        }));

        const csv = Papa.unparse(csvData);
        return csv;
    }

    async uploadCSV(requestId: string, csvContent: string): Promise<string> {
        // Dynamic imports to avoid Firebase client SDK initialization at build time
        const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('@/lib/firebase-client');

        const fileName = `deductions/${this.tenantId}/${this.year}/${String(this.month).padStart(2, '0')}/${requestId}.csv`;
        const storageRef = ref(storage, fileName);

        // Upload CSV to Firebase Storage
        await uploadString(storageRef, csvContent, 'raw', {
            contentType: 'text/csv',
        });

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Update request with CSV URL
        const db = await getDb();
        const requestRepo = db.getRepository(DeductionRequest);
        await requestRepo.update(requestId, { csvFileUrl: downloadURL });

        return downloadURL;
    }

    async submitRequest(requestId: string, submittedBy: string): Promise<void> {
        const db = await getDb();
        const requestRepo = db.getRepository(DeductionRequest);

        const request = await requestRepo.findOne({ where: { id: requestId } });
        if (!request) {
            throw new Error('Deduction request not found');
        }

        if (request.status !== DeductionRequestStatus.DRAFT) {
            throw new Error(`Cannot submit request with status: ${request.status}`);
        }

        // Update status to submitted
        await requestRepo.update(requestId, {
            status: DeductionRequestStatus.SUBMITTED,
            submittedBy,
            submittedAt: new Date(),
        });
    }

    private async validateRegulatorCap(totalAmount: number): Promise<void> {
        const db = await getDb();
        const tenantRepo = db.getRepository(require('@/src/entities/Tenant').Tenant);

        const tenant = await tenantRepo.findOne({ where: { id: this.tenantId } });
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Check if regulator cap is configured
        const regulatorCap = tenant.regulatorDeductionCap;
        if (regulatorCap && totalAmount > regulatorCap) {
            throw new Error(
                `Total deduction amount (P${totalAmount.toFixed(2)}) exceeds regulator cap (P${regulatorCap.toFixed(2)})`
            );
        }
    }
}
