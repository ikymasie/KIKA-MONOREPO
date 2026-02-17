'use client';

import { useState } from 'react';
import FileUpload from '@/components/common/FileUpload';
import { getDeductionFilePath, generateUniqueFileName } from '@/lib/firebase-storage';

interface DeductionFileUploadProps {
    batchId?: string;
    onUploadComplete: (url: string, fileName: string) => void;
    onUploadError?: (error: string) => void;
    currentFileUrl?: string;
}

export default function DeductionFileUpload({
    batchId,
    onUploadComplete,
    onUploadError,
    currentFileUrl,
}: DeductionFileUploadProps) {
    const [previewData, setPreviewData] = useState<any[] | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const validateCSV = async (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const lines = text.split('\n').filter(line => line.trim());

                    if (lines.length < 2) {
                        setValidationErrors(['CSV file must contain at least a header row and one data row']);
                        resolve(false);
                        return;
                    }

                    // Parse header
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

                    // Required columns for deduction CSV
                    const requiredColumns = ['member_id', 'amount', 'deduction_type'];
                    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

                    if (missingColumns.length > 0) {
                        setValidationErrors([
                            `Missing required columns: ${missingColumns.join(', ')}`,
                            `Found columns: ${headers.join(', ')}`
                        ]);
                        resolve(false);
                        return;
                    }

                    // Parse first few rows for preview
                    const preview = lines.slice(1, 6).map(line => {
                        const values = line.split(',');
                        const row: any = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index]?.trim() || '';
                        });
                        return row;
                    });

                    setPreviewData(preview);
                    setValidationErrors([]);
                    resolve(true);
                } catch (error) {
                    setValidationErrors(['Failed to parse CSV file. Please ensure it is properly formatted.']);
                    resolve(false);
                }
            };

            reader.onerror = () => {
                setValidationErrors(['Failed to read file']);
                resolve(false);
            };

            reader.readAsText(file);
        });
    };

    const handleFileSelected = async (file: File) => {
        // Validate CSV before upload
        const isValid = await validateCSV(file);
        if (!isValid) {
            onUploadError?.('CSV validation failed. Please check the file format.');
            return false;
        }
        return true;
    };

    return (
        <div className="space-y-6">
            <FileUpload
                storagePath={getDeductionFilePath(
                    batchId || 'temp',
                    generateUniqueFileName('deductions.csv')
                )}
                acceptedTypes={['text/csv', 'application/vnd.ms-excel']}
                maxSize={20 * 1024 * 1024} // 20MB
                onUploadComplete={(url) => {
                    onUploadComplete(url, 'deductions.csv');
                }}
                onUploadError={(error) => {
                    onUploadError?.(error);
                }}
                currentFileUrl={currentFileUrl}
                label="Deduction CSV File"
                helperText="Upload a CSV file with columns: member_id, amount, deduction_type (Max 20MB)"
                showPreview={false}
            />

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <h4 className="text-sm font-bold text-red-900 mb-2">Validation Errors:</h4>
                    <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                            <li key={index} className="text-sm text-red-700">{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* CSV Preview */}
            {previewData && previewData.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <h4 className="text-sm font-bold text-green-900 mb-3">CSV Preview (First 5 rows):</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-green-300">
                                    {Object.keys(previewData[0]).map((header) => (
                                        <th key={header} className="px-3 py-2 text-left font-bold text-green-900 uppercase text-xs">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, index) => (
                                    <tr key={index} className="border-b border-green-200">
                                        {Object.values(row).map((value: any, cellIndex) => (
                                            <td key={cellIndex} className="px-3 py-2 text-green-800">
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
