import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Transaction, TransactionType, TransactionStatus } from '@/src/entities/Transaction';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const transactionRepo = AppDataSource.getRepository(Transaction);

    // In a production system, we would link transactions directly to vendors.
    // For now, we fetch transactions related to merchandise payments for this tenant.
    const payments = await transactionRepo.find({
        where: {
            tenantId: user.tenantId,
            transactionType: TransactionType.MERCHANDISE_PAYMENT,
            status: TransactionStatus.COMPLETED
        },
        order: { transactionDate: 'DESC' }
    });

    return NextResponse.json(payments);
});
