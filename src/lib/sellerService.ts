import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db, isFirebaseEnabled, handleFirestoreError, OperationType, auth } from './firebase';
import { Store, Product, Review, Order } from '../types';
import { PRODUCTS } from '../constants';
import { isHeicFile, convertHeicToJpeg } from './utils';

// Helper to ensure auth is ready or fail fast
const ensureAuth = () => {
  if (isFirebaseEnabled && (!auth || !auth.currentUser)) {
    throw new Error("PERMISSION_DENIED: Silakan login ulang via Dashboard Admin untuk mengaktifkan akses Cloud.");
  }
};

export const MAIN_STORE_ID = 'estehanget-store';

// Helper: Memastikan setiap produk selalu pasti memiliki stok 1 (atau 0 jika barang berstatus SOLD)
export const ensureProductStock = (p: Product): Product => {
  const rawStock = Number(p.stock);
  const stock = Number.isFinite(rawStock) ? (rawStock === 0 ? 0 : 1) : 1;
  return {
    ...p,
    stock
  };
};

// --- Local Storage Fallback Helpers ---
const STORAGE_PREFIX = 'estehanget_';
const getLocalData = <T>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (key === 'products') {
          return (parsed as Product[]).map(ensureProductStock) as unknown as T[];
        }
        return parsed as T[];
      }
    }
  } catch (e) {
    console.error("Error reading local storage", e);
  }
  if (key === 'products') return (PRODUCTS as Product[]).map(ensureProductStock) as unknown as T[];
  return [];
};
const setLocalData = <T>(key: string, data: T[]) => localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));

// --- Firestore Services ---

/**
 * Utility to convert base64 data URL to binary Blob synchronously in memory.
 */
export function dataURLtoBlob(dataUrl: string): Blob | null {
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binaryStr = atob(parts[1]);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch (e) {
    return null;
  }
}

/**
 * Compresses a base64 image (or leaves external URLs untouched) to fit within strict Firestore field limits.
 * Uses fast off-thread createImageBitmap with Blob or ObjectURL to prevent browser lockups.
 */
export const compressBase64Image = async (
  dataUrl: string, 
  maxDim = 540, 
  quality = 0.55
): Promise<string> => {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  
  // If already under 35KB in base64 (~26KB binary), it is already very lightweight
  if (dataUrl.length < 35 * 1024) return dataUrl;

  // Method 1: Fast native off-thread decode with createImageBitmap & Blob
  if (typeof createImageBitmap === 'function') {
    try {
      const blob = dataURLtoBlob(dataUrl);
      if (blob) {
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        let w = bitmap.width;
        let h = bitmap.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, w, h);
          bitmap.close();
          const compressed = canvas.toDataURL('image/jpeg', quality);
          if (compressed && compressed.length < dataUrl.length) {
            return compressed;
          }
        } else {
          bitmap.close();
        }
      }
    } catch (e) {
      // Fallback to HTMLImageElement
    }
  }

  // Method 2: HTMLImageElement with Blob ObjectURL (instant load compared to raw dataURL)
  try {
    const blob = dataURLtoBlob(dataUrl);
    const objectUrl = blob ? URL.createObjectURL(blob) : dataUrl;
    const result = await new Promise<string>((resolve) => {
      const timer = setTimeout(() => {
        if (blob) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        resolve('');
      }, 3000);

      const img = new Image();
      img.onload = () => {
        clearTimeout(timer);
        if (blob) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        try {
          const canvas = document.createElement('canvas');
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('');
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
        } catch (err) {
          resolve('');
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        if (blob) {
          try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        }
        resolve('');
      };

      img.src = objectUrl;
    });

    if (result) return result;
  } catch (e) {
    // Fall through
  }

  // If compression completely failed and dataUrl is still oversized (>80KB),
  // NEVER send a multi-megabyte uncompressed string into Firestore!
  if (dataUrl.length > 80 * 1024) {
    console.warn(`Image base64 too large (${dataUrl.length} bytes) and cannot be decompressed. Replacing with safe placeholder.`);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 375;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 500, 375);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ESTEHANGET THRIFT', 250, 180);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('MAJALENGKA • 1-OF-1 THRIFT', 250, 215);
        return canvas.toDataURL('image/jpeg', 0.65);
      }
    } catch (e) {}
    return 'https://picsum.photos/seed/estehanget/600/450';
  }

  return dataUrl;
};

