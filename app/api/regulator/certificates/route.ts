import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { CertificateType as CertificateTypeType } from '@/src/entities/Certificate';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { Certificate, CertificateType } = await import('@/src/entities/Certificate');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const certificateType = searchParams.get('certificateType') as CertificateTypeType | null;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const dataSource = await getDb();
        const certRepo = dataSource.getRepository(Certificate);

        const queryBuilder = certRepo
            .createQueryBuilder('certificate')
            .leftJoinAndSelect('certificate.tenant', 'tenant')
            .leftJoinAndSelect('certificate.issuer', 'issuer')
            .orderBy('certificate.issuedDate', 'DESC');

        if (tenantId) {
            queryBuilder.andWhere('certificate.tenantId = :tenantId', { tenantId });
        }

        if (certificateType) {
            queryBuilder.andWhere('certificate.certificateType = :certificateType', {
                certificateType,
            });
        }

        const [certificates, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return NextResponse.json({
            certificates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching certificates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch certificates', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { Certificate } = await import('@/src/entities/Certificate');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { tenantId, certificateType, expiryDate, metadata } = body;

        if (!tenantId || !certificateType) {
            return NextResponse.json(
                { error: 'Missing required fields: tenantId, certificateType' },
                { status: 400 }
            );
        }

        const dataSource = await getDb();
        const certRepo = dataSource.getRepository(Certificate);

        // Generate certificate number
        const count = await certRepo.count();
        const certificateNumber = `CERT-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

        const certificate = certRepo.create({
            tenantId,
            certificateNumber,
            certificateType,
            issuedDate: new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            issuedBy: user.id,
            metadata,
        });

        await certRepo.save(certificate);

        // TODO: Generate PDF certificate and upload to Firebase Storage
        // certificate.documentUrl = await generateCertificatePDF(certificate);
        // await certRepo.save(certificate);

        return NextResponse.json(certificate, { status: 201 });
    } catch (error: any) {
        console.error('Error creating certificate:', error);
        return NextResponse.json(
            { error: 'Failed to create certificate', details: error.message },
            { status: 500 }
        );
    }
}
