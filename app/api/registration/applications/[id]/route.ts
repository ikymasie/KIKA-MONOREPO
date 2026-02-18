import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { AppDataSource } = await import('@/src/config/database');
        const { SocietyApplication } = await import('@/src/entities/SocietyApplication');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const id = params.id;
        const applicationRepo = AppDataSource.getRepository(SocietyApplication);
        const application = await applicationRepo.findOne({
            where: { id },
            relations: ['applicant']
        });

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Error fetching application:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
