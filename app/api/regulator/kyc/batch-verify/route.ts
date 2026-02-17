import { NextRequest, NextResponse } from 'next/server';
import { KYCVerificationService } from '@/src/services/KYCVerificationService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { kycIds, verifiedBy, verified, notes } = body;

        if (!kycIds || !Array.isArray(kycIds) || kycIds.length === 0) {
            return NextResponse.json({ error: 'kycIds must be a non-empty array' }, { status: 400 });
        }

        if (!verifiedBy) {
            return NextResponse.json({ error: 'verifiedBy is required' }, { status: 400 });
        }

        await KYCVerificationService.batchVerify(kycIds, verifiedBy, verified, notes);

        return NextResponse.json({ message: `Successfully processed ${kycIds.length} KYC records` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
