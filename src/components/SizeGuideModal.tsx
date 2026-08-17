import React, { useState } from 'react';
import { X, Ruler, Sparkles } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand?: string;
}

const SIZE_CHART = [
  { eu: '36', usM: '4.5', usW: '6.0', uk: '3.5', cm: '22.5' },
  { eu: '37', usM: '5.0', usW: '6.5', uk: '4.0', cm: '23.0' },
  { eu: '38', usM: '6.0', usW: '7.5', uk: '5.0', cm: '24.0' },
  { eu: '39', usM: '6.5', usW: '8.0', uk: '5.5', cm: '24.5' },
  { eu: '40', usM: '7.5', usW: '9.0', uk: '6.5', cm: '25.0' },
  { eu: '41', usM: '8.0', usW: '9.5', uk: '7.0', cm: '26.0' },
  { eu: '42', usM: '8.5', usW: '10.0', uk: '7.5', cm: '26.5' },
  { eu: '43', usM: '9.5', usW: '11.0', uk: '8.5', cm: '27.5' },
  { eu: '44', usM: '10.0', usW: '11.5', uk: '9.0', cm: '28.0' },
  { eu: '45', usM: '11.0', usW: '12.5', uk: '10.0', cm: '29.0' },
  { eu: '46', usM: '12.0', usW: '13.5', uk: '11.0', cm: '30.0' },
];

export default function SizeGuideModal({ isOpen, onClose, brand }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#FDFBF7] w-full max-w-2xl rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-white border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-tea-main border-2 border-black rounded-xl">
              <Ruler size={20} className="text-black" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-black">Panduan Ukuran Sepatu</h3>
              <p className="text-xs font-bold text-black/60">
                Konversi Ukuran EU, US, UK & Panjang Kaki ({brand || 'Sepatu Original'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Tips Banner */}
          <div className="bg-amber-100/80 border-2 border-black p-4 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider text-black">
              <Sparkles size={14} className="text-amber-700" /> Tips Mengukur Kaki
            </div>
            <p className="text-xs text-black/80 leading-relaxed font-medium">
              Ukur panjang telapak kaki Anda dari ujung tumit hingga ujung jari terpanjang pada sore hari (saat ukuran kaki maksimal). Tambahkan toleransi <strong>0.5 cm - 1 cm</strong> untuk kenyamanan kaus kaki.
            </p>
          </div>

          {/* Unit Switcher & Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-black uppercase tracking-wider">
                Tabel Ukuran Standar (EU)
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-black">
                <button
                  onClick={() => setUnit('cm')}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                    unit === 'cm' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Centimeter (CM)
                </button>
                <button
                  onClick={() => setUnit('inch')}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                    unit === 'inch' ? 'bg-black text-white' : 'text-black hover:bg-gray-100'
                  }`}
                >
                  Inches (IN)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-black bg-white">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-tea-main border-b-2 border-black font-extrabold text-black uppercase text-[11px]">
                    <th className="p-3 border-r-2 border-black text-center">EU</th>
                    <th className="p-3 border-r-2 border-black text-center">US Men</th>
                    <th className="p-3 border-r-2 border-black text-center">US Women</th>
                    <th className="p-3 border-r-2 border-black text-center">UK</th>
                    <th className="p-3 text-center">Panjang ({unit.toUpperCase()})</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-black font-bold text-black font-mono">
                  {SIZE_CHART.map((row, idx) => {
                    const displayCm = unit === 'cm' ? `${row.cm} cm` : `${(parseFloat(row.cm) / 2.54).toFixed(1)} in`;
                    return (
                      <tr 
                        key={row.eu} 
                        className={`hover:bg-amber-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="p-2.5 border-r-2 border-black text-center font-extrabold text-sm bg-gray-100">{row.eu}</td>
                        <td className="p-2.5 border-r-2 border-black text-center">{row.usM}</td>
                        <td className="p-2.5 border-r-2 border-black text-center">{row.usW}</td>
                        <td className="p-2.5 border-r-2 border-black text-center">{row.uk}</td>
                        <td className="p-2.5 text-center font-extrabold text-tea-accent">{displayCm}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Brand-Specific Advice */}
          <div className="p-4 bg-white rounded-2xl border-2 border-black space-y-2">
            <h4 className="font-extrabold text-xs text-black uppercase tracking-wider">
              Catatan Fit Merek Populer:
            </h4>
            <ul className="text-xs text-black/70 space-y-1 font-medium list-disc list-inside">
              <li><strong>Nike / Air Jordan:</strong> True to size. Untuk tipe kaki lebar, disarankan naik 0.5 size.</li>
              <li><strong>Adidas / Yeezy:</strong> True to size. Untuk seri Yeezy/Ultraboost disarankan naik 0.5 size.</li>
              <li><strong>Puma / Converse / Vans:</strong> True to size / standar ukuran internasional.</li>
              <li><strong>Balenciaga / LV / Gucci:</strong> Seringkali menggunakan ukuran EU designer (bisa sedikit lebih lega).</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t-2 border-black flex justify-between items-center">
          <p className="text-[11px] font-bold text-black/60">
            Punya pertanyaan ukuran khusus? Konsultasikan gratis via WhatsApp.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-white text-xs font-extrabold rounded-xl hover:bg-black/80 transition-all border border-black"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
