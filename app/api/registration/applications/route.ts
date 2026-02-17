import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { SocietyApplicationService } from '@/src/services/SocietyApplicationService';
import { ApplicationStatus, ApplicationType } from '@/src/entities/SocietyApplication';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || (!user.isGovernmentOfficer() && !user.isRegulator())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as ApplicationStatus || undefined;
        const type = searchParams.get('type') as ApplicationType || undefined;
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
