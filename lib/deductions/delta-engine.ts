import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { DeductionRequestStatus } from '@/src/entities/DeductionRequest';
import { ChangeReason } from '@/src/entities/DeductionItem';
import { MemberStatus, EmploymentStatus } from '@/src/entities/Member';
import { LoanStatus } from '@/src/entities/Loan';
import { PolicyStatus } from '@/src/entities/InsurancePolicy';
import { OrderStatus } from '@/src/entities/MerchandiseOrder';
import Papa from 'papaparse';
import { RowDataPacket } from 'mysql2/promise';

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

    async generateDeductionRequest(): Promise<any> {
        // Check for duplicate submission for this period
        const existingRequest = await queryOne<RowDataPacket & { id: string }>(
            'SELECT id FROM deduction_requests WHERE tenantId = ? AND month = ? AND year = ? AND status = ?',
            [this.tenantId, this.month, this.year, DeductionRequestStatus.SUBMITTED]
        );

        if (existingRequest) {
            throw new Error(`Deduction request for ${this.year}-${String(this.month).padStart(2, '0')} has already been submitted`);
        }

        // Get all active members
        const members = await query<RowDataPacket & {
            id: string; memberNumber: string; nationalId: string; employeeNumber: string;
            status: string; monthlyNetSalary: number;
        }>(
            'SELECT id, memberNumber, nationalId, employeeNumber, status, monthlyNetSalary FROM members WHERE tenantId = ? AND status = ? AND employmentStatus = ?',
            [this.tenantId, MemberStatus.ACTIVE, EmploymentStatus.EMPLOYED]
        );

        const breakdowns: DeductionBreakdown[] = [];

        for (const member of members) {
            const breakdown = await this.calculateMemberDeduction(member);
            if (breakdown.total > 0 && await this.hasChanged(member.id, breakdown.total)) {
                breakdowns.push(breakdown);
            }
        }

        const batchNumber = `${this.tenantId.substring(0, 8)}-${this.year}${String(this.month).padStart(2, '0')}`;
        const requestId = uuidv4();
        const totalAmount = breakdowns.reduce((sum, b) => sum + b.total, 0);

        await execute(
            `INSERT INTO deduction_requests (id, tenantId, batchNumber, month, year, totalMembers, totalAmount, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [requestId, this.tenantId, batchNumber, this.month, this.year, breakdowns.length, totalAmount, DeductionRequestStatus.DRAFT]
        );

        // Validate against regulator cap if configured
        await this.validateRegulatorCap(totalAmount);

        // Create deduction items
        for (const breakdown of breakdowns) {
            const previousDeduction = await this.getPreviousMonthDeduction(breakdown.memberId);
            const previousAmount = previousDeduction ? Number(previousDeduction.currentAmount) : 0;

            await execute(
                `INSERT INTO deduction_items 
                 (id, requestId, memberId, memberNumber, nationalId, employeeNumber, currentAmount, previousAmount,
                  changeReason, isOverLimit, limitNotes, breakdown, createdAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    uuidv4(), requestId, breakdown.memberId, breakdown.memberNumber, breakdown.nationalId,
                    breakdown.employeeNumber, breakdown.total, previousAmount, breakdown.changeReason,
                    breakdown.isOverLimit ? 1 : 0, breakdown.limitNotes || null,
                    JSON.stringify({
                        savings: breakdown.savings,
                        loanRepayment: breakdown.loanRepayment,
                        insurance: breakdown.insurance,
                        merchandise: breakdown.merchandise,
                    })
                ]
            );
        }

        // Update insurance policy statuses
        try {
            const { InsuranceService } = require('@/lib/insurance-service');
            await InsuranceService.processWaitingPeriods();
            await InsuranceService.detectLapsedPolicies();
        } catch (error) {
            console.error('Failed to run insurance automation during deduction cycle:', error);
        }

        return await queryOne('SELECT * FROM deduction_requests WHERE id = ?', [requestId]);
    }

    private async calculateMemberDeduction(member: {
        id: string; memberNumber: string; nationalId: string;
        employeeNumber: string; status: string; monthlyNetSalary: number;
    }): Promise<DeductionBreakdown> {
        const [savingsResult, loansResult, policiesResult, ordersResult] = await Promise.all([
            queryOne<RowDataPacket & { total: number }>(
                'SELECT COALESCE(SUM(monthlyContribution), 0) as total FROM member_savings WHERE memberId = ? AND isActive = true',
                [member.id]
            ),
            queryOne<RowDataPacket & { total: number }>(
                'SELECT COALESCE(SUM(monthlyInstallment), 0) as total FROM loans WHERE memberId = ? AND status = ?',
                [member.id, LoanStatus.ACTIVE]
            ),
            queryOne<RowDataPacket & { total: number }>(
                'SELECT COALESCE(SUM(monthlyPremium), 0) as total FROM insurance_policies WHERE memberId = ? AND status = ?',
                [member.id, PolicyStatus.ACTIVE]
            ),
            queryOne<RowDataPacket & { total: number }>(
                'SELECT COALESCE(SUM(monthlyInstallment), 0) as total FROM merchandise_orders WHERE memberId = ? AND status = ?',
                [member.id, OrderStatus.DELIVERED]
            ),
        ]);

        const savings = Number(savingsResult?.total || 0);
        const loanRepayment = Number(loansResult?.total || 0);
        const insurance = Number(policiesResult?.total || 0);
        const merchandise = Number(ordersResult?.total || 0);
        const currentTotal = savings + loanRepayment + insurance + merchandise;

        const changeReason = await this.determineChangeReason(
            member.id, currentTotal, { savings, loanRepayment, insurance, merchandise }, member.status as MemberStatus
        );
        const limitCheck = await this.checkDeductionLimit(member, currentTotal);

        return {
            memberId: member.id,
            memberNumber: member.memberNumber || '',
            nationalId: member.nationalId || '',
            employeeNumber: member.employeeNumber || '',
            savings, loanRepayment, insurance, merchandise,
            total: currentTotal, changeReason, ...limitCheck,
        };
    }

    private async checkDeductionLimit(
        member: { id: string; monthlyNetSalary: number; nationalId: string },
        tenantTotal: number
    ): Promise<{ isOverLimit: boolean; limitNotes?: string }> {
        const tenant = await queryOne<RowDataPacket & { maxDeductionPercentage: number }>(
            'SELECT maxDeductionPercentage FROM tenants WHERE id = ?',
            [this.tenantId]
        );

        const maxPct = Number(tenant?.maxDeductionPercentage || 40);
        const salary = Number(member.monthlyNetSalary || 0);

        if (salary === 0) {
            return { isOverLimit: tenantTotal > 0, limitNotes: 'Member net salary is not recorded (P0.00). Any deduction is flagged as over limit.' };
        }

        const maxDeduction = salary * (maxPct / 100);

        // Cross-tenant: find this member in other tenants
        const otherMembers = await query<RowDataPacket & { id: string; tenantId: string }>(
            'SELECT id, tenantId FROM members WHERE nationalId = ? AND id != ?',
            [member.nationalId, member.id]
        );

        let otherSaccosTotal = 0;
        const otherTenantNotes: string[] = [];

        for (const otherMember of otherMembers) {
            const otherRequest = await queryOne<RowDataPacket & { id: string }>(
                'SELECT id FROM deduction_requests WHERE tenantId = ? AND month = ? AND year = ? ORDER BY createdAt DESC LIMIT 1',
                [otherMember.tenantId, this.month, this.year]
            );

            if (otherRequest) {
                const otherItem = await queryOne<RowDataPacket & { currentAmount: number }>(
                    'SELECT currentAmount FROM deduction_items WHERE requestId = ? AND memberId = ?',
                    [otherRequest.id, otherMember.id]
                );

                if (otherItem) {
                    const amount = Number(otherItem.currentAmount);
                    otherSaccosTotal += amount;
                    if (amount > 0) {
                        const otherTenant = await queryOne<RowDataPacket & { name: string }>(
                            'SELECT name FROM tenants WHERE id = ?',
                            [otherMember.tenantId]
                        );
                        otherTenantNotes.push(`P${amount.toFixed(2)} at ${otherTenant?.name || 'Other SACCOS'}`);
                    }
                }
            }
        }

        const grandTotal = tenantTotal + otherSaccosTotal;
        const isOverLimit = grandTotal > maxDeduction;

        let limitNotes = `Limit: P${maxDeduction.toFixed(2)} (${maxPct}% of P${salary.toFixed(2)}). `;
        limitNotes += otherSaccosTotal > 0
            ? `Combined Total: P${grandTotal.toFixed(2)} (${otherTenantNotes.join(', ')}). `
            : `Total: P${grandTotal.toFixed(2)}. `;
        limitNotes += isOverLimit ? 'EXCEEDED.' : 'Within limit.';

        return { isOverLimit, limitNotes };
    }

    private async determineChangeReason(
        memberId: string,
        currentTotal: number,
        currentBreakdown: { savings: number; loanRepayment: number; insurance: number; merchandise: number },
        memberStatus: MemberStatus
    ): Promise<ChangeReason> {
        const previousDeduction = await this.getPreviousMonthDeduction(memberId);

        if (!previousDeduction) return ChangeReason.NEW_ENROLLMENT;

        const previousTotal = Number(previousDeduction.currentAmount || 0);
        let previousBreakdown: any = {};
        try {
            previousBreakdown = typeof previousDeduction.breakdown === 'string'
                ? JSON.parse(previousDeduction.breakdown)
                : (previousDeduction.breakdown || {});
        } catch { previousBreakdown = {}; }

        if (memberStatus !== MemberStatus.ACTIVE) return ChangeReason.STATUS_CHANGE;
        if (previousTotal > 0 && currentTotal === 0) return ChangeReason.POLICY_MATURITY;

        const loanChanged = Math.abs((currentBreakdown.loanRepayment || 0) - Number(previousBreakdown.loanRepayment || 0)) > 0.01;
        const insuranceChanged = Math.abs((currentBreakdown.insurance || 0) - Number(previousBreakdown.insurance || 0)) > 0.01;

        if (loanChanged && currentBreakdown.loanRepayment === 0 && Number(previousBreakdown.loanRepayment || 0) > 0) return ChangeReason.POLICY_MATURITY;
        if (insuranceChanged && currentBreakdown.insurance === 0 && Number(previousBreakdown.insurance || 0) > 0) return ChangeReason.POLICY_MATURITY;

        const savingsChanged = Math.abs((currentBreakdown.savings || 0) - Number(previousBreakdown.savings || 0)) > 0.01;
        if (savingsChanged) return ChangeReason.MANUAL_ADJUSTMENT;

        return ChangeReason.AMOUNT_CHANGE;
    }

    private async hasChanged(memberId: string, currentTotal: number): Promise<boolean> {
        const previousDeduction = await this.getPreviousMonthDeduction(memberId);
        if (!previousDeduction) return currentTotal > 0;
        const previousTotal = Number(previousDeduction.currentAmount || 0);
        return Math.abs(currentTotal - previousTotal) >= 0.01;
    }

    private async getPreviousMonthDeduction(memberId: string): Promise<any | null> {
        let prevMonth = this.month - 1;
        let prevYear = this.year;
        if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }

        const prevRequest = await queryOne<RowDataPacket & { id: string }>(
            'SELECT id FROM deduction_requests WHERE tenantId = ? AND month = ? AND year = ? AND status = ?',
            [this.tenantId, prevMonth, prevYear, DeductionRequestStatus.COMPLETED]
        );

        if (!prevRequest) return null;

        return await queryOne(
            'SELECT * FROM deduction_items WHERE requestId = ? AND memberId = ?',
            [prevRequest.id, memberId]
        );
    }

    async generateCSV(requestId: string): Promise<string> {
        const request = await queryOne<RowDataPacket & { id: string }>(
            'SELECT id FROM deduction_requests WHERE id = ?',
            [requestId]
        );
        if (!request) throw new Error('Deduction request not found');

        const items = await query<RowDataPacket & {
            employeeNumber: string; nationalId: string; memberNumber: string;
            currentAmount: number; memberFullName: string;
        }>(
            `SELECT di.employeeNumber, di.nationalId, di.memberNumber, di.currentAmount, m.fullName as memberFullName
             FROM deduction_items di
             LEFT JOIN members m ON di.memberId = m.id
             WHERE di.requestId = ?`,
            [requestId]
        );

        const csvData = items.map(item => ({
            'Employee Number': item.employeeNumber,
            'National ID': item.nationalId,
            'Member Number': item.memberNumber,
            'Full Name': item.memberFullName || '',
            'Deduction Amount': Number(item.currentAmount).toFixed(2),
            'Effective Month': `${this.year}-${String(this.month).padStart(2, '0')}`,
        }));

        return Papa.unparse(csvData);
    }

    async uploadCSV(requestId: string, csvContent: string): Promise<string> {
        const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('@/lib/firebase-client');

        const fileName = `deductions/${this.tenantId}/${this.year}/${String(this.month).padStart(2, '0')}/${requestId}.csv`;
        const storageRef = ref(storage, fileName);
        await uploadString(storageRef, csvContent, 'raw', { contentType: 'text/csv' });
        const downloadURL = await getDownloadURL(storageRef);

        await execute('UPDATE deduction_requests SET csvFileUrl = ? WHERE id = ?', [downloadURL, requestId]);

        return downloadURL;
    }

    async submitRequest(requestId: string, submittedBy: string): Promise<void> {
        const request = await queryOne<RowDataPacket & { id: string; status: string }>(
            'SELECT id, status FROM deduction_requests WHERE id = ?',
            [requestId]
        );
        if (!request) throw new Error('Deduction request not found');
        if (request.status !== DeductionRequestStatus.DRAFT) {
            throw new Error(`Cannot submit request with status: ${request.status}`);
        }

        await execute(
            'UPDATE deduction_requests SET status = ?, submittedBy = ?, submittedAt = NOW(), updatedAt = NOW() WHERE id = ?',
            [DeductionRequestStatus.SUBMITTED, submittedBy, requestId]
        );
    }

    private async validateRegulatorCap(totalAmount: number): Promise<void> {
        const tenant = await queryOne<RowDataPacket & { regulatorDeductionCap: number | null; name: string }>(
            'SELECT regulatorDeductionCap FROM tenants WHERE id = ?',
            [this.tenantId]
        );
        if (!tenant) throw new Error('Tenant not found');

        if (tenant.regulatorDeductionCap && totalAmount > Number(tenant.regulatorDeductionCap)) {
            throw new Error(
                `Total deduction amount (P${totalAmount.toFixed(2)}) exceeds regulator cap (P${Number(tenant.regulatorDeductionCap).toFixed(2)})`
            );
        }
    }
}
