'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, FileUp } from 'lucide-react';
import FileUpload from '@/components/common/FileUpload';

interface DocumentUploadProps {
    applicationId: string;
    onUpdate?: () => void;
}

export default function DocumentUpload({ applicationId, onUpdate }: DocumentUploadProps) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, [applicationId]);

    const fetchDocuments = async () => {
        try {
            const res = await fetch(`/api/applications/documents/upload?applicationId=${applicationId}`);
            if (res.ok) setDocuments(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const docTypes = [
        { type: 'CONSTITUTION', label: 'Society Constitution', desc: 'The governing rules of your society' },
        { type: 'FORM_A', label: 'Form A (Application)', desc: 'Completed and signed Form A' },
        { type: 'MEMBERSHIP_LIST', label: 'Membership List', desc: 'A detailed list of all foundation members' },
        { type: 'VIABILITY_REPORT', label: 'Viability Report', desc: 'Required for SACCOS/Coops' },
    ];

    if (loading) return <div>Loading documents...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {docTypes.map((doc) => {
                const existingDoc = documents.find(d => d.documentType === doc.type.toLowerCase());
                return (
                    <div key={doc.type} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="font-bold text-gray-900">{doc.label}</h4>
                                <p className="text-xs text-gray-500 font-medium">{doc.desc}</p>
                            </div>
                            {existingDoc && <CheckCircle2 className="text-green-500" size={24} />}
                        </div>

                        <FileUpload
                            storagePath={`applications/${applicationId}/${doc.type.toLowerCase()}`}
                            onUploadComplete={async (url) => {
                                const res = await fetch('/api/applications/documents/upload', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        applicationId,
                                        documentType: doc.type.toLowerCase(),
                                        fileName: `${doc.label}.pdf`,
                                        fileUrl: url
                                    })
                                });
                                if (res.ok) {
                                    await fetchDocuments();
                                    onUpdate?.();
                                }
                            }}
                            acceptedTypes={['application/pdf', 'image/*']}
                            label=""
                            helperText="Upload PDF or Scanned Image"
                            currentFileUrl={existingDoc?.fileUrl}
                        />
                    </div>
                );
            })}
        </div>
    );
}
