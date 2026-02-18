import { NextRequest, NextResponse } from 'next/server';
import type { RiskLevel as RiskLevelType } from '@/src/entities/SecurityScreening';

/**
 * POST: Submit final security clearance decision
 */

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { RiskLevel } = await import('@/src/entities/SecurityScreening');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.INTELLIGENCE_LIAISON) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, isCleared, notes, riskLevel } = body;

        if (!applicationId || typeof isCleared !== 'boolean') {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const application = await SocietyApplicationService.submitSecurityClearance(
            applicationId,
            user.id,
            isCleared,
            notes,
            riskLevel as RiskLevelType || RiskLevel.LOW
        );

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Security approval error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
