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
      return saved ? JSON.parse(saved) : [];
    } catch {
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
    localStorage.setItem('esteh_cart', JSON.stringify(cart));
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
        return prev.map(item => 
          (item.id === product.id && item.selectedSize === defaultSize)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, selectedSize: defaultSize, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <ToastProvider>
      <Router>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} duration={2800} />}
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
