import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building,
  DollarSign,
  Plus,
  Trash2,
  Printer,
  Check,
  Calendar,
  Layers,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Supplier, Purchase, SupplierPaymentOrder, PaymentMethod, CashRegister, MoneyBox } from '../../types';

interface SupplierPaymentOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  pendingPurchases: Purchase[];
  cashRegisters: CashRegister[];
  moneyBoxes: MoneyBox[];
  nextOpNumber: string;
  onSavePaymentOrder: (order: SupplierPaymentOrder) => void;
}

export const SupplierPaymentOrderModal: React.FC<SupplierPaymentOrderModalProps> = ({
  isOpen,
  onClose,
  supplier,
  pendingPurchases,
  cashRegisters,
  moneyBoxes,
  nextOpNumber,
  onSavePaymentOrder,
}) => {
  const [opNumber, setOpNumber] = useState<string>(nextOpNumber || 'OP-0001-00000001');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'apply_invoices' | 'on_account'>('apply_invoices');
  const [manualAmount, setManualAmount] = useState<number>(supplier.currentBalance || 0);

  // Invoices applied
  const [appliedInvoices, setAppliedInvoices] = useState<{ [purchaseId: string]: number }>({});

  // Payment methods breakdown
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [selectedBoxId, setSelectedBoxId] = useState<string>(moneyBoxes[0]?.id || 'mb-macro');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Retentions
  const [hasRetentions, setHasRetentions] = useState<boolean>(false);
  const [retentionType, setRetentionType] = useState<string>('IIBB');
  const [retentionCertNumber, setRetentionCertNumber] = useState<string>('');
  const [retentionAmount, setRetentionAmount] = useState<number>(0);
  const [retentionsList, setRetentionsList] = useState<
    { type: string; certificateNumber: string; amount: number }[]
  >([]);

  useEffect(() => {
    if (nextOpNumber) setOpNumber(nextOpNumber);
    // Initialize default application to all pending invoices
    const initialApplied: { [purchaseId: string]: number } = {};
    pendingPurchases.forEach((p) => {
      const balance = p.balanceDue !== undefined ? p.balanceDue : p.total;
      if (balance > 0) {
        initialApplied[p.id] = balance;
      }
    });
    setAppliedInvoices(initialApplied);
  }, [nextOpNumber, pendingPurchases, isOpen]);

  const supplierPendingPurchases = useMemo(() => {
    return pendingPurchases.filter(
      (p) => p.supplierId === supplier.id && (p.paymentStatus === 'pending' || p.paymentStatus === 'partial')
    );
  }, [pendingPurchases, supplier]);

  const totalInvoicesSelected = useMemo(() => {
    if (paymentType === 'on_account') return Number(manualAmount) || 0;
    return (Object.values(appliedInvoices) as number[]).reduce((acc: number, v: number) => acc + (Number(v) || 0), 0);
  }, [appliedInvoices, paymentType, manualAmount]);

  const totalRetentions = useMemo(() => {
    return retentionsList.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [retentionsList]);

  // Net payable via cash / bank = Total Invoices - Retentions
  const netFundsToPay = Math.max(0, totalInvoicesSelected - totalRetentions);

  if (!isOpen) return null;

  const handleToggleInvoice = (purchase: Purchase, isChecked: boolean) => {
    const balance = purchase.balanceDue !== undefined ? purchase.balanceDue : purchase.total;
    setAppliedInvoices((prev) => {
      const copy = { ...prev };
      if (isChecked) {
        copy[purchase.id] = balance;
      } else {
        delete copy[purchase.id];
      }
      return copy;
    });
  };

  const handleInvoiceAmountChange = (purchaseId: string, value: number) => {
    setAppliedInvoices((prev) => ({
      ...prev,
      [purchaseId]: value,
    }));
  };

  const handleAddRetention = () => {
    if (!retentionAmount || retentionAmount <= 0) return;
    setRetentionsList([
      ...retentionsList,
      {
        type: retentionType,
        certificateNumber: retentionCertNumber || `RET-${Date.now().toString().slice(-4)}`,
        amount: Number(retentionAmount),
      },
    ]);
    setRetentionAmount(0);
    setRetentionCertNumber('');
  };

  const handleRemoveRetention = (idx: number) => {
    const copy = [...retentionsList];
    copy.splice(idx, 1);
    setRetentionsList(copy);
  };

  const handleSave = () => {
    if (totalInvoicesSelected <= 0) {
      alert('El monto total a pagar debe ser mayor a $0.');
      return;
    }

    const appliedList: { purchaseId: string; invoiceNumber: string; amountApplied: number }[] = [];
    if (paymentType === 'apply_invoices') {
      (Object.entries(appliedInvoices) as [string, number][]).forEach(([purchaseId, amount]) => {
        const numericAmount = Number(amount) || 0;
        if (numericAmount > 0) {
          const pur = supplierPendingPurchases.find((p) => p.id === purchaseId);
          appliedList.push({
            purchaseId,
            invoiceNumber: pur?.fullInvoiceNumber || pur?.code || 'FC',
            amountApplied: numericAmount,
          });
        }
      });
    }

    const order: SupplierPaymentOrder = {
      id: `op-${Date.now()}`,
      paymentOrderNumber: opNumber,
      date: new Date(date).toISOString(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierTaxId: supplier.cuit,
      totalAmount: totalInvoicesSelected,
      paymentMethod,
      destinationBoxId: selectedBoxId,
      paymentMethodsDetail: [
        {
          method: paymentMethod,
          boxId: selectedBoxId,
          amount: netFundsToPay,
          referenceNumber,
        },
      ],
      retentions: retentionsList,
      appliedToPurchases: appliedList,
      notes: notes || `Pago emitido a ${supplier.name}`,
      userId: 'user-1',
      userName: 'Carlos Mendoza',
    };

    onSavePaymentOrder(order);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Emitir Orden de Pago a Proveedor
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {opNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Proveedor: <strong className="text-slate-200">{supplier.name}</strong> (CUIT: {supplier.cuit}) • Saldo Deuda: <strong className="text-rose-400 font-mono">${supplier.currentBalance.toLocaleString('es-AR')}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Top Form: Fecha, Modo de Pago */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Fecha de Emisión
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Concepto de Imputación
              </label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-800 p-0.5">
                <button
                  type="button"
                  onClick={() => setPaymentType('apply_invoices')}
                  className={`flex-1 py-1.5 font-semibold text-xs rounded-lg transition-all ${
                    paymentType === 'apply_invoices'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cancelar Facturas
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('on_account')}
                  className={`flex-1 py-1.5 font-semibold text-xs rounded-lg transition-all ${
                    paymentType === 'on_account'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pago a Cuenta
                </button>
              </div>
            </div>

            {paymentType === 'on_account' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Monto a Cuenta ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={manualAmount || ''}
                  onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-3 font-mono font-bold text-emerald-400 bg-slate-800 border border-slate-700 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Pending Invoices Table */}
          {paymentType === 'apply_invoices' && (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  Facturas Pendientes de Pago ({supplierPendingPurchases.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Selecciona los comprobantes a cancelar con esta orden de pago
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-800/60 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">✓</th>
                      <th className="py-2 px-3">Comprobante</th>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3 text-right">Total Factura</th>
                      <th className="py-2 px-3 text-right">Saldo Pendiente</th>
                      <th className="py-2 px-3 text-right w-36">Monto a Cancelar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {supplierPendingPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Este proveedor no tiene facturas pendientes de pago registradas.
                        </td>
                      </tr>
                    ) : (
                      supplierPendingPurchases.map((pur) => {
                        const balance = pur.balanceDue !== undefined ? pur.balanceDue : pur.total;
                        const isApplied = appliedInvoices[pur.id] !== undefined;
                        const appliedAmt = appliedInvoices[pur.id] || 0;

                        return (
                          <tr key={pur.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={isApplied}
                                onChange={(e) => handleToggleInvoice(pur, e.target.checked)}
                                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-800"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-200">
                              {pur.invoiceType} {pur.fullInvoiceNumber || pur.code}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{pur.date}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              ${pur.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                              ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={balance}
                                disabled={!isApplied}
                                value={appliedAmt || ''}
                                onChange={(e) =>
                                  handleInvoiceAmountChange(pur.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-28 h-7 px-2 font-mono font-bold text-right text-emerald-400 bg-slate-800 border border-slate-700 rounded-md focus:border-emerald-500 outline-none disabled:opacity-40"
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Method Details */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              Medio de Pago & Origen de Fondos
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium outline-none"
                >
                  <option value="bank_transfer">Transferencia Bancaria</option>
                  <option value="cash">Efectivo de Caja</option>
                  <option value="check">Cheque de Cartera / Propio</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Caja / Cuenta Origen</label>
                <select
                  value={selectedBoxId}
                  onChange={(e) => setSelectedBoxId(e.target.value)}
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium outline-none"
                >
                  {moneyBoxes.map((mb) => (
                    <option key={mb.id} value={mb.id}>
                      {mb.name} (${mb.currentBalance.toLocaleString('es-AR')})
                    </option>
                  ))}
                  {cashRegisters.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">N° Comprobante / Transf.</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="ej: TRF-90281"
                  className="w-full h-8 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Retentions (Optional) */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <FileCheck className="w-4 h-4" />
                Retenciones Impositivas (Opcional)
              </h4>
              <button
                type="button"
                onClick={() => setHasRetentions(!hasRetentions)}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                {hasRetentions ? 'Ocultar retenciones' : '+ Agregar retención (Ganancias/IIBB/IVA)'}
              </button>
            </div>

            {hasRetentions && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Tipo Retención</label>
                    <select
                      value={retentionType}
                      onChange={(e) => setRetentionType(e.target.value)}
                      className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="IIBB">Retención IIBB</option>
                      <option value="Ganancias">Retención Ganancias</option>
                      <option value="IVA">Retención IVA</option>
                      <option value="SUSS">Retención SUSS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-0.5">N° Certificado</label>
                    <input
                      type="text"
                      value={retentionCertNumber}
                      onChange={(e) => setRetentionCertNumber(e.target.value)}
                      placeholder="0001-000001"
                      className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Monto Retención ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={retentionAmount || ''}
                      onChange={(e) => setRetentionAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full h-8 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddRetention}
                      className="w-full h-8 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {retentionsList.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {retentionsList.map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-slate-800/80 rounded-lg text-xs"
                      >
                        <span className="font-semibold text-amber-300">
                          {r.type} - Cert: {r.certificateNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-200">
                            -${r.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRetention(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Total Imputado a Facturas:</span>
                <span className="font-mono font-bold text-slate-200">
                  ${totalInvoicesSelected.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {totalRetentions > 0 && (
                <div className="flex items-center gap-2 text-amber-400">
                  <span>(-) Total Retenciones:</span>
                  <span className="font-mono font-bold">
                    -${totalRetentions.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                Importe Neto a Transferir / Pagar
              </span>
              <span className="text-2xl font-mono font-black text-emerald-400">
                ${netFundsToPay.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar & Emitir Orden de Pago</span>
          </button>
        </div>

      </div>
    </div>
  );
};
