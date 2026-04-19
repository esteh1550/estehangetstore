import React from 'react';
import { motion } from 'motion/react';
import { CONTACT_INFO } from '../constants';

export default function About() {
  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <h1 className="text-5xl font-display font-bold tracking-tighter text-black dark:text-white">Tentang ESTEHANGET</h1>
        <p className="text-xl text-black/60 dark:text-white/60 leading-relaxed">
          Kami percaya bahwa kesederhanaan adalah bentuk kemewahan yang paling murni.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="aspect-video rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/5"
      >
        <img 
          src="https://picsum.photos/seed/about/1200/800" 
          alt="About Us" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-black/70 dark:text-white/70 leading-relaxed">
        <div className="space-y-4">
          <h3 className="text-2xl font-display font-bold text-black dark:text-white">Visi Kami</h3>
          <p>
            Menjadi platform e-commerce terdepan yang menginspirasi gaya hidup minimalis, fungsional, dan estetis bagi masyarakat modern di Indonesia.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-display font-bold text-black dark:text-white">Misi Kami</h3>
          <p>
            Menyediakan produk berkualitas tinggi dengan desain yang dikurasi secara ketat, memberikan pengalaman belanja yang personal melalui teknologi AI, dan memastikan kepuasan pelanggan adalah prioritas utama.
          </p>
        </div>
      </div>

      <div className="bg-tea-main/10 dark:bg-tea-main/5 p-8 rounded-3xl text-center space-y-6 border border-tea-main/20">
        <h3 className="text-2xl font-display font-bold text-black dark:text-white">Hubungi Kami</h3>
        <p className="text-black/70 dark:text-white/70">Ada pertanyaan atau ingin berkolaborasi? Tim kami siap membantu.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a 
            href={`https://wa.me/${CONTACT_INFO.whatsapp}`} 
            className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
          >
            WhatsApp Admin
          </a>
          <a 
            href={CONTACT_INFO.instagram} 
            className="border-2 border-black dark:border-white text-black dark:text-white px-8 py-3 rounded-full font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
          >
            Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
