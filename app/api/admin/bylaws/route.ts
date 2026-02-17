import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Bylaw } from '@/src/entities/Bylaw';
import { ByelawReview, ByelawReviewStatus } from '@/src/entities/ByelawReview';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const bylawRepo = AppDataSource.getRepository(Bylaw);
        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        const [bylaws, reviews] = await Promise.all([
            bylawRepo.find({
                where: { tenantId: user.tenantId },
                order: { createdAt: 'DESC' },
            }),
            reviewRepo.find({
                where: { tenantId: user.tenantId },
                order: { submittedAt: 'DESC' },
            }),
        ]);

        return NextResponse.json({ bylaws, reviews });
    } catch (error: any) {
        console.error('Bylaws GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { documentUrl, version, notes } = body;

        if (!documentUrl || !version) {
            return NextResponse.json({ error: 'Document URL and version are required' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reviewRepo = AppDataSource.getRepository(ByelawReview);

        const newReview = reviewRepo.create({
            tenantId: user.tenantId,
            bylawDocumentUrl: documentUrl,
            version: parseInt(version),
            submittedAt: new Date(),
            status: ByelawReviewStatus.PENDING,
            reviewNotes: notes,
        });

        await reviewRepo.save(newReview);

        return NextResponse.json(newReview, { status: 201 });
    } catch (error: any) {
        console.error('Bylaws POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
