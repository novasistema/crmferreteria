import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Building,
  CreditCard,
  FileText,
  DollarSign,
  Calendar,
  Download,
  Printer,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Receipt,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Supplier, SupplierAccountMovement, Purchase, SupplierPaymentOrder } from '../../types';
import { SupplierPaymentOrderDetailModal } from './SupplierPaymentOrderDetailModal';
import { useApp } from '../../context/AppContext';

interface SupplierDetailLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  movements: SupplierAccountMovement[];
  purchases: Purchase[];
  paymentOrders: SupplierPaymentOrder[];
  onOpenNewInvoice: () => void;
  onOpenPaymentOrder: () => void;
  onOpenManualAdjustment: () => void;
}

export const SupplierDetailLedgerModal: React.FC<SupplierDetailLedgerModalProps> = ({
  isOpen,
  onClose,
  supplier,
  movements,
  purchases,
  paymentOrders,
  onOpenNewInvoice,
  onOpenPaymentOrder,
  onOpenManualAdjustment,
}) => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'movements' | 'invoices' | 'paymentOrders'>('movements');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrderForView, setSelectedOrderForView] = useState<SupplierPaymentOrder | null>(null);

  const handleApplyDiscount = () => {
    const discount = supplier.defaultDiscountPercent || 0;
    if (discount <= 0) {
      showToast(`El proveedor ${supplier.name} no tiene configurado un % de descuento en su padrón. Edítelo para asignarle uno.`, 'error');
      return;
    }
    if (confirm(`¿Confirma aplicar el ${discount}% de descuento a todos los productos del proveedor ${supplier.name}? Se actualizarán los costos y precios minoristas.`)) {
      const count = store.applySupplierDiscount(supplier.id, discount);
      showToast(`¡Descuento del ${discount}% aplicado a ${count} productos del proveedor!`, 'success');
    }
  };

  const supplierMovements = useMemo(() => {
    return movements
      .filter((m) => m.supplierId === supplier.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [movements, supplier]);

  const supplierPurchases = useMemo(() => {
    return purchases
      .filter((p) => p.supplierId === supplier.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, supplier]);

  const supplierOrders = useMemo(() => {
    return paymentOrders
      .filter((po) => po.supplierId === supplier.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paymentOrders, supplier]);

  const pendingDebt = supplier.currentBalance || 0;
  const totalPurchasesSum = supplierPurchases.reduce((acc, p) => acc + p.total, 0);
  const totalPaidSum = supplierOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  // Keyboard shortcut to close (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {supplier.name}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  CUIT: {supplier.cuit}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {supplier.businessName || supplier.name} • {supplier.taxCondition} • {supplier.phone || 'Sin teléfono'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Saldo Deuda Actual
              </span>
              <span
                className={`text-base font-black font-mono ${
                  pendingDebt > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                ${pendingDebt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="Cerrar y volver a Proveedores (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'movements'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mayor de Cta. Cte. ({supplierMovements.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Facturas & Compras ({supplierPurchases.length})
            </button>
            <button
              onClick={() => setActiveTab('paymentOrders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'paymentOrders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Órdenes de Pago ({supplierOrders.length})
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleApplyDiscount}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              title={`Aplicar ${supplier.defaultDiscountPercent || 0}% de descuento configurado en el proveedor a todos sus productos`}
            >
              <span>Aplicar Descuento ({supplier.defaultDiscountPercent || 0}%)</span>
            </button>

            <button
              onClick={onOpenPaymentOrder}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Emitir Pago (OP)</span>
            </button>

            <button
              onClick={onOpenNewInvoice}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cargar Factura</span>
            </button>

            <button
              onClick={onOpenManualAdjustment}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Ajuste Saldo</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
              title="Imprimir Resumen"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: MOVIMIENTOS MAYOR */}
          {activeTab === 'movements' && (
            <div className="space-y-4">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900 border border-slate-700/80 rounded-xl shadow-md">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">Total Compras</span>
                  <span className="text-xl font-extrabold font-mono text-white">
                    ${totalPurchasesSum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl shadow-md">
                  <span className="text-[11px] text-emerald-300 uppercase font-bold block mb-1">Total Pagado</span>
                  <span className="text-xl font-extrabold font-mono text-emerald-400">
                    ${totalPaidSum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl shadow-md">
                  <span className="text-[11px] text-rose-300 uppercase font-bold block mb-1">Saldo Adeudado</span>
                  <span className="text-xl font-extrabold font-mono text-rose-400">
                    ${pendingDebt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Comprobante / Nro</th>
                      <th className="py-2.5 px-3">Concepto / Detalle</th>
                      <th className="py-2.5 px-3 text-right">Debe (+)</th>
                      <th className="py-2.5 px-3 text-right">Haber (-)</th>
                      <th className="py-2.5 px-3 text-right">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {supplierMovements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          No hay movimientos registrados en la cuenta corriente de este proveedor.
                        </td>
                      </tr>
                    ) : (
                      supplierMovements.map((mov) => {
                        const isDebt = mov.movementType === 'purchase_debt' || mov.debit > 0;
                        return (
                          <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-300 font-mono">
                              {mov.date.split('T')[0]}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isDebt
                                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                }`}
                              >
                                {mov.movementType === 'purchase_debt'
                                  ? 'Factura Compra'
                                  : mov.movementType === 'payment_credit'
                                  ? 'Orden de Pago'
                                  : mov.movementType === 'credit_note'
                                  ? 'Nota de Crédito'
                                  : 'Ajuste Manual'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-200 font-mono">
                              {mov.voucherNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{mov.notes || mov.concept}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                              {mov.debit > 0
                                ? `$${mov.debit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              {mov.credit > 0
                                ? `$${mov.credit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-100">
                              ${mov.balanceAfter.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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

          {/* TAB 2: FACTURAS & COMPROBANTES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Comprobante</th>
                      <th className="py-2.5 px-3">Depósito</th>
                      <th className="py-2.5 px-3 text-center">Estado Pago</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-3 text-right">IVA</th>
                      <th className="py-2.5 px-3 text-right">Total Factura</th>
                      <th className="py-2.5 px-3 text-right">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {supplierPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No hay facturas de compra registradas para este proveedor.
                        </td>
                      </tr>
                    ) : (
                      supplierPurchases.map((pur) => {
                        const balance = pur.balanceDue !== undefined ? pur.balanceDue : pur.total;
                        return (
                          <tr key={pur.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-slate-300 font-mono">{pur.date}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-200">
                              {pur.invoiceType} {pur.fullInvoiceNumber || pur.code}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{pur.warehouseName || 'Casa Central'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  pur.paymentStatus === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : pur.paymentStatus === 'partial'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                                }`}
                              >
                                {pur.paymentStatus === 'paid'
                                  ? 'PAGADA'
                                  : pur.paymentStatus === 'partial'
                                  ? 'PARCIAL'
                                  : 'PENDIENTE'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              ${pur.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              ${pur.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                              ${pur.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                              ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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

          {/* TAB 3: ORDENES DE PAGO */}
          {activeTab === 'paymentOrders' && (
            <div className="space-y-4">
              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">N° Orden Pago</th>
                      <th className="py-2.5 px-3">Medio de Pago</th>
                      <th className="py-2.5 px-3">Facturas Imputadas</th>
                      <th className="py-2.5 px-3 text-right">Retenciones</th>
                      <th className="py-2.5 px-3 text-right">Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {supplierOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No hay órdenes de pago emitidas a este proveedor.
                        </td>
                      </tr>
                    ) : (
                      supplierOrders.map((ord) => {
                        const totalRet = ord.retentions?.reduce((a, r) => a + r.amount, 0) || 0;
                        return (
                          <tr
                            key={ord.id}
                            onClick={() => setSelectedOrderForView(ord)}
                            className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                            title="Haga clic para ver el detalle completo de esta orden de pago"
                          >
                            <td className="py-2.5 px-3 text-slate-300 font-mono">
                              {ord.date.split('T')[0]}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-400 font-mono group-hover:underline flex items-center space-x-1.5">
                              <span>{ord.paymentOrderNumber}</span>
                              <span className="text-[10px] text-slate-500 font-normal px-1 bg-slate-800 rounded group-hover:text-emerald-300">Ver detalle</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {ord.paymentMethod === 'bank_transfer'
                                ? 'Transferencia Bancaria'
                                : ord.paymentMethod === 'cash'
                                ? 'Efectivo'
                                : ord.paymentMethod === 'check'
                                ? 'Cheque'
                                : 'Otro'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {ord.appliedToPurchases?.map((a) => a.invoiceNumber).join(', ') ||
                                'Pago a Cuenta'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                              {totalRet > 0
                                ? `-$${totalRet.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                : '$0,00'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              ${ord.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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

        </div>

        {/* Modal Footer with explicit Salir button */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs mt-auto">
          <span className="text-slate-400 text-xs hidden sm:inline">
            Presione <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">Esc</kbd> o haga clic en <strong>Salir</strong> para volver a Proveedores
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 flex items-center gap-2 transition-all cursor-pointer ml-auto shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Salir / Volver a Proveedores</span>
          </button>
        </div>

      </div>

      {/* Sub-modal: Payment Order Detail */}
      <SupplierPaymentOrderDetailModal
        isOpen={!!selectedOrderForView}
        onClose={() => setSelectedOrderForView(null)}
        order={selectedOrderForView}
        supplier={supplier}
      />
    </div>
  );
};
