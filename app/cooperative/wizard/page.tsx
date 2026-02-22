'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CooperativeWizard from '@/components/cooperative/CooperativeWizard';

/**
 * /cooperative/wizard?id=<applicationId>
 * Wrapper that accepts an `id` query param and passes it to CooperativeWizard
 * to resume an existing application.
 */
export default function CooperativeWizardPage() {
    const searchParams = useSearchParams();
    const applicationId = searchParams.get('id') || undefined;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <CooperativeWizard applicationId={applicationId} />
        </div>
    );
}
