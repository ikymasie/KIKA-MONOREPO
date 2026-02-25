import { queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notification-service';
import { NotificationEvent } from './notification-types';
import { UserRole } from '../src/entities/User';
import { RowDataPacket } from 'mysql2/promise';

export class OtpService {
    /**
     * Generate a 6-digit OTP and send it via SMS
     */
    async generateOtp(phone: string): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // 2. Set expiry (10 minutes from now)
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            // 3. Save to database using raw SQL
            const id = uuidv4();
            await execute(
                `INSERT INTO otps (id, phone, code, expiresAt, used, createdAt)
                 VALUES (?, ?, ?, ?, false, NOW())`,
                [id, phone, code, expiresAt]
            );

            // 4. Send via notification service
            await notificationService.sendNotification({
                event: NotificationEvent.MEMBER_LOGIN_OTP,
                recipientRole: UserRole.MEMBER, // Default to member for OTP login
                recipientPhone: phone,
                data: {
                    otp: code,
                },
            });

            console.log(`[Otp Service] Generated OTP for ${phone}`);
            return { success: true };

        } catch (error: any) {
            console.error('[Otp Service] Error generating OTP:', error);
            return { success: false, error: 'Failed to generate OTP' };
        }
    }

    /**
     * Verify an OTP code
     */
    async verifyOtp(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Find valid, unused OTP for this phone using raw SQL
            const otp = await queryOne<RowDataPacket & { id: string }>(
                `SELECT id FROM otps 
                 WHERE phone = ? AND code = ? AND used = false AND expiresAt > NOW()
                 ORDER BY createdAt DESC LIMIT 1`,
                [phone, code]
            );

            if (!otp) {
                return { success: false, error: 'Invalid or expired OTP' };
            }

            // Mark as used
            await execute(
                'UPDATE otps SET used = true WHERE id = ?',
                [otp.id]
            );

            return { success: true };

        } catch (error: any) {
            console.error('[Otp Service] Error verifying OTP:', error);
            return { success: false, error: 'Failed to verify OTP' };
        }
    }
}

export const otpService = new OtpService();
