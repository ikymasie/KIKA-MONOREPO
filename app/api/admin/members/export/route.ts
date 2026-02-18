import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) {
        throw new ForbiddenError('Admin access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const memberRepo = AppDataSource.getRepository(Member);

    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    const queryBuilder = memberRepo
        .createQueryBuilder('member')
        .where('member.tenantId = :tenantId', { tenantId: user.tenantId });

    if (status) {
        queryBuilder.andWhere('member.status = :status', { status });
    }

    if (search) {
        queryBuilder.andWhere(
            '(member.firstName LIKE :search OR member.lastName LIKE :search OR member.memberNumber LIKE :search OR member.nationalId LIKE :search)',
            { search: `%${search}%` }
        );
    }

    const members = await queryBuilder.orderBy('member.createdAt', 'DESC').getMany();

    // Format for CSV
    const data = members.map(m => ({
        'Member Number': m.memberNumber,
        'First Name': m.firstName,
        'Last Name': m.lastName,
        'ID Number': m.nationalId,
        'Email': m.email,
        'Phone': m.phone,
        'Status': m.status.toUpperCase(),
        'Join Date': m.joinDate,
        'Employer': m.employer || 'N/A',
        'Employment Status': m.employmentStatus.toUpperCase(),
        'Share Capital': m.shareCapital
    }));

    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=members_export_${new Date().toISOString().split('T')[0]}.csv`,
        },
    });
});
