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
      const text = `Halo Admin ESTEHANGET, saya ingin berlangganan newsletter untuk mendapatkan info promo terbaru.\n\nNomor WhatsApp saya: ${email}\n\nMohon didaftarkan ya Kak!`;
      window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
      
      setEmail('');
      setShowModal(true);
    } catch (error) {
      console.error('Error saving newsletter:', error);
      const text = `Halo Admin ESTEHANGET, saya ingin berlangganan newsletter untuk mendapatkan info promo terbaru.\n\nNomor WhatsApp saya: ${email}\n\nMohon didaftarkan ya Kak!`;
      window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-bg-light text-black pt-16 pb-8 px-4 border-t border-black/5">
      <Modal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Berhasil Terdaftar!"
        message="Nomor Anda telah kami simpan. Tunggu info promo menarik dari kami ya Kak!"
      />
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src={CONTACT_INFO.logo} alt="Logo" className="h-10 w-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
            <span className="font-display text-2xl font-bold tracking-tighter text-black">ESTEHANGET</span>
          </div>
          <p className="text-black text-sm leading-relaxed">
            Destinasi belanja minimalis dan profesional untuk gaya hidup modern Anda.
          </p>
          <div className="flex gap-4">
            <a href={CONTACT_INFO.instagram} target="_blank" rel="noreferrer" className="hover:text-tea-accent transition-colors">
              <Instagram size={20} />
            </a>
            <a href={`https://wa.me/${CONTACT_INFO.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-tea-accent transition-colors">
              <MessageCircle size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display font-bold mb-6 text-black">Kategori</h4>
          <ul className="space-y-3 text-sm text-black">
            <li><a href="#" className="hover:text-tea-accent transition-colors">Gadget</a></li>
            <li><a href="#" className="hover:text-tea-accent transition-colors">Pakaian</a></li>
            <li><a href="#" className="hover:text-tea-accent transition-colors">Sepatu</a></li>
            <li><a href="#" className="hover:text-tea-accent transition-colors">Produk Digital</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-6 text-black">Bantuan</h4>
          <ul className="space-y-3 text-sm text-black">
            <li><a href="/contact" className="hover:text-tea-accent transition-colors">Hubungi Kami</a></li>
            <li><a href="#" className="hover:text-tea-accent transition-colors">Cara Belanja</a></li>
            <li><a href="#" className="hover:text-tea-accent transition-colors">Syarat & Ketentuan</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold mb-6 text-black">Newsletter</h4>
          <p className="text-sm text-black mb-4">Dapatkan info promo terbaru via WhatsApp.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="tel"
              placeholder="Nomor WA (e.g 0812...)"
              className="bg-black/5 border border-black/10 rounded-lg px-4 py-2 text-sm flex-1 focus:outline-none focus:border-tea-main transition-colors text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="bg-tea-main text-black p-2 rounded-lg hover:bg-tea-accent hover:text-white transition-colors">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-black/10 text-center text-xs text-black/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} ESTEHANGET. This web created by estehangetaja project.</p>
        <a href="/admin" className="opacity-0 hover:opacity-100 transition-opacity">Admin Panel</a>
      </div>
    </footer>
  );
}
