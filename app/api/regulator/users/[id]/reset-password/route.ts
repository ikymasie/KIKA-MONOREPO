import { NextRequest, NextResponse } from 'next/server';
import { generateTemporaryPassword, hashPassword } from '@/lib/password';
import { sendEmail, generateCredentialsEmail } from '@/lib/email';
import { query, execute } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [params.id]) as any[];
        const user = users[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Generate new temporary password
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await hashPassword(temporaryPassword);

        // Update user
        await execute(
            'UPDATE users SET temporaryPassword = ?, mustChangePassword = 1, updatedAt = NOW() WHERE id = ?',
            [hashedPassword, params.id]
        );

        // Send email with new credentials
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/signin`;

        const emailContent = generateCredentialsEmail({
            recipientName: user.firstName ? `${user.firstName} ${user.lastName}` : 'User',
            email: user.email || '',
            temporaryPassword,
            loginUrl
        });

        await sendEmail({
            to: user.email || '',
            subject: 'Password Reset - KIKA Platform',
            html: emailContent.html,
            text: emailContent.text
        });

        console.log(`✅ Password reset for ${user.email || 'unknown'}`);

        return NextResponse.json({
            success: true,
            message: 'Password reset email sent successfully'
        });

    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
