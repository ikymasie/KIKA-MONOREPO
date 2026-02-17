'use client';

import ApplicationWizard from '@/components/applicant/ApplicationWizard';
import { Suspense } from 'react';

export default function ApplyPage() {
    return (
        <div className="h-full">
            <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                </div>
            }>
                <ApplicationWizard />
            </Suspense>
        </div>
    );
}
