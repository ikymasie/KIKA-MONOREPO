import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const { query } = await import("@/src/db/query");


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const memberNumber = searchParams.get('memberNumber');

        if (!tenantId || !memberNumber) {
            return NextResponse.json({ error: 'Tenant ID and Member Number are required' }, { status: 400 });
        }

        const members = await query(`
            SELECT m.*, 
                   k.identityVerified as kycIdentityVerified, 
                   k.residenceVerified as kycResidenceVerified, 
                   k.incomeVerified as kycIncomeVerified
            FROM members m
            LEFT JOIN kycs k ON k.memberId = m.id
            WHERE m.tenantId = ? AND m.memberNumber = ?
            LIMIT 1
        `, [tenantId, memberNumber]) as any[];

        const member = members[0];

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: member.id,
            memberNumber: member.memberNumber,
            firstName: member.firstName,
            lastName: member.lastName,
            nationalId: member.nationalId,
            status: member.status,
            kycStatus: member.kycIdentityVerified !== undefined && member.kycIdentityVerified !== null ? (member.kycIdentityVerified && member.kycResidenceVerified && member.kycIncomeVerified ? 'Verified' : 'Pending Verification') : 'No KYC Record',
        });
    } catch (error: any) {
        console.error('Member verification tool error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
