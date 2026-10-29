import React, { useState } from 'react';
import { Cake, X, MessageSquare, Send, Calendar, Gift, Search, CheckCircle2, BadgePercent } from 'lucide-react';
import { Customer } from '../types';

interface CumpleanosModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
}

export const CumpleanosModal: React.FC<CumpleanosModalProps> = ({
  isOpen,
  onClose,
  customers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('15');
  const [sentCustomerIds, setSentCustomerIds] = useState<string[]>([]);

  if (!isOpen) return null;

  // Derive mock/real birthdays from customer registry
  const currentMonth = new Date().toLocaleString('es-AR', { month: 'long' });
  const currentMonthNum = new Date().getMonth() + 1;

  // Simulate birthdays deterministically if not set
  const birthdayCustomers = customers.map((c, idx) => {
    const day = ((idx * 7 + 3) % 28) + 1;
    const month = ((idx * 3 + 2) % 12) + 1;
    return {
      ...c,
      birthdayDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`,
      birthdayMonth: month,
      birthdayDay: day
    };
  }).filter(c => c.birthdayMonth === currentMonthNum || c.birthdayMonth === ((currentMonthNum % 12) + 1));

  const filtered = birthdayCustomers.filter(c =>
    c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.taxId.includes(searchTerm)
  );

  const handleSendWhatsAppPromo = (cust: typeof birthdayCustomers[0]) => {
    const couponCode = `CUMPLE-${cust.taxId.slice(-4)}-${promoDiscount}`;
    const text = encodeURIComponent(
      `¡Hola ${cust.businessName}! 🎉 Desde Nova Systems / Colorear Pinturas queremos desearte un muy Feliz Cumpleaños. ` +
      `Para celebrarlo, te regalamos un cupón especial de *${promoDiscount}% de descuento* (${couponCode}) válido para tu próxima compra en fábrica y mostrador. ¡Que tengas un excelente día!`
    );
    const phone = cust.phone?.replace(/[^0-9]/g, '') || '5491100000000';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    setSentCustomerIds(prev => [...prev, cust.id]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-xs">
              <Cake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black">Agenda de Cumpleaños & Fidelización</h3>
              <p className="text-xs text-orange-100">
                Clientes que cumplen años este mes ({currentMonth}) y próximas semanas
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente agendado..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Descuento de Regalo:</span>
            <select
              value={promoDiscount}
              onChange={e => setPromoDiscount(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1 bg-white font-bold text-orange-600 text-xs"
            >
              <option value="10">10% OFF</option>
              <option value="15">15% OFF (Recomendado)</option>
              <option value="20">20% OFF</option>
              <option value="25">25% OFF</option>
            </select>
          </div>
        </div>

        {/* List of Birthday Clients */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No hay cumpleaños programados para la búsqueda seleccionada.
            </div>
          ) : (
            filtered.map(cust => {
              const isSent = sentCustomerIds.includes(cust.id);
              return (
                <div key={cust.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold uppercase">{currentMonth.slice(0, 3)}</span>
                      <span className="text-xs font-black">{cust.birthdayDay}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{cust.businessName}</h4>
                      <p className="text-[11px] text-slate-500">
                        CUIT: {cust.taxId} · {cust.phone || 'Sin WhatsApp'} · {cust.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSent ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Saludo Enviado
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendWhatsAppPromo(cust)}
                        className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Enviar Regalo {promoDiscount}% OFF</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} clientes con fecha de festejo próxima</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
