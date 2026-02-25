import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const { RegistrationService } = await import("@/src/services/RegistrationService");
        const { UserRole } = await import("@/src/entities/User");

        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Allow director and minister delegate roles
        if (
            user.role !== UserRole.DIRECTOR_COOPERATIVES &&
            user.role !== UserRole.MINISTER_DELEGATE &&
            user.role !== UserRole.DCD_DIRECTOR
        ) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // Fetch all data in parallel
        const [registry, pendingAppeals, pendingDecisions] = await Promise.all([
            RegistrationService.getOfficialRegistry().catch(() => []),
            RegistrationService.getPendingAppeals().catch(() => []),
            RegistrationService.getPendingDecisions().catch(() => []),
        ]);

        const totalRegistered = Array.isArray(registry) ? registry.length : 0;
        const pendingAppealsCount = Array.isArray(pendingAppeals) ? pendingAppeals.length : 0;
        const pendingApprovalsCount = Array.isArray(pendingDecisions) ? pendingDecisions.length : 0;

        return NextResponse.json({
            totalRegistered,
            pendingAppeals: pendingAppealsCount,
            pendingApprovals: pendingApprovalsCount,
        });
    } catch (error: any) {
        console.error('[REGISTRATION_STATS_GET]', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
