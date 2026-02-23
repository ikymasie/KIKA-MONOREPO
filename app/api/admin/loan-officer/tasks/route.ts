import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/db/query';
import { LoanStatus, WorkflowStage } from '@/src/interfaces/ILoan';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/errors';

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

    const statusExcludeList = ['approved', 'rejected', 'disbursed', 'active', 'paid_off'];
    const placeholders = statusExcludeList.map(() => '?').join(',');

    const tasks = await query(
        `SELECT l.*, 
                m.firstName as memberFirstName, m.lastName as memberLastName,
                p.name as productName
         FROM loans l
         LEFT JOIN members m ON m.id = l.memberId
         LEFT JOIN savings_products p ON p.id = l.productId
         WHERE l.tenantId = ?
           AND ((l.loanOfficerId = ?) OR (l.workflowStage = ? AND l.loanOfficerId IS NULL))
           AND l.status NOT IN (${placeholders})
         ORDER BY COALESCE(l.applicationDate, l.createdAt) ASC`,
        [
            user.tenantId,
            user.id,
            'technical_appraisal',
            ...statusExcludeList
        ]
    ) as any[];

    const formattedTasks = tasks.map(loan => {
        // Calculate urgency based on application date
        const daysPending = Math.floor((new Date().getTime() - new Date(loan.applicationDate || loan.createdAt || new Date()).getTime()) / (1000 * 3600 * 24));

        return {
            id: loan.id,
            loanNumber: loan.loanNumber,
            memberName: (loan.memberFirstName && loan.memberLastName) ? `${loan.memberFirstName} ${loan.memberLastName}` : 'Unknown',
            productName: loan.productName || 'Unknown',
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
