import { useState, useEffect } from 'react';
import { Product } from '../types';

const HISTORY_KEY = 'estehanget_view_history';
const MAX_HISTORY = 12;

export function useProductHistory() {
  const [history, setHistory] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const addToHistory = (product: Product) => {
    setHistory(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const newHistory = [product, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const getRecommendedProducts = (allProducts: Product[]) => {
    if (history.length === 0) return [];
    
    // Get categories the user frequently views
    const categoryCounts: Record<string, number> = {};
    history.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    // Sort categories by frequency
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Filter products from these categories that are NOT already in history
    const historyIds = new Set(history.map(p => p.id));
    return allProducts
      .filter(p => topCategories.includes(p.category) && !historyIds.has(p.id))
      .slice(0, 6);
  };

  return { history, addToHistory, getRecommendedProducts };
}
