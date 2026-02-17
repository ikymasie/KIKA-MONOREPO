import { getDb } from '@/lib/db';
import { InsurancePolicy, PolicyStatus } from '@/src/entities/InsurancePolicy';
import { LessThan, In } from 'typeorm';

export class InsuranceService {
    /**
     * Transitions policies from WAITING_PERIOD to ACTIVE if the waiting period has ended.
     */
    static async processWaitingPeriods() {
        const db = await getDb();
        const policyRepo = db.getRepository(InsurancePolicy);

        const now = new Date();
        const policiesToActivate = await policyRepo.find({
            where: {
                status: PolicyStatus.WAITING_PERIOD,
                waitingPeriodEndDate: LessThan(now)
            }
        });

        if (policiesToActivate.length > 0) {
            for (const policy of policiesToActivate) {
                policy.status = PolicyStatus.ACTIVE;
            }
            await policyRepo.save(policiesToActivate);
            console.log(`Activated ${policiesToActivate.length} insurance policies.`);
        }
    }

    /**
     * Checks for policies that should lapse due to non-payment.
     * Rule: If monthsPaid is less than the number of months since startDate (minus some grace), mark as LAPSED.
     * This is typically triggered after a deduction cycle.
     */
    static async detectLapsedPolicies() {
        const db = await getDb();
        const policyRepo = db.getRepository(InsurancePolicy);

        const activePolicies = await policyRepo.find({
            where: { status: In([PolicyStatus.ACTIVE, PolicyStatus.WAITING_PERIOD]) }
        });

        const now = new Date();
        const lapsedPolicies: InsurancePolicy[] = [];

        for (const policy of activePolicies) {
            const startDate = new Date(policy.startDate);
            const monthsSinceStart = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

            // Allow 2 months grace period
            if (monthsSinceStart > policy.monthsPaid + 2) {
                policy.status = PolicyStatus.LAPSED;
                lapsedPolicies.push(policy);
            }
        }

        if (lapsedPolicies.length > 0) {
            await policyRepo.save(lapsedPolicies);
            console.log(`Marked ${lapsedPolicies.length} policies as LAPSED due to non-payment.`);
        }
    }
}
