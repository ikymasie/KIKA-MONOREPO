import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/sms-service';
import { getServerSession } from '@/lib/auth-server';

/**
 * POST /api/notifications/sms
 * 
 * Send SMS notifications via SMSPortal
 * 
 * Request Body:
 * - Single SMS: { "to": "+267XXXXXXXX", "message": "Your message" }
 * - Bulk SMS: { "messages": [{ "to": "+267XXXXXXXX", "message": "Message 1" }, ...] }
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();

        // Handle bulk SMS
        if (body.messages && Array.isArray(body.messages)) {
            // Validate bulk messages
            if (body.messages.length === 0) {
                return NextResponse.json(
                    { error: 'No messages provided' },
                    { status: 400 }
                );
            }

            // Validate each message
            for (const msg of body.messages) {
                if (!msg.to || !msg.message) {
                    return NextResponse.json(
                        { error: 'Each message must have "to" and "message" fields' },
                        { status: 400 }
                    );
                }
            }

            // Send bulk SMS
            const result = await smsService.sendBulkSMS(body.messages);

            if (!result.success) {
                return NextResponse.json(
                    {
                        error: 'Failed to send bulk SMS',
                        results: result.results
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: `Sent ${result.results.length} SMS messages`,
                results: result.results
            });
        }

        // Handle single SMS
        if (body.to && body.message) {
            const result = await smsService.sendSMS(body.to, body.message);

            if (!result.success) {
                return NextResponse.json(
                    {
                        error: result.error || 'Failed to send SMS',
                        details: result.details
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'SMS sent successfully',
                messageId: result.messageId
            });
        }

        // Invalid request format
        return NextResponse.json(
            {
                error: 'Invalid request format. Provide either { "to", "message" } or { "messages": [...] }'
            },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('[SMS API] Error:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/notifications/sms
 * 
 * Check SMS Portal account balance
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            );
        }

        // Check balance
        const result = await smsService.checkBalance();

        if (!result.success) {
            return NextResponse.json(
                {
                    error: result.error || 'Failed to check balance'
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            balance: result.balance
        });

    } catch (error: any) {
        console.error('[SMS API] Error checking balance:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error.message
            },
            { status: 500 }
        );
    }
}
