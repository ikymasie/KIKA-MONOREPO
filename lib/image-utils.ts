/**
 * Image Optimization Utilities
 * 
 * Provides functions to wrap image URLs with CDN transformation parameters
 * or handle local thumbnail generation strategies.
 */

export interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpg';
    fit?: 'cover' | 'contain' | 'fill';
}

/**
 * Transforms a raw image URL into an optimized version.
 * For now, this is a placeholder that returns the original URL,
 * but it's architected to easily integrate with Cloudinary, Imgix, or similar.
 */
export function getOptimizedImageUrl(url?: string, options: ImageOptions = {}): string {
    if (!url) return '';

    // If it's already a Data URL or external placeholder, return as is
    if (url.startsWith('data:') || url.includes('placeholder')) {
        return url;
    }

    // Example Cloudinary integration logic (commented out):
    /*
    if (url.includes('cloudinary.com')) {
        const transformations = [];
        if (options.width) transformations.push(`w_${options.width}`);
        if (options.height) transformations.push(`h_${options.height}`);
        if (options.quality) transformations.push(`q_${options.quality}`);
        if (options.format) transformations.push(`f_${options.format}`);
        if (options.fit) transformations.push(`c_${options.fit}`);
        
        const transformationString = transformations.join(',');
        return url.replace('/upload/', `/upload/${transformationString}/`);
    }
    */

    // Default strategy: Just return the URL for now
    // Future: Append query parameters if using a server-side resizer like Next.js Image Optimizer
    return url;
}

/**
 * Returns a standard thumbnail URL for a product image.
 */
export function getProductThumbnail(url?: string): string {
    return getOptimizedImageUrl(url, { width: 300, height: 300, fit: 'cover', format: 'webp' });
}
