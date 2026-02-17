import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { KYCVerificationService } from '@/src/services/KYCVerificationService';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const kyc = await KYCVerificationService.getKYCById(params.id);

        if (!kyc) {
            return NextResponse.json({ error: 'KYC record not found' }, { status: 404 });
        }

        return NextResponse.json(kyc);
    } catch (error: any) {
        console.error('Error fetching KYC details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { documentType, verified, notes } = body;

        if (!documentType || verified === undefined) {
            return NextResponse.json(
                { error: 'documentType and verified fields are required' },
                { status: 400 }
            );
        }

        const kyc = await KYCVerificationService.verifyKYCDocument({
            kycId: params.id,
            documentType,
            verified,
            notes,
            verifiedBy: user.id,
        });

        return NextResponse.json({
            message: 'KYC document verified successfully',
            kyc,
        });
    } catch (error: any) {
        console.error('Error verifying KYC document:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
