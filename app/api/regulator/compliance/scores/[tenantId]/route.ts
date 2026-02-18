import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { ComplianceService } = await import('@/src/services/ComplianceService');


        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const history = await ComplianceService.getComplianceScoreHistory(params.tenantId);
        const metrics = await ComplianceService.getComplianceMetrics(params.tenantId);

        return NextResponse.json({
            history,
            metrics,
        });
    } catch (error: any) {
        console.error('Error fetching compliance score:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { ComplianceService } = await import('@/src/services/ComplianceService');
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const score = await ComplianceService.calculateComplianceScore(
            params.tenantId,
            user.id
        );

        return NextResponse.json({
            message: 'Compliance score calculated successfully',
            score,
        });
    } catch (error: any) {
        console.error('Error calculating compliance score:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
