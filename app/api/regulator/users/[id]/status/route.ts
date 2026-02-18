import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { User, UserStatus } from '@/entities/User';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await request.json();

        if (!status || !Object.values(UserStatus).includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Prevent deactivating self
        if (params.id === currentUser.id && status === UserStatus.INACTIVE) {
            return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: params.id } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.status = status;
        await userRepo.save(user);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                status: user.status
            }
        });

    } catch (error: any) {
        console.error('Error updating user status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