/**
 * Sanitizes and compresses all product image URLs/base64 strings so that
 * the total Firestore document array property stays strictly below 450,000 bytes
 * (Firestore maximum document limit is 1,048,487 bytes).
 */
export const sanitizeProductImages = async (images: string[]): Promise<string[]> => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }

  // Cap at 6 photos maximum per product for thrift/shoe showcase
  const candidateImages = images.filter(Boolean).slice(0, 6);

  // Pass 1: Standard compression (520px, quality 0.55 -> ~20-35KB per photo)
  let processed = await Promise.all(
    candidateImages.map(img => compressBase64Image(img, 520, 0.55))
  );

  let totalBytes = processed.reduce((sum, str) => sum + (str ? str.length : 0), 0);

  // Pass 2: If total size exceeds 280KB, apply tighter compression (420px, quality 0.45)
  if (totalBytes > 280 * 1024) {
    console.warn(`Total images size ${totalBytes} exceeds 280KB. Applying tighter compression...`);
    processed = await Promise.all(
      processed.map(img => compressBase64Image(img, 420, 0.45))
    );
    totalBytes = processed.reduce((sum, str) => sum + (str ? str.length : 0), 0);
  }

  // Pass 3: If STILL > 380KB, drop down to top 4 photos at 360px, quality 0.40
  if (totalBytes > 380 * 1024) {
    console.warn(`Total images size ${totalBytes} still over 380KB. Downsampling top 4 photos...`);
    processed = await Promise.all(
      processed.slice(0, 4).map(img => compressBase64Image(img, 360, 0.40))
    );
  }

  // FINAL HARD SAFETY GUARANTEE FOR FIRESTORE:
  // Firestore hard limit for any property is 1,048,487 bytes.
  // We strictly cap total images array at 450,000 bytes (~440 KB).
  const MAX_ALLOWED_TOTAL_BYTES = 450 * 1024;
  const safeList: string[] = [];
  let currentBytes = 0;

  for (const img of processed) {
    if (!img) continue;
    // Reject any single image that is still abnormally large (>95KB)
    if (img.length > 95 * 1024) {
      continue;
    }
    if (currentBytes + img.length <= MAX_ALLOWED_TOTAL_BYTES) {
      safeList.push(img);
      currentBytes += img.length;
    } else {
      break;
    }
  }

  if (safeList.length === 0) {
    safeList.push('https://picsum.photos/seed/estehanget/600/450');
  }

  return safeList;
};

function drawWatermarkOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkText: string
) {
  try {
    const fontSize = Math.max(13, Math.round(width * 0.033));
    ctx.font = `bold ${fontSize}px sans-serif`;

    const text = watermarkText.toUpperCase();
    const subText = 'MAJALENGKA • 1-OF-1 THRIFT';
    const textWidth = Math.max(ctx.measureText(text).width, ctx.measureText(subText).width);

    const paddingX = fontSize * 0.85;
    const paddingY = fontSize * 0.55;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize * 2.4 + paddingY * 1.4;

    const posX = width - boxWidth - (fontSize * 0.7);
    const posY = height - boxHeight - (fontSize * 0.7);

    ctx.save();
    ctx.fillStyle = 'rgba(15, 15, 15, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;

    const radius = 8;
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
    ctx.font = `600 ${Math.round(fontSize * 0.65)}px sans-serif`;
    ctx.fillStyle = '#E5C158';
    ctx.fillText(subText, posX + paddingX, posY + paddingY + fontSize * 1.8);

    ctx.restore();
  } catch (err) {
    // Non-fatal if watermark styling fails
  }
}

