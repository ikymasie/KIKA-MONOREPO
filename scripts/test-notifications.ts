/**
 * Test Notification System
 * 
 * Script to test the notification system by sending test notifications.
 */

import { notificationService } from '../lib/notification-service';
import { NotificationEvent } from '../lib/notification-types';
import { UserRole } from '../src/entities/User';

async function testNotifications() {
    console.log('[Test] Testing notification system...\n');

    // Test 1: Member Deposit Received
    console.log('[Test] 1. Testing Member Deposit Notification...');
    await notificationService.sendNotification({
        event: NotificationEvent.MEMBER_DEPOSIT_RECEIVED,
        recipientRole: UserRole.MEMBER,
        recipientEmail: 'test@example.com', // Replace with your test email
        recipientPhone: '+26771234567', // Replace with your test phone
        recipientName: 'John Doe',
        data: {
            memberName: 'John Doe',
            amount: '500.00',
            accountType: 'Savings',
            newBalance: '2,500.00',
            date: new Date().toLocaleDateString(),
            reference: 'DEP-001',
        },
    });

    // Wait a bit between sends
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Loan Approval
    console.log('[Test] 2. Testing Loan Approval Notification...');
    await notificationService.sendNotification({
        event: NotificationEvent.MEMBER_LOAN_DECISION,
        recipientRole: UserRole.MEMBER,
        recipientEmail: 'test@example.com',
        recipientPhone: '+26771234567',
        recipientName: 'John Doe',
        data: {
            decision: 'Congratulations',
            loanId: 'L123',
            status: 'APPROVED',
            message: 'Your loan has been approved. Funds will be disbursed shortly.',
            memberName: 'John Doe',
            amount: '50,000.00',
            disbursementDate: new Date().toLocaleDateString(),
            approved: true,
            portalLink: 'http://localhost:3000/member/loans/L123',
        },
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: System Alert (SACCOS Admin)
    console.log('[Test] 3. Testing System Alert Notification...');
    await notificationService.sendNotification({
        event: NotificationEvent.SACCOS_SYSTEM_ALERT,
        recipientRole: UserRole.SACCOS_ADMIN,
        recipientEmail: 'admin@example.com',
        recipientPhone: '+26771234567',
        data: {
            alertMessage: 'Regulator has updated the Deduction CSV spec. Action required.',
            alertType: 'Regulatory Update',
            actionRequired: 'Review and update deduction file format',
            timestamp: new Date().toLocaleString(),
            dashboardLink: 'http://localhost:3000/admin/dashboard',
        },
    });

    console.log('\n[Test] ✅ Test notifications sent!');
    console.log('[Test] Check your email and phone for test messages.');

    process.exit(0);
}

// Run the test
testNotifications().catch(error => {
    console.error('[Test] ❌ Error:', error);
    process.exit(1);
});
