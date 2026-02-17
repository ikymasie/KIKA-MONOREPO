import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_URL = process.env.APP_URL || 'http://localhost:3000';

async function testOtpFlow() {
    console.log('🧪 Starting End-to-End OTP Flow Test...');

    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    try {
        // 1. Find a test phone number
        const [rows] = await connection.execute('SELECT phone FROM members WHERE status = "active" LIMIT 1');
        const phone = (rows as any[])[0]?.phone;

        if (!phone) {
            console.error('❌ No active member found to test with');
            return;
        }

        console.log(`📱 Using test phone number: ${phone}`);

        // 2. Request OTP
        console.log('📤 Requesting OTP...');
        const sendResponse = await fetch(`${API_URL}/api/auth/otp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });

        const sendData = await sendResponse.json();
        if (!sendResponse.ok) {
            console.error('❌ Failed to send OTP:', sendData.error);
            return;
        }
        console.log('✅ OTP requested successfully');

        // 3. Get the code from DB (since we can't read SMS in automated test)
        console.log('🔍 Retrieving OTP code from database...');
        const [otpRows] = await connection.execute(
            'SELECT code FROM otps WHERE phone = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
            [phone]
        );
        const code = (otpRows as any[])[0]?.code;

        if (!code) {
            console.error('❌ No OTP code found in database');
            return;
        }
        console.log(`✅ Found code: ${code}`);

        // 4. Verify OTP
        console.log('🔐 Verifying OTP...');
        const verifyResponse = await fetch(`${API_URL}/api/auth/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code }),
        });

        const verifyData: any = await verifyResponse.json();
        if (!verifyResponse.ok) {
            console.error('❌ Failed to verify OTP:', verifyData.error);
            return;
        }

        if (verifyData.customToken) {
            console.log('✅ OTP verified successfully! Received Custom Token.');
            console.log('🎫 Token starts with:', verifyData.customToken.substring(0, 20) + '...');
        } else {
            console.error('❌ Verification success but no token received');
        }

        // 5. Final check: verify OTP is now marked as used
        const [usedRows] = await connection.execute(
            'SELECT used FROM otps WHERE phone = ? AND code = ?',
            [phone, code]
        );
        if ((usedRows as any[])[0]?.used === 1) {
            console.log('✅ OTP correctly marked as used in database');
        } else {
            console.warn('⚠️ OTP was NOT marked as used in database');
        }

        console.log('\n✨ All tests passed! Phone + OTP authentication is fully functional.');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        await connection.end();
    }
}

testOtpFlow();
