import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';

import { Product } from '../types';

interface HeroProps {
  featuredProducts?: Product[];
}

const DEFAULT_BANNERS = [
  {
    id: 1,
    title: "Ramadan Sale",
    subtitle: "Diskon Hingga 50%",
    image: "https://i.postimg.cc/6qNqM5LX/Gemini_Generated_Image_9ye57e9ye57e9ye5.png",
    color: "bg-sky-blue/20"
  },
  {
    id: 2,
    title: "Gadget Terbaru",
    subtitle: "Cicilan 0% s/d 12 Bulan",
    image: "https://picsum.photos/seed/gadget/1200/800",
    color: "bg-pastel-peach/20"
  },
  {
    id: 3,
    title: "Fashion Minimalis",
    subtitle: "Gratis Ongkir Seluruh Indonesia",
    image: "https://picsum.photos/seed/fashion/1200/800",
    color: "bg-lavender/20"
  }
];

export default function Hero({ featuredProducts = [] }: HeroProps) {
  const [current, setCurrent] = React.useState(0);

  const slides = React.useMemo(() => {
    if (featuredProducts.length > 0) {
      return featuredProducts.slice(0, 3).map((p, i) => ({
        id: p.id,
        title: p.name,
        subtitle: p.description,
        image: p.images[0],
        color: i === 0 ? "bg-sky-blue/20" : i === 1 ? "bg-pastel-peach/20" : "bg-lavender/20",
        isProduct: true
      }));
    }
    return DEFAULT_BANNERS;
  }, [featuredProducts]);

  React.useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative pt-28 pb-8 px-4 max-w-7xl mx-auto overflow-hidden">
      <div className="relative aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden shadow-xl group">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className={cn("absolute inset-0 flex items-center px-8 md:px-20", slides[current].color)}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
              <div className="space-y-4 text-center md:text-left">
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-5xl font-display font-bold text-black line-clamp-2"
                >
                  {slides[current].title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm md:text-lg text-black font-medium line-clamp-2"
                >
                  {slides[current].subtitle}
                </motion.p>
                <motion.button 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => {
                    document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-tea-main text-white px-6 py-3 rounded-xl font-bold text-sm md:text-base hover:scale-105 transition-transform shadow-lg"
                >
                  Cek Sekarang
                </motion.button>
              </div>
              <div className="hidden md:block relative h-full">
                <img 
                  src={slides[current].image} 
                  alt={slides[current].title}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <button 
          onClick={() => setCurrent(prev => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setCurrent(prev => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={24} />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                current === i ? "w-6 bg-black dark:bg-white" : "bg-black dark:bg-white opacity-20"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
