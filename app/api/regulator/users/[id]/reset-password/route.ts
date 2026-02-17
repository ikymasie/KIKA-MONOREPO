import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { User } from '@/entities/User';
import { generateTemporaryPassword, hashPassword } from '@/lib/password';
import { sendEmail, generateCredentialsEmail } from '@/lib/email';
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: params.id } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Generate new temporary password
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await hashPassword(temporaryPassword);

        // Update user
        user.temporaryPassword = hashedPassword;
        user.mustChangePassword = true;

        await userRepo.save(user);

        // Send email with new credentials
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/signin`;

        const emailContent = generateCredentialsEmail({
            recipientName: user.fullName,
            email: user.email,
            temporaryPassword,
            loginUrl
        });

        await sendEmail({
            to: user.email,
            subject: 'Password Reset - KIKA Platform',
            html: emailContent.html,
            text: emailContent.text
        });

        console.log(`✅ Password reset for ${user.email}`);

        return NextResponse.json({
            success: true,
            message: 'Password reset email sent successfully'
        });

    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
