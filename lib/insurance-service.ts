import { query, execute } from '@/src/db/query';
import { PolicyStatus } from '@/src/entities/InsurancePolicy';
import { RowDataPacket } from 'mysql2/promise';

export class InsuranceService {
    /**
     * Transitions policies from WAITING_PERIOD to ACTIVE if the waiting period has ended.
     */
    static async processWaitingPeriods() {
        try {
            const policiesToActivate = await query<RowDataPacket & { id: string }>(
                `SELECT id FROM insurance_policies 
                 WHERE status = ? AND waitingPeriodEndDate < NOW()`,
                [PolicyStatus.WAITING_PERIOD]
            );

            if (policiesToActivate.length > 0) {
                const ids = policiesToActivate.map(p => p.id);
                await execute(
                    `UPDATE insurance_policies SET status = ?, updatedAt = NOW() WHERE id IN (?)`,
                    [PolicyStatus.ACTIVE, ids]
                );
                console.log(`Activated ${policiesToActivate.length} insurance policies.`);
            }
        } catch (error) {
            console.error('[Insurance Service] Error processing waiting periods:', error);
        }
    }

    /**
     * Checks for policies that should lapse due to non-payment.
     * Rule: If monthsPaid is less than the number of months since startDate (minus some grace), mark as LAPSED.
     * This is typically triggered after a deduction cycle.
     */
    static async detectLapsedPolicies() {
        try {
            const activePolicies = await query<RowDataPacket & { id: string, startDate: Date, monthsPaid: number }>(
                `SELECT id, startDate, monthsPaid FROM insurance_policies 
                 WHERE status IN (?, ?)`,
                [PolicyStatus.ACTIVE, PolicyStatus.WAITING_PERIOD]
            );

            const now = new Date();
            const lapsedIds: string[] = [];

            for (const policy of activePolicies) {
                const startDate = new Date(policy.startDate);
                const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

                // Allow 2 months grace period
                if (monthsSinceStart > (policy.monthsPaid || 0) + 2) {
                    lapsedIds.push(policy.id);
                }
            }

            if (lapsedIds.length > 0) {
                await execute(
                    `UPDATE insurance_policies SET status = ?, updatedAt = NOW() WHERE id IN (?)`,
                    [PolicyStatus.LAPSED, lapsedIds]
                );
                console.log(`Marked ${lapsedIds.length} policies as LAPSED due to non-payment.`);
            }
        } catch (error) {
            console.error('[Insurance Service] Error detecting lapsed policies:', error);
        }
    }
}