export const uploadImage = async (
  file: File, 
  _path: string, 
  options?: { watermarkText?: string }
): Promise<string> => {
  // Auto-convert HEIC/HEIF (e.g. from iPhone) to standard JPEG
  if (isHeicFile(file)) {
    try {
      file = await convertHeicToJpeg(file);
    } catch (e) {
      console.warn('HEIC auto-convert failed, attempting direct decode:', e);
    }
  }

  const TARGET_MAX_WIDTH = 540;
  const TARGET_MAX_HEIGHT = 540;
  const TARGET_QUALITY = 0.55;

  // Strategy 1: Fast, modern off-thread decode via createImageBitmap
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      let width = bitmap.width;
      let height = bitmap.height;

      if (width > height) {
        if (width > TARGET_MAX_WIDTH) {
          height = Math.round((height * TARGET_MAX_WIDTH) / width);
          width = TARGET_MAX_WIDTH;
        }
      } else {
        if (height > TARGET_MAX_HEIGHT) {
          width = Math.round((width * TARGET_MAX_HEIGHT) / height);
          height = TARGET_MAX_HEIGHT;
        }
      }

      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        if (options?.watermarkText) {
          drawWatermarkOverlay(ctx, canvas.width, canvas.height, options.watermarkText);
        }

        const dataUrl = canvas.toDataURL('image/jpeg', TARGET_QUALITY);
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          return dataUrl;
        }
      } else {
        bitmap.close();
      }
    } catch (err) {
      // Fallback silently without throwing unhandled exceptions
    }
  }

  // Strategy 2: URL.createObjectURL + HTMLImageElement
  try {
    const objectUrl = URL.createObjectURL(file);
    const compressedUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > height) {
            if (width > TARGET_MAX_WIDTH) {
              height = Math.round((height * TARGET_MAX_WIDTH) / width);
              width = TARGET_MAX_WIDTH;
            }
          } else {
            if (height > TARGET_MAX_HEIGHT) {
              width = Math.round((width * TARGET_MAX_HEIGHT) / height);
              height = TARGET_MAX_HEIGHT;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          if (options?.watermarkText) {
            drawWatermarkOverlay(ctx, canvas.width, canvas.height, options.watermarkText);
          }

          resolve(canvas.toDataURL('image/jpeg', TARGET_QUALITY));
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
        reject(new Error('Failed to load image from object URL'));
      };

      img.src = objectUrl;
    });

    if (compressedUrl && compressedUrl.startsWith('data:image/')) {
      return compressedUrl;
    }
  } catch (err) {
    // Strategy 2 failed, proceeding to Strategy 3
  }

  // Strategy 3: FileReader + Canvas compression
  try {
    const rawDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader result is not a string'));
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    const compressedFromDataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > h && w > TARGET_MAX_WIDTH) {
            h = Math.round((h * TARGET_MAX_WIDTH) / w);
            w = TARGET_MAX_WIDTH;
          } else if (h > TARGET_MAX_HEIGHT) {
            w = Math.round((w * TARGET_MAX_HEIGHT) / h);
            h = TARGET_MAX_HEIGHT;
          }
          canvas.width = Math.max(1, w);
          canvas.height = Math.max(1, h);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);

            if (options?.watermarkText) {
              drawWatermarkOverlay(ctx, canvas.width, canvas.height, options.watermarkText);
            }

            resolve(canvas.toDataURL('image/jpeg', TARGET_QUALITY));
            return;
          }
        } catch (e) {
          // ignore
        }
        // If canvas drawing failed, only return rawDataUrl if under 60KB
        resolve(rawDataUrl.length < 60 * 1024 ? rawDataUrl : '');
      };
      img.onerror = () => {
        resolve(rawDataUrl.length < 60 * 1024 ? rawDataUrl : '');
      };
      img.src = rawDataUrl;
    });

    if (compressedFromDataUrl) {
      return compressedFromDataUrl;
    }
  } catch (err) {
    // Strategy 3 failed, generating fallback
  }

  // Ultimate fallback: lightweight canvas placeholder (~8KB)
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 375;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 500, 375);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(file.name || 'E STORE THRIFT', 250, 180);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText('1-OF-1 PRELOVED SHOES • MAJALENGKA', 250, 215);
      return canvas.toDataURL('image/jpeg', 0.65);
    }
  } catch (e) {
    // ignore
  }

  return 'https://picsum.photos/seed/estehanget/600/450';
};

export const createStore = async (storeData: Omit<Store, 'id' | 'createdAt' | 'rating'>) => {
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      const storeRef = doc(db, 'stores', MAIN_STORE_ID);
      const newStore = {
        ...storeData,
        id: MAIN_STORE_ID,
        rating: 5.0,
        createdAt: serverTimestamp(),
      };
      await setDoc(storeRef, newStore);
      return MAIN_STORE_ID;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'stores');
    }
  }

  // Fallback
  const stores = getLocalData<Store>('stores');
  const newStoreLocal = { ...storeData, id: MAIN_STORE_ID, rating: 5.0, createdAt: new Date().toISOString() as any };
  setLocalData('stores', [newStoreLocal]);
  return MAIN_STORE_ID;
};

export const updateStore = async (storeId: string, storeData: Partial<Store>) => {
  const id = storeId || MAIN_STORE_ID;
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      const storeRef = doc(db, 'stores', id);
      await updateDoc(storeRef, { ...storeData, updatedAt: serverTimestamp() });
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `stores/${id}`);
    }
  }

  // Fallback
  const stores = getLocalData<Store>('stores');
  const updated = stores.map(s => s.id === id ? { ...s, ...storeData, updatedAt: new Date().toISOString() as any } : s);
  setLocalData('stores', updated);
};

