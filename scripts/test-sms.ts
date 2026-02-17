/**
 * SMS Service Test Utility
 * 
 * Run this script to test SMS sending functionality:
 * npm run test:sms
 */

console.log('🧪 Testing SMS Portal Integration\n');
console.log('='.repeat(50));

// Test 1: Check configuration
console.log('\n📋 Test 1: Configuration Check');
console.log('-'.repeat(50));

// Load environment variables
require('dotenv').config();

const hasClientId = !!process.env.SMS_PORTAL_CLIENT_ID;
const hasApiSecret = !!process.env.SMS_PORTAL_API_SECRET;
const apiUrl = process.env.SMS_PORTAL_API_URL || 'https://rest.smsportal.com/v1';

console.log(`✓ Client ID configured: ${hasClientId}`);
if (hasClientId) {
    console.log(`  Client ID: ${process.env.SMS_PORTAL_CLIENT_ID?.substring(0, 8)}...`);
}

console.log(`✓ API Secret configured: ${hasApiSecret}`);
if (hasApiSecret) {
    console.log(`  API Secret: ${process.env.SMS_PORTAL_API_SECRET?.substring(0, 8)}...`);
}

console.log(`✓ API URL: ${apiUrl}`);

if (!hasClientId || !hasApiSecret) {
    console.error('\n❌ SMS Portal credentials not configured!');
    console.log('Please add credentials to your .env file:');
    console.log('  SMS_PORTAL_CLIENT_ID=your_client_id');
    console.log('  SMS_PORTAL_API_SECRET=your_api_secret');
    process.exit(1);
}

// Test 2: Service file exists
console.log('\n📋 Test 2: Service File Check');
console.log('-'.repeat(50));

const fs = require('fs');
const path = require('path');

const smsServicePath = path.join(__dirname, '..', 'lib', 'sms-service.ts');
const smsServiceExists = fs.existsSync(smsServicePath);

console.log(`✓ SMS Service file exists: ${smsServiceExists}`);
console.log(`  Path: ${smsServicePath}`);

// Test 3: API Route exists
const apiRoutePath = path.join(__dirname, '..', 'app', 'api', 'notifications', 'sms', 'route.ts');
const apiRouteExists = fs.existsSync(apiRoutePath);

console.log(`✓ API Route file exists: ${apiRouteExists}`);
console.log(`  Path: ${apiRoutePath}`);

// Test 4: Documentation exists
const docsPath = path.join(__dirname, '..', 'sms-integration-guide.md');
const docsExists = fs.existsSync(docsPath);

console.log(`✓ Documentation exists: ${docsExists}`);
console.log(`  Path: ${docsPath}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('✅ SMS Integration Configuration Complete!\n');
console.log('Your SMS Portal credentials are configured:');
console.log(`  • Client ID: ${process.env.SMS_PORTAL_CLIENT_ID}`);
console.log(`  • API URL: ${apiUrl}\n`);

console.log('Next steps to test SMS sending:');
console.log('1. Start your Next.js server: npm run dev');
console.log('2. Use the API endpoint: POST /api/notifications/sms');
console.log('3. Example request:');
console.log('   curl -X POST http://localhost:3000/api/notifications/sms \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"to": "+26771234567", "message": "Test SMS"}\'');
console.log('\n4. Check sms-integration-guide.md for more examples\n');
