import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: string;
            tenantId: string | null;
            firebaseUid?: string;
        } & DefaultSession['user'];
        token: any;
    }

    interface User {
        id: string;
        role: string;
        tenantId: string | null;
        firebaseUid?: string;
        firstName?: string;
        lastName?: string;
        status?: string;
    }
}
