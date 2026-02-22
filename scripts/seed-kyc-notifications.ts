
import { AppDataSource } from '../src/config/database';
import { NotificationTemplate } from '../src/entities/NotificationTemplate';
import { NotificationEvent, NotificationPriority, NotificationChannel } from '../lib/notification-types';
import { UserRole } from '../src/entities/User';

async function seed() {
    console.log('🌱 Seeding KYC Notification Templates...');

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const templateRepo = AppDataSource.getRepository(NotificationTemplate);

    const templates = [
        {
            event: NotificationEvent.MEMBER_KYC_EXPIRY_WARNING,
            targetRole: UserRole.MEMBER,
            channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
            priority: NotificationPriority.HIGH,
            description: 'Warning sent when a KYC document is about to expire',
            smsTemplate: 'KIKA Alert: Your {{documentType}} expires on {{expiryDate}} ({{daysRemaining}} days left). promoting compliance, please renew via portal.',
            emailSubject: 'Action Required: KYC Document Expiry Warning',
            emailTemplate: `
                <h2>Document Expiry Notice</h2>
                <p>Dear {{firstName}},</p>
                <p>This is a reminder that your <strong>{{documentType}}</strong> on file is set to expire on <strong>{{expiryDate}}</strong>.</p>
                <p>To ensure your account remains in good standing and compliant with Financial Intelligence Act regulations, please upload a renewed copy at your earliest convenience.</p>
                <p><a href="{{portalUrl}}">Login to Member Portal</a></p>
                <p>Regards,<br/>The KIKA Team</p>
            `,
            placeholders: ['firstName', 'documentType', 'expiryDate', 'daysRemaining', 'portalUrl'],
            isActive: true
        },
        {
            event: NotificationEvent.MEMBER_KYC_EXPIRED,
            targetRole: UserRole.MEMBER,
            channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
            priority: NotificationPriority.URGENT,
            description: 'Alert sent when a KYC document has officially expired',
            smsTemplate: 'KIKA Alert: Your {{documentType}} has EXPIRED. Your account may be restricted. Please upload a new copy immediately.',
            emailSubject: 'URGENT: KYC Document Expired',
            emailTemplate: `
                <h2 style="color: #e53e3e;">Document Expired</h2>
                <p>Dear {{firstName}},</p>
                <p>Your <strong>{{documentType}}</strong> has expired as of today.</p>
                <p><strong>Immediate Action Required:</strong> Please upload a valid replacement document to prevent restrictions on your account services.</p>
                <p><a href="{{portalUrl}}" style="background-color: #e53e3e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Documents Now</a></p>
                <p>Regards,<br/>The KIKA Compliance Team</p>
            `,
            placeholders: ['firstName', 'documentType', 'portalUrl'],
            isActive: true
        }
    ];

    for (const t of templates) {
        const existing = await templateRepo.findOne({
            where: { event: t.event, targetRole: t.targetRole }
        });

        if (existing) {
            console.log(`- Template for ${t.event} already exists. Skipping.`);
        } else {
            const newTemplate = templateRepo.create(t);
            await templateRepo.save(newTemplate);
            console.log(`+ Created template for ${t.event}`);
        }
    }

    console.log('✅ Seeding complete.');
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
