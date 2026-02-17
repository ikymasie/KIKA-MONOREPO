import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { KYCVerificationService } from '@/src/services/KYCVerificationService';

export async function GET(request: NextRequest) {
    try {
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
