import { query } from '../db/query';
import { sendEmail, generateWorkflowNotificationEmail } from '../../lib/email';

export class NotificationService {
    /**
     * Send notification to responsible users when application moves to a new stage
     */
    static async notifyWorkflowStage(
        application: any,
        newStatus: string
    ): Promise<void> {
        try {
            const [[settings]] = await query('SELECT * FROM regulator_settings ORDER BY updatedAt DESC LIMIT 1') as any;

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

            const responsibleUsers = await query(
                'SELECT * FROM users WHERE role = ? AND status = ?',
                [responsibleRole, 'active']
            ) as any[];

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
                    to: user.email!,
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
    private static getStageKey(status: string): string | null {
        switch (status) {
            case 'draft': return null;
            case 'submitted': return 'initial_review';
            case 'incomplete': return null;
            case 'under_review': return 'under_review';
            case 'security_vetting': return 'security_vetting';
            case 'security_failed': return null;
            case 'legal_review': return 'legal_review';
            case 'legal_rejected': return null;
            case 'pending_decision': return 'final_decision';
            case 'approved': return null;
            case 'rejected': return null;
            case 'appeal_lodged': return 'appeal_review';
            case 'appeal_approved': return null;
            case 'appeal_rejected': return null;
            default: return null;
        }
    }

    /**
     * Get human-readable stage name
     */
    private static getStageName(status: string): string {
        switch (status) {
            case 'draft': return 'Draft';
            case 'submitted': return 'Initial Review';
            case 'incomplete': return 'Incomplete';
            case 'under_review': return 'Under Review';
            case 'security_vetting': return 'Security Vetting';
            case 'security_failed': return 'Security Failed';
            case 'legal_review': return 'Legal Review';
            case 'legal_rejected': return 'Legal Rejected';
            case 'pending_decision': return 'Final Decision';
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            case 'appeal_lodged': return 'Appeal Review';
            case 'appeal_approved': return 'Appeal Approved';
            case 'appeal_rejected': return 'Appeal Rejected';
            default: return status;
        }
    }
}
