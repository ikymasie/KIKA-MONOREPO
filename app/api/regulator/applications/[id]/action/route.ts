import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { SocietyApplication, ApplicationStatus } = await import('@/src/entities/SocietyApplication');
        const { User, UserRole } = await import('@/src/entities/User');
        const { ApplicationStatusHistory } = await import('@/src/entities/ApplicationStatusHistory');
        const { NotificationService } = await import('@/src/services/NotificationService');


        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { action, notes } = await request.json(); // action: 'approve' | 'reject' | 'request_info'

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const appRepo = AppDataSource.getRepository(SocietyApplication);
        const application = await appRepo.findOne({ where: { id } });

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Log status change to audit trail
        const previousStatus = application.status;
        const historyRepo = AppDataSource.getRepository(ApplicationStatusHistory);

        // Apply status change
        switch (action) {
            case 'approve':
                // Move to next stage or final approval
                if (application.status === ApplicationStatus.SUBMITTED) {
                    application.status = ApplicationStatus.SECURITY_VETTING; // Example flow
                } else if (application.status === ApplicationStatus.SECURITY_VETTING) {
                    // Assume regulator can override/approve security step or it's a manual step
                    application.status = ApplicationStatus.APPROVED;
                    application.finalDecisionAt = new Date();
                    application.finalDecisionMakerId = user.id;
                } else {
                    // Default simple flow for now
                    application.status = ApplicationStatus.APPROVED;
                    application.finalDecisionAt = new Date();
                    application.finalDecisionMakerId = user.id;
                }
                break;
            case 'reject':
                application.status = ApplicationStatus.REJECTED;
                application.rejectionReasons = notes;
                application.finalDecisionAt = new Date();
                application.finalDecisionMakerId = user.id;
                break;
            case 'request_info':
                application.status = ApplicationStatus.INCOMPLETE;
                // Ideally store the specific request in a separate comments table or `rejectionReasons` for now
                application.rejectionReasons = `Info Requested: ${notes}`;
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Create audit trail entry
        const historyEntry = historyRepo.create({
            applicationId: application.id,
            fromStatus: previousStatus,
            toStatus: application.status,
            changedBy: user.id,
            notes: notes || undefined,
            action
        });

        await historyRepo.save(historyEntry);
        await appRepo.save(application);

        // Send notification to responsible users
        // TODO: Implement NotificationService.notifyWorkflowStage
        // await NotificationService.notifyWorkflowStage(application, application.status);

        return NextResponse.json({ success: true, application });

    } catch (error: any) {
        console.error('Error processing application action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
