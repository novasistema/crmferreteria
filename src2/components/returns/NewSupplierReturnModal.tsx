import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SupplierReturn, SupplierReturnItem, Supplier, Product } from '../../types';
import {
  X,
  RotateCcw,
  Search,
  Package,
  Check,
  AlertCircle,
  Truck,
  DollarSign,
  Building2,
  Trash2,
} from 'lucide-react';

interface NewSupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReturn: SupplierReturn) => void;
}

export const NewSupplierReturnModal: React.FC<NewSupplierReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { store, currentUser, showToast } = useApp();

  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseCode, setPurchaseCode] = useState<string>('');
  const [supplierCreditNoteNumber, setSupplierCreditNoteNumber] = useState<string>('');

  // Items to return
  const [items, setItems] = useState<
    {
      productId: string;
      productCode: string;
      productName: string;
      quantity: number;
      unitCost: number;
      stockAvailable: number;
    }[]
  >([]);

  // Product search
  const [prodSearch, setProdSearch] = useState<string>('');

  // Warehouse & Reason & Method
  const [warehouseId, setWarehouseId] = useState<string>(
    store.warehouses.find((w) => w.isMain)?.id || store.warehouses[0]?.id || '1'
  );
  const [reason, setReason] = useState<string>('Falla de fábrica / Garantía');
  const [customReason, setCustomReason] = useState<string>('');
  const [creditMethod, setCreditMethod] = useState<
    'supplier_current_account' | 'cash_refund' | 'supplier_credit_note'
  >('supplier_current_account');
  const [notes, setNotes] = useState<string>('');

  const selectedSupplier = useMemo(() => {
    return store.suppliers.find((s) => s.id === supplierId) || null;
  }, [store.suppliers, supplierId]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!prodSearch.trim() || prodSearch.length < 2) return [];
    const q = prodSearch.toLowerCase();
    return store.products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.supplierCode && p.supplierCode.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [store.products, prodSearch]);

  const handleAddProduct = (prod: Product) => {
    const existingIdx = items.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => (idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it))
      );
    } else {
      const whStock = prod.stockByWarehouse?.[warehouseId] || prod.stock || 0;
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          quantity: 1,
          unitCost: prod.costPrice || 0,
          stockAvailable: whStock,
        },
      ]);
    }
    setProdSearch('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleQtyChange = (index: number, newQty: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, quantity: Math.max(0.01, newQty) } : it))
    );
  };

  const handleCostChange = (index: number, newCost: number) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, unitCost: Math.max(0, newCost) } : it))
    );
  };

  const totalReturn = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSupplier) {
      showToast('Seleccioná el proveedor destinatario', 'error');
      return;
    }

    if (items.length === 0) {
      showToast('Agregá al menos un artículo a devolver al proveedor', 'error');
      return;
    }

    const effectiveReason = reason === 'Otro' && customReason.trim() ? customReason : reason;

    const itemsToSave: SupplierReturnItem[] = items.map((it) => ({
      productId: it.productId,
      productCode: it.productCode,
      productName: it.productName,
      quantity: it.quantity,
      unitCost: it.unitCost,
      subtotal: it.quantity * it.unitCost,
      warehouseId,
    }));

    const newReturn = store.registerSupplierReturn({
      purchaseCode: purchaseCode.trim() || undefined,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierTaxId: selectedSupplier.cuit || selectedSupplier.taxId,
      items: itemsToSave,
      total: totalReturn,
      reason: effectiveReason,
      notes,
      creditMethod,
      supplierCreditNoteNumber: supplierCreditNoteNumber.trim() || undefined,
      warehouseId,
      user: currentUser || { id: 'admin', name: 'Administrador', role: 'admin', email: '', branchId: '1', active: true },
    });

    showToast(`Devolución a proveedor ${newReturn.code} registrada con éxito`, 'success');
    onSuccess(newReturn);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Nueva Devolución a Proveedor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Descontá mercadería del stock y registrá nota de crédito o reintegro del proveedor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Step 1: Seleccionar Proveedor */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-4">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              1. Datos del Proveedor y Comprobante de Referencia
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Proveedor Destinatario *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {store.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.cuit ? `(CUIT: ${s.cuit})` : ''} - Saldo a pagar: ${s.currentBalance?.toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                  Factura de Compra / Remito Original (Opcional)
                </label>
                <input
                  type="text"
                  value={purchaseCode}
                  onChange={(e) => setPurchaseCode(e.target.value)}
                  placeholder="Ej: FC-0001-00001234"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {selectedSupplier && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">
                  Proveedor: <strong className="text-slate-900 dark:text-slate-100">{selectedSupplier.name}</strong> • Saldo en Cta. Cte.: <strong>${(selectedSupplier.currentBalance || 0).toLocaleString('es-AR')}</strong>
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {selectedSupplier.contactPerson || selectedSupplier.phone || ''}
                </span>
              </div>
            )}
          </div>

          {/* Step 2: Productos a Devolver */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              2. Productos a Devolver (Se descontarán del stock)
            </label>

            {/* Product Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                placeholder="Buscar artículo por nombre, código o SKU para agregar a la devolución..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />

              {filteredProducts.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddProduct(p)}
                      className="w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {p.name}
                        </span>
                        <span className="block text-xs text-slate-400">
                          Cód: {p.code} • Stock actual: {p.stock} {p.unit || 'u'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Costo: ${p.costPrice?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[11px] text-blue-600 font-bold">
                          + Agregar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">No hay productos agregados a la devolución</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buscá y agregá los artículos que vas a enviar de vuelta al proveedor.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3">Artículo</th>
                      <th className="p-3 w-28 text-center">Cant. a Devolver</th>
                      <th className="p-3 w-32 text-right">Costo Unit. ($)</th>
                      <th className="p-3 w-32 text-right">Subtotal</th>
                      <th className="p-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((item, idx) => (
                      <tr key={`${item.productId}-${idx}`} className="bg-white dark:bg-slate-900">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {item.productName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Cód: {item.productCode} • Stock en depósito: {item.stockAvailable}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitCost}
                            onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-right font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                          ${(item.quantity * item.unitCost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step 3: Motivo y Depósito Origen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Motivo de Devolución al Proveedor
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Falla de fábrica / Garantía">Falla de fábrica / Garantía</option>
                <option value="Mercadería dañada en transporte">Mercadería dañada en transporte</option>
                <option value="Producto equivocado / Sobrante">Producto equivocado / Sobrante</option>
                <option value="Vencimiento / En mal estado">Vencimiento / En mal estado</option>
                <option value="Devolución acordada con proveedor">Devolución acordada con proveedor</option>
                <option value="Otro">Otro motivo...</option>
              </select>

              {reason === 'Otro' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Especificá el motivo..."
                  className="w-full mt-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Depósito de Origen (Egreso de Stock)
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {store.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.isMain ? '(Principal)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 4: Compensación Financiera */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              4. Compensación Financiera del Proveedor
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'supplier_current_account',
                  title: 'Descontar de Cuenta Corriente',
                  desc: 'Reduce el saldo que le debemos al proveedor',
                },
                {
                  id: 'supplier_credit_note',
                  title: 'Nota de Crédito Proveedor',
                  desc: 'Registra NC del proveedor para futuras compras',
                },
                {
                  id: 'cash_refund',
                  title: 'Reembolso Efectivo / Transf.',
                  desc: 'Ingreso directo a caja/banco',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    creditMethod === opt.id
                      ? 'border-blue-600 bg-blue-500/10 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{opt.title}</span>
                    <input
                      type="radio"
                      name="creditMethod"
                      value={opt.id}
                      checked={creditMethod === opt.id}
                      onChange={() => setCreditMethod(opt.id as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {opt.desc}
                  </span>
                </label>
              ))}
            </div>

            {creditMethod === 'supplier_credit_note' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  N° de Nota de Crédito emitida por el Proveedor
                </label>
                <input
                  type="text"
                  value={supplierCreditNoteNumber}
                  onChange={(e) => setSupplierCreditNoteNumber(e.target.value)}
                  placeholder="Ej: NC-A 0005-00004910"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle o nota interna sobre la devolución al proveedor..."
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Resumen Total */}
          <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                Total de la Devolución
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {items.length} artículo(s) a egresar del stock
              </p>
            </div>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              ${totalReturn.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={items.length === 0 || !selectedSupplier}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirmar Devolución a Proveedor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
