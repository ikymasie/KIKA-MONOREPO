import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
        const { query } = await import("../../../../src/db/query");
        const { tenantId } = params;

        const [tenant] = await query(
            'SELECT id, name, logoUrl, primaryColor, secondaryColor, brandingSettings FROM tenants WHERE id = ? LIMIT 1',
            [tenantId]
        ) as any;

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
