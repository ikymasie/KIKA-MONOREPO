/**
 * Notification Service
 * 
 * Core service that orchestrates notification delivery across SMS and Email channels.
 * Handles template resolution, channel selection, and logging.
 */

import { smsService } from './sms-service';
import { emailService } from './email-service';
import {
    NotificationEvent,
    NotificationChannel,
    NotificationStatus,
    NotificationContext
} from './notification-types';
import { UserRole } from '@/src/entities/User';
import { getDataSource } from '@/src/config/database';
import { NotificationTemplate } from '@/src/entities/NotificationTemplate';
import { NotificationLog } from '@/src/entities/NotificationLog';

class NotificationService {
    private templateCache: Map<string, NotificationTemplate> = new Map();

    /**
     * Send notification based on event and role
     */
    async sendNotification(context: NotificationContext): Promise<void> {
        try {
            // 1. Get template for event + role
            const template = await this.getTemplate(context.event, context.recipientRole as UserRole);

            if (!template || !template.isActive) {
                console.warn(`[Notification Service] No active template for ${context.event} / ${context.recipientRole}`);
                return;
            }

            // 2. Resolve template placeholders
            const resolvedSMS = template.smsTemplate
                ? this.resolvePlaceholders(template.smsTemplate, context.data)
                : null;

            const resolvedEmailSubject = template.emailSubject
                ? this.resolvePlaceholders(template.emailSubject, context.data)
                : null;

            const resolvedEmailBody = template.emailTemplate
                ? this.resolvePlaceholders(template.emailTemplate, context.data)
                : null;

            // 3. Send via appropriate channels
            const promises: Promise<any>[] = [];

            if (template.channels.includes(NotificationChannel.SMS) && context.recipientPhone) {
                promises.push(
                    this.sendSMS(context, resolvedSMS!)
                );
            }

            if (template.channels.includes(NotificationChannel.EMAIL) && context.recipientEmail) {
                promises.push(
                    this.sendEmail(context, resolvedEmailSubject!, resolvedEmailBody!)
                );
            }

            await Promise.allSettled(promises);

        } catch (error: any) {
            console.error('[Notification Service] Error sending notification:', error);
        }
    }

    /**
     * Send SMS notification
     */
    private async sendSMS(context: NotificationContext, message: string): Promise<void> {
        try {
            const result = await smsService.sendSMS(context.recipientPhone!, message);

            await this.logNotification({
                event: context.event,
                channel: NotificationChannel.SMS,
                recipient: context.recipientPhone!,
                userId: context.userId,
                tenantId: context.tenantId,
                content: message,
                status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
                externalId: result.messageId,
                errorMessage: result.error,
                metadata: context.data,
            });

            if (!result.success) {
                console.error(`[Notification Service] SMS failed: ${result.error}`);
            }

        } catch (error: any) {
            console.error('[Notification Service] Error sending SMS:', error);
            await this.logNotification({
                event: context.event,
                channel: NotificationChannel.SMS,
                recipient: context.recipientPhone!,
                userId: context.userId,
                tenantId: context.tenantId,
                content: message,
                status: NotificationStatus.FAILED,
                errorMessage: error.message,
                metadata: context.data,
            });
        }
    }

    /**
     * Send email notification
     */
    private async sendEmail(context: NotificationContext, subject: string, body: string): Promise<void> {
        try {
            // Wrap body in email template
            const htmlBody = emailService.generateEmailHtml(body, subject);

            const result = await emailService.sendEmail({
                to: context.recipientEmail!,
                subject,
                html: htmlBody,
            });

            await this.logNotification({
                event: context.event,
                channel: NotificationChannel.EMAIL,
                recipient: context.recipientEmail!,
                userId: context.userId,
                tenantId: context.tenantId,
                subject,
                content: body,
                status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
                externalId: result.messageId,
                errorMessage: result.error,
                metadata: context.data,
            });

            if (!result.success) {
                console.error(`[Notification Service] Email failed: ${result.error}`);
            }

        } catch (error: any) {
            console.error('[Notification Service] Error sending email:', error);
            await this.logNotification({
                event: context.event,
                channel: NotificationChannel.EMAIL,
                recipient: context.recipientEmail!,
                userId: context.userId,
                tenantId: context.tenantId,
                subject,
                content: body,
                status: NotificationStatus.FAILED,
                errorMessage: error.message,
                metadata: context.data,
            });
        }
    }

    /**
     * Resolve template placeholders with actual data
     */
    private resolvePlaceholders(template: string, data: Record<string, any>): string {
        let resolved = template;

        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            resolved = resolved.replace(placeholder, String(value ?? ''));
        }

        return resolved;
    }

    /**
     * Get template from database or cache
     */
    private async getTemplate(event: NotificationEvent, role: UserRole): Promise<NotificationTemplate | null> {
        const cacheKey = `${event}_${role}`;

        // Check cache first
        if (this.templateCache.has(cacheKey)) {
            return this.templateCache.get(cacheKey)!;
        }

        try {
            const dataSource = await getDataSource();
            const templateRepo = dataSource.getRepository(NotificationTemplate);

            const template = await templateRepo.findOne({
                where: {
                    event,
                    targetRole: role,
                },
            });

            if (template) {
                this.templateCache.set(cacheKey, template);
            }

            return template;

        } catch (error: any) {
            console.error('[Notification Service] Error fetching template:', error);
            return null;
        }
    }

    /**
     * Log notification to database
     */
    private async logNotification(log: Partial<NotificationLog>): Promise<void> {
        try {
            const dataSource = await getDataSource();
            const logRepo = dataSource.getRepository(NotificationLog);

            await logRepo.save(log);

        } catch (error: any) {
            console.error('[Notification Service] Error logging notification:', error);
        }
    }

    /**
     * Clear template cache (useful after template updates)
     */
    clearCache(): void {
        this.templateCache.clear();
    }

    /**
     * Send bulk notifications to multiple recipients
     */
    async sendBulkNotifications(contexts: NotificationContext[]): Promise<void> {
        const promises = contexts.map(context => this.sendNotification(context));
        await Promise.allSettled(promises);
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
