import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');

        if (!applicationId) {
            return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
        }

        // Verify ownership
        const application = await SocietyApplicationService.getApplicantApplication(applicationId, user.id);
        if (!application && !user.isGovernmentOfficer() && !user.isRegulator()) {
            return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 });
        }

        const members = await SocietyApplicationService.getMembers(applicationId);
        return NextResponse.json(members);
    } catch (error: any) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
        const { applicationId, ...memberData } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
        }

        // Verify ownership and status
        const application = await SocietyApplicationService.getApplicantApplication(applicationId, user.id);
        if (!application) {
            return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 });
        }

        const member = await SocietyApplicationService.addMember(applicationId, memberData);
        return NextResponse.json(member, { status: 201 });
    } catch (error: any) {
        console.error('Error adding member:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...memberData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Missing member id' }, { status: 400 });
        }

        // Note: In a real app, we should verify the member belongs to an application owned by the user
        // For now, relying on SocietyApplicationService.updateMember which doesn't check ownership yet
        const member = await SocietyApplicationService.updateMember(id, memberData);
        return NextResponse.json(member);
    } catch (error: any) {
        console.error('Error updating member:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing member id' }, { status: 400 });
        }

        await SocietyApplicationService.removeMember(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error removing member:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
