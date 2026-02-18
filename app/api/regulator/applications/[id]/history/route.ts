import { NextResponse, NextRequest } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { ApplicationStatusHistory } from '@/entities/ApplicationStatusHistory';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const historyRepo = AppDataSource.getRepository(ApplicationStatusHistory);
        const history = await historyRepo.find({
            where: { applicationId: params.id },
            relations: ['user'],
            order: { changedAt: 'DESC' }
        });

        return NextResponse.json(history.map(entry => ({
            id: entry.id,
            fromStatus: entry.fromStatus,
            toStatus: entry.toStatus,
            action: entry.action,
            notes: entry.notes,
            changedAt: entry.changedAt,
            changedBy: {
                id: entry.user.id,
                name: `${entry.user.firstName} ${entry.user.lastName}`,
                email: entry.user.email
            }
        })));

    } catch (error: any) {
        console.error('Error fetching application history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
