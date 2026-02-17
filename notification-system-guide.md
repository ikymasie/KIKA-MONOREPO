# Notification System Usage Guide

## Quick Start

The notification system is now fully configured and ready to use. Here's how to integrate it into your application.

## Prerequisites

1. **Database Setup**: Run migrations to create notification tables
2. **Seed Templates**: Run the seed script to populate templates
3. **Environment Variables**: Ensure SMTP and SMS credentials are configured

```bash
# Seed notification templates
npm run ts-node scripts/seed-notification-templates.ts

# Test the system
npm run ts-node scripts/test-notifications.ts
```

## Basic Usage

### Sending a Notification

```typescript
import { notificationService } from '@/lib/notification-service';
import { NotificationEvent } from '@/lib/notification-types';
import { UserRole } from '@/src/entities/User';

// Example: Send deposit confirmation to member
await notificationService.sendNotification({
    event: NotificationEvent.MEMBER_DEPOSIT_RECEIVED,
    recipientRole: UserRole.MEMBER,
    recipientEmail: member.email,
    recipientPhone: member.phone,
    recipientName: member.fullName,
    userId: member.id,
    tenantId: member.tenantId,
    data: {
        memberName: member.fullName,
        amount: deposit.amount.toFixed(2),
        accountType: 'Savings',
        newBalance: newBalance.toFixed(2),
        date: new Date().toLocaleDateString(),
        reference: deposit.reference,
    },
});
```

## Integration Examples

### 1. Loan Approval Workflow

```typescript
// In your loan approval handler
async function approveLoan(loanId: string, approvedBy: string) {
    const loan = await loanRepo.findOne({ 
        where: { id: loanId }, 
        relations: ['member', 'tenant'] 
    });

    // Update loan status
    loan.status = LoanStatus.APPROVED;
    loan.approvedBy = approvedBy;
    loan.approvedDate = new Date();
    await loanRepo.save(loan);

    // Send notification to member
    await notificationService.sendNotification({
        event: NotificationEvent.MEMBER_LOAN_DECISION,
        recipientRole: UserRole.MEMBER,
        recipientEmail: loan.member.email,
        recipientPhone: loan.member.phone,
        recipientName: loan.member.fullName,
        userId: loan.member.id,
        tenantId: loan.tenantId,
        data: {
            decision: 'Congratulations',
            loanId: loan.id,
            status: 'APPROVED',
            message: 'Your loan has been approved. Funds will be disbursed shortly.',
            memberName: loan.member.fullName,
            amount: loan.amount.toLocaleString(),
            disbursementDate: loan.disbursementDate?.toLocaleDateString(),
            approved: true,
            portalLink: `${process.env.APP_URL}/member/loans/${loan.id}`,
        },
    });
}
```

### 2. Credit Committee Approval Request

```typescript
// When loan needs committee approval
async function requestCreditCommitteeApproval(loanId: string) {
    const loan = await loanRepo.findOne({ 
        where: { id: loanId }, 
        relations: ['member'] 
    });

    // Get all credit committee members
    const committeeMembers = await userRepo.find({
        where: { 
            role: UserRole.CREDIT_COMMITTEE,
            tenantId: loan.tenantId,
            status: UserStatus.ACTIVE,
        },
    });

    // Send notification to all committee members
    const notifications = committeeMembers.map(member => ({
        event: NotificationEvent.CREDIT_COMMITTEE_APPROVAL_REQUEST,
        recipientRole: UserRole.CREDIT_COMMITTEE,
        recipientEmail: member.email,
        recipientPhone: member.phone,
        userId: member.id,
        tenantId: loan.tenantId,
        data: {
            loanId: loan.id,
            applicantName: loan.member.fullName,
            amount: loan.amount.toLocaleString(),
            purpose: loan.purpose,
            creditScore: loan.creditScore || 'N/A',
            recommendation: 'Pending Review',
            approvalLink: `${process.env.APP_URL}/committee/loans/${loan.id}`,
        },
    }));

    await notificationService.sendBulkNotifications(notifications);
}
```

### 3. System Alert for SACCOS Admin

