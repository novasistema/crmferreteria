import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Supplier, PurchaseOrder, PurchaseOrderItem } from '../../types';
import {
  X,
  Search,
  Plus,
  Trash2,
  Package,
  Calendar,
  Building,
  AlertCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface NewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrder?: PurchaseOrder | null;
  initialProductToAdd?: {
    product: Product;
    quantity: number;
    targetSupplierId?: string;
  } | null;
}

export const NewPurchaseOrderModal: React.FC<NewPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  initialOrder,
  initialProductToAdd,
}) => {
  const { store, currentUser, showToast } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialOrder?.supplierId || store.suppliers[0]?.id || ''
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    initialOrder?.expectedDeliveryDate || ''
  );
  const [notes, setNotes] = useState<string>(initialOrder?.notes || '');
  const [items, setItems] = useState<PurchaseOrderItem[]>(initialOrder?.items || []);

  // Product Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (initialOrder) {
      setSelectedSupplierId(initialOrder.supplierId);
      setExpectedDeliveryDate(initialOrder.expectedDeliveryDate || '');
      setNotes(initialOrder.notes || '');
      setItems([...initialOrder.items]);
    } else {
      setSelectedSupplierId(
        initialProductToAdd?.targetSupplierId ||
        initialProductToAdd?.product?.supplierId ||
        store.suppliers[0]?.id ||
        ''
      );
      setExpectedDeliveryDate('');
      setNotes('');
      if (initialProductToAdd?.product) {
        const prod = initialProductToAdd.product;
        const origSup = store.suppliers.find((s) => s.id === prod.supplierId);
        setItems([
          {
            productId: prod.id,
            productCode: prod.code,
            supplierProductCode: prod.supplierCode || '',
            productName: prod.name,
            originalSupplierId: prod.supplierId,
            originalSupplierName: origSup?.name || prod.supplierName || 'Sin asignar',
            quantity: initialProductToAdd.quantity || 1,
            unitCost: prod.costPrice || 0,
            vatRate: prod.vatRate || 21,
            subtotal: (initialProductToAdd.quantity || 1) * (prod.costPrice || 0),
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [initialOrder, initialProductToAdd, isOpen, store.suppliers]);

  // Live product search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const term = searchQuery.toLowerCase();
    const matches = store.products
      .filter((p) => {
        const matchCode = p.code?.toLowerCase().includes(term);
        const matchName = p.name?.toLowerCase().includes(term);
        const matchSupCode = p.supplierCode?.toLowerCase().includes(term);
        const matchBarcode = p.barcode?.toLowerCase().includes(term);
        return matchCode || matchName || matchSupCode || matchBarcode;
      })
      .slice(0, 8);

    setSearchResults(matches);
    setIsSearchOpen(matches.length > 0);
  }, [searchQuery, store.products]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentSupplier = store.suppliers.find((s) => s.id === selectedSupplierId);

  const handleSelectProduct = (prod: Product) => {
    const origSup = store.suppliers.find((s) => s.id === prod.supplierId);

    // Check if already in list
    const existingIdx = items.findIndex((i) => i.productId === prod.id);
    if (existingIdx >= 0) {
      // Increase qty
      const updated = [...items];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].subtotal = updated[existingIdx].quantity * updated[existingIdx].unitCost;
      setItems(updated);
      showToast(`Cantidad incrementada para "${prod.name}"`, 'info');
    } else {
      const defaultQty = Math.max(1, (prod.stockMin || 0) - (prod.stock || 0) > 0 ? (prod.stockMin || 0) - (prod.stock || 0) : 1);
      const unitCost = prod.costPrice || 0;
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productCode: prod.code,
          supplierProductCode: prod.supplierCode || '',
          productName: prod.name,
          originalSupplierId: prod.supplierId,
          originalSupplierName: origSup?.name || prod.supplierName || 'Sin asignar',
          quantity: defaultQty,
          unitCost,
          vatRate: prod.vatRate || 21,
          subtotal: defaultQty * unitCost,
        },
      ]);
    }

    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitCost') {
        const qty = field === 'quantity' ? Math.max(0, Number(value) || 0) : item.quantity;
        const cost = field === 'unitCost' ? Math.max(0, Number(value) || 0) : item.unitCost;
        item.quantity = qty;
        item.unitCost = cost;
        item.subtotal = qty * cost;
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, i) => acc + (i.subtotal || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Debes agregar al menos un producto al pedido de compra', 'error');
      return;
    }

    const supplier = store.suppliers.find((s) => s.id === selectedSupplierId) || store.suppliers[0];
    const subtotal = totalAmount;
    const taxTotal = 0; // Or VAT calculation
    const total = subtotal;

    if (initialOrder) {
      // Edit existing
      const updatedOrder: PurchaseOrder = {
        ...initialOrder,
        supplierId: supplier?.id || '',
        supplierName: supplier?.name || 'Proveedor General',
        supplierTaxId: supplier?.cuit || '',
        supplierPhone: supplier?.phone || '',
        supplierEmail: supplier?.email || '',
        expectedDeliveryDate,
        notes,
        items,
        subtotal,
        taxTotal,
        total,
      };
      store.savePurchaseOrder(updatedOrder);
      showToast(`Pedido ${updatedOrder.code} actualizado con éxito`, 'success');
    } else {
      // Create new
      const newCode = store.generatePurchaseOrderCode();
      const newOrder: PurchaseOrder = {
        id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        code: newCode,
        supplierId: supplier?.id || '',
        supplierName: supplier?.name || 'Proveedor General',
        supplierTaxId: supplier?.cuit || '',
        supplierPhone: supplier?.phone || '',
        supplierEmail: supplier?.email || '',
        date: new Date().toISOString().split('T')[0],
        expectedDeliveryDate,
        notes,
        items,
        subtotal,
        taxTotal,
        total,
        status: 'draft',
        paymentCondition: 'credit',
        invoiceNumber: '',
        warehouseId: '1',
        userId: currentUser.id,
        userName: currentUser.name,
      };
      store.savePurchaseOrder(newOrder);
      showToast(`Pedido de compra ${newCode} creado para ${newOrder.supplierName}`, 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {initialOrder ? `Editar Pedido ${initialOrder.code}` : 'Nuevo Pedido de Compra'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 dark:text-slate-300">
            {/* Supplier Selector Banner */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                    Proveedor Destinatario del Pedido
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Podés seleccionar el proveedor por defecto o asignarle otro proveedor para armar el pedido.
                  </span>
                </div>
              </div>

              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white font-bold rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[220px]"
              >
                {store.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.cuit || 'S/CUIT'})
                  </option>
                ))}
              </select>
            </div>

            {/* Agregar Productos Section */}
            <div className="space-y-2" ref={searchContainerRef}>
              <label className="text-sm font-bold text-slate-900 dark:text-white block">
                Agregar Productos
              </label>

              {/* Search Bar matching Image 2 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setIsSearchOpen(true);
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                />

                {/* Dropdown search results */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute top-12 left-0 right-0 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                    {searchResults.map((prod) => {
                      const origSup = store.suppliers.find((s) => s.id === prod.supplierId);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod)}
                          className="p-3 hover:bg-blue-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded text-[11px]">
                                {prod.code}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white uppercase">
                                {prod.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
                              {prod.supplierCode && (
                                <span>Cód. Prov: <strong className="text-slate-700 dark:text-slate-300">{prod.supplierCode}</strong></span>
                              )}
                              <span>Prov. Original: <strong className="text-slate-700 dark:text-slate-300">{origSup?.name || prod.supplierName || 'N/A'}</strong></span>
                              <span>Stock: <strong className={prod.stock <= (prod.stockMin || 0) ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}>{prod.stock} {prod.unit || 'u'}</strong></span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                              ${(prod.costPrice || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-blue-500 font-semibold">+ Agregar</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Added Items Table */}
            {items.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Código Proveedor</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3">Proveedor Original</th>
                      <th className="py-2.5 px-3 text-right">Cantidad</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {items.map((item, idx) => (
                      <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {item.productCode}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <input
                            type="text"
                            value={item.supplierProductCode || ''}
                            onChange={(e) => handleUpdateItem(idx, 'supplierProductCode', e.target.value)}
                            placeholder="Cód."
                            className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white uppercase max-w-[200px] truncate">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                          {item.originalSupplierName || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0.001"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-right font-mono font-bold text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitCost}
                            onChange={(e) => handleUpdateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-right font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${(item.subtotal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Fecha Esperada de Entrega & Notas (Matching Image 2 Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Fecha Esperada de Entrega
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales para el pedido..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer matching Image 2 */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Estimado</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md shadow-blue-600/20"
              >
                {initialOrder ? 'Guardar Cambios' : 'Crear Pedido'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
