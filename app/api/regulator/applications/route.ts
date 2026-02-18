import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { SocietyApplication } = await import('@/src/entities/SocietyApplication');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is regulator
        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const applicationRepo = AppDataSource.getRepository(SocietyApplication);

        // Fetch all applications
        const applications = await applicationRepo.find({
            order: { createdAt: 'DESC' },
        });

        const formattedApplications = applications.map(app => ({
            id: app.id,
            proposedName: app.proposedName,
            applicationType: app.applicationType,
            status: app.status,
            submittedAt: app.createdAt,
            primaryContactName: app.primaryContactName,
            primaryContactEmail: app.primaryContactEmail,
        }));

        return NextResponse.json(formattedApplications);
    } catch (error: any) {
        console.error('Applications fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch applications' },
            { status: 500 }
        );
    }
}
