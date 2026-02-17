import { NextRequest, NextResponse } from 'next/server';
import { SocietyApplicationService } from '@/src/services/SocietyApplicationService';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We use the application repository to find all applications by applicantUserId
        // Since we don't have a dedicated "list" method in the service yet that takes a userId
        // we can implement it here or add it to the service. 
        // Let's use the service pattern if possible, or just use the repo if it's simpler.

        // Let's add a method to SocietyApplicationService for this.
        const apps = await SocietyApplicationService.getApplicantApplications(user.id);

        return NextResponse.json(apps);
    } catch (error: any) {
        console.error('Error listing applications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
