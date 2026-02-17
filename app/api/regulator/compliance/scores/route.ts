import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { ComplianceService } from '@/src/services/ComplianceService';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const scores = await ComplianceService.getAllComplianceScores();

        return NextResponse.json(scores);
    } catch (error: any) {
        console.error('Error fetching compliance scores:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenantIds } = body;

        if (!tenantIds || !Array.isArray(tenantIds)) {
            return NextResponse.json(
                { error: 'tenantIds array is required' },
                { status: 400 }
            );
        }

        const results = [];
        for (const tenantId of tenantIds) {
            try {
                const score = await ComplianceService.calculateComplianceScore(
                    tenantId,
                    user.id
                );
                results.push({ tenantId, success: true, score });
            } catch (error: any) {
                results.push({ tenantId, success: false, error: error.message });
            }
        }

        return NextResponse.json({
            message: 'Compliance scores calculated',
            results,
        });
    } catch (error: any) {
        console.error('Error calculating compliance scores:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
