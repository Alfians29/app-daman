'use client';

/**
 * Image compression utility using Canvas API
 * Compresses images before upload to reduce storage and bandwidth
 */

export type CompressionOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.75
  format?: 'jpeg' | 'png' | 'webp';
};

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.75,
  format: 'jpeg',
};

/**
 * Compress an image file using Canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<string> - Compressed image as base64 data URL
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(
            opts.maxWidth / width,
            opts.maxHeight / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const mimeType = `image/${opts.format}`;
        const base64 = canvas.toDataURL(mimeType, opts.quality);

        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Get estimated file size from base64 string
 * @param base64 - Base64 data URL
 * @returns Size in bytes
 */
export function getBase64Size(base64: string): number {
  // Remove data URL prefix
  const base64Data = base64.split(',')[1] || base64;
  // Calculate size: base64 is ~4/3 the size of binary
  return Math.round((base64Data.length * 3) / 4);
}

/**
 * Format bytes to human readable string
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
