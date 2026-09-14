import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats.
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Plain 11-character ID
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Direct 11-character alphanumeric/dash/underscore ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

/**
 * Generates an embeddable YouTube iframe URL with optimal e-commerce parameters.
 */
export function getYouTubeEmbedUrl(url?: string | null, autoplay: boolean = false): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${autoplay ? '&autoplay=1' : ''}`;
}

/**
 * Returns the high-resolution YouTube video thumbnail URL.
 */
export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Checks if a product's sizes match a selected filter size.
 * Rules:
 * - If filter is "all" or empty, returns true.
 * - If filter is an integer size (e.g., "42"), it matches:
 *   - "42" (exact)
 *   - "42,5" or "42.5" (half size)
 *   - "42 1/2", "42 2/3", "42 1/3" (fractional sizes)
 *   - "42-43" or "42/43"
 * - If filter is "41", it matches "41", "41,5", "41.5", "41 1/3", etc.
 * - Applies similarly to all base sizes (36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46).
 */
export function doesProductMatchSizeFilter(productSizes: string[] | undefined, filterSize: string): boolean {
  if (!filterSize || filterSize === 'all') return true;

  const sizes = (productSizes && productSizes.length > 0)
    ? productSizes
    : ['38', '39', '40', '41', '42', '43', '44'];

  const cleanFilter = filterSize.trim().toLowerCase().replace(',', '.');
  const filterNum = parseFloat(cleanFilter);
  const isFilterInt = !isNaN(filterNum) && Number.isInteger(filterNum);

  return sizes.some(rawSize => {
    if (!rawSize) return false;
    const sizeStr = String(rawSize).trim();
    const cleanSize = sizeStr.toLowerCase().replace(',', '.');

    // 1. Direct match (e.g. '42' === '42' or '42.5' === '42.5' or '42,5' === '42,5')
    if (sizeStr.toLowerCase() === filterSize.trim().toLowerCase() || cleanSize === cleanFilter) {
      return true;
    }

    // 2. Numeric evaluation
    const sizeNum = parseFloat(cleanSize);
    if (!isNaN(filterNum) && !isNaN(sizeNum)) {
      if (isFilterInt) {
        // Filter "42" matches 42.0, 42.5, 42.66 (42 2/3), 42.33 (42 1/3)
        // because Math.floor(42.5) === 42
        if (Math.floor(sizeNum) === filterNum) {
          return true;
        }
      } else {
        // Specific decimal filter like "42.5"
        if (Math.abs(sizeNum - filterNum) < 0.08) {
          return true;
        }
      }
    }

    // 3. Regex token & fraction evaluation
    if (isFilterInt) {
      const baseStr = String(filterNum);
      // Matches 42 as standalone or followed by ,5 / .5 / 1/2 / 2/3 / 1/3 / /43 / -43
      const reg = new RegExp(`(^|[^0-9])${baseStr}([,.]\\d+|[ ]*1\\/2|[ ]*2\\/3|[ ]*1\\/3|\\/\\d+|-\\d+)?($|[^0-9])`, 'i');
      if (reg.test(sizeStr)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Determines if a product is considered a "Fresh Drop" (uploaded within 48 hours or flagged).
 */
export function isFreshDrop(product: { createdAt?: any; isFreshDrop?: boolean }): boolean {
  if (product.isFreshDrop) return true;
  if (!product.createdAt) return false;

  try {
    let createdMs: number | null = null;
    if (typeof product.createdAt?.toDate === 'function') {
      createdMs = product.createdAt.toDate().getTime();
    } else if (typeof product.createdAt === 'string') {
      createdMs = new Date(product.createdAt).getTime();
    } else if (typeof product.createdAt === 'number') {
      createdMs = product.createdAt;
    }

    if (createdMs && !isNaN(createdMs)) {
      const diffHours = (Date.now() - createdMs) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 48;
    }
  } catch (e) {
    return false;
  }
  return false;
}

/**
 * Checks if a product's insole matches a filter selection.
 */
export function doesProductMatchInsoleFilter(productInsole: string | undefined, filterInsole: string): boolean {
  if (!filterInsole || filterInsole === 'all') return true;
  if (!productInsole) return false;

  const cleanProduct = productInsole.toLowerCase().replace(/cm/g, '').replace(',', '.').trim();
  const cleanFilter = filterInsole.toLowerCase().replace(/cm/g, '').replace(',', '.').trim();

  const prodNum = parseFloat(cleanProduct);
  const filterNum = parseFloat(cleanFilter);

  if (!isNaN(prodNum) && !isNaN(filterNum)) {
    // If filter is integer like 27, match 27.0 up to 27.5
    if (Number.isInteger(filterNum)) {
      return Math.floor(prodNum) === filterNum;
    }
    return Math.abs(prodNum - filterNum) < 0.2;
  }

  return cleanProduct.includes(cleanFilter);
}

/**
 * Watermarks an image file before upload using HTML5 Canvas.
 */
export async function applyWatermarkToImage(
  file: File, 
  watermarkText: string = 'ESTEHANGET STORE • ORIGINAL'
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark dimensions
      const fontSize = Math.max(16, Math.round(canvas.width * 0.032));
      ctx.font = `bold ${fontSize}px sans-serif`;

      const text = watermarkText.toUpperCase();
      const subText = 'MAJALENGKA • 1-OF-1 THRIFT';
      const textWidth = Math.max(ctx.measureText(text).width, ctx.measureText(subText).width);
      
      const paddingX = fontSize * 0.9;
      const paddingY = fontSize * 0.6;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = fontSize * 2.5 + paddingY * 1.5;

      const posX = canvas.width - boxWidth - (fontSize * 0.8);
      const posY = canvas.height - boxHeight - (fontSize * 0.8);

      // Draw pill background with border
      ctx.save();
      ctx.fillStyle = 'rgba(15, 15, 15, 0.72)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;

      // Rounded rectangle
      const radius = 10;
      ctx.beginPath();
      ctx.moveTo(posX + radius, posY);
      ctx.lineTo(posX + boxWidth - radius, posY);
      ctx.quadraticCurveTo(posX + boxWidth, posY, posX + boxWidth, posY + radius);
      ctx.lineTo(posX + boxWidth, posY + boxHeight - radius);
      ctx.quadraticCurveTo(posX + boxWidth, posY + boxHeight, posX + boxWidth - radius, posY + boxHeight);
      ctx.lineTo(posX + radius, posY + boxHeight);
      ctx.quadraticCurveTo(posX, posY + boxHeight, posX, posY + boxHeight - radius);
      ctx.lineTo(posX, posY + radius);
      ctx.quadraticCurveTo(posX, posY, posX + radius, posY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Text 1: Brand
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, posX + paddingX, posY + paddingY + fontSize * 0.85);

      // Text 2: Subtitle
      ctx.font = `600 ${Math.round(fontSize * 0.68)}px sans-serif`;
      ctx.fillStyle = '#E5C158'; // Golden accent
      ctx.fillText(subText, posX + paddingX, posY + paddingY + fontSize * 1.85);

      ctx.restore();

      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const watermarkedFile = new File([blob], file.name, {
          type: file.type || 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(watermarkedFile);
      }, file.type || 'image/jpeg', 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
