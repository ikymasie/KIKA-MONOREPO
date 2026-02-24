'use client';

import { redirect } from 'next/navigation';

export default function HomePage() {
    // For on-premise deployments, we bypass the public marketing
    // landing page entirely and go straight to the internal login logic.
    redirect('/auth/signin');

    return null;
}
