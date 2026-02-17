'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { uploadFile, validateFileType, validateFileSize, formatFileSize, UploadProgress } from '@/lib/firebase-storage';
import { Upload, X, File, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

export interface FileUploadProps {
    /**
     * Storage path for the file (use path generators from firebase-storage.ts)
     */
    storagePath: string;

    /**
     * Allowed MIME types (e.g., ['image/*', 'application/pdf'])
     */
    acceptedTypes?: string[];

    /**
     * Maximum file size in bytes
     */
    maxSize?: number;

    /**
     * Callback when upload completes successfully
     */
    onUploadComplete: (url: string) => void;

    /**
     * Callback when upload fails
     */
    onUploadError?: (error: string) => void;

    /**
     * Current file URL (for showing existing file)
     */
    currentFileUrl?: string;

    /**
     * Label for the upload area
     */
    label?: string;

    /**
     * Helper text
     */
    helperText?: string;

    /**
     * Whether to show image preview
     */
    showPreview?: boolean;

    /**
     * Custom class name
     */
    className?: string;
}

export default function FileUpload({
    storagePath,
    acceptedTypes = ['image/*'],
    maxSize = 5 * 1024 * 1024, // 5MB default
    onUploadComplete,
    onUploadError,
    currentFileUrl,
    label = 'Upload File',
    helperText,
    showPreview = true,
    className = '',
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentFileUrl || null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentFileUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isImage = acceptedTypes.some(type => type.startsWith('image/') || type === 'image/*');

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = async (file: File) => {
        setError(null);

        // Validate file type
        if (!validateFileType(file, acceptedTypes)) {
            const errorMsg = `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`;
            setError(errorMsg);
            onUploadError?.(errorMsg);
            return;
        }

        // Validate file size
        if (!validateFileSize(file, maxSize)) {
            const errorMsg = `File size exceeds ${formatFileSize(maxSize)} limit`;
            setError(errorMsg);
            onUploadError?.(errorMsg);
            return;
        }

        // Show preview for images
        if (isImage && showPreview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }

        // Upload file
        setUploading(true);
        setProgress(null);

        try {
            const url = await uploadFile(file, storagePath, (prog) => {
                setProgress(prog);
            });

            setUploadedUrl(url);
            setUploading(false);
            setProgress(null);
            onUploadComplete(url);
        } catch (err: any) {
            const errorMsg = err.message || 'Upload failed';
            setError(errorMsg);
            setUploading(false);
            setProgress(null);
            onUploadError?.(errorMsg);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        setUploadedUrl(null);
        setError(null);
        setProgress(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}

            {/* Upload Area */}
            {!uploadedUrl && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleClick}
                    className={`
                        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                        transition-all duration-200 ease-in-out
                        ${isDragging
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                        }
                        ${uploading ? 'pointer-events-none opacity-75' : ''}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept={acceptedTypes.join(',')}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-3">
                        {uploading ? (
                            <>
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Uploading...
                                    </p>
                                    {progress && (
                                        <div className="space-y-1">
                                            <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-600 transition-all duration-300"
                                                    style={{ width: `${progress.percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {Math.round(progress.percentage)}% - {formatFileSize(progress.bytesTransferred)} / {formatFileSize(progress.totalBytes)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    {isImage ? (
                                        <ImageIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    ) : (
                                        <File className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <span className="text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
                                    </p>
                                    {helperText && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {helperText}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Max size: {formatFileSize(maxSize)}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Preview */}
            {uploadedUrl && showPreview && isImage && (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <img
                        src={previewUrl || uploadedUrl}
                        alt="Preview"
                        className="w-full h-48 object-contain"
                    />
                    <button
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Uploaded
                    </div>
                </div>
            )}

            {/* Non-image file uploaded */}
            {uploadedUrl && (!isImage || !showPreview) && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            File uploaded successfully
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 truncate">
                            {uploadedUrl}
                        </p>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-800 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </button>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            Upload failed
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            {error}
                        </p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-800 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                </div>
            )}
        </div>
    );
}
