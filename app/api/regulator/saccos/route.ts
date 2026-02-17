import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Tenant } from '@/src/entities/Tenant';
import { Member, MemberStatus } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is regulator
        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);
        const memberRepo = AppDataSource.getRepository(Member);

        // Fetch all SACCOS with member counts
        const allSaccos = await tenantRepo.find({
            order: { name: 'ASC' },
        });

        // Get member counts for each SACCOS
        const saccosWithCounts = await Promise.all(
            allSaccos.map(async (saccos) => {
                const memberCount = await memberRepo.count({
                    where: {
                        tenantId: saccos.id,
                        status: MemberStatus.ACTIVE,
                    },
                });

                return {
                    id: saccos.id,
                    name: saccos.name,
                    code: saccos.code,
                    status: saccos.status,
                    registrationDate: saccos.registrationDate,
                    phone: saccos.phone,
                    email: saccos.email,
                    memberCount,
                };
            })
        );

        return NextResponse.json({
            saccos: saccosWithCounts,
        });
    } catch (error: any) {
        console.error('SACCOS directory error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch SACCOS' },
            { status: 500 }
        );
    }
}
