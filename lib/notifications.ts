export async function sendClaimNotification(phoneNumber: string, claimNumber: string, status: string, amount?: number) {
    const statusMessages: Record<string, string> = {
        'submitted': 'Triage Complete. Your claim #$NUM has been submitted for review.',
        'in_review': 'Your claim #$NUM is now under review by a claims officer.',
        'approved': 'Approved! Your claim #$NUM for P $AMT has been verified and sent for payment.',
        'paid': 'Payment Sent. Funds for claim #$NUM (P $AMT) have been released to your account.',
        'rejected': 'Claim Update: Your claim #$NUM was not approved. Portals are now open for appeal.',
        'under_appeal': 'Appeal Received. Your dispute for claim #$NUM has been escalated to senior management.',
        'final_rejection': 'Final Decision: The rejection for claim #$NUM has been upheld after thorough review.'
    };

    let msg = statusMessages[status] || `Update on your claim #$NUM: Current status is ${status}.`;
    msg = msg.replace('$NUM', claimNumber).replace('$AMT', amount?.toLocaleString() || '0');

    // MOCK: In production, this would call an SMS gateway like Twilio or Africa's Talking
    console.log(`[SMS GATEWAY] To: ${phoneNumber} | Message: ${msg}`);

    // Log to notification audit trail (mock)
    return { success: true, timestamp: new Date() };
}
