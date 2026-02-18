import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Tenant } = await import('@/src/entities/Tenant');


        const { tenantId } = params;

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepo.findOne({
            where: { id: tenantId },
            select: ['id', 'name', 'logoUrl', 'primaryColor', 'secondaryColor', 'brandingSettings']
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error('Public Branding GET error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch branding' },
            { status: 500 }
        );
    }
}
