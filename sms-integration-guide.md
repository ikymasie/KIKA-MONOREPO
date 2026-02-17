# SMS Portal Integration Guide

Complete guide for using the SMS notification system in the KIKA platform.

## Quick Start

### 1. Environment Setup

The SMS Portal credentials are already configured in your `.env` file:

```env
SMS_PORTAL_CLIENT_ID=1463fda2-2835-4cc2-a443-1954ddfc965b
SMS_PORTAL_API_SECRET=c97d097d-b755-47ba-b8c0-8fe3fe4b53a2
SMS_PORTAL_API_URL=https://rest.smsportal.com/v1
```

### 2. Send SMS via API

**Endpoint:** `POST /api/notifications/sms`

**Authentication:** Required (must be signed in)

#### Single SMS

```bash
curl -X POST http://localhost:3000/api/notifications/sms \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "to": "+267XXXXXXXX",
    "message": "Your loan application has been approved!"
  }'
```

#### Bulk SMS

```bash
curl -X POST http://localhost:3000/api/notifications/sms \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "messages": [
      {
        "to": "+26771234567",
        "message": "Your payment is due tomorrow"
      },
      {
        "to": "+26772345678",
        "message": "Your claim has been processed"
      }
    ]
  }'
```

### 3. Check Account Balance

```bash
curl -X GET http://localhost:3000/api/notifications/sms \
  -H "Cookie: your-session-cookie"
```

## Usage Examples

### From Server Components

```typescript
// app/actions/notifications.ts
'use server';

import { smsService } from '@/lib/sms-service';

export async function sendWelcomeSMS(phoneNumber: string, userName: string) {
  const message = `Welcome to KIKA, ${userName}! Your account has been created successfully.`;
  
  const result = await smsService.sendSMS(phoneNumber, message);
  
  if (!result.success) {
    console.error('Failed to send welcome SMS:', result.error);
    return { success: false, error: result.error };
  }
  
  return { success: true, messageId: result.messageId };
}
```

### From Client Components

```typescript
// components/SendNotification.tsx
'use client';

import { useState } from 'react';

export function SendNotification() {
  const [loading, setLoading] = useState(false);
  
  const sendSMS = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: '+26771234567',
          message: 'Test notification'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('SMS sent successfully!');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button onClick={sendSMS} disabled={loading}>
      {loading ? 'Sending...' : 'Send SMS'}
    </button>
  );
}
```

### Common Use Cases

#### 1. Loan Approval Notification

```typescript
import { smsService } from '@/lib/sms-service';

async function notifyLoanApproval(customer: Customer, loanAmount: number) {
  const message = `Good news! Your loan application for BWP ${loanAmount.toLocaleString()} has been approved. Visit your portal to view details.`;
  
  await smsService.sendSMS(customer.phone_number, message);
}
```

#### 2. Payment Reminder

```typescript
async function sendPaymentReminder(customer: Customer, dueDate: Date, amount: number) {
  const formattedDate = dueDate.toLocaleDateString('en-BW');
  const message = `Reminder: Your payment of BWP ${amount} is due on ${formattedDate}. Please ensure timely payment to avoid penalties.`;
  
  await smsService.sendSMS(customer.phone_number, message);
}
```

#### 3. Bulk Notifications to Members

```typescript
async function notifyAllMembers(members: Customer[], announcement: string) {
  const messages = members.map(member => ({
    to: member.phone_number,
    message: `KIKA Announcement: ${announcement}`
  }));
  
  const result = await smsService.sendBulkSMS(messages);
  
  console.log(`Sent ${result.results.filter(r => r.success).length} out of ${messages.length} messages`);
}
```

#### 4. OTP/Verification Code

```typescript
async function sendVerificationCode(phoneNumber: string, code: string) {
  const message = `Your KIKA verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;
  
  await smsService.sendSMS(phoneNumber, message);
}
```

## Phone Number Format

The service automatically formats phone numbers to international format:

- **Input:** `71234567` → **Output:** `+26771234567` (Botswana)
- **Input:** `0712345678` → **Output:** `+26771234567`
- **Input:** `+26771234567` → **Output:** `+26771234567` (no change)

For international numbers, always include the country code with `+`.

## Error Handling

```typescript
const result = await smsService.sendSMS(phoneNumber, message);

