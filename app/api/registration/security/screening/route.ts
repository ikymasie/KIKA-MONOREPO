import { NextRequest, NextResponse } from 'next/server';
import type { RiskFlagType as RiskFlagTypeType } from '@/src/entities/RiskFlag';

/**
 * GET: Fetch screening data for an application
 * POST: Create or update screening data (background checks, risk flags)
 */

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { RiskFlagType } = await import('@/src/entities/RiskFlag');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.INTELLIGENCE_LIAISON) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');

        if (!applicationId) {
            return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
        }

        const screening = await SocietyApplicationService.getSecurityScreening(applicationId);
        return NextResponse.json(screening);
    } catch (error: any) {
        console.error('Fetch screening error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const { RiskFlagType } = await import('@/src/entities/RiskFlag');
        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.INTELLIGENCE_LIAISON) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { screeningId, type, description, action } = body;

        if (action === 'add-risk-flag') {
            if (!screeningId || !type || !description) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }
            const flag = await SocietyApplicationService.addRiskFlag(screeningId, {
                type: type as RiskFlagTypeType,
                description
            });
            return NextResponse.json(flag);
        }

        if (action === 'resolve-risk-flag') {
            const { flagId } = body;
            if (!flagId) {
                return NextResponse.json({ error: 'flagId is required' }, { status: 400 });
            }
            const flag = await SocietyApplicationService.resolveRiskFlag(flagId, user.id);
            return NextResponse.json(flag);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Risk flag action error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
