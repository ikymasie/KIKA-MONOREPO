'use client';

import CooperativeWizard from '@/components/cooperative/CooperativeWizard';

/**
 * /cooperative/wizard?id=<applicationId>
 * CooperativeWizard reads the `id` query param natively via useSearchParams().
 * This route exists so that "Continue Application" links resolve correctly.
 */
export default function CooperativeWizardPage() {
    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <CooperativeWizard />
        </div>
    );
}
