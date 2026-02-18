import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, notes } = body;

        if (!applicationId || !notes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const application = await SocietyApplicationService.submitAppeal(applicationId, user.id, notes);

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Error submitting appeal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
