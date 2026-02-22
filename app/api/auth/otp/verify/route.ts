import { NextRequest, NextResponse } from 'next/server';
import { otpService } from '@/lib/otp-service';
import { adminAuth } from '@/lib/firebase-admin';
import mysql from 'mysql2/promise';

/** Normalise a Botswana phone number to the format stored in the DB: 267XXXXXXXX */
function normalisePhone(raw: string): string {
    let p = raw.trim().replace(/\s+/g, '');
    if (p.startsWith('+267')) p = p.slice(1);
    if (p.startsWith('0')) p = '267' + p.slice(1);
    if (!p.startsWith('267')) p = '267' + p;
    return p;
}

export async function POST(request: NextRequest) {
    try {
        const { phone: rawPhone, code } = await request.json();

        if (!rawPhone || !code) {
            return NextResponse.json(
                { error: 'Phone number and code are required' },
                { status: 400 }
            );
        }

        const phone = normalisePhone(rawPhone);

        // 1. Verify OTP
        const verificationResult = await otpService.verifyOtp(phone, code);

        if (!verificationResult.success) {
            return NextResponse.json(
                { error: verificationResult.error },
                { status: 401 }
            );
        }

        // 2. Find user in database to get Firebase UID or info for custom token
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        });

        try {
            // First check users table
            const [userRows] = await connection.execute(
                'SELECT id, firebaseUid, role, tenantId, email FROM users WHERE phone = ? AND status = "active" LIMIT 1',
                [phone]
            );

            let user = (userRows as any[])[0];

            if (!user) {
                // Check members table (members might not have a user account yet)
                const [memberRows] = await connection.execute(
                    'SELECT m.id, m.userId, u.firebaseUid, m.email, m.tenantId FROM members m LEFT JOIN users u ON m.userId = u.id WHERE m.phone = ? AND m.status = "active" LIMIT 1',
                    [phone]
                );

                const member = (memberRows as any[])[0];

                if (!member) {
                    return NextResponse.json(
                        { error: 'User not found' },
                        { status: 404 }
                    );
                }

                // If member exists but no user record, we should ideally create one or handle accordingly.
                // For KIKA, members usually have a User record with role 'member'.
                if (!member.firebaseUid) {
                    // This is a case where the member exists but hasn't had a Firebase account linked.
                    // We might need to handle this by creating a Firebase user.
                    // For now, let's assume members that sign in have been provisioned or we handle it gracefully.
                    return NextResponse.json(
                        { error: 'Account not fully provisioned for phone login' },
                        { status: 400 }
                    );
                }

                user = {
                    firebaseUid: member.firebaseUid,
                    role: 'member',
                    tenantId: member.tenantId,
                    userId: member.id,
                };
            }

            // 3. Generate Firebase Custom Token
            // We use the firebaseUid to create a token that the client can use to sign in
            const customToken = await adminAuth.createCustomToken(user.firebaseUid, {
                role: user.role,
                tenantId: user.tenantId,
                userId: user.id
            });

            return NextResponse.json({
                success: true,
                customToken,
                user: {
                    role: user.role
                }
            });

        } finally {
            await connection.end();
        }

    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
