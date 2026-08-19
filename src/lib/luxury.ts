import { Product } from '../types';

export const LUXURY_PRICE_THRESHOLD = 500000; // Rp 500.000

export const isLuxuryProduct = (product?: { price?: number } | null): boolean => {
  if (!product || typeof product.price !== 'number') return false;
  return product.price >= LUXURY_PRICE_THRESHOLD;
};
