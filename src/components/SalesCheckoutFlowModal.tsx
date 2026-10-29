import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Check, 
  CheckCircle2, 
  FileText, 
  Receipt, 
  CreditCard, 
  Banknote, 
  ArrowLeftRight, 
  Wallet, 
  QrCode, 
  Smartphone, 
  FileCheck, 
  AlertCircle, 
  ChevronRight, 
  Layers, 
  ArrowLeft
} from 'lucide-react';
import { Customer, Cashbox, InvoiceType } from '../types';

export type CheckoutDocumentType = 'ingreso_venta' | 'factura_a' | 'factura_b' | 'factura_c';

export type CheckoutPaymentMethod = 
  | 'efectivo' 
  | 'tarjeta' 
  | 'transferencia' 
  | 'cheque' 
  | 'cuenta_corriente' 
  | 'echeq' 
  | 'mercadopago_qr' 
  | 'mercado_pago' 
  | 'no_pago'
  | 'pago_mixto';

export interface CheckoutResult {
  docType: CheckoutDocumentType;
  invoiceType: InvoiceType;
  billingType: 'arca' | 'no_arca';
  paymentMethod: CheckoutPaymentMethod;
  cashGiven?: number;
  changeGiven?: number;
  cardDetails?: {
    type: 'debito' | 'credito';
    installments: number;
    couponNumber: string;
  };
  transferDetails?: {
    bank: string;
    referenceNumber: string;
  };
  checkDetails?: {
    number: string;
    bank: string;
    dueDate: string;
  };
  mixedPayments?: {
    method: CheckoutPaymentMethod;
    amount: number;
  }[];
  cashboxId?: string;
  notes?: string;
}

interface SalesCheckoutFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customer?: Customer | null;
  cashboxes?: Cashbox[];
  onConfirm: (result: CheckoutResult) => Promise<void>;
}

