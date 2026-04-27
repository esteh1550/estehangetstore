import React from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

export default function Contact() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Admin ESTEHANGET,\n\nNama: ${formData.name}\nEmail: ${formData.email}\n\nPesan:\n${formData.message}`;
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-12"
        >
          <div className="space-y-4">
            <h1 className="text-5xl font-display font-bold tracking-tighter text-black">Hubungi Kami</h1>
            <p className="text-black/60 text-lg">
              Punya pertanyaan atau butuh bantuan? Tim kami siap melayani Anda dengan sepenuh hati.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-tea-main/10 rounded-2xl flex items-center justify-center text-tea-main flex-shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-black">WhatsApp</h4>
                <p className="text-black/60">{CONTACT_INFO.whatsapp}</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-pastel-pink/20 rounded-2xl flex items-center justify-center text-pastel-pink flex-shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="font-bold text-black">Email</h4>
                <p className="text-black/60">halo@estehanget.com</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-lavender/20 rounded-2xl flex items-center justify-center text-lavender flex-shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-black">Lokasi</h4>
                <p className="text-black/60">Jakarta Selatan, Indonesia</p>
              </div>
            </div>
          </div>

          <div className="aspect-video rounded-3xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-black/5 shadow-xl">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126906.2494194094!2d106.7196775!3d-6.2844662!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f1ec2422b1b3%3A0x1016348e5d07d80!2sJakarta%20Selatan%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sid!2sid!4v1713080000000!5m2!1sid!2sid" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-black/5 space-y-8"
        >
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-black">Kirim Pesan</h3>
            <p className="text-black/60">Isi formulir di bawah ini dan kami akan segera membalasnya.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-black/60 ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                required
                className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black"
                placeholder="Masukkan nama Anda"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-black/60 ml-1">Email / No. WhatsApp</label>
              <input 
                type="text" 
                required
                className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black"
                placeholder="email@anda.com atau 0812..."
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-black/60 ml-1">Pesan Anda</label>
              <textarea 
                rows={5}
                required
                className="w-full bg-white border border-black/5 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black resize-none"
                placeholder="Tuliskan pesan atau pertanyaan Anda di sini..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
              ></textarea>
            </div>

            <button 
              type="submit"
              className="w-full bg-tea-main text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl"
            >
              <MessageCircle size={20} /> Kirim via WhatsApp
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
