import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

// Default tenant for on-prem single-tenant bypassed deployments.
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'kika-default-tenant';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Create direct MySQL connection (avoiding TypeORM circular dependency)
                const connection = await mysql.createConnection({
                    host: process.env.DATABASE_HOST || 'localhost',
                    port: parseInt(process.env.DATABASE_PORT || '3306'),
                    user: process.env.DATABASE_USERNAME,
                    password: process.env.DATABASE_PASSWORD,
                    database: process.env.DATABASE_NAME,
                    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
                });

                try {
                    // Query user from database
                    const [rows] = await connection.execute(
                        'SELECT id, email, passwordHash, firstName, lastName, role, tenantId, firebaseUid, status FROM users WHERE email = ?',
                        [credentials.email]
                    );

                    const users = rows as any[];

                    if (!users || users.length === 0) {
                        return null;
                    }

                    const user = users[0];

                    if (user.status !== 'active') {
                        throw new Error('Account is not active');
                    }

                    // For the sake of the on-prem transition, we'll verify the passwordHash
                    if (!user.passwordHash) {
                        throw new Error("No local password set for this account. Please contact administrator.");
                    }

                    const passwordsMatch = await bcrypt.compare(credentials.password, user.passwordHash);

                    if (!passwordsMatch) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        role: user.role,
                        // Always inject the default tenant for on-prem bypass
                        tenantId: user.tenantId || DEFAULT_TENANT_ID,
                        firebaseUid: user.firebaseUid,
                    };

                } finally {
                    await connection.end();
                }
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.tenantId = user.tenantId; // Will contain DEFAULT_TENANT_ID if applicable
                token.firebaseUid = user.firebaseUid;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.tenantId = token.tenantId as string;
                session.user.firebaseUid = token.firebaseUid as string;
                session.token = token;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400"),
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_change_in_production",
};
