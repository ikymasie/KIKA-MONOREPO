import { AppDataSource } from '../config/database';
import { User, UserRole, UserStatus } from '../entities/User';
import { SocietyApplication, ApplicationStatus } from '../entities/SocietyApplication';
import { RegulatorSettings } from '../entities/RegulatorSettings';
import { sendEmail, generateWorkflowNotificationEmail } from '../../lib/email';

export class NotificationService {
    /**
     * Send notification to responsible users when application moves to a new stage
     */
    static async notifyWorkflowStage(
        application: SocietyApplication,
        newStatus: ApplicationStatus
    ): Promise<void> {
        try {
            // Get workflow configuration
            const settingsRepo = AppDataSource.getRepository(RegulatorSettings);
            const settings = await settingsRepo.findOne({
                where: {},
                order: { updatedAt: 'DESC' }
            });

            if (!settings?.workflowConfig) {
                console.log('No workflow configuration found, skipping notification');
                return;
            }

            // Map status to workflow config key
            const stageKey = this.getStageKey(newStatus);
            if (!stageKey) {
                console.log(`No stage key for status: ${newStatus}`);
                return;
            }

            // Get the responsible role from config
            const responsibleRole = settings.workflowConfig[stageKey];
            if (!responsibleRole) {
                console.log(`No role configured for stage: ${stageKey}`);
                return;
            }

            // Find all users with this role
            const userRepo = AppDataSource.getRepository(User);
            const responsibleUsers = await userRepo.find({
                where: { role: responsibleRole as UserRole, status: UserStatus.ACTIVE }
            });

            if (responsibleUsers.length === 0) {
                console.log(`No active users found with role: ${responsibleRole}`);
                return;
            }

            // Send email to each responsible user
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const actionUrl = `${baseUrl}/regulator/applications/${application.id}`;

            for (const user of responsibleUsers) {
                const emailContent = generateWorkflowNotificationEmail({
                    recipientName: user.fullName,
                    applicationName: application.proposedName,
                    stage: this.getStageName(newStatus),
                    actionUrl
                });

                await sendEmail({
                    to: user.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                    text: emailContent.text
                });

                console.log(`✅ Notification sent to ${user.email} for ${stageKey}`);
            }

        } catch (error) {
            console.error('Error sending workflow notification:', error);
            // Don't throw - notifications should not block workflow
        }
    }

    /**
     * Map ApplicationStatus to workflow config key
     */
    private static getStageKey(status: ApplicationStatus): string | null {
        const mapping: Record<ApplicationStatus, string | null> = {
            [ApplicationStatus.DRAFT]: null,
            [ApplicationStatus.SUBMITTED]: 'initial_review',
            [ApplicationStatus.INCOMPLETE]: null,
            [ApplicationStatus.UNDER_REVIEW]: 'under_review',
            [ApplicationStatus.SECURITY_VETTING]: 'security_vetting',
            [ApplicationStatus.SECURITY_FAILED]: null,
            [ApplicationStatus.LEGAL_REVIEW]: 'legal_review',
            [ApplicationStatus.LEGAL_REJECTED]: null,
            [ApplicationStatus.PENDING_DECISION]: 'final_decision',
            [ApplicationStatus.APPROVED]: null,
            [ApplicationStatus.REJECTED]: null,
            [ApplicationStatus.APPEAL_LODGED]: 'appeal_review',
            [ApplicationStatus.APPEAL_APPROVED]: null,
            [ApplicationStatus.APPEAL_REJECTED]: null,
        };

        return mapping[status] || null;
    }

    /**
     * Get human-readable stage name
     */
    private static getStageName(status: ApplicationStatus): string {
        const names: Record<ApplicationStatus, string> = {
            [ApplicationStatus.DRAFT]: 'Draft',
            [ApplicationStatus.SUBMITTED]: 'Initial Review',
            [ApplicationStatus.INCOMPLETE]: 'Incomplete',
            [ApplicationStatus.UNDER_REVIEW]: 'Under Review',
            [ApplicationStatus.SECURITY_VETTING]: 'Security Vetting',
            [ApplicationStatus.SECURITY_FAILED]: 'Security Failed',
            [ApplicationStatus.LEGAL_REVIEW]: 'Legal Review',
            [ApplicationStatus.LEGAL_REJECTED]: 'Legal Rejected',
            [ApplicationStatus.PENDING_DECISION]: 'Final Decision',
            [ApplicationStatus.APPROVED]: 'Approved',
            [ApplicationStatus.REJECTED]: 'Rejected',
            [ApplicationStatus.APPEAL_LODGED]: 'Appeal Review',
            [ApplicationStatus.APPEAL_APPROVED]: 'Appeal Approved',
            [ApplicationStatus.APPEAL_REJECTED]: 'Appeal Rejected',
        };

        return names[status] || status;
    }
}
