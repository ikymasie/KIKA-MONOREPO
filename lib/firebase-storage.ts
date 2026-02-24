// On-Premise Polyfill for Firebase Storage
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
 * Upload a file using the Local On-Premise API instead of Firebase 
 */
export async function uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    // Convert firebase path to local folder structure string,
    // avoiding deep slashes to make generic uploading simpler
    formData.append('path', path.replace(/\//g, '-'));

    // Optional: simulate progress
    if (onProgress) {
        onProgress({ bytesTransferred: 0, totalBytes: file.size, percentage: 0 });
    }

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        if (onProgress) {
            onProgress({ bytesTransferred: file.size, totalBytes: file.size, percentage: 100 });
        }

        const data = await response.json();
        return data.url; // Returns the local URL
    } catch (error: any) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

/**
 * Delete a file (Not fully implemented locally yet)
 */
export async function deleteFile(url: string): Promise<void> {
    // For on-premise, file deletion can be implemented via another API route,
    // or ignored depending on compliance rules. We'll simply console.log for now.
    console.log("Local file deletion requested for:", url);
}

/**
 * Get metadata for a file
 * For local files, this would require querying the file system.
 * Returning a mock for now.
 */
export async function getFileMetadata(url: string): Promise<FileMetadata> {
    try {
        return {
            name: url.split('/').pop() || 'file',
            size: 0,
            contentType: 'application/octet-stream',
            timeCreated: new Date().toISOString(),
            updated: new Date().toISOString(),
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
