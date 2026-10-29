import React, { useState } from 'react';
import { QrCode, X, CheckCircle2, RotateCw, Copy, Check, ExternalLink, ShieldCheck, DollarSign } from 'lucide-react';
import { Customer } from '../types';

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  customer?: Customer | null;
  onPaymentApproved?: (amount: number, reference: string) => void;
}

export const MercadoPagoModal: React.FC<MercadoPagoModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 45000,
  customer,
  onPaymentApproved
}) => {
  const [amount, setAmount] = useState<number>(defaultAmount || 45000);
  const [concept, setConcept] = useState('Cobro Mostrador / Pedido de Pinturas');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `https://mpago.la/pos-nova-${amount}-${Date.now()}`
  )}`;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const ref = `MP-${Date.now().toString().slice(-8)}`;
      setPaymentRef(ref);
      setIsProcessing(false);
      setPaymentSuccess(true);
      if (onPaymentApproved) {
        onPaymentApproved(amount, ref);
      }
    }, 1200);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://mpago.la/pos-nova-${amount}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReset = () => {
    setPaymentSuccess(false);
    setPaymentRef('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header with MP colors */}
        <div className="px-5 py-4 bg-[#009ee3] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/20 text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Cobro con Mercado Pago QR</h3>
              <p className="text-xs text-sky-100">Terminal de Cobro Dinámico & Point</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          {paymentSuccess ? (
            <div className="py-6 space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-slate-900">¡Pago Aprobado con Éxito!</h4>
              <p className="text-xs text-slate-600">
                Se acreditaron <strong>${amount.toLocaleString('es-AR')}</strong> en la cuenta de Mercado Pago.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-700">
                Operación Nº: <strong>{paymentRef}</strong>
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Nuevo Cobro
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-[#009ee3] hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Amount input */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Monto a Cobrar (ARS):</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-slate-400 font-black text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-2xl font-mono font-black text-slate-900 bg-transparent focus:outline-none"
                  />
                </div>
                {customer && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    Cliente: <strong>{customer.businessName}</strong>
                  </div>
                )}
              </div>

              {/* QR Image Box */}
              <div className="p-4 bg-white border-2 border-dashed border-sky-300 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <img 
                  src={qrImageUrl} 
                  alt="QR Mercado Pago" 
                  className="w-48 h-48 object-contain rounded-lg shadow-xs" 
                />
                <span className="text-[11px] font-semibold text-slate-500">
                  Escanee con la App de Mercado Pago o cualquier billetera digital (Transferencias 3.0)
                </span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" /> Verificando acreditación...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Simular Pago Aprobado
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link de pago copiado' : 'Copiar Link de Pago Web'}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cobro acreditado al instante</span>
          </div>
          <span className="font-semibold text-sky-700">Nova Systems POS</span>
        </div>

      </div>
    </div>
  );
};
