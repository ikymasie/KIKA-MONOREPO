import { getDataSource } from '../src/config/database';
import { Otp } from '../src/entities/Otp';
import { notificationService } from './notification-service';
import { NotificationEvent } from './notification-types';
import { UserRole } from '../src/entities/User';
import { MoreThan } from 'typeorm';

export class OtpService {
    /**
     * Generate a 6-digit OTP and send it via SMS
     */
    async generateOtp(phone: string): Promise<{ success: boolean; error?: string }> {
        try {
            const dataSource = await getDataSource();
            const otpRepository = dataSource.getRepository(Otp);

            // 1. Generate 6-digit code
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // 2. Set expiry (10 minutes from now)
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            // 3. Save to database
            const otp = otpRepository.create({
                phone,
                code,
                expiresAt,
            });
            await otpRepository.save(otp);

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
            const dataSource = await getDataSource();
            const otpRepository = dataSource.getRepository(Otp);

            // Find valid, unused OTP for this phone
            const otp = await otpRepository.findOne({
                where: {
                    phone,
                    code,
                    used: false,
                    expiresAt: MoreThan(new Date()),
                },
                order: {
                    createdAt: 'DESC',
                },
            });

            if (!otp) {
                return { success: false, error: 'Invalid or expired OTP' };
            }

            // Mark as used
            otp.used = true;
            await otpRepository.save(otp);

            return { success: true };

        } catch (error: any) {
            console.error('[Otp Service] Error verifying OTP:', error);
            return { success: false, error: 'Failed to verify OTP' };
        }
    }
}

export const otpService = new OtpService();
