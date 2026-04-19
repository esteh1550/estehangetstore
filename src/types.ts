export interface Store {
  id: string;
  name: string;
  logo: string;
  rating: number;
  location: string;
  description: string;
  isMall?: boolean;
  isStar?: boolean;
  ownerUid?: string;
  createdAt?: any;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'gadget' | 'pakaian' | 'sepatu' | 'digital';
  images: string[];
  description: string;
  specifications: string[];
  storeId: string;
  views?: number;
  ownerUid?: string;
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: any;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  createdAt: any;
  checkoutUrl: string;
  trackingHistory?: {
    status: string;
    message: string;
    timestamp: any;
  }[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
