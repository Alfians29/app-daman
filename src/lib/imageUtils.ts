'use client';

/**
 * Image compression utility using Canvas API
 * Compresses images before upload to reduce storage and bandwidth
 * Supports animated GIFs with optimization
 */

export type CompressionOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.75
  format?: 'jpeg' | 'png' | 'webp';
};

export type GifCompressionOptions = {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number; // Max file size in bytes
};

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.75,
  format: 'jpeg',
};

const DEFAULT_GIF_OPTIONS: Required<GifCompressionOptions> = {
  maxWidth: 100, // Smaller for animated - max compression
  maxHeight: 100,
  maxSizeBytes: 300 * 1024, // 300KB max for GIF
};

/**
 * Check if a file is a GIF
 */
export function isGifFile(file: File): boolean {
  return file.type === 'image/gif';
}

/**
 * Check if a GIF file is animated by reading its binary data
 * Animated GIFs have multiple image frames indicated by multiple 0x00 0x21 0xF9 sequences
 */
export async function isAnimatedGif(file: File): Promise<boolean> {
  if (!isGifFile(file)) return false;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const view = new Uint8Array(buffer);

      // Count graphic control extension blocks (0x21 0xF9)
      // Multiple blocks indicate animation
      let count = 0;
      for (let i = 0; i < view.length - 1; i++) {
        if (view[i] === 0x21 && view[i + 1] === 0xf9) {
          count++;
          if (count > 1) {
            resolve(true);
            return;
          }
        }
      }
      resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Process animated GIF - validates size and returns as-is or rejects if too large
 * Note: True GIF compression/resizing requires server-side processing with tools like gifsicle
 * This function performs client-side validation and basic size check
 */
export async function processAnimatedGif(
  file: File,
  options: GifCompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_GIF_OPTIONS, ...options };

  // Check file size
  if (file.size > opts.maxSizeBytes) {
    throw new Error(
      `GIF terlalu besar! Maksimal ${formatFileSize(opts.maxSizeBytes)}. ` +
        `File kamu: ${formatFileSize(file.size)}. ` +
        `Gunakan tool online seperti ezgif.com untuk kompres GIF.`
    );
  }

  // For animated GIF, we need to check dimensions
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Check dimensions
      if (img.width > opts.maxWidth * 2 || img.height > opts.maxHeight * 2) {
        reject(
          new Error(
            `GIF terlalu besar! Maksimal ${opts.maxWidth * 2}x${
              opts.maxHeight * 2
            }px. ` + `Gunakan tool online seperti ezgif.com untuk resize GIF.`
          )
        );
        return;
      }

      // Return original GIF as base64 (preserves animation)
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read GIF file'));
      reader.readAsDataURL(file);
    };

    img.onerror = () => reject(new Error('Failed to load GIF'));

    // Load image to check dimensions
    const tempReader = new FileReader();
    tempReader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    tempReader.readAsDataURL(file);
  });
}

/**
 * Smart image processor - handles both static images and animated GIFs
 * @param file - The image file to process
 * @param options - Compression options for static images
 * @param gifOptions - Options for animated GIFs
 * @returns Promise<string> - Processed image as base64 data URL
 */
export async function processImage(
  file: File,
  options: CompressionOptions = {},
  gifOptions: GifCompressionOptions = {}
): Promise<string> {
  // Check if it's an animated GIF
  if (await isAnimatedGif(file)) {
    return processAnimatedGif(file, gifOptions);
  }

  // For static images (including static GIFs), compress normally
  return compressImage(file, options);
}

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
