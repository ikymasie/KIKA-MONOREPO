'use client';

import { useState } from 'react';
import FileUpload from '@/components/common/FileUpload';
import { getApplicationDocumentPath, generateUniqueFileName } from '@/lib/firebase-storage';
import { DocumentType } from '@/entities/ApplicationDocument';

interface DocumentUploadFormProps {
    applicationId: string;
    onUploadComplete?: (document: any) => void;
    onUploadError?: (error: string) => void;
}

const DOCUMENT_TYPE_OPTIONS = [
    { value: DocumentType.CONSTITUTION, label: 'Constitution' },
    { value: DocumentType.FORM_A, label: 'Form A' },
    { value: DocumentType.MEMBERSHIP_LIST, label: 'Membership List' },
    { value: DocumentType.VIABILITY_REPORT, label: 'Viability Report' },
    { value: DocumentType.PROOF_OF_CAPITAL, label: 'Proof of Capital' },
    { value: DocumentType.CERTIFICATE, label: 'Certificate' },
    { value: DocumentType.REJECTION_NOTICE, label: 'Rejection Notice' },
    { value: DocumentType.APPEAL_LETTER, label: 'Appeal Letter' },
];

export default function DocumentUploadForm({
    applicationId,
    onUploadComplete,
    onUploadError,
}: DocumentUploadFormProps) {
    const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.CONSTITUTION);
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string | undefined>(undefined);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async () => {
        if (!uploadedFileUrl) {
            onUploadError?.('Please upload a document first');
            return;
        }

        setUploading(true);

        try {
            const response = await fetch(`/api/regulator/applications/${applicationId}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileUrl: uploadedFileUrl,
                    documentType,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save document');
            }

            const data = await response.json();
            onUploadComplete?.(data.document);

            // Reset form
            setUploadedFileUrl(undefined);
            setDocumentType(DocumentType.CONSTITUTION);
        } catch (error: any) {
            onUploadError?.(error.message || 'Failed to save document');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-white rounded-xl border border-gray-200">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Application Document</h3>

                {/* Document Type Selector */}
                <div className="space-y-2 mb-6">
                    <label className="block text-sm font-semibold text-gray-700">
                        Document Type
                    </label>
                    <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all text-gray-900 font-medium"
                    >
                        {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* File Upload */}
                <FileUpload
                    storagePath={getApplicationDocumentPath(
                        applicationId,
                        generateUniqueFileName(`${documentType}.pdf`)
                    )}
                    acceptedTypes={[
                        'application/pdf',
                        'image/jpeg',
                        'image/png',
                        'image/jpg',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    ]}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onUploadComplete={(url) => {
                        setUploadedFileUrl(url);
                    }}
                    onUploadError={(error) => {
                        onUploadError?.(error);
                    }}
                    currentFileUrl={uploadedFileUrl}
                    label="Document File"
                    helperText="Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)"
                    showPreview={false}
                />
            </div>

            {/* Submit Button */}
            {uploadedFileUrl && (
                <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </span>
                    ) : (
                        'Save Document'
                    )}
                </button>
            )}
        </div>
    );
}
