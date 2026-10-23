import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building,
  DollarSign,
  Calendar,
  Check,
  AlertCircle,
  FileText,
  Percent,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Purchase, Supplier, PaymentMethod, CashRegister, MoneyBox, SupplierPaymentOrder } from '../../types';

interface PurchasePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase;
  supplier: Supplier;
  cashRegisters: CashRegister[];
  moneyBoxes: MoneyBox[];
  onSavePayment: (paymentOrder: SupplierPaymentOrder) => void;
}

export const PurchasePaymentModal: React.FC<PurchasePaymentModalProps> = ({
  isOpen,
  onClose,
  purchase,
  supplier,
  cashRegisters,
  moneyBoxes,
  onSavePayment,
}) => {
  const pendingBalance = useMemo(() => {
    if (purchase.balanceDue !== undefined) return purchase.balanceDue;
    return Math.max(0, purchase.total - (purchase.paidAmount || 0));
  }, [purchase]);

  // Form states
  const [payAmount, setPayAmount] = useState<number>(pendingBalance || purchase.total);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedBoxId, setSelectedBoxId] = useState<string>(() => {
    const openReg = cashRegisters.find((r) => r.isOpen);
    if (openReg) return openReg.id;
    return moneyBoxes[0]?.id || 'reg-1';
  });
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>(
    `Pago de factura ${purchase.invoiceType} ${purchase.fullInvoiceNumber || purchase.code}`
  );

  // Retentions
  const [hasRetentions, setHasRetentions] = useState<boolean>(false);
  const [retentionType, setRetentionType] = useState<string>('IIBB');
  const [retentionCertNumber, setRetentionCertNumber] = useState<string>('');
  const [retentionAmount, setRetentionAmount] = useState<number>(0);

  if (!isOpen) return null;

  const validPayAmount = Math.max(0, Number(payAmount) || 0);
  const validRetentionAmount = hasRetentions ? Math.max(0, Number(retentionAmount) || 0) : 0;
  const netCashToDisburse = Math.max(0, validPayAmount - validRetentionAmount);
  const remainingInvoiceBalance = Math.max(0, pendingBalance - validPayAmount);
  const newSupplierBalance = Math.max(0, (supplier.currentBalance || 0) - validPayAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validPayAmount <= 0) {
      alert('Por favor ingrese un monto válido a pagar.');
      return;
    }

    if (validPayAmount > pendingBalance + 0.01) {
      if (!confirm(`El monto ingresado ($${validPayAmount.toLocaleString('es-AR')}) supera el saldo pendiente de la factura ($${pendingBalance.toLocaleString('es-AR')}). ¿Desea continuar de todas formas?`)) {
        return;
      }
    }

    const opNumber = `OP-${Date.now().toString().slice(-6)}`;

    const paymentOrder: SupplierPaymentOrder = {
      id: `po-${Date.now()}`,
      paymentOrderNumber: opNumber,
      date: paymentDate,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierTaxId: supplier.cuit,
      totalAmount: validPayAmount,
      paymentMethod,
      destinationBoxId: selectedBoxId,
      appliedToPurchases: [
        {
          purchaseId: purchase.id,
          invoiceNumber: purchase.fullInvoiceNumber || purchase.code,
          amountApplied: validPayAmount,
        },
      ],
      retentions: hasRetentions && validRetentionAmount > 0
        ? [
            {
              type: retentionType,
              certificateNumber: retentionCertNumber || 'S/N',
              amount: validRetentionAmount,
            },
          ]
        : [],
      notes: notes.trim(),
      userId: 'user-1',
      userName: 'Carlos Mendoza',
    };

    onSavePayment(paymentOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800 text-xs">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Registrar Pago de Factura de Compra
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {purchase.invoiceType} - {purchase.fullInvoiceNumber || purchase.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Supplier & Invoice Summary Card */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Proveedor</span>
              <span className="font-bold text-slate-900 text-xs block truncate">{supplier.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">CUIT: {supplier.cuit}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Saldo Actual Cta. Cte.</span>
              <span className={`text-xs font-mono font-black ${
                (supplier.currentBalance || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                ${(supplier.currentBalance || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {(supplier.currentBalance || 0) > 0 ? 'Deuda a pagar' : 'Al día / a favor'}
              </span>
            </div>
          </div>

          {/* Invoice Balances */}
          <div className="grid grid-cols-3 gap-2 text-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Total Factura</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                ${purchase.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Ya Abonado</span>
              <span className="text-xs font-mono font-bold text-emerald-600">
                ${(purchase.paidAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Saldo Pendiente</span>
              <span className="text-xs font-mono font-black text-rose-600">
                ${pendingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Monto a Abonar ($) *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayAmount(pendingBalance)}
                  className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md cursor-pointer transition-colors"
                >
                  Pagar 100% Saldo (${pendingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                </button>
                {pendingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setPayAmount(Number((pendingBalance / 2).toFixed(2)))}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md cursor-pointer transition-colors"
                  >
                    50%
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={payAmount || ''}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full h-10 pl-7 pr-3 text-base font-mono font-black bg-white border-2 border-blue-300 focus:border-blue-600 rounded-xl outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Payment Method & Cash Register Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Forma de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="cash">Efectivo de Caja</option>
                <option value="bank_transfer">Transferencia Bancaria</option>
                <option value="check">Cheque Propio / Terceros</option>
                <option value="debit_card">Tarjeta de Débito</option>
                <option value="credit_card">Tarjeta de Crédito</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Caja / Cuenta de Egreso
              </label>
              <select
                value={selectedBoxId}
                onChange={(e) => setSelectedBoxId(e.target.value)}
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <optgroup label="Cajas de Mostrador">
                  {cashRegisters.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name} {reg.isOpen ? '(Abierta)' : '(Cerrada)'}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Bancos & Cuentas de Dinero">
                  {moneyBoxes.map((mb) => (
                    <option key={mb.id} value={mb.id}>
                      {mb.name} ({mb.type})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Fecha del Pago
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                Nro. Comprobante / Transf. (Opcional)
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Ej: TRX-994812 / Chq 002"
                className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Retentions Section */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-xs select-none">
                <input
                  type="checkbox"
                  checked={hasRetentions}
                  onChange={(e) => setHasRetentions(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>Aplicar Retenciones Impositivas</span>
              </label>
              {hasRetentions && (
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                  Deduce del efectivo desembolsado
                </span>
              )}
            </div>

            {hasRetentions && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tipo</label>
                  <select
                    value={retentionType}
                    onChange={(e) => setRetentionType(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="IIBB">Retención IIBB</option>
                    <option value="Ganancias">Retención Ganancias</option>
                    <option value="IVA">Retención IVA</option>
                    <option value="SUSS">Retención SUSS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Certificado N°</label>
                  <input
                    type="text"
                    value={retentionCertNumber}
                    onChange={(e) => setRetentionCertNumber(e.target.value)}
                    placeholder="Ej: CRT-0019"
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={retentionAmount || ''}
                    onChange={(e) => setRetentionAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full h-8 px-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-rose-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Observaciones / Motivo
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle o nota para la orden de pago..."
              className="w-full h-8 px-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Account & Cash Impact Summary */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 shadow-md">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400">Total Imputado a la Factura:</span>
              <span className="font-mono font-bold text-white">
                ${validPayAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {hasRetentions && validRetentionAmount > 0 && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 text-amber-300">
                <span>Retenciones Impositivas deducidas:</span>
                <span className="font-mono font-bold">
                  -${validRetentionAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-300 font-semibold">Egreso Real en Caja/Banco:</span>
              <span className="font-mono font-black text-amber-400 text-sm">
                ${netCashToDisburse.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Repercusión en Cuenta Corriente</span>
                <span className="text-slate-300 text-[11px]">
                  Saldo Proveedor: ${supplier.currentBalance?.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ➜{' '}
                  <strong className="text-emerald-400">${newSupplierBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Estado Factura</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  remainingInvoiceBalance <= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {remainingInvoiceBalance <= 0 ? 'PAGADA COMPLETA' : `PARCIAL (Resta $${remainingInvoiceBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })})`}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar Pago & Actualizar Cuenta Corriente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
