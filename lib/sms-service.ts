/**
 * SMS Portal Service
 * 
 * Production-ready service for sending SMS notifications via SMSPortal REST API.
 * Supports single and bulk SMS sending with comprehensive error handling.
 */

interface SMSMessage {
    to: string;
    message: string;
}

interface SMSResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    details?: any;
}

interface BulkSMSResponse {
    success: boolean;
    results: Array<{
        to: string;
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}

class SMSPortalService {
    private clientId: string;
    private apiSecret: string;
    private apiUrl: string;

    constructor() {
        this.clientId = process.env.SMS_PORTAL_CLIENT_ID || '1463fda2-2835-4cc2-a443-1954ddfc965b';
        this.apiSecret = process.env.SMS_PORTAL_API_SECRET || 'c97d097d-b755-47ba-b8c0-8fe3fe4b53a2';
        this.apiUrl = process.env.SMS_PORTAL_API_URL || 'https://rest.smsportal.com/v1';

        console.log('SMS PORTAL CRED TEST',process.env.SMS_PORTAL_API_SECRET)
        if (!this.clientId || !this.apiSecret) {
            console.warn('SMS Portal credentials not configured. SMS sending will fail.');
        }
    }

    /**
     * Get Basic Authentication header
     */
    private getAuthHeader(): string {
        const credentials = Buffer.from(`${this.clientId}:${this.apiSecret}`).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Validate phone number format
     */
    private validatePhoneNumber(phoneNumber: string): boolean {
        // Remove spaces and dashes
        const cleaned = phoneNumber.replace(/[\s-]/g, '');

        // Check if it starts with + and has 10-15 digits
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        return phoneRegex.test(cleaned);
    }

    /**
     * Format phone number to international format
     */
    private formatPhoneNumber(phoneNumber: string): string {
        let cleaned = phoneNumber.replace(/[\s-]/g, '');

        // If it doesn't start with +, assume it's a Botswana number
        if (!cleaned.startsWith('+')) {
            // Remove leading 0 if present
            if (cleaned.startsWith('0')) {
                cleaned = cleaned.substring(1);
            }
            // Add Botswana country code
            cleaned = `+267${cleaned}`;
        }

        return cleaned;
    }

    /**
     * Send a single SMS message
     * 
     * @param to - Recipient phone number (international format recommended)
     * @param message - Message content (max 160 characters for single SMS)
     * @returns Promise with SMS response
     */
    async sendSMS(to: string, message: string): Promise<SMSResponse> {
        try {
            // Validate inputs
            if (!to || !message) {
                return {
                    success: false,
                    error: 'Phone number and message are required'
                };
            }

            // Format and validate phone number
            const formattedPhone = this.formatPhoneNumber(to);
            if (!this.validatePhoneNumber(formattedPhone)) {
                return {
                    success: false,
                    error: `Invalid phone number format: ${to}`
                };
            }

            // Check credentials
            if (!this.clientId || !this.apiSecret) {
                return {
                    success: false,
                    error: 'SMS Portal credentials not configured'
                };
            }

            // Prepare request
            const requestBody = {
                messages: [
                    {
                        content: message,
                        destination: formattedPhone
                    }
                ]
            };

            console.log(`[SMS Service] Sending SMS to ${formattedPhone}`);

            // Send request to SMSPortal API
            const response = await fetch(`${this.apiUrl}/bulkmessages`, {
                method: 'POST',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('[SMS Service] API Error:', responseData);
                return {
                    success: false,
                    error: responseData.error || `HTTP ${response.status}: ${response.statusText}`,
                    details: responseData
                };
            }

            console.log('[SMS Service] SMS sent successfully:', responseData);

            return {
                success: true,
                messageId: responseData.id || responseData.messageId,
                details: responseData
            };

        } catch (error: any) {
            console.error('[SMS Service] Error sending SMS:', error);
            return {
                success: false,
                error: error.message || 'Failed to send SMS',
                details: error
            };
        }
    }

    /**
     * Send bulk SMS messages
     * 
     * @param messages - Array of messages with recipient and content
     * @returns Promise with bulk SMS response
     */
    async sendBulkSMS(messages: SMSMessage[]): Promise<BulkSMSResponse> {
        try {
            if (!messages || messages.length === 0) {
                return {
                    success: false,
                    results: []
                };
            }

            // Check credentials
            if (!this.clientId || !this.apiSecret) {
                return {
                    success: false,
                    results: messages.map(msg => ({
                        to: msg.to,
                        success: false,
                        error: 'SMS Portal credentials not configured'
                    }))
                };
            }

            // Validate and format all messages
            const formattedMessages = messages.map(msg => {
                const formattedPhone = this.formatPhoneNumber(msg.to);
                return {
                    content: msg.message,
                    destination: formattedPhone,
                    originalTo: msg.to
                };
            });

            // Prepare request
            const requestBody = {
                messages: formattedMessages.map(msg => ({
                    content: msg.content,
                    destination: msg.destination
                }))
            };

            console.log(`[SMS Service] Sending bulk SMS to ${messages.length} recipients`);

            // Send request to SMSPortal API
            const response = await fetch(`${this.apiUrl}/bulkmessages`, {
                method: 'POST',
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('[SMS Service] Bulk API Error:', responseData);
                return {
                    success: false,
                    results: messages.map(msg => ({
                        to: msg.to,
                        success: false,
                        error: responseData.error || `HTTP ${response.status}: ${response.statusText}`
                    }))
                };
            }

            console.log('[SMS Service] Bulk SMS sent successfully');

            // Parse results
            const results = formattedMessages.map((msg, index) => ({
                to: msg.originalTo,
                success: true,
                messageId: responseData.id || `${responseData.messageId}-${index}`
            }));

            return {
                success: true,
                results
            };

        } catch (error: any) {
            console.error('[SMS Service] Error sending bulk SMS:', error);
            return {
                success: false,
                results: messages.map(msg => ({
                    to: msg.to,
                    success: false,
                    error: error.message || 'Failed to send SMS'
                }))
            };
        }
    }

    /**
     * Check SMS Portal account balance (if supported by API)
     */
    async checkBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/account/balance`, {
                method: 'GET',
                headers: {
                    'Authorization': this.getAuthHeader(),
                }
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }

            const data = await response.json();
            return {
                success: true,
                balance: data.balance || data.credits
            };

        } catch (error: any) {
            console.error('[SMS Service] Error checking balance:', error);
            return {
                success: false,
                error: error.message || 'Failed to check balance'
            };
        }
    }
}

// Export singleton instance
export const smsService = new SMSPortalService();

// Export types
export type { SMSMessage, SMSResponse, BulkSMSResponse };
