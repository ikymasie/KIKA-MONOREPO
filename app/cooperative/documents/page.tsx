'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentUpload from '@/components/applicant/DocumentUpload';
import { Upload, ArrowLeft } from 'lucide-react';
import Link from 'link';

export default function CooperativeDocumentsPage() {
    const searchParams = useSearchParams();
    const applicationId = searchParams.get('applicationId');
    const [appName, setAppName] = useState('');

    useEffect(() => {
        if (applicationId) {
            fetch(`/api/applications/${applicationId}`)
                .then(res => res.json())
                .then(data => setAppName(data.proposedName));
        }
    }, [applicationId]);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <Link
                    href="/cooperative"
                    className="flex items-center gap-2 text-slate-400 font-bold hover:text-primary-600 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Portal
                </Link>
            </div>

            <header className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-8">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                    <Upload size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Legal Documents</h1>
                    <p className="text-slate-500 font-medium">
                        {appName ? appName : 'Statutes and identification documents'}
                    </p>
                </div>
            </header>

            {applicationId ? (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <DocumentUpload applicationId={applicationId} onUpdate={() => { }} />
                </div>
            ) : (
                <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                    <p className="text-slate-400 font-bold">No application selected. Please select an application from your dashboard.</p>
                    <Link href="/cooperative" className="inline-block px-8 py-4 bg-primary-600 text-white font-black rounded-2xl">
                        Go to Dashboard
                    </Link>
                </div>
            )}
        </div>
    );
}