```typescript
// When critical system event occurs
async function sendSystemAlert(tenantId: string, alertType: string, message: string) {
    const admins = await userRepo.find({
        where: {
            role: UserRole.SACCOS_ADMIN,
            tenantId,
            status: UserStatus.ACTIVE,
        },
    });

    for (const admin of admins) {
        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            recipientEmail: admin.email,
            recipientPhone: admin.phone,
            userId: admin.id,
            tenantId,
            data: {
                alertMessage: message,
                alertType,
                actionRequired: 'Review system logs and take appropriate action',
                timestamp: new Date().toLocaleString(),
                dashboardLink: `${process.env.APP_URL}/admin/dashboard`,
            },
        });
    }
}
```

### 4. Guarantor Request

```typescript
// When member requests guarantor
async function requestGuarantor(loanId: string, guarantorId: string) {
    const loan = await loanRepo.findOne({ 
        where: { id: loanId }, 
        relations: ['member'] 
    });
    
    const guarantor = await memberRepo.findOne({ 
        where: { id: guarantorId } 
    });

    await notificationService.sendNotification({
        event: NotificationEvent.MEMBER_GUARANTOR_REQUEST,
        recipientRole: UserRole.MEMBER,
        recipientEmail: guarantor.email,
        recipientPhone: guarantor.phone,
        recipientName: guarantor.fullName,
        userId: guarantor.id,
        tenantId: loan.tenantId,
        data: {
            memberName: guarantor.fullName,
            applicantName: loan.member.fullName,
            loanId: loan.id,
            amount: loan.amount.toLocaleString(),
            purpose: loan.purpose,
            approvalLink: `${process.env.APP_URL}/member/guarantor-requests/${loan.id}`,
        },
    });
}
```

## Template Customization

Templates can be customized through the database:

```typescript
import { getDataSource } from '@/src/config/database';
import { NotificationTemplate } from '@/src/entities/NotificationTemplate';

async function updateTemplate(event: NotificationEvent, role: UserRole) {
    const dataSource = await getDataSource();
    const templateRepo = dataSource.getRepository(NotificationTemplate);

    const template = await templateRepo.findOne({
        where: { event, targetRole: role },
    });

    if (template) {
        template.smsTemplate = 'Your custom SMS template with {{placeholders}}';
        template.emailSubject = 'Custom Email Subject';
        template.emailTemplate = '<h2>Custom HTML Email</h2><p>{{content}}</p>';
        
        await templateRepo.save(template);
        
        // Clear cache to use new template
        notificationService.clearCache();
    }
}
```

## Monitoring Notifications

Query notification logs:

```typescript
import { NotificationLog } from '@/src/entities/NotificationLog';

// Get recent notifications for a user
const logs = await notificationLogRepo.find({
    where: { userId: user.id },
    order: { sentAt: 'DESC' },
    take: 10,
});

// Get failed notifications
const failed = await notificationLogRepo.find({
    where: { status: NotificationStatus.FAILED },
    order: { sentAt: 'DESC' },
});

// Get notifications by event type
const loanNotifications = await notificationLogRepo.find({
    where: { event: NotificationEvent.MEMBER_LOAN_DECISION },
    order: { sentAt: 'DESC' },
});
```

## Best Practices

1. **Always provide all required placeholders** - Check template definitions for required data
2. **Use tenant-specific sender names** - Pass `tenantName` in email messages for branding
3. **Handle errors gracefully** - Notifications are fire-and-forget, log failures for review
4. **Batch notifications when possible** - Use `sendBulkNotifications` for multiple recipients
5. **Monitor notification logs** - Regularly review failed notifications
6. **Test before deploying** - Use the test script to verify templates

## Environment Variables

Required in `.env`:

```bash
# Brevo SMTP (Email)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=a21b4b001@smtp-brevo.com
SMTP_PASS=your-api-key
SMTP_FROM=admin@dl-africa.com

# SMS Portal
SMS_PORTAL_CLIENT_ID=your-client-id
SMS_PORTAL_API_SECRET=your-api-secret
SMS_PORTAL_API_URL=https://rest.smsportal.com/v1
```

## Next Steps

1. Run database migrations to create tables
2. Seed notification templates
3. Test with the test script
4. Integrate into your business logic
5. Monitor notification logs
6. Customize templates as needed
