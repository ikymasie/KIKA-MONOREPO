import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp-service';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        // Verify that a user/member exists with this phone number
        // We use direct mysql connection to avoid circular dependencies during initial phases
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        });

        try {
            // Check in users table
            const [userRows] = await connection.execute(
                'SELECT id FROM users WHERE phone = ? AND status = "active" LIMIT 1',
                [phone]
            );

            const users = userRows as any[];

            if (!users || users.length === 0) {
                // If not in users table, check in members table
                const [memberRows] = await connection.execute(
                    'SELECT id FROM members WHERE phone = ? AND status = "active" LIMIT 1',
                    [phone]
                );

                const members = memberRows as any[];

                if (!members || members.length === 0) {
                    return NextResponse.json(
                        { error: 'No active account found with this phone number' },
                        { status: 404 }
                    );
                }
            }

            // Generate and send OTP
            const result = await otpService.generateOtp(phone);

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, message: 'OTP sent successfully' });

        } finally {
            await connection.end();
        }

    } catch (error: any) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send OTP' },
            { status: 500 }
        );
    }
}