if (!result.success) {
  // Handle different error types
  if (result.error?.includes('Invalid phone number')) {
    console.error('Phone number validation failed');
  } else if (result.error?.includes('credentials not configured')) {
    console.error('SMS service not properly configured');
  } else if (result.error?.includes('HTTP 401')) {
    console.error('Authentication failed - check credentials');
  } else {
    console.error('Unknown error:', result.error);
  }
}
```

## Best Practices

### 1. Message Length

- Keep messages under 160 characters for single SMS
- Messages longer than 160 characters will be split into multiple SMS (additional cost)

### 2. Cost Optimization

```typescript
// ❌ Bad: Sending individual SMS in a loop
for (const customer of customers) {
  await smsService.sendSMS(customer.phone, message);
}

// ✅ Good: Using bulk SMS
const messages = customers.map(c => ({
  to: c.phone,
  message: message
}));
await smsService.sendBulkSMS(messages);
```

### 3. Rate Limiting

Consider implementing rate limiting for user-triggered SMS:

```typescript
// Example: Limit to 5 SMS per user per hour
const RATE_LIMIT = 5;
const TIME_WINDOW = 60 * 60 * 1000; // 1 hour

// Store in Redis or database
const userSMSCount = await redis.get(`sms:${userId}`);

if (userSMSCount >= RATE_LIMIT) {
  throw new Error('SMS rate limit exceeded. Please try again later.');
}
```

### 4. Logging and Monitoring

```typescript
// Log all SMS sends for audit trail
await db.smsLog.create({
  recipient: phoneNumber,
  message: message,
  status: result.success ? 'sent' : 'failed',
  messageId: result.messageId,
  error: result.error,
  sentBy: userId,
  sentAt: new Date()
});
```

### 5. Template Management

```typescript
// Create reusable message templates
const SMS_TEMPLATES = {
  LOAN_APPROVED: (name: string, amount: number) => 
    `Congratulations ${name}! Your loan of BWP ${amount} has been approved.`,
  
  PAYMENT_DUE: (amount: number, date: string) =>
    `Payment reminder: BWP ${amount} due on ${date}.`,
  
  CLAIM_PROCESSED: (claimId: string) =>
    `Your claim #${claimId} has been processed. Check your portal for details.`
};

// Usage
await smsService.sendSMS(
  customer.phone,
  SMS_TEMPLATES.LOAN_APPROVED(customer.name, loanAmount)
);
```

## Testing

### Test in Development

```typescript
// Create a test endpoint or script
async function testSMS() {
  const result = await smsService.sendSMS(
    '+26771234567', // Your test number
    'Test message from KIKA platform'
  );
  
  console.log('Result:', result);
}
```

### Mock for Unit Tests

```typescript
// __mocks__/sms-service.ts
export const smsService = {
  sendSMS: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id'
  }),
  sendBulkSMS: jest.fn().mockResolvedValue({
    success: true,
    results: []
  })
};
```

## Troubleshooting

### Issue: "SMS Portal credentials not configured"

**Solution:** Ensure environment variables are set in `.env`:
```env
SMS_PORTAL_CLIENT_ID=1463fda2-2835-4cc2-a443-1954ddfc965b
SMS_PORTAL_API_SECRET=c97d097d-b755-47ba-b8c0-8fe3fe4b53a2
```

### Issue: "Invalid phone number format"

**Solution:** Ensure phone numbers are in valid format:
- Include country code: `+26771234567`
- Or let the service auto-format Botswana numbers: `71234567`

### Issue: "HTTP 401: Unauthorized"

**Solution:** Check that your API credentials are correct and active in the SMSPortal dashboard.

### Issue: Messages not being delivered

**Solution:**
1. Check SMSPortal dashboard for delivery status
2. Verify the phone number is correct and active
3. Check account balance
4. Review SMSPortal logs for any blocks or restrictions

## Security Considerations

1. **Never expose credentials in client-side code**
   - Always use server-side API routes
   - Keep credentials in `.env` (never commit to git)

2. **Validate user permissions**
   - Check if user has permission to send SMS
   - Implement role-based access control

3. **Sanitize message content**
   - Prevent injection of malicious content
   - Validate message length and format

4. **Monitor usage**
   - Track SMS sends per user/organization
   - Set up alerts for unusual activity
   - Regular audit of SMS logs

## Support

For SMSPortal API issues:
- Dashboard: https://www.smsportal.com
- API Documentation: https://rest.smsportal.com/docs
- Support: Contact SMSPortal support team

For KIKA platform issues:
- Check application logs
- Review this documentation
- Contact your development team
