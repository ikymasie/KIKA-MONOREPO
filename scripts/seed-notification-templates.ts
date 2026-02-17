/**
 * Seed Notification Templates
 * 
 * This script seeds the database with all notification templates
 * from the template definitions.
 */

import { getDataSource } from '../src/config/database';
import { NotificationTemplate } from '../src/entities/NotificationTemplate';
import { NOTIFICATION_TEMPLATE_DEFINITIONS } from '../lib/notification-templates';

async function seedNotificationTemplates() {
    try {
        console.log('[Seed] Starting notification template seeding...');

        const dataSource = await getDataSource();
        const templateRepo = dataSource.getRepository(NotificationTemplate);

        // Clear existing templates (optional - comment out if you want to preserve manual edits)
        // await templateRepo.clear();
        // console.log('[Seed] Cleared existing templates');

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const definition of NOTIFICATION_TEMPLATE_DEFINITIONS) {
            // Check if template already exists
            const existing = await templateRepo.findOne({
                where: {
                    event: definition.event,
                    targetRole: definition.targetRole,
                },
            });

            if (existing) {
                // Update existing template
                existing.channels = definition.channels;
                existing.smsTemplate = definition.smsTemplate;
                existing.emailSubject = definition.emailSubject;
                existing.emailTemplate = definition.emailTemplate;
                existing.placeholders = definition.placeholders;
                existing.priority = definition.priority;
                existing.description = definition.description;

                await templateRepo.save(existing);
                updatedCount++;
                console.log(`[Seed] Updated: ${definition.event} for ${definition.targetRole}`);
            } else {
                // Create new template
                const template = templateRepo.create({
                    event: definition.event,
                    targetRole: definition.targetRole,
                    channels: definition.channels,
                    smsTemplate: definition.smsTemplate,
                    emailSubject: definition.emailSubject,
                    emailTemplate: definition.emailTemplate,
                    placeholders: definition.placeholders,
                    priority: definition.priority,
                    description: definition.description,
                    isActive: true,
                });

                await templateRepo.save(template);
                createdCount++;
                console.log(`[Seed] Created: ${definition.event} for ${definition.targetRole}`);
            }
        }

        console.log('\n[Seed] ✅ Notification template seeding complete!');
        console.log(`[Seed] Created: ${createdCount}`);
        console.log(`[Seed] Updated: ${updatedCount}`);
        console.log(`[Seed] Total templates: ${NOTIFICATION_TEMPLATE_DEFINITIONS.length}`);

        process.exit(0);
    } catch (error) {
        console.error('[Seed] ❌ Error seeding notification templates:', error);
        process.exit(1);
    }
}

// Run the seed function
seedNotificationTemplates();