export const SalesCheckoutFlowModal: React.FC<SalesCheckoutFlowModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  customer,
  cashboxes = [],
  onConfirm
}) => {
  // Step in the modal: 1 = 'tipo_comprobante', 2 = 'metodo_pago'
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Selected Comprobante
  const [selectedDocType, setSelectedDocType] = useState<CheckoutDocumentType>('ingreso_venta');

  // Step 2: Selected Payment Method
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<CheckoutPaymentMethod>('efectivo');
  const [isMixedPayment, setIsMixedPayment] = useState<boolean>(false);

  // Cash payment details
  const [cashAmountGiven, setCashAmountGiven] = useState<number>(totalAmount);

  // Mixed payment details
  const [mixedCash, setMixedCash] = useState<number>(Math.floor(totalAmount / 2));
  const [mixedTransfer, setMixedTransfer] = useState<number>(Math.ceil(totalAmount / 2));

  // Card details
  const [cardType, setCardType] = useState<'debito' | 'credito'>('debito');
  const [cardInstallments, setCardInstallments] = useState<number>(1);
  const [cardCoupon, setCardCoupon] = useState<string>('');

  // Transfer details
  const [transferBank, setTransferBank] = useState<string>('Banco Galicia (Cuenta Fábrica)');
  const [transferRef, setTransferRef] = useState<string>('');

  // Check details
  const [checkNumber, setCheckNumber] = useState<string>('');
  const [checkBank, setCheckBank] = useState<string>('Banco Santander');
  const [checkDueDate, setCheckDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Selected cashbox
  const [selectedCashboxId, setSelectedCashboxId] = useState<string>(() => {
    const def = cashboxes.find(c => c.isDefault) || cashboxes[0];
    return def?.id || 'caja-mostrador-1';
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset or update on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setCashAmountGiven(totalAmount);
      setIsMixedPayment(false);
      setMixedCash(Math.floor(totalAmount / 2));
      setMixedTransfer(Math.ceil(totalAmount / 2));
    }
  }, [isOpen, totalAmount]);

  // Calculate change for cash payment
  const changeToGive = useMemo(() => {
    const given = Number(cashAmountGiven) || 0;
    return Math.max(0, given - totalAmount);
  }, [cashAmountGiven, totalAmount]);

  if (!isOpen) return null;

  // Handle advancing to step 2
  const handleProceedToPayment = (type: CheckoutDocumentType) => {
    setSelectedDocType(type);
    setStep(2);
  };

  // Handle confirmation
  const handleFinalSubmit = async () => {
    if (selectedPaymentMethod === 'cuenta_corriente' && (!customer || customer.id === 'occasional')) {
      alert('Para registrar en Cuenta Corriente debe seleccionar un cliente registrado (no Cliente Ocasional).');
      return;
    }

    if (selectedPaymentMethod === 'efectivo' && cashAmountGiven < totalAmount) {
      alert(`El importe entregado ($${cashAmountGiven.toLocaleString('es-AR')}) es menor al total a cobrar ($${totalAmount.toLocaleString('es-AR')}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      let invType: InvoiceType = 'RECIBO_X_NO_ARCA';
      let billType: 'arca' | 'no_arca' = 'no_arca';

      if (selectedDocType === 'factura_a') {
        invType = 'FACTURA_A';
        billType = 'arca';
      } else if (selectedDocType === 'factura_b') {
        invType = 'FACTURA_B';
        billType = 'arca';
      } else if (selectedDocType === 'factura_c') {
        invType = 'FACTURA_C';
        billType = 'arca';
      } else {
        invType = 'RECIBO_X_NO_ARCA';
        billType = 'no_arca';
      }

      const checkoutPayload: CheckoutResult = {
        docType: selectedDocType,
        invoiceType: invType,
        billingType: billType,
        paymentMethod: isMixedPayment ? 'pago_mixto' : selectedPaymentMethod,
        cashGiven: selectedPaymentMethod === 'efectivo' ? Number(cashAmountGiven) : undefined,
        changeGiven: selectedPaymentMethod === 'efectivo' ? changeToGive : undefined,
        cardDetails: selectedPaymentMethod === 'tarjeta' ? {
          type: cardType,
          installments: cardInstallments,
          couponNumber: cardCoupon
        } : undefined,
        transferDetails: selectedPaymentMethod === 'transferencia' ? {
          bank: transferBank,
          referenceNumber: transferRef
        } : undefined,
        checkDetails: (selectedPaymentMethod === 'cheque' || selectedPaymentMethod === 'echeq') ? {
          number: checkNumber,
          bank: checkBank,
          dueDate: checkDueDate
        } : undefined,
        mixedPayments: isMixedPayment ? [
          { method: 'efectivo', amount: Number(mixedCash) || 0 },
          { method: 'transferencia', amount: Number(mixedTransfer) || 0 }
        ] : undefined,
        cashboxId: selectedCashboxId
      };

      await onConfirm(checkoutPayload);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al confirmar la venta. Revise la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        
        {/* ========================================================
            STEP 1: TIPO DE COMPROBANTE (Matches Image 1 Exactly)
           ======================================================== */}
        {step === 1 && (
          <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Tipo de Comprobante
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Seleccioná el tipo de comprobante para esta venta
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Ingreso de Venta (Highlighted in screenshot with orange border) */}
            <div>
              <div
                onClick={() => setSelectedDocType('ingreso_venta')}
                className={`w-full p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedDocType === 'ingreso_venta'
                    ? 'border-[#ea580c] bg-orange-50/40 shadow-xs ring-2 ring-orange-200/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Orange Receipt Icon matching screenshot */}
                <div className="w-14 h-14 rounded-2xl bg-orange-100/80 text-[#ea580c] flex items-center justify-center shrink-0 border border-orange-200 shadow-2xs">
                  <Receipt className="w-7 h-7" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-base font-black text-slate-900">
                    Ingreso de Venta
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprobante interno sin facturación fiscal
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDocType === 'ingreso_venta' ? 'border-[#ea580c] bg-[#ea580c] text-white' : 'border-slate-300'
                }`}>
                  {selectedDocType === 'ingreso_venta' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Section Header: FACTURACIÓN ELECTRÓNICA (ARCA) */}
            <div className="pt-2">
              <span className="text-[11px] font-black tracking-wider text-slate-400 uppercase">
                FACTURACIÓN ELECTRÓNICA (ARCA)
              </span>
            </div>

            {/* ARCA Fiscal Invoices list */}
            <div className="space-y-3">
              {/* Factura A */}
              <div
                onClick={() => setSelectedDocType('factura_a')}
                className={`w-full p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedDocType === 'factura_a'
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-200/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-200">
                  A
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-black text-slate-900">
                    Factura A
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Responsable Inscripto → Responsable Inscripto
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDocType === 'factura_a' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}>
                  {selectedDocType === 'factura_a' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Factura B */}
              <div
                onClick={() => setSelectedDocType('factura_b')}
                className={`w-full p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedDocType === 'factura_b'
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-200/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-200">
                  B
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-black text-slate-900">
                    Factura B
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Responsable Inscripto → Consumidor Final / Monotributo
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDocType === 'factura_b' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}>
                  {selectedDocType === 'factura_b' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Factura C */}
              <div
                onClick={() => setSelectedDocType('factura_c')}
                className={`w-full p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  selectedDocType === 'factura_c'
                    ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-200/50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black text-lg flex items-center justify-center shrink-0 border border-emerald-200">
                  C
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-black text-slate-900">
                    Factura C
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monotributo → Consumidor Final
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedDocType === 'factura_c' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}>
                  {selectedDocType === 'factura_c' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Bottom Bar: Total & Next Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Total Venta:</span>
                <span className="font-mono font-black text-xl text-slate-900">
                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleProceedToPayment(selectedDocType)}
                className="px-6 py-3 bg-[#ea580c] hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Continuar a Forma de Pago</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: MÉTODO DE PAGO (Matches Image 2 Exactly)
           ======================================================== */}
        {step === 2 && (
          <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Volver a seleccionar tipo de comprobante"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Método de Pago
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprobante: <strong className="text-slate-800 uppercase">
                      {selectedDocType === 'ingreso_venta' ? 'Ingreso de Venta (No ARCA)' : selectedDocType.replace('_', ' ').toUpperCase() + ' (ARCA)'}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMixedPayment(!isMixedPayment)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                    isMixedPayment 
                      ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-600" />
                  <span>Pago Mixto</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid of 6 Payment Cards + 2 Mercado Pago Cards + 1 No Pago Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Efectivo */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('efectivo');
                  setIsMixedPayment(false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'efectivo' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Banknote className={`w-5 h-5 ${selectedPaymentMethod === 'efectivo' && !isMixedPayment ? 'text-[#ea580c]' : 'text-slate-700'}`} />
                <span className={`text-xs font-bold ${selectedPaymentMethod === 'efectivo' && !isMixedPayment ? 'text-[#ea580c]' : 'text-slate-700'}`}>
                  Efectivo
                </span>
              </div>

              {/* 2. Tarjeta */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('tarjeta');
                  setIsMixedPayment(false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'tarjeta' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">Tarjeta</span>
              </div>

              {/* 3. Transferencia */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('transferencia');
                  setIsMixedPayment(false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'transferencia' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <ArrowLeftRight className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">Transferencia</span>
              </div>

              {/* 4. Cheque */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('cheque');
                  setIsMixedPayment(false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'cheque' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <FileCheck className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">Cheque</span>
              </div>

              {/* 5. Cuenta Corriente */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('cuenta_corriente');
                  setIsMixedPayment(false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'cuenta_corriente' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Wallet className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">Cuenta Corriente</span>
              </div>

              {/* 6. E-Cheq */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('echeq');
                  setIsMixedPayment(false);
                }}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'echeq' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <FileText className="w-5 h-5 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">E-Cheq</span>
              </div>
            </div>

            {/* Mercado Pago cards row (2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* MercadoPago QR */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('mercadopago_qr');
                  setIsMixedPayment(false);
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2.5 ${
                  selectedPaymentMethod === 'mercadopago_qr' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <Smartphone className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">MercadoPago QR</span>
              </div>

              {/* Mercado Pago */}
              <div
                onClick={() => {
                  setSelectedPaymentMethod('mercado_pago');
                  setIsMixedPayment(false);
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2.5 ${
                  selectedPaymentMethod === 'mercado_pago' && !isMixedPayment
                    ? 'border-[#ea580c] bg-orange-50/50 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-700">Mercado Pago</span>
              </div>
            </div>

            {/* No Pago full-width bar */}
            <div>
              <div
                onClick={() => {
                  setSelectedPaymentMethod('no_pago');
                  setIsMixedPayment(false);
                }}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center gap-2 ${
                  selectedPaymentMethod === 'no_pago' && !isMixedPayment
                    ? 'border-slate-400 bg-slate-100 text-slate-900 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-500'
                }`}
              >
                <X className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold">No Pago</span>
              </div>
            </div>

            {/* DYNAMIC PAYMENT METHOD BODY */}
            {/* 1. EFECTIVO (Exact matching screenshot layout: Paga con Efectivo, Quick buttons, Vuelto) */}
            {selectedPaymentMethod === 'efectivo' && !isMixedPayment && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <label className="text-xs font-black text-slate-800">
                    Paga con Efectivo ($):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={cashAmountGiven}
                      onChange={(e) => setCashAmountGiven(Number(e.target.value) || 0)}
                      className="w-44 p-2 text-right font-mono font-black text-base rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#ea580c]"
                    />
                  </div>
                </div>

                {/* Quick denomination buttons matching screenshot */}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCashAmountGiven(totalAmount)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold shadow-2xs transition-colors"
                  >
                    Exacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmountGiven(10000)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-mono font-bold shadow-2xs transition-colors"
                  >
                    $10.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmountGiven(20000)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-mono font-bold shadow-2xs transition-colors"
                  >
                    $20.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmountGiven(50000)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-mono font-bold shadow-2xs transition-colors"
                  >
                    $50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashAmountGiven(100000)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-mono font-bold shadow-2xs transition-colors"
                  >
                    $100.000
                  </button>
                </div>

                {/* Vuelto para entregar display */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    Vuelto para entregar:
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-600">
                    ${changeToGive.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* 2. PAGO MIXTO */}
            {isMixedPayment && (
              <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-4 animate-in fade-in">
                <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                  Distribución de Pago Mixto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Efectivo ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mixedCash}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setMixedCash(val);
                        setMixedTransfer(Math.max(0, totalAmount - val));
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Transferencia / Tarjeta ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={mixedTransfer}
                      onChange={(e) => setMixedTransfer(Number(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold bg-white text-xs"
                    />
                  </div>
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between pt-2 border-t border-blue-200">
                  <span>Suma combinada:</span>
                  <span className="font-mono font-black text-slate-900">
                    ${(Number(mixedCash) + Number(mixedTransfer)).toLocaleString('es-AR', { minimumFractionDigits: 2 })} / ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {/* 3. CUENTA CORRIENTE */}
            {selectedPaymentMethod === 'cuenta_corriente' && !isMixedPayment && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-700" />
                  <h4 className="text-xs font-black text-amber-950 uppercase">
                    Venta a Crédito en Cuenta Corriente
                  </h4>
                </div>
                <div className="text-xs text-amber-900 space-y-1">
                  <p>Cliente asignado: <strong className="text-slate-900">{customer ? customer.businessName : 'Cliente Ocasional'}</strong></p>
                  {customer && (
                    <p>Saldo actual: <strong className="font-mono text-slate-900">${(customer.currentBalance || 0).toLocaleString('es-AR')}</strong> | Límite: <strong className="font-mono text-slate-900">${(customer.creditLimit || 500000).toLocaleString('es-AR')}</strong></p>
                  )}
                  <p className="text-[11px] text-amber-800 pt-1">
                    El monto de ${totalAmount.toLocaleString('es-AR')} se cargará al saldo deudor del cliente como deuda pendiente.
                  </p>
                </div>
              </div>
            )}

            {/* 4. TRANSFERENCIA */}
            {selectedPaymentMethod === 'transferencia' && !isMixedPayment && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 animate-in fade-in text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banco / Cuenta de Recepción</label>
                    <select
                      value={transferBank}
                      onChange={(e) => setTransferBank(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value="Banco Galicia (Cuenta Fábrica)">Banco Galicia (Cuenta Fábrica)</option>
                      <option value="Banco Santander">Banco Santander</option>
                      <option value="Banco Nación (Aranceles)">Banco Nación (Aranceles)</option>
                      <option value="Mercado Pago CVU">Mercado Pago CVU</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nº Comprobante / Referencia Bancaria</label>
                    <input
                      type="text"
                      placeholder="Ej: 98127391823"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. TARJETA */}
            {selectedPaymentMethod === 'tarjeta' && !isMixedPayment && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 animate-in fade-in text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tipo de Tarjeta</label>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Cuotas</label>
                    <select
                      value={cardInstallments}
                      onChange={(e) => setCardInstallments(Number(e.target.value) || 1)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value={1}>1 Cuota (Sin interés)</option>
                      <option value={3}>3 Cuotas</option>
                      <option value={6}>6 Cuotas</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nº Cupón / Operación</label>
                    <input
                      type="text"
                      placeholder="Ej: 1248"
                      value={cardCoupon}
                      onChange={(e) => setCardCoupon(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. CHEQUE / E-CHEQ */}
            {(selectedPaymentMethod === 'cheque' || selectedPaymentMethod === 'echeq') && !isMixedPayment && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 animate-in fade-in text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nº de Cheque</label>
                    <input
                      type="text"
                      placeholder="00012938"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Banco Emisor</label>
                    <input
                      type="text"
                      placeholder="Banco Galicia"
                      value={checkBank}
                      onChange={(e) => setCheckBank(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Fecha de Cobro</label>
                    <input
                      type="date"
                      value={checkDueDate}
                      onChange={(e) => setCheckDueDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. MERCADOPAGO QR */}
            {selectedPaymentMethod === 'mercadopago_qr' && !isMixedPayment && (
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 flex items-center gap-5 animate-in fade-in">
                <div className="w-20 h-20 bg-white border border-sky-300 rounded-xl flex items-center justify-center p-2 shadow-xs shrink-0">
                  <QrCode className="w-14 h-14 text-sky-600" />
                </div>
                <div className="text-xs text-sky-950 space-y-1">
                  <h4 className="font-black text-sm text-sky-900">Cobro con QR Dinámico Mercado Pago</h4>
                  <p className="text-sky-800">Monto codificado: <strong className="font-mono">${totalAmount.toLocaleString('es-AR')}</strong></p>
                  <p className="text-[11px] text-sky-700">El cliente escanea desde su app de Mercado Pago o billetera bancaria interoperable.</p>
                </div>
              </div>
            )}

            {/* 8. NO PAGO */}
            {selectedPaymentMethod === 'no_pago' && !isMixedPayment && (
              <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 text-xs text-slate-600 animate-in fade-in">
                <p className="font-bold text-slate-800">Comprobante emitido sin registro de cobro inmediato.</p>
                <p className="text-[11px] text-slate-500">Se guardará la venta con estado pendiente de pago.</p>
              </div>
            )}

            {/* BOTTOM BAR: Total a cobrar (Exact green style from Image 2) & Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-600">Total a cobrar:</span>
                <span className="font-mono font-black text-2xl text-emerald-600">
                  ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmitting ? 'Registrando...' : 'Confirmar Venta'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
