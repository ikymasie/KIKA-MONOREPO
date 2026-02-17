import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';

export async function GET(request: NextRequest) {
    try {
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

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const member = await memberRepo.findOne({
            where: { tenantId, memberNumber },
            relations: ['kyc'],
        });

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
            kycStatus: member.kyc ? (member.kyc.identityVerified && member.kyc.residenceVerified && member.kyc.incomeVerified ? 'Verified' : 'Pending Verification') : 'No KYC Record',
        });
    } catch (error: any) {
        console.error('Member verification tool error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
