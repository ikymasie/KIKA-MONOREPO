import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { KYC } from '@/src/entities/KYC';
import { Member } from '@/src/entities/Member';
import { User } from '@/src/entities/User';
import { NotificationLog } from '@/src/entities/NotificationLog';
import { notificationService } from '@/lib/notification-service';
import { NotificationEvent, NotificationChannel, NotificationStatus } from '@/lib/notification-types';
import { LessThanOrEqual, MoreThan, IsNull, Not, In } from 'typeorm';

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

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const kycRepo = AppDataSource.getRepository(KYC);
    const logRepo = AppDataSource.getRepository(NotificationLog);
    const memberRepo = AppDataSource.getRepository(Member); // To get User details

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

            // 1. Omang
            const expiringOmang = await kycRepo.find({
                where: {
                    omangExpiryDate: MoreThan(startOfDay) && LessThanOrEqual(endOfDay) as any // TypeORM date range syntax hint
                    // Actually TypeORM 'Between' is better
                } as any,
                relations: ['member', 'member.user']
            });
            // TypeORM find options for dates can be tricky with exact matches, using raw query or Between is safer usually. 
            // Let's use QueryBuilder for better control over dates

            const qb = kycRepo.createQueryBuilder('kyc')
                .leftJoinAndSelect('kyc.member', 'member')
                .leftJoinAndSelect('member.user', 'user')
                .where('member.status = :status', { status: 'active' });

            // We want (expiry >= start AND expiry <= end)
            // But doing this for all 3 doc types in one query implies ORs.

            // Let's process the records in memory if the dataset isn't huge, 
            // OR simply run 3 separate efficient queries for this specific day.

            // Query 1: OMANG
            const omangList = await kycRepo.createQueryBuilder('kyc')
                .innerJoinAndSelect('kyc.member', 'member')
                .leftJoinAndSelect('member.user', 'user')
                .where('kyc.omangExpiryDate >= :start AND kyc.omangExpiryDate <= :end', { start: startOfDay, end: endOfDay })
                .getMany();

            await processExpiryBatch(omangList, 'Omang / National ID', days);

            // Query 2: PASSPORT
            const passportList = await kycRepo.createQueryBuilder('kyc')
                .innerJoinAndSelect('kyc.member', 'member')
                .leftJoinAndSelect('member.user', 'user')
                .where('kyc.passportExpiryDate >= :start AND kyc.passportExpiryDate <= :end', { start: startOfDay, end: endOfDay })
                .getMany();

            await processExpiryBatch(passportList, 'Passport', days);

            // Query 3: WORK PERMIT
            const permitList = await kycRepo.createQueryBuilder('kyc')
                .innerJoinAndSelect('kyc.member', 'member')
                .leftJoinAndSelect('member.user', 'user')
                .where('kyc.workPermitExpiryDate >= :start AND kyc.workPermitExpiryDate <= :end', { start: startOfDay, end: endOfDay })
                .getMany();

            await processExpiryBatch(permitList, 'Work Permit', days);
        }

        async function processExpiryBatch(list: KYC[], docType: string, daysRemaining: number) {
            results.checked += list.length;

            for (const kyc of list) {
                if (!kyc.member) continue;

                // If member isn't linked to a User, we might send SMS to phone
                // If they are linked, we have User properties (email etc)
                const member = kyc.member;
                const user = member.user;

                // Determine contact details
                const phone = user?.phone || member.phone;
                const email = user?.email || member.email;
                const role = user?.role || 'member';

                const event = daysRemaining === 0
                    ? NotificationEvent.MEMBER_KYC_EXPIRED
                    : NotificationEvent.MEMBER_KYC_EXPIRY_WARNING;

                // Check deduplication log
                // Have we sent this specific event to this user for this doc type today?
                // We can use a unique key in metadata or just check last sent time for this event
                const alreadySent = await logRepo.findOne({
                    where: {
                        recipient: email || phone,
                        event: event,
                        metadata: { // JSON queries in TypeORM can be database specific, be careful
                            // Ideally we store a hash or key. 
                            // For now, let's just query by time + event + recipient
                            // and filter in code if needed.
                        } as any,
                        sentAt: MoreThan(new Date(now.getTime() - 20 * 60 * 60 * 1000)) // Sent in last 20 hours
                    } as any
                });

                if (alreadySent) continue;

                await notificationService.sendNotification({
                    event,
                    recipientRole: role,
                    recipientEmail: email,
                    recipientPhone: phone,
                    userId: user?.id,
                    tenantId: member.tenantId,
                    data: {
                        firstName: member.firstName,
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
