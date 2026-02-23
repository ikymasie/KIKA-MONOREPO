import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/db/query';
import { notificationService } from '@/lib/notification-service';
import { NotificationEvent } from '@/lib/notification-types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for cron job

/**
 * CRON: GET /api/cron/kyc-expiry
 * Checks for documents expiring in 30 days, 7 days, or today.
 * Secured by CRON_SECRET header.
 */
export const GET = async (request: NextRequest) => {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow local development testing if needed, or strict production check
        if (process.env.NODE_ENV === 'production') {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    const results = {
        checked: 0,
        sent: 0,
        errors: 0
    };

    const now = new Date();
    const warningDays = [30, 7, 0]; // Notify at 30 days, 7 days, and on expiry

    try {
        // We need to check each document type date independently.
        // For efficiency, we can fetch all KYC records that have ANY expiry date set.
        // But scanning the whole table might be heavy. 
        // Better to query for specific ranges.

        // Let's iterate through the thresholds
        for (const days of warningDays) {
            const targetDate = new Date();
            targetDate.setDate(now.getDate() + days);

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            // Fetch records expiring on this target day
            // We check separate queries for each doc type to keep logic clean, 
            // though a complex OR query is possible.

            const omangList = await query(
                `SELECT k.*, m.firstName, m.lastName, m.email as memberEmail, m.phone as memberPhone, m.tenantId, u.id as userId, u.email as userEmail, u.phone as userPhone, u.role as userRole
                 FROM kycs k
                 INNER JOIN members m ON m.id = k.memberId
                 LEFT JOIN users u ON u.id = m.userId
                 WHERE m.status = 'active' AND k.omangExpiryDate >= ? AND k.omangExpiryDate <= ?`,
                [startOfDay, endOfDay]
            ) as any[];

            await processExpiryBatch(omangList, 'Omang / National ID', days);

            // Query 2: PASSPORT
            const passportList = await query(
                `SELECT k.*, m.firstName, m.lastName, m.email as memberEmail, m.phone as memberPhone, m.tenantId, u.id as userId, u.email as userEmail, u.phone as userPhone, u.role as userRole
                 FROM kycs k
                 INNER JOIN members m ON m.id = k.memberId
                 LEFT JOIN users u ON u.id = m.userId
                 WHERE m.status = 'active' AND k.passportExpiryDate >= ? AND k.passportExpiryDate <= ?`,
                [startOfDay, endOfDay]
            ) as any[];

            await processExpiryBatch(passportList, 'Passport', days);

            // Query 3: WORK PERMIT
            const permitList = await query(
                `SELECT k.*, m.firstName, m.lastName, m.email as memberEmail, m.phone as memberPhone, m.tenantId, u.id as userId, u.email as userEmail, u.phone as userPhone, u.role as userRole
                 FROM kycs k
                 INNER JOIN members m ON m.id = k.memberId
                 LEFT JOIN users u ON u.id = m.userId
                 WHERE m.status = 'active' AND k.workPermitExpiryDate >= ? AND k.workPermitExpiryDate <= ?`,
                [startOfDay, endOfDay]
            ) as any[];

            await processExpiryBatch(permitList, 'Work Permit', days);
        }

        async function processExpiryBatch(list: any[], docType: string, daysRemaining: number) {
            results.checked += list.length;

            for (const row of list) {
                // Determine contact details
                const phone = row.userPhone || row.memberPhone;
                const email = row.userEmail || row.memberEmail;
                const role = row.userRole || 'member';

                const event = daysRemaining === 0
                    ? NotificationEvent.MEMBER_KYC_EXPIRED
                    : NotificationEvent.MEMBER_KYC_EXPIRY_WARNING;

                const alreadySent = await query(
                    'SELECT id FROM notification_logs WHERE recipient IN (?, ?) AND event = ? AND sentAt > ? LIMIT 1',
                    [email || '', phone || '', event, new Date(now.getTime() - 20 * 60 * 60 * 1000)]
                ) as any[];

                if (alreadySent.length > 0) continue;

                await notificationService.sendNotification({
                    event,
                    recipientRole: role,
                    recipientEmail: email,
                    recipientPhone: phone,
                    userId: row.userId,
                    tenantId: row.tenantId,
                    data: {
                        firstName: row.firstName,
                        documentType: docType,
                        expiryDate: new Date(now.getTime() + daysRemaining * 86400000).toLocaleDateString(),
                        daysRemaining: daysRemaining,
                        portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/member/profile`
                    }
                });

                results.sent++;
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
};
