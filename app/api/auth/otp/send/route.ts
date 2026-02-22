import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp-service';
import mysql from 'mysql2/promise';

/** Normalise a Botswana phone number to the format stored in the DB: 267XXXXXXXX */
function normalisePhone(raw: string): string {
    let p = raw.trim().replace(/\s+/g, '');
    if (p.startsWith('+267')) p = p.slice(1);       // +26771... → 26771...
    if (p.startsWith('0')) p = '267' + p.slice(1); // 071...   → 26771...
    if (!p.startsWith('267')) p = '267' + p;          // 71...    → 26771...
    return p;
}

export async function POST(request: NextRequest) {
    try {
        const { phone: rawPhone } = await request.json();

        if (!rawPhone) {
            return NextResponse.json(
                { error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const phone = normalisePhone(rawPhone);

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

            return NextResponse.json({ success: true, message: 'OTP sent successfully', phone });

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
