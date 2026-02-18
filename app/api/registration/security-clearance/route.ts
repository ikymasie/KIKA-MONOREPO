import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.INTELLIGENCE_LIAISON) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, isCleared, notes } = body;

        if (!applicationId || typeof isCleared !== 'boolean') {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const application = await SocietyApplicationService.submitSecurityClearance(
            applicationId,
            user.id,
            isCleared,
            notes
        );

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Security clearance error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
