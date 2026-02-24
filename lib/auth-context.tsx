'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
    firebaseUid?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    firebaseUser: any | null; // Deprecated placeholder for compatibility
    loading: boolean;
    signIn: (email: string, password: string) => Promise<any>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    // We map the NextAuth session user to the AuthUser interface 
    // expected by the rest of the application
    const user: AuthUser | null = session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || session.user.email || 'User',
        role: session.user.role || 'member',
        tenantId: session.user.tenantId || undefined,
        firebaseUid: session.user.firebaseUid,
    } : null;

    const loading = status === 'loading';

    const signIn = async (email: string, password: string) => {
        try {
            const res = await nextAuthSignIn('credentials', {
                redirect: false,
                email,
                password,
            });
            if (res?.error) {
                throw new Error(res.error);
            }
            return res;
        } catch (error: any) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await nextAuthSignOut({ redirect: false });
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const refreshSession = async () => {
        // NextAuth automatically handles session refreshing if configured,
        // but can be manually triggered by reloading the window or 
        // calling getSession() if needed.
        console.log("Session refresh requested locally");
    };

    const value: AuthContextType = {
        user,
        firebaseUser: null, // Removed external dependency
        loading,
        signIn,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}
