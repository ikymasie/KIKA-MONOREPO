/**
 * Email Service
 * 
 * Production-ready email service using Brevo (formerly Sendinblue) SMTP.
 * Supports single and bulk email sending with HTML templates.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailMessage {
    to: string;
    subject: string;
    html: string;
    text?: string;
    tenantName?: string; // For dynamic sender name
    attachments?: Array<{
        content: string;
        filename: string;
        type?: string;
        disposition?: string;
    }>;
}

interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    details?: any;
}

interface BulkEmailResponse {
    success: boolean;
    results: Array<{
        to: string;
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}

class EmailService {
    private transporter: Transporter | null = null;
    private isConfigured: boolean;

    constructor() {
        const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');
        const smtpUser = process.env.SMTP_USER || 'admin@dl-africa.com';
        const smtpPass = process.env.SMTP_PASS || 'xCT79s5mYv3q6hB2';

        this.isConfigured = !!(smtpUser && smtpPass);

        if (this.isConfigured) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: false, // Use TLS
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });

            console.log('[Email Service] Brevo SMTP configured successfully');
        } else {
            console.warn('[Email Service] SMTP credentials not configured. Email sending will fail.');
        }
    }

    /**
     * Send a single email
     */
    async sendEmail(message: EmailMessage): Promise<EmailResponse> {
        try {
            if (!this.isConfigured || !this.transporter) {
                return {
                    success: false,
                    error: 'Email service not configured - missing SMTP credentials',
                };
            }

            if (!message.to || !message.subject || !message.html) {
                return {
                    success: false,
                    error: 'Email recipient, subject, and content are required',
                };
            }

            // Dynamic sender name based on tenant
            const senderName = message.tenantName
                ? `KIKA Ya ${message.tenantName}`
                : 'KIKA Ya Sechaba';

            const senderEmail = process.env.SMTP_FROM || 'admin@dl-africa.com';

            const mailOptions = {
                from: `${senderName} <${senderEmail}>`,
                to: message.to,
                subject: message.subject,
                text: message.text || this.stripHtml(message.html),
                html: message.html,
                attachments: message.attachments,
            };

            console.log(`[Email Service] Sending email to ${message.to}: ${message.subject}`);

            const info = await this.transporter.sendMail(mailOptions);

            console.log('[Email Service] Email sent successfully:', info.messageId);

            return {
                success: true,
                messageId: info.messageId,
                details: info,
            };

        } catch (error: any) {
            console.error('[Email Service] Error sending email:', error);

            return {
                success: false,
                error: error.message || 'Failed to send email',
                details: error,
            };
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmail(messages: EmailMessage[]): Promise<BulkEmailResponse> {
        try {
            if (!this.isConfigured || !this.transporter) {
                return {
                    success: false,
                    results: messages.map(msg => ({
                        to: msg.to,
                        success: false,
                        error: 'Email service not configured',
                    })),
                };
            }

            if (!messages || messages.length === 0) {
                return {
                    success: false,
                    results: [],
                };
            }

            console.log(`[Email Service] Sending bulk email to ${messages.length} recipients`);

            // Send emails sequentially to avoid rate limiting
            const results: BulkEmailResponse['results'] = [];

            for (const message of messages) {
                const result = await this.sendEmail(message);
                results.push({
                    to: message.to,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error,
                });

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const successCount = results.filter(r => r.success).length;
            console.log(`[Email Service] Bulk send complete: ${successCount}/${messages.length} successful`);

            return {
                success: successCount > 0,
                results,
            };

        } catch (error: any) {
            console.error('[Email Service] Error sending bulk emails:', error);

            return {
                success: false,
                results: messages.map(msg => ({
                    to: msg.to,
                    success: false,
                    error: error.message || 'Failed to send email',
                })),
            };
        }
    }

    /**
     * Strip HTML tags for plain text fallback
     */
    private stripHtml(html: string): string {
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .trim();
    }

    /**
     * Generate HTML email template wrapper
     */
    generateEmailHtml(content: string, title?: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'KIKA Notification'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        h1, h2, h3 { margin-top: 0; color: #333; }
        h2 { color: #667eea; }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white !important;
            border-radius: 6px;
            text-decoration: none;
            margin: 10px 0;
            font-weight: 500;
        }
        .button:hover {
            background: #5568d3;
            text-decoration: none;
        }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
        strong { color: #333; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>KIKA</h1>
            <p>Savings & Credit Cooperative Society</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>This is an automated message from KIKA. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} KIKA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }

    /**
     * Verify SMTP connection
     */
    async verifyConnection(): Promise<boolean> {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            console.log('[Email Service] SMTP connection verified');
            return true;
        } catch (error: any) {
            console.error('[Email Service] SMTP verification failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailMessage, EmailResponse, BulkEmailResponse };

