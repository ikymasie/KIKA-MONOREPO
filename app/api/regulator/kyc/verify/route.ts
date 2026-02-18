import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { KYCVerificationService } = await import('@/src/services/KYCVerificationService');

    
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const pendingVerifications = await KYCVerificationService.getPendingVerifications(
            tenantId || undefined,
            limit
        );

        return NextResponse.json({
            verifications: pendingVerifications,
            count: pendingVerifications.length,
        });
    } catch (error: any) {
        console.error('Error fetching pending KYC verifications:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
