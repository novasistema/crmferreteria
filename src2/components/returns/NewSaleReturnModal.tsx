import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleReturn, SaleReturnItem, Sale, Product } from '../../types';
import {
  X,
  RotateCcw,
  Search,
  ShoppingCart,
  Check,
  AlertCircle,
  Building2,
  DollarSign,
  Package,
  FileText,
  UserCheck,
} from 'lucide-react';

interface NewSaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReturn: SaleReturn) => void;
}

export const NewSaleReturnModal: React.FC<NewSaleReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { store, currentUser, showToast } = useApp();

  const [saleSearch, setSaleSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Manual / Custom Selection if not from a sale
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');

  // Selected items to return
  const [returnItems, setReturnItems] = useState<
    {
      productId: string;
      productCode: string;
      productName: string;
      originalQty: number;
      quantity: number;
      unitPrice: number;
      disposition: 'restock' | 'damaged' | 'discard';
      selected: boolean;
    }[]
  >([]);

  // Manual product search if adding extra items
  const [prodSearch, setProdSearch] = useState('');

  // Warehouse & Reason & Refund Method
  const [warehouseId, setWarehouseId] = useState<string>(
    store.warehouses.find((w) => w.isMain)?.id || store.warehouses[0]?.id || '1'
  );
  const [reason, setReason] = useState<string>('Defecto / Falla de fábrica');
  const [customReason, setCustomReason] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<
    'credit_note' | 'cash' | 'current_account' | 'exchange_voucher'
  >('credit_note');
  const [notes, setNotes] = useState<string>('');

  // Filtered sales for search dropdown
  const filteredSales = useMemo(() => {
    if (!saleSearch.trim()) return store.sales.slice(0, 10);
    const query = saleSearch.toLowerCase();
    return store.sales
      .filter(
        (s) =>
          s.code.toLowerCase().includes(query) ||
          s.clientName.toLowerCase().includes(query) ||
          (s.fiscalData?.invoiceNumber && s.fiscalData.invoiceNumber.toLowerCase().includes(query))
      )
      .slice(0, 10);
  }, [store.sales, saleSearch]);

  // Filtered clients
  const filteredClients進 = useMemo(() => {
    if (!clientSearch.trim()) return store.clients.slice(0, 8);
    const query = clientSearch.toLowerCase();
    return store.clients
      .filter((c) => c.name.toLowerCase().includes(query) || c.taxId.includes(query))
      .slice(0, 8);
  }, [store.clients, clientSearch]);

  // When a sale is picked, populate returnItems
  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setSelectedClientId(sale.clientId);
    setReturnItems(
      sale.items.map((it) => ({
        productId: it.productId,
        productCode: it.productCode,
        productName: it.productName,
        originalQty: it.quantity,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        disposition: 'restock',
        selected: true,
      }))
    );
  };

  const handleToggleItem = (index: number) => {
    setReturnItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, selected: !it.selected } : it))
    );
  };

  const handleQtyChange = (index: number, newQty: number) => {
    setReturnItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const validQty提高 = Math.max(0.01, Math.min(newQty, it.originalQty || 9999));
        return { ...it, quantity: validQty提高 };
      })
    );
  };

  const handleDispositionChange卷 = (
    index: number,
    disposition: 'restock' | 'damaged' | 'discard'
  ) => {
    setReturnItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, disposition } : it))
    );
  };

  // Add manual product
  const handleAddManualProduct = (prod: Product) => {
    const existingIdx = returnItems.findIndex((it) => it.productId === prod.id);
    if (existingIdx >= 0) {
      setReturnItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIdx
            ? { ...it, quantity: it.quantity + 1, selected: true }
            : it
        )
      );
    } else {
      setReturnItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productCode: prod.code,
          productName: prod.name,
          originalQty: 9999,
          quantity: 1,
          unitPrice: prod.priceMinorista || 0,
          disposition: 'restock',
          selected: true,
        },
      ]);
    }
    setProdSearch('');
  };

  const selectedReturnItems = returnItems.filter((it) => it.selected && it.quantity > 0);
  const totalRefund = selectedReturnItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);

  const selectedClient = useMemo(() => {
    if (selectedSale) {
      return store.clients.find((c) => c.id === selectedSale.clientId) || {
        id: selectedSale.clientId,
        name: selectedSale.clientName,
        taxId: selectedSale.clientTaxId,
      };
    }
    return store.clients.find((c) => c.id === selectedClientId) || null;
  }, [selectedSale, selectedClientId, store.clients]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedReturnItems.length === 0) {
      showToast('Seleccioná al menos un producto a devolver con cantidad mayor a 0', 'error');
      return;
    }

    if (!selectedClient && !selectedSale) {
      showToast('Seleccioná una venta o un cliente para la devolución', 'error');
      return;
    }

    const effectiveReason = reason === 'Otro' && customReason.trim() ? customReason : reason;

    const itemsToSave: SaleReturnItem[] = selectedReturnItems.map((it) => ({
      productId: it.productId,
      productCode: it.productCode,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.quantity * it.unitPrice,
      disposition: it.disposition,
      warehouseId,
    }));

    const newReturn = store.registerSaleReturn({
      saleId: selectedSale?.id,
      saleCode: selectedSale?.code,
      clientId: selectedClient?.id || 'cf',
      clientName: selectedClient?.name || selectedSale?.clientName || 'Consumidor Final',
      clientTaxId: selectedClient?.taxId || selectedSale?.clientTaxId || '',
      items: itemsToSave,
      total: totalRefund,
      reason: effectiveReason,
      notes,
      refundMethod,
      warehouseId,
      user: currentUser || { id: 'admin', name: 'Administrador', role: 'admin', email: '', branchId: '1', active: true },
    });

    showToast(`Devolución ${newReturn.code} registrada con éxito`, 'success');
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
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Nueva Devolución de Venta
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reingresá mercadería a stock y generá reintegro o nota de crédito al cliente
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
          {/* Step 1: Vincular Venta o Cliente */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                1. Seleccionar Venta Original (Opcional) o Cliente
              </label>
              {selectedSale && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSale(null);
                    setReturnItems([]);
                  }}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  Desvincular Venta
                </button>
              )}
            </div>

            {!selectedSale ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    placeholder="Buscar venta por N° ticket, factura o nombre del cliente..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {filteredSales.length > 0 && (
                  <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    {filteredSales.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSale(s)}
                        className="w-full text-left p-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {s.code}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {s.documentType?.toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(s.date).toLocaleDateString('es-AR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Cliente: <strong className="text-slate-700 dark:text-slate-300">{s.clientName}</strong> ({s.items.length} artículos)
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                            ${s.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[11px] text-blue-600 font-bold">
                            Seleccionar →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Or choose client if no sale */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                    O asigná directamente un Cliente:
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Consumidor Final (Venta mostrador)</option>
                    {store.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.taxId ? `(${c.taxId})` : ''} - Saldo: ${c.currentBalance.toLocaleString('es-AR')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Venta Vinculada: {selectedSale.code}
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedSale.clientName} • {new Date(selectedSale.date).toLocaleDateString('es-AR')} • Total Original: ${selectedSale.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-blue-500 text-white">
                  <Check className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Productos a Devolver */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                2. Productos y Cantidades a Devolver
              </label>

              {/* Add manual product selector if needed */}
              <div className="relative w-64">
                <input
                  type="text"
                  value={prodSearch}
                  onChange={(e) => setProdSearch(e.target.value)}
                  placeholder="+ Agregar producto..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {prodSearch.trim().length > 1 && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {store.products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                          p.code.toLowerCase().includes(prodSearch.toLowerCase())
                      )
                      .slice(0, 6)
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleAddManualProduct(p)}
                          className="w-full text-left p-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</span>
                            <span className="block text-[10px] text-slate-400">Cód: {p.code}</span>
                          </div>
                          <span className="font-bold text-amber-600">${p.priceMinorista?.toLocaleString('es-AR')}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {returnItems.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium">No hay productos seleccionados para devolver</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seleccioná una venta arriba o buscá un artículo para agregarlo manualmente.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <th className="p-3 w-10 text-center">Sel.</th>
                      <th className="p-3">Artículo</th>
                      <th className="p-3 w-28 text-center">Cant. a Devolver</th>
                      <th className="p-3 w-28 text-right">Precio Unit.</th>
                      <th className="p-3 w-36 text-center">Destino Stock</th>
                      <th className="p-3 w-28 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {returnItems.map((item, idx) => (
                      <tr
                        key={`${item.productId}-${idx}`}
                        className={`transition-colors ${
                          item.selected
                            ? 'bg-white dark:bg-slate-900'
                            : 'bg-slate-50/50 dark:bg-slate-950/40 opacity-60'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => handleToggleItem(idx)}
                            className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {item.productName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Cód: {item.productCode} {item.originalQty < 9999 ? `• Vendido: ${item.originalQty}` : ''}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0.01"
                            max={item.originalQty || 9999}
                            step="any"
                            value={item.quantity}
                            disabled={!item.selected}
                            onChange={(e) => handleQtyChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="p-3 text-right font-medium text-slate-700 dark:text-slate-300">
                          ${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <select
                            value={item.disposition}
                            disabled={!item.selected}
                            onChange={(e) =>
                              handleDispositionChange卷(
                                idx,
                                e.target.value as 'restock' | 'damaged' | 'discard'
                              )
                            }
                            className="text-[11px] font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden disabled:opacity-50"
                          >
                            <option value="restock">Reingresar Stock</option>
                            <option value="damaged">Dañado / Falla</option>
                            <option value="discard">Descarte / Merma</option>
                          </select>
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                          ${(item.quantity * item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step 3: Motivo y Depósito */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Motivo de la Devolución
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Defecto / Falla de fábrica">Defecto / Falla de fábrica</option>
                <option value="Error en el pedido / No solicitado">Error en el pedido / No solicitado</option>
                <option value="Cambio de producto por otro modelo">Cambio de producto por otro modelo</option>
                <option value="Cliente arrepentido / No lo necesita">Cliente arrepentido / No lo necesita</option>
                <option value="Garantía / Servicio Técnico">Garantía / Servicio Técnico</option>
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
                Depósito / Sucursal de Reingreso
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

          {/* Step 4: Método de Reintegro / Compensación */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              4. Método de Reintegro / Compensación Financiera
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'credit_note',
                  title: 'Nota de Crédito',
                  desc: 'Comprobante formal / saldo a favor',
                },
                {
                  id: 'cash',
                  title: 'Reintegro en Efectivo',
                  desc: 'Egreso directo de caja mostrador',
                },
                {
                  id: 'current_account',
                  title: 'Ajuste Cta. Cte.',
                  desc: 'Descuenta saldo deudor del cliente',
                },
                {
                  id: 'exchange_voucher',
                  title: 'Vale de Cambio',
                  desc: 'Cupón para futuras compras',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    refundMethod === opt.id
                      ? 'border-blue-600 bg-blue-500/10 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs">{opt.title}</span>
                    <input
                      type="radio"
                      name="refundMethod"
                      value={opt.id}
                      checked={refundMethod === opt.id}
                      onChange={() => setRefundMethod(opt.id as any)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {opt.desc}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Observaciones Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalle o nota interna sobre la devolución..."
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Resumen Total */}
          <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                Total a Reintegrar al Cliente
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedReturnItems.length} artículo(s) seleccionados
              </p>
            </div>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              ${totalRefund.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
              disabled={selectedReturnItems.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Confirmar Devolución
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
