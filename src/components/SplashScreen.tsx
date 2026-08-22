import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number; // duration in ms
}

const LOGO_URL = "https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png";

export default function SplashScreen({ onFinish, duration = 2800 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Preload logo image
    const img = new Image();
    img.src = LOGO_URL;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 600); // allow exit animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] bg-[#FAF7F2] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle background vintage pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#E8DEC9_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

          {/* Ambient background glow */}
          <div className="absolute w-80 h-80 rounded-full bg-[#B83A0E]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
            {/* Animated Logo Container */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-36 h-36 sm:w-44 sm:h-44 mb-6 bg-white rounded-3xl p-5 shadow-[0_16px_50px_rgba(24,21,18,0.12)] border border-[#E8DEC9] flex items-center justify-center overflow-hidden"
            >
              <img
                src={LOGO_URL}
                alt="E STORE Logo"
                className={`w-full h-full object-contain filter drop-shadow-md transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-90'
                }`}
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-1"
            >
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-[0.2em] text-[#181512] uppercase">
                E STORE
              </h1>
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-[#8C8375] uppercase">
                SHOES STORE TERPERCAYA
              </p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mt-8 w-44 sm:w-52 h-1.5 bg-[#E8DEC9] rounded-full overflow-hidden relative"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: duration / 1000 - 0.4, ease: "easeInOut" }}
                className="h-full bg-[#B83A0E] rounded-full"
              />
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="mt-4 text-[10px] font-semibold tracking-[0.2em] text-[#7A7163] uppercase"
            >
              Mempersiapkan Koleksi Sepatu Original...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