export const getMyStore = (callback: (store: Store | null) => void) => {
  if (isFirebaseEnabled && db) {
    const storeRef = doc(db, 'stores', MAIN_STORE_ID);
    return onSnapshot(storeRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Store);
      } else {
        callback(null);
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stores'));
  }

  // Fallback
  const stores = getLocalData<Store>('stores');
  callback(stores.length > 0 ? stores[0] : null);
  return () => {};
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
  const sanitizedImages = await sanitizeProductImages(productData.images || []);
  const finalData = {
    ...productData,
    images: sanitizedImages,
    stock: productData.stock === 0 ? 0 : 1, // Pastikan stok selalu 1 (atau 0 jika SOLD)
  };
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      const prodRef = collection(db, 'products');
      const docRef = await addDoc(prodRef, {
        ...finalData,
        storeId: MAIN_STORE_ID,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'products');
    }
  }

  // Fallback
  const products = getLocalData<Product>('products');
  const newProduct = ensureProductStock({ ...finalData, id: `prod_${Date.now()}`, storeId: MAIN_STORE_ID, createdAt: new Date().toISOString() as any });
  setLocalData('products', [newProduct, ...products]);
  return newProduct.id;
};

export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  const payload = { ...productData };
  if (payload.stock !== undefined) {
    payload.stock = payload.stock === 0 ? 0 : 1;
  }
  if (payload.images && Array.isArray(payload.images)) {
    payload.images = await sanitizeProductImages(payload.images);
  }
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, { ...payload, updatedAt: serverTimestamp() });
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
    }
  }

  // Fallback
  const products = getLocalData<Product>('products');
  const updated = products.map(p => p.id === productId ? ensureProductStock({ ...p, ...payload, updatedAt: new Date().toISOString() as any }) : p);
  setLocalData('products', updated);
};

export const updateProductStatus = async (productId: string, status: 'ready' | 'booked' | 'sold') => {
  let patch: Partial<Product> = {};
  if (status === 'ready') {
    patch = { stock: 1, isBooked: false };
  } else if (status === 'booked') {
    patch = { stock: 1, isBooked: true };
  } else if (status === 'sold') {
    patch = { stock: 0, isBooked: false };
  }
  return await updateProduct(productId, patch);
};

