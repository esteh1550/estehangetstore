import React from 'react';
import { Instagram, MessageCircle, Send } from 'lucide-react';
import { saveNewsletter } from '../lib/storage';
import { CONTACT_INFO } from '../constants';
import Modal from './Modal';

export default function Footer() {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await saveNewsletter({ phone: email });

      // Also open WhatsApp as a backup/direct contact
      const text = `Halo Admin E STORE, saya ingin berlangganan newsletter untuk mendapatkan info promo sepatu terbaru.\n\nNomor WhatsApp saya: ${email}\n\nMohon didaftarkan ya Kak!`;
      window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
      
      setEmail('');
      setShowModal(true);
    } catch (error) {
      console.error('Error saving newsletter:', error);
      const text = `Halo Admin E STORE, saya ingin berlangganan newsletter untuk mendapatkan info promo sepatu terbaru.\n\nNomor WhatsApp saya: ${email}\n\nMohon didaftarkan ya Kak!`;
      window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#FAF4ED] text-[#181512] pt-16 pb-12 px-4 border-t border-[#E8DEC9]">
      <Modal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Berhasil Terdaftar!"
        message="Nomor Anda telah kami simpan. Tunggu info promo menarik dari kami ya Kak!"
      />
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-[#E5DEC9] flex items-center justify-center p-1 shadow-sm overflow-hidden">
                <img 
                  src={CONTACT_INFO.logo} 
                  alt="E STORE Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-serif text-2xl font-normal tracking-widest text-[#181512] uppercase">
                  E STORE
                </span>
                <p className="text-[10px] text-[#7A7163] font-bold tracking-widest uppercase">Shoes Store Terpercaya</p>
              </div>
            </div>
            <p className="text-[#5C5549] text-xs leading-relaxed">
              Toko sepatu online terpercaya & 100% original. Menyediakan koleksi Nike, Adidas, New Balance, Converse, dan Vans.
            </p>
            <div className="flex gap-4 pt-2">
              <a href={CONTACT_INFO.instagram} target="_blank" rel="noreferrer" className="text-[#181512] hover:text-[#B83A0E] transition-colors">
                <Instagram size={18} />
              </a>
              <a href={`https://wa.me/${CONTACT_INFO.whatsapp}`} target="_blank" rel="noreferrer" className="text-[#181512] hover:text-[#B83A0E] transition-colors">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm tracking-widest uppercase mb-4 text-[#181512]">Koleksi Brands</h4>
            <ul className="space-y-1.5 text-xs text-[#5C5549]">
              <li><a href="/?brand=Nike" className="hover:text-[#B83A0E] transition-colors">Nike</a></li>
              <li><a href="/?brand=Adidas" className="hover:text-[#B83A0E] transition-colors">Adidas</a></li>
              <li><a href="/?brand=New%20Balance" className="hover:text-[#B83A0E] transition-colors">New Balance</a></li>
              <li><a href="/?brand=Converse" className="hover:text-[#B83A0E] transition-colors">Converse</a></li>
              <li><a href="/?brand=Vans" className="hover:text-[#B83A0E] transition-colors">Vans</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm tracking-widest uppercase mb-4 text-[#181512]">Informasi</h4>
            <ul className="space-y-1.5 text-xs text-[#5C5549]">
              <li><a href="/contact" className="hover:text-[#B83A0E] transition-colors">Hubungi Kami</a></li>
              <li><a href="/orders" className="hover:text-[#B83A0E] transition-colors">Cek Status Pesanan</a></li>
              <li><a href="/" className="hover:text-[#B83A0E] transition-colors">Garansi Original 100%</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm tracking-widest uppercase mb-2 text-[#181512]">Newsletter Signup</h4>
            <p className="text-xs text-[#5C5549] mb-4">Dapatkan info rilis & promo spesial via WhatsApp.</p>
            <form onSubmit={handleSubscribe} className="flex gap-1.5">
              <input
                type="tel"
                placeholder="Nomor WA (0812...)"
                className="bg-[#FAF7F2] border border-[#E0D6C3] rounded-lg px-3 py-2 text-xs flex-1 focus:outline-none focus:border-[#B83A0E] text-[#181512]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="bg-[#181512] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#B83A0E] transition-colors"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Editorial Heritage Strip */}
        <div className="pt-8 border-t border-[#E5DEC9] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#7A7163]">
          <span className="font-serif font-bold text-sm tracking-widest text-[#B83A0E] uppercase">
            MILK LINEN / IVORY
          </span>

          <div className="flex gap-6 font-medium text-xs text-[#181512]">
            <a href="/" className="hover:text-[#B83A0E] transition-colors">Story</a>
            <a href="/" className="hover:text-[#B83A0E] transition-colors">Craft</a>
            <a href="/" className="hover:text-[#B83A0E] transition-colors">Sustainability</a>
            <a href="/" className="hover:text-[#B83A0E] transition-colors">Stockists</a>
          </div>

          <p className="text-[11px] font-medium text-[#7A7163]">
            © {new Date().getFullYear()} E STORE HERITAGE. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
