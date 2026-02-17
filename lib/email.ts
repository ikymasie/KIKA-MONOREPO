import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

// Create reusable transporter
const createTransporter = () => {
    // Check if SMTP credentials are configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    // Fallback to console logging if no SMTP configured
    return null;
};

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    const transporter = createTransporter();

    if (!transporter) {
        // Mock mode: just log to console
        console.log('📧 [EMAIL MOCK]');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.text || options.html}`);
        console.log('---');
        return true;
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@kika.gov.bw',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}

// Template for workflow notifications
export function generateWorkflowNotificationEmail(params: {
    recipientName: string;
    applicationName: string;
    stage: string;
    actionUrl: string;
}): { subject: string; html: string; text: string } {
    const { recipientName, applicationName, stage, actionUrl } = params;

    const subject = `Action Required: ${applicationName} - ${stage}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">KIKA Platform - Application Review</h2>
            <p>Dear ${recipientName},</p>
            <p>A new application requires your attention:</p>
            <div style="background: #f5f3ff; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0;">
                <strong>Application:</strong> ${applicationName}<br>
                <strong>Stage:</strong> ${stage}
            </div>
            <p>Please review and take appropriate action:</p>
            <a href="${actionUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0;">
                Review Application
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated notification from the KIKA Platform.
            </p>
        </div>
    `;

    const text = `
KIKA Platform - Application Review

Dear ${recipientName},

A new application requires your attention:

Application: ${applicationName}
Stage: ${stage}

Please review and take appropriate action: ${actionUrl}

This is an automated notification from the KIKA Platform.
    `.trim();

    return { subject, html, text };
}

// Template for user credentials
export function generateCredentialsEmail(params: {
    recipientName: string;
    email: string;
    temporaryPassword: string;
    loginUrl: string;
}): { subject: string; html: string; text: string } {
    const { recipientName, email, temporaryPassword, loginUrl } = params;

    const subject = 'Your KIKA Platform Account Credentials';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Welcome to KIKA Platform</h2>
            <p>Dear ${recipientName},</p>
            <p>Your account has been created. Please use the following credentials to log in:</p>
            <div style="background: #f5f3ff; padding: 20px; border-left: 4px solid #7c3aed; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${temporaryPassword}</code></p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <strong>⚠️ Important:</strong> You will be required to change your password upon first login for security purposes.
            </div>
            <a href="${loginUrl}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0;">
                Log In Now
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
                If you did not expect this email, please contact your system administrator.<br>
                This is an automated message from the KIKA Platform.
            </p>
        </div>
    `;

    const text = `
Welcome to KIKA Platform

Dear ${recipientName},

Your account has been created. Please use the following credentials to log in:

Email: ${email}
Temporary Password: ${temporaryPassword}

⚠️ IMPORTANT: You will be required to change your password upon first login for security purposes.

Log in here: ${loginUrl}

If you did not expect this email, please contact your system administrator.
This is an automated message from the KIKA Platform.
    `.trim();

    return { subject, html, text };
}
