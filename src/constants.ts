import { Product, Store } from './types';

export const STORE = {
  id: 'e-store-official',
  name: 'E STORE Official',
  logo: 'https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png',
  rating: 4.9,
  location: 'Majalengka, Jawa Barat, Indonesia',
  description: 'Toko resmi E STORE yang menyediakan berbagai pilihan sepatu sneaker, olahraga, formal, dan sepatu wanita 100% original di Majalengka.',
  isMall: true,
  isStar: true,
};

export const PRODUCTS: Product[] = [];

export const CONTACT_INFO = {
  whatsapp: '+6285179550150',
  instagram: 'https://www.instagram.com/estehangetaja',
  brandName: 'E STORE',
  logo: 'https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png',
};

export const ADMIN_EMAILS: string[] = [
  "eepsyarief20@gmail.com"
];

export const ADMIN_EMAIL = ADMIN_EMAILS[0];

export const getExtraAdminEmails = (): string[] => {
  try {
    const saved = localStorage.getItem('extra_admin_emails');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const getAllAdminEmails = (): string[] => {
  const extra = getExtraAdminEmails();
  const set = new Set([...ADMIN_EMAILS, ...extra].map(e => e.toLowerCase().trim()));
  return Array.from(set);
};

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return getAllAdminEmails().includes(normalized);
};

export const addAdminEmail = (email: string): boolean => {
  const normalized = email.toLowerCase().trim();
  if (!normalized || !normalized.includes('@')) return false;
  const current = getExtraAdminEmails();
  if (current.includes(normalized) || ADMIN_EMAILS.includes(normalized)) return true;
  const updated = [...current, normalized];
  localStorage.setItem('extra_admin_emails', JSON.stringify(updated));
  return true;
};

export const removeAdminEmail = (email: string): boolean => {
  const normalized = email.toLowerCase().trim();
  const current = getExtraAdminEmails();
  const updated = current.filter(e => e !== normalized);
  localStorage.setItem('extra_admin_emails', JSON.stringify(updated));
  return true;
};