export const deleteProduct = async (productId: string) => {
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      await deleteDoc(doc(db, 'products', productId));
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${productId}`);
    }
  }

  // Fallback
  const products = getLocalData<Product>('products');
  const filtered = products.filter(p => p.id !== productId);
  setLocalData('products', filtered);
};

export const getMyProducts = (callback: (products: Product[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'products'), where('storeId', '==', MAIN_STORE_ID));
    return onSnapshot(q, (snap) => {
      const prods = snap.docs.map(doc => ensureProductStock({ id: doc.id, ...doc.data() } as Product));
      // Sort client-side to avoid mandatory composite index requirement
      prods.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as any);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      });
      callback(prods);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
  }

  // Fallback
  callback(getLocalData<Product>('products').map(ensureProductStock));
  return () => {};
};

export const getAllProducts = (callback: (products: Product[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ensureProductStock({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products_all'));
  }

  // Fallback
  callback(getLocalData<Product>('products').map(ensureProductStock));
  return () => {};
};

export const getAllStores = (callback: (stores: Store[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'stores_all'));
  }

  // Fallback
  callback(getLocalData<Store>('stores'));
  return () => {};
};

export const getStore = async (storeId: string): Promise<Store | null> => {
  if (isFirebaseEnabled && db) {
    try {
      const snap = await getDoc(doc(db, 'stores', storeId));
      return snap.exists() ? { id: snap.id, ...snap.data() } as Store : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `stores/${storeId}`);
    }
  }
  return getLocalData<Store>('stores').find(s => s.id === storeId) || null;
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  if (isFirebaseEnabled && db) {
    try {
      const snap = await getDoc(doc(db, 'products', productId));
      return snap.exists() ? ensureProductStock({ id: snap.id, ...snap.data() } as Product) : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `products/${productId}`);
    }
  }
  const found = getLocalData<Product>('products').find(p => p.id === productId);
  return found ? ensureProductStock(found) : null;
};

export const incrementProductView = async (productId: string) => {
  // Views are intentionally best-effort. Public clients must not be able to mutate
  // product inventory or metadata under the strict admin-only product rule.
  if (isFirebaseEnabled && db) return;
  const products = getLocalData<Product>('products');
  const updated = products.map(p => p.id === productId ? { ...p, views: (p.views || 0) + 1 } : p);
  setLocalData('products', updated);
};

export const getProductsByStore = async (storeId: string): Promise<Product[]> => {
  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, 'products'), where('storeId', '==', storeId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ensureProductStock({ id: doc.id, ...doc.data() } as Product));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `stores/${storeId}/products`);
    }
  }
  return getLocalData<Product>('products').filter(p => p.storeId === storeId).map(ensureProductStock);
};

// Sinkronisasi massal: Setel semua stok produk menjadi 1
export const syncAllProductsStockToOne = async (): Promise<number> => {
  let updatedCount = 0;
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      const snap = await getDocs(collection(db, 'products'));
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.stock !== 1) {
          await updateDoc(doc(db, 'products', docSnap.id), { stock: 1 });
          updatedCount++;
        }
      }
    } catch (e) {
      console.warn("Firestore bulk stock sync warning:", e);
    }
  }

  // Update local storage
  const localProducts = getLocalData<Product>('products');
  const updated = localProducts.map(p => ({ ...p, stock: 1 }));
  setLocalData('products', updated);
  return updatedCount;
};

// --- Review Services ---

export const getReviewsByProduct = (productId: string, callback: (reviews: Review[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    return onSnapshot(q, (snap) => {
      const revs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
      // Sort client-side to avoid mandatory composite index requirement
      revs.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as any);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      });
      callback(revs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `products/${productId}/reviews`));
  }
  callback(getLocalData<Review>('reviews').filter(r => r.productId === productId));
  return () => {};
};

export const addReview = async (productId: string, rating: number, comment: string, images: string[] = []) => {
  if (isFirebaseEnabled && db) {
    try {
      ensureAuth();
      const currentUser = auth?.currentUser;
      if (!currentUser) throw new Error('PERMISSION_DENIED: Login diperlukan untuk mengirim ulasan.');
      const reviewsRef = collection(db, 'reviews');
      await addDoc(reviewsRef, {
        productId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Pelanggan',
        rating,
        comment,
        images,
        createdAt: serverTimestamp(),
      });
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'reviews');
    }
  }
  const reviews = getLocalData<Review>('reviews');
  const newReview = { id: `rev_${Date.now()}`, productId, userId: 'local_user', userName: 'Guest User', rating, comment, images, createdAt: new Date().toISOString() as any };
  setLocalData('reviews', [newReview, ...reviews]);
};

// --- Order/History Services ---

export const recordOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  if (isFirebaseEnabled && db) {
    try {
      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...orderData,
        trackingHistory: [{
          status: orderData.status,
          message: 'Pesanan telah dibuat',
          timestamp: Timestamp.now().toDate().toISOString()
        }],
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
    }
  }
  const orders = getLocalData<Order>('orders');
  const newOrder = { ...orderData, id: `ord_${Date.now()}`, trackingHistory: [{ status: orderData.status, message: 'Pesanan telah dibuat', timestamp: new Date().toISOString() }], createdAt: new Date().toISOString() as any };
  setLocalData('orders', [newOrder, ...orders]);
  return newOrder.id;
};

export const updateOrderStatus = async (orderId: string, status: Order['status'], message: string) => {
  if (isFirebaseEnabled && db) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        const currentTracking = snap.data().trackingHistory || [];
        await updateDoc(orderRef, {
          status,
          trackingHistory: [...currentTracking, { status, message, timestamp: Timestamp.now().toDate().toISOString() }]
        });
      }
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  }
  const orders = getLocalData<Order>('orders');
  const updated = orders.map(o => {
    if (o.id === orderId) {
      const trackingEntry = { status, message, timestamp: new Date().toISOString() };
      return { ...o, status, trackingHistory: [...(o.trackingHistory || []), trackingEntry] };
    }
    return o;
  });
  setLocalData('orders', updated);
};

export const getMyOrders = (userId: string, callback: (orders: Order[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      // Sort client-side to avoid mandatory composite index requirement
      results.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as any);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as any);
        return dateB.getTime() - dateA.getTime();
      });
      callback(results);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/orders`));
  }
  callback(getLocalData<Order>('orders').filter(o => o.userId === userId));
  return () => {};
};
