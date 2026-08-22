/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';
import Home from './pages/Home';
import Contact from './pages/Contact';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Seller from './pages/Seller';
import Orders from './pages/Orders';
import { Product, CartItem } from './types';
import { getAllProducts } from './lib/sellerService';
import { PRODUCTS } from './constants';
import { ToastProvider } from './components/Toast';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [cart, setCart] = React.useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('esteh_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item: any) =>
        item && typeof item.id === 'string' && typeof item.name === 'string' &&
        Number.isFinite(Number(item.price)) && Number(item.quantity) > 0
      ).map((item: any) => ({
        ...item,
        price: Number(item.price),
        quantity: Math.max(1, Number(item.quantity)),
        selectedSize: item.selectedSize ? String(item.selectedSize) : undefined,
      }));
    } catch {
      localStorage.removeItem('esteh_cart');
      return [];
    }
  });
  
  const [wishlist, setWishlist] = React.useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('esteh_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [dynamicProducts, setDynamicProducts] = React.useState<Product[]>([]);

  React.useEffect(() => {
    const unsub = getAllProducts(setDynamicProducts);
    return () => unsub();
  }, []);

  const allProducts = React.useMemo(() => {
    const combined = [...PRODUCTS];
    dynamicProducts.forEach(dp => {
      if (!combined.find(p => p.id === dp.id)) combined.push(dp);
    });
    return combined;
  }, [dynamicProducts]);

  React.useEffect(() => {
    localStorage.setItem('esteh_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  React.useEffect(() => {
    try {
      localStorage.setItem('esteh_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [cart]);
  React.useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user_session');
      if (savedUser && savedUser !== 'undefined') {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to parse user session", e);
    }
  }, []);

  const addToCart = (product: Product & { selectedSize?: string }) => {
    const defaultSize = product.selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : '40');
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === defaultSize);
      if (existing) {
        const maxStock = Number.isFinite(existing.stock) && existing.stock > 0 ? existing.stock : Number.MAX_SAFE_INTEGER;
        if (existing.quantity >= maxStock) return prev;
        return prev.map(item =>
          (item.id === product.id && item.selectedSize === defaultSize)
            ? { ...item, quantity: Math.min(maxStock, item.quantity + 1) }
            : item
        );
      }
      return [...prev, { ...product, selectedSize: defaultSize, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const getCartKey = (item: Pick<CartItem, 'id' | 'selectedSize'>) =>
    `${item.id}::${item.selectedSize || 'standard'}`;

  const updateCartQuantity = (id: string, selectedSize: string | undefined, delta: number) => {
    const key = getCartKey({ id, selectedSize });
    setCart(prev => prev.map(item => {
      if (getCartKey(item) !== key) return item;
      const maxStock = Number.isFinite(item.stock) && item.stock > 0 ? item.stock : Number.MAX_SAFE_INTEGER;
      const newQty = Math.min(maxStock, Math.max(1, item.quantity + delta));
      return { ...item, quantity: newQty };
    }));
  };

  const removeFromCart = (id: string, selectedSize: string | undefined) => {
    const key = getCartKey({ id, selectedSize });
    setCart(prev => prev.filter(item => getCartKey(item) !== key));
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <ToastProvider>
      <Router>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={1600} />}
        <div className="min-h-screen flex flex-col">
        <Navbar 
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          wishlistCount={wishlist.length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <Home 
                  onAddToCart={addToCart}
                  onToggleWishlist={toggleWishlist}
                  onViewDetails={() => {}} // Not needed anymore as we use links
                  wishlist={wishlist}
                />
              } />
              <Route path="/product/:id" element={<ProductDetail onAddToCart={addToCart} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/seller" element={<Seller />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="*" element={<Home onAddToCart={addToCart} onToggleWishlist={toggleWishlist} onViewDetails={() => {}} wishlist={wishlist} />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />

        <CartSidebar 
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          onUpdateQuantity={updateCartQuantity}
          onRemove={removeFromCart}
        />

        <WishlistSidebar 
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          wishlist={wishlist}
          allProducts={allProducts}
          onToggleWishlist={toggleWishlist}
          onAddToCart={addToCart}
        />
      </div>
    </Router>
  </ToastProvider>
  );
}
