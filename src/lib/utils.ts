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
