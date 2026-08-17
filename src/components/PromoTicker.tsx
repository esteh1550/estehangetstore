import React from 'react';

export default function PromoTicker() {
  return (
    <div className="bg-lilac-dark text-bone py-2 overflow-hidden whitespace-nowrap relative">
      <div className="flex animate-ticker">
        {[...Array(10)].map((_, i) => (
          <span key={i} className="mx-8 font-display text-sm font-bold uppercase tracking-widest">
            ✨ FLASH SALE! Termurah & Terpercaya ✨
          </span>
        ))}
      </div>
    </div>
  );
}
