import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus, WorkflowStage } from '@/src/entities/Loan';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);

    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    if (!user.isTenantAdmin()) {
        throw new ForbiddenError('Staff access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }

    const loanRepo = AppDataSource.getRepository(Loan);

    // Task Queue Logic:
    // 1. Loans explicitly assigned to this officer
    // 2. Loans in TECHNICAL_APPRAISAL stage that are unassigned
    const tasks = await loanRepo
        .createQueryBuilder('loan')
        .leftJoinAndSelect('loan.member', 'member')
        .leftJoinAndSelect('loan.product', 'product')
        .where('loan.tenantId = :tenantId', { tenantId: user.tenantId })
        .andWhere(
            '((loan.loanOfficerId = :userId) OR (loan.workflowStage = :stage AND loan.loanOfficerId IS NULL))',
            {
                userId: user.id,
                stage: WorkflowStage.TECHNICAL_APPRAISAL
            }
        )
        .andWhere('loan.status NOT IN (:...terminalStates)', {
            terminalStates: [LoanStatus.APPROVED, LoanStatus.REJECTED, LoanStatus.DISBURSED, LoanStatus.ACTIVE, LoanStatus.PAID_OFF]
        })
        .orderBy('loan.applicationDate', 'ASC') // Oldest first for SLA
        .getMany();

    const formattedTasks = tasks.map(loan => {
        // Calculate urgency based on application date
        const daysPending = Math.floor((new Date().getTime() - new Date(loan.applicationDate || loan.createdAt).getTime()) / (1000 * 3600 * 24));

        return {
            id: loan.id,
            loanNumber: loan.loanNumber,
            memberName: `${loan.member.firstName} ${loan.member.lastName}`,
            productName: loan.product.name,
            amount: Number(loan.principalAmount),
            status: loan.status,
            stage: loan.workflowStage,
            applicationDate: loan.applicationDate || loan.createdAt,
            daysPending,
            isAssignedToMe: loan.loanOfficerId === user.id,
            priority: daysPending > 3 ? 'high' : daysPending > 1 ? 'medium' : 'low',
        };
    });

    return NextResponse.json({
        success: true,
        data: formattedTasks,
        metadata: {
            totalTasks: formattedTasks.length,
            highPriorityCount: formattedTasks.filter(t => t.priority === 'high').length,
            unassignedCount: tasks.filter(t => !t.loanOfficerId).length,
        }
    });
});
