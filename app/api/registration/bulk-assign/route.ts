import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { SocietyApplicationService } from '@/src/services/SocietyApplicationService';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || (!user.isGovernmentOfficer() && !user.isRegulator())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationIds, officerId, role, notes } = body;

        if (!applicationIds || !Array.isArray(applicationIds) || !officerId || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (role !== 'intelligence' && role !== 'legal') {
            return NextResponse.json({ error: 'Invalid target role' }, { status: 400 });
        }

        const applications = await SocietyApplicationService.bulkAssignToWorkflow(
            applicationIds,
            officerId,
            role,
            user.id,
            notes
        );

        return NextResponse.json(applications);
    } catch (error: any) {
        console.error('Error in bulk application assignment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
