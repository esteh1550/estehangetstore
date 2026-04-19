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
import { db, isFirebaseEnabled, handleFirestoreError, OperationType } from './firebase';
import { Store, Product, Review, Order } from '../types';

export const MAIN_STORE_ID = 'estehanget-store';

// --- Local Storage Fallback Helpers ---
const STORAGE_PREFIX = 'estehanget_';
const getLocalData = <T>(key: string): T[] => JSON.parse(localStorage.getItem(STORAGE_PREFIX + key) || '[]');
const setLocalData = <T>(key: string, data: T[]) => localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));

// --- Firestore Services ---

export const uploadImage = async (file: File, _path: string): Promise<string> => {
  // Simple Base64 simulation for both modes for now to ensure portability
  // In a full production app, we would use Firebase Storage here
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};

export const createStore = async (storeData: Omit<Store, 'id' | 'createdAt' | 'rating'>) => {
  if (isFirebaseEnabled && db) {
    try {
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
  if (isFirebaseEnabled && db) {
    try {
      const prodRef = collection(db, 'products');
      const docRef = await addDoc(prodRef, {
        ...productData,
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
  const newProduct = { ...productData, id: `prod_${Date.now()}`, storeId: MAIN_STORE_ID, createdAt: new Date().toISOString() as any };
  setLocalData('products', [newProduct, ...products]);
  return newProduct.id;
};

export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  if (isFirebaseEnabled && db) {
    try {
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, { ...productData, updatedAt: serverTimestamp() });
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}`);
    }
  }

  // Fallback
  const products = getLocalData<Product>('products');
  const updated = products.map(p => p.id === productId ? { ...p, ...productData, updatedAt: new Date().toISOString() as any } : p);
  setLocalData('products', updated);
};

export const deleteProduct = async (productId: string) => {
  if (isFirebaseEnabled && db) {
    try {
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
    const q = query(collection(db, 'products'), where('storeId', '==', MAIN_STORE_ID), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
  }

  // Fallback
  callback(getLocalData<Product>('products'));
  return () => {};
};

export const getAllProducts = (callback: (products: Product[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products_all'));
  }

  // Fallback
  callback(getLocalData<Product>('products'));
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
      return snap.exists() ? { id: snap.id, ...snap.data() } as Product : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `products/${productId}`);
    }
  }
  return getLocalData<Product>('products').find(p => p.id === productId) || null;
};

export const incrementProductView = async (productId: string) => {
  if (isFirebaseEnabled && db) {
    try {
      await updateDoc(doc(db, 'products', productId), { views: increment(1) });
      return;
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${productId}/views`);
    }
  }
  const products = getLocalData<Product>('products');
  const updated = products.map(p => p.id === productId ? { ...p, views: (p.views || 0) + 1 } : p);
  setLocalData('products', updated);
};

export const getProductsByStore = async (storeId: string): Promise<Product[]> => {
  if (isFirebaseEnabled && db) {
    try {
      const q = query(collection(db, 'products'), where('storeId', '==', storeId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `stores/${storeId}/products`);
    }
  }
  return getLocalData<Product>('products').filter(p => p.storeId === storeId);
};

// --- Review Services ---

export const getReviewsByProduct = (productId: string, callback: (reviews: Review[]) => void) => {
  if (isFirebaseEnabled && db) {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `products/${productId}/reviews`));
  }
  callback(getLocalData<Review>('reviews').filter(r => r.productId === productId));
  return () => {};
};

export const addReview = async (productId: string, rating: number, comment: string, images: string[] = []) => {
  if (isFirebaseEnabled && db) {
    try {
      const reviewsRef = collection(db, 'reviews');
      await addDoc(reviewsRef, {
        productId,
        userId: 'cloud_user', // This would depend on real auth in prod
        userName: 'Pecinta Teh',
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
    const q = query(collection(db, 'orders'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${userId}/orders`));
  }
  callback(getLocalData<Order>('orders').filter(o => o.userId === userId));
  return () => {};
};
