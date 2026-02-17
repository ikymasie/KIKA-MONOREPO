import { storage } from './firebase-client';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    getMetadata,
    UploadMetadata,
} from 'firebase/storage';

export interface UploadProgress {
    bytesTransferred: number;
    totalBytes: number;
    percentage: number;
}

export interface FileMetadata {
    name: string;
    size: number;
    contentType: string;
    timeCreated: string;
    updated: string;
}

/**
 * Generate storage path for tenant-related files
 */
export function getTenantFilePath(tenantId: string, type: 'logo' | 'favicon', fileName: string): string {
    const folder = type === 'logo' ? 'logos' : 'branding';
    return `tenants/${tenantId}/${folder}/${fileName}`;
}

/**
 * Generate storage path for merchandise product files
 */
export function getProductFilePath(productId: string, type: 'image' | 'thumbnail' | 'flyer', fileName: string): string {
    return `products/merchandise/${productId}/${type}/${fileName}`;
}

/**
 * Generate storage path for application documents
 */
export function getApplicationDocumentPath(applicationId: string, fileName: string): string {
    return `applications/${applicationId}/documents/${fileName}`;
}

/**
 * Generate storage path for deduction files
 */
export function getDeductionFilePath(batchId: string, fileName: string): string {
    return `deductions/${batchId}/${fileName}`;
}

/**
 * Generate a unique filename with timestamp
 */
export function generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(`.${extension}`, '').replace(/[^a-zA-Z0-9]/g, '_');
    return `${nameWithoutExt}_${timestamp}_${randomString}.${extension}`;
}

/**
 * Upload a file to Firebase Storage
 * @param file - File to upload
 * @param path - Storage path (use helper functions above)
 * @param onProgress - Optional callback for upload progress
 * @returns Promise resolving to the download URL
 */
export async function uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);

        const metadata: UploadMetadata = {
            contentType: file.type,
            customMetadata: {
                originalName: file.name,
                uploadedAt: new Date().toISOString(),
            },
        };

        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                if (onProgress) {
                    const progress: UploadProgress = {
                        bytesTransferred: snapshot.bytesTransferred,
                        totalBytes: snapshot.totalBytes,
                        percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
                    };
                    onProgress(progress);
                }
            },
            (error) => {
                console.error('Upload error:', error);
                reject(new Error(`Upload failed: ${error.message}`));
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                } catch (error: any) {
                    reject(new Error(`Failed to get download URL: ${error.message}`));
                }
            }
        );
    });
}

/**
 * Delete a file from Firebase Storage
 * @param url - The download URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
    try {
        // Extract the path from the URL
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);

        if (!pathMatch) {
            throw new Error('Invalid Firebase Storage URL');
        }

        const path = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, path);

        await deleteObject(storageRef);
    } catch (error: any) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

/**
 * Get metadata for a file in Firebase Storage
 * @param url - The download URL of the file
 */
export async function getFileMetadata(url: string): Promise<FileMetadata> {
    try {
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);

        if (!pathMatch) {
            throw new Error('Invalid Firebase Storage URL');
        }

        const path = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, path);

        const metadata = await getMetadata(storageRef);

        return {
            name: metadata.name,
            size: metadata.size,
            contentType: metadata.contentType || 'application/octet-stream',
            timeCreated: metadata.timeCreated,
            updated: metadata.updated,
        };
    } catch (error: any) {
        console.error('Metadata error:', error);
        throw new Error(`Failed to get file metadata: ${error.message}`);
    }
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
        if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category + '/');
        }
        return file.type === type;
    });
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if URL is from Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'firebasestorage.googleapis.com';
    } catch {
        return false;
    }
}
