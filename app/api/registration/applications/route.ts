import { NextRequest, NextResponse } from 'next/server';
import type { ApplicationStatus as ApplicationStatusType, ApplicationType as ApplicationTypeType } from '@/src/entities/SocietyApplication';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const { ApplicationStatus, ApplicationType } = await import('@/src/entities/SocietyApplication');


        const user = await getUserFromRequest(request);
        if (!user || (!user.isGovernmentOfficer() && !user.isRegulator())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as ApplicationStatusType || undefined;
        const type = searchParams.get('type') as ApplicationTypeType || undefined;
        const search = searchParams.get('search') || undefined;

        const applications = await SocietyApplicationService.getApplicationsForRegistry({
            status,
            type,
            search
        });

        return NextResponse.json(applications);
    } catch (error: any) {
        console.error('Error fetching registry applications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
