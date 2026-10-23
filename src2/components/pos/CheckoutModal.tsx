import React, { useState, useRef, useEffect } from 'react';
import { PaymentMethod, DocumentType, Client } from '../../types';
import {
  Banknote,
  CreditCard,
  Smartphone,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Printer,
  Mail,
  Share2,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  selectedDocType: DocumentType;
  selectedClient: Client;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (pm: PaymentMethod) => void;
  onConfirmSale: (paymentDetails: {
    method: PaymentMethod;
    cashTendered: number;
    cardBrand?: string;
    installments?: number;
    printTicket: boolean;
    sendEmail: boolean;
    sendWhatsapp: boolean;
    documentType: DocumentType;
  }) => void;
  isProcessing: boolean;
  initialPrintTicket: boolean;
  initialSendEmail: boolean;
  initialSendWhatsapp: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  total,
  selectedDocType,
  selectedClient,
  paymentMethod,
  setPaymentMethod,
  onConfirmSale,
  isProcessing,
  initialPrintTicket,
  initialSendEmail,
  initialSendWhatsapp,
}) => {
  const [docType, setDocType] = useState<DocumentType>(selectedDocType);
  const [cashTendered, setCashTendered] = useState<string>(total.toString());
  const [cardBrand, setCardBrand] = useState<string>('Visa Débito');
  const [installments, setInstallments] = useState<number>(1);
  const [printTicket, setPrintTicket] = useState(initialPrintTicket);
  const [sendEmail, setSendEmail] = useState(initialSendEmail);
  const [sendWhatsapp, setSendWhatsapp] = useState(initialSendWhatsapp);

  const cashInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDocType(selectedDocType);
      setCashTendered(total.toString());
      setPrintTicket(initialPrintTicket);
      setSendEmail(initialSendEmail);
      setSendWhatsapp(initialSendWhatsapp);
      setTimeout(() => {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, total, selectedDocType, initialPrintTicket, initialSendEmail, initialSendWhatsapp]);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - total);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && !isProcessing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    onConfirmSale({
      method: paymentMethod,
      cashTendered: tenderedNum,
      cardBrand: paymentMethod === 'credit_card' || paymentMethod === 'debit_card' ? cardBrand : undefined,
      cardInstallments: paymentMethod === 'credit_card' ? installments : undefined,
      printTicket,
      sendEmail,
      sendWhatsapp,
      documentType: docType,
    });
  };

  const setPresetCash = (amount: number) => {
    setCashTendered(amount.toString());
    cashInputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span>Finalizar y Cobrar Venta (F8)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Cliente: <strong className="text-white">{selectedClient.name}</strong> ({selectedClient.taxCondition})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {/* 1. SELECCION TIPO DE VENTA / COMPROBANTE (Ingreso de venta no ARCA vs Factura B vs Factura A) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Tipo de Venta / Comprobante:</span>
              <span className="text-[11px] text-amber-400 font-normal">
                {docType === 'ticket'
                  ? 'Venta Interna (Sin emisión fiscal ARCA)'
                  : docType === 'factura_b'
                  ? 'Factura Electrónica B (AFIP/ARCA)'
                  : docType === 'factura_a'
                  ? 'Factura Electrónica A (Resp. Inscripto)'
                  : 'Comprobante seleccionado'}
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Option 1: Ingreso de venta (no ARCA) */}
              <button
                type="button"
                onClick={() => setDocType('ticket')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  docType === 'ticket'
                    ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Receipt className={`w-4 h-4 ${docType === 'ticket' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-1 rounded font-bold uppercase">
                    INTERNO
                  </span>
                </div>
                <div className="font-bold text-white text-xs">Ingreso de Venta</div>
                <div className="text-[10px] text-slate-400">(no ARCA / No fiscal)</div>
              </button>

              {/* Option 2: Factura B (Consumidor Final) */}
              <button
                type="button"
                onClick={() => setDocType('factura_b')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  docType === 'factura_b'
                    ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <ShieldCheck className={`w-4 h-4 ${docType === 'factura_b' ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1 rounded font-bold uppercase">
                    ARCA
                  </span>
                </div>
                <div className="font-bold text-white text-xs">Factura B</div>
                <div className="text-[10px] text-slate-400">Consumidor Final</div>
              </button>

              {/* Option 3: Factura A (Responsable Inscripto) */}
              <button
                type="button"
                onClick={() => setDocType('factura_a')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  docType === 'factura_a'
                    ? 'bg-emerald-600/30 border-emerald-400 ring-1 ring-emerald-400 shadow-md'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <FileSpreadsheet className={`w-4 h-4 ${docType === 'factura_a' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-[9px] bg-emerald-900/60 text-emerald-300 px-1 rounded font-bold uppercase">
                    ARCA
                  </span>
                </div>
                <div className="font-bold text-white text-xs">Factura A</div>
                <div className="text-[10px] text-slate-400">Resp. Inscripto (IVA)</div>
              </button>
            </div>
          </div>

          {/* Total Prominent Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total a Cobrar
            </span>
            <span className="text-2xl font-black text-amber-400 tracking-tight font-mono">
              ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Forma de Pago
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Efectivo (1)', icon: Banknote },
                { id: 'debit_card', label: 'Débito (2)', icon: CreditCard },
                { id: 'credit_card', label: 'Crédito (3)', icon: CreditCard },
                { id: 'bank_transfer', label: 'Transferencia (4)', icon: Smartphone },
                { id: 'current_account', label: 'Cta. Cte. (5)', icon: FileText },
                { id: 'mercadopago_qr', label: 'MercadoPago (6)', icon: Smartphone },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSelected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.id as PaymentMethod);
                      setTimeout(() => cashInputRef.current?.focus(), 30);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-400 shadow-md font-extrabold scale-[1.02]'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Tendered & Change Calculator */}
          {paymentMethod === 'cash' && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Paga con Efectivo ($):</label>
                <input
                  ref={cashInputRef}
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-40 bg-slate-900 border border-slate-700 text-right text-lg font-black text-emerald-400 rounded-lg px-3 py-1.5 focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              {/* Quick Bill Buttons */}
              <div className="flex flex-wrap gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => setPresetCash(total)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-amber-400 border border-slate-700 cursor-pointer"
                >
                  Exacto
                </button>
                {[5000, 10000, 20000, 50000, 100000].map((amt) => {
                  if (amt < total && amt !== 10000) return null;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPresetCash(amt)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      ${amt.toLocaleString('es-AR')}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
                <span className="font-semibold text-slate-400 text-xs">Vuelto para entregar:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ${changeDue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Credit Card Details */}
          {paymentMethod === 'credit_card' && (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Tarjeta:</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2"
                >
                  <option value="Visa Crédito">Visa Crédito</option>
                  <option value="MasterCard Crédito">MasterCard Crédito</option>
                  <option value="Tarjeta Naranja">Tarjeta Naranja</option>
                  <option value="Cabal">Cabal</option>
                  <option value="American Express">American Express</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Cuotas:</label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-xs font-semibold text-white rounded-lg p-2"
                >
                  <option value="1">1 Pago Sin Interés</option>
                  <option value="3">3 Cuotas</option>
                  <option value="6">6 Cuotas</option>
                  <option value="12">12 Cuotas</option>
                </select>
              </div>
            </div>
          )}

          {/* Current Account Notice */}
          {paymentMethod === 'current_account' && (
            <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl text-xs space-y-1">
              <div className="flex items-center text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                Venta a Cuenta Corriente
              </div>
              <p className="text-slate-300 text-[11px]">
                Se imputará la deuda de ${total.toLocaleString('es-AR')} a la ficha de {selectedClient.name}.
              </p>
            </div>
          )}

          {/* Output Options Checkboxes */}
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-300">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={printTicket}
                onChange={(e) => setPrintTicket(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
              />
              <span className="flex items-center">
                <Printer className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Imprimir Comprobante
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
              />
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Enviar Email
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendWhatsapp}
                onChange={(e) => setSendWhatsapp(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-orange-500 focus:ring-0"
              />
              <span className="flex items-center">
                <Share2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Enviar WhatsApp
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-2 shrink-0 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Volver (Esc)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="flex-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs shadow-lg flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isProcessing ? 'Procesando...' : 'CONFIRMAR VENTA (ENTER)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
