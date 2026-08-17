import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, isFirebaseEnabled } from './firebase';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface NewsletterRecord {
  id: string;
  email?: string;
  phone?: string;
  createdAt: any;
}

const LOCAL_ORDERS_KEY = 'estehanget_orders';
const LOCAL_NEWSLETTER_KEY = 'estehanget_newsletter';

export const saveOrder = async (order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>) => {
  if (isFirebaseEnabled && db) {
    try {
      await addDoc(collection(db, 'customer_orders'), {
        ...order,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return;
    } catch (e) {
      console.error('Error saving order to Firestore:', e);
    }
  }

  // Fallback
  const newOrder = {
    ...order,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };
  const localOrders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
  const localOrderWithId = { ...newOrder, id: `local_${Date.now()}` };
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([localOrderWithId, ...localOrders]));
};

export const saveNewsletter = async (data: { email?: string, phone?: string }) => {
  if (isFirebaseEnabled && db) {
    try {
      await addDoc(collection(db, 'newsletter'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return;
    } catch (e) {
      console.error('Error saving newsletter to Firestore:', e);
    }
  }

  // Fallback
  const newEntry = {
    ...data,
    createdAt: new Date().toISOString()
  };
  const localNews = JSON.parse(localStorage.getItem(LOCAL_NEWSLETTER_KEY) || '[]');
  const localNewsWithId = { ...newEntry, id: `local_${Date.now()}` };
  localStorage.setItem(LOCAL_NEWSLETTER_KEY, JSON.stringify([localNewsWithId, ...localNews]));
};

export const getLocalOrders = (): OrderRecord[] => {
  return JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]');
};

export const getLocalNewsletters = (): NewsletterRecord[] => {
  return JSON.parse(localStorage.getItem(LOCAL_NEWSLETTER_KEY) || '[]');
};

export const clearLocalData = () => {
  localStorage.removeItem(LOCAL_ORDERS_KEY);
  localStorage.removeItem(LOCAL_NEWSLETTER_KEY);
};

export const updateLocalOrderStatus = (id: string, status: OrderRecord['status']) => {
  const orders = getLocalOrders();
  const updated = orders.map(o => o.id === id ? { ...o, status } : o);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
};
