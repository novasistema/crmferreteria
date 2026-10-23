import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Supplier, PurchaseOrder, PurchaseOrderItem } from '../../types';
import {
  ShoppingCart,
  Package,
  X,
  Check,
  Building,
  AlertCircle,
  Truck,
  ArrowRight,
  PlusCircle,
  FolderPlus,
} from 'lucide-react';

interface QuickOrderModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPurchaseOrders?: () => void;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenPurchaseOrders,
}) => {
  const { store, currentUser, showToast } = useApp();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [orderQty, setOrderQty] = useState<string>('10');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [supplierProductCode, setSupplierProductCode] = useState<string>('');
  const [orderMode, setOrderMode] = useState<'new' | 'existing'>('new');
  const [targetOrderId, setTargetOrderId] = useState<string>('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (product) {
      setSelectedSupplierId(product.supplierId || store.suppliers[0]?.id || '');
      setSupplierProductCode(product.supplierCode || '');
      setUnitCost(product.costPrice || 0);

      const calculatedQty = Math.max(
        1,
        (product.stockMin || 5) * 2 - (product.stock || 0)
      );
      setOrderQty(String(calculatedQty > 0 ? calculatedQty : 10));
      setExpectedDeliveryDate('');
      setNotes('');
    }
  }, [product, store.suppliers]);

  // Check draft / open orders for the chosen supplier
  const openOrdersForSupplier = store.purchaseOrders.filter(
    (o) => o.supplierId === selectedSupplierId && (o.status === 'draft' || o.status === 'pending')
  );

  useEffect(() => {
    if (openOrdersForSupplier.length > 0) {
      setTargetOrderId(openOrdersForSupplier[0].id);
      setOrderMode('existing');
    } else {
      setOrderMode('new');
      setTargetOrderId('');
    }
  }, [selectedSupplierId]);

  if (!isOpen || !product) return null;

  const originalSupplier = store.suppliers.find((s) => s.id === product.supplierId);
  const targetSupplier = store.suppliers.find((s) => s.id === selectedSupplierId);

  const isDifferentSupplier =
    product.supplierId &&
    selectedSupplierId &&
    product.supplierId !== selectedSupplierId;

  const numericQty = Math.max(0.001, parseFloat(orderQty) || 1);
  const totalItemCost = numericQty * unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numericQty || numericQty <= 0) {
      showToast('Ingresá una cantidad válida para el pedido', 'error');
      return;
    }

    const newItem: PurchaseOrderItem = {
      productId: product.id,
      productCode: product.code,
      supplierProductCode: supplierProductCode || product.supplierCode || '',
      productName: product.name,
      originalSupplierId: product.supplierId,
      originalSupplierName: originalSupplier?.name || product.supplierName || 'Sin asignar',
      quantity: numericQty,
      unitCost: unitCost,
      vatRate: product.vatRate || 21,
      subtotal: totalItemCost,
    };

    if (orderMode === 'existing' && targetOrderId) {
      // Append to existing draft order
      const existingOrder = store.purchaseOrders.find((o) => o.id === targetOrderId);
      if (existingOrder) {
        const itemIdx = existingOrder.items.findIndex((i) => i.productId === product.id);
        let updatedItems = [...existingOrder.items];

        if (itemIdx >= 0) {
          updatedItems[itemIdx] = {
            ...updatedItems[itemIdx],
            quantity: updatedItems[itemIdx].quantity + numericQty,
            unitCost: unitCost,
            subtotal: (updatedItems[itemIdx].quantity + numericQty) * unitCost,
          };
        } else {
          updatedItems.push(newItem);
        }

        const newSubtotal = updatedItems.reduce((acc, i) => acc + (i.subtotal || 0), 0);
        const updatedOrder: PurchaseOrder = {
          ...existingOrder,
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal,
          updatedAt: new Date().toISOString(),
        };

        store.savePurchaseOrder(updatedOrder);
        showToast(
          `Producto agregado al pedido existente ${existingOrder.code} (${existingOrder.supplierName})`,
          'success'
        );
        onClose();
        return;
      }
    }

    // Otherwise create new Purchase Order
    const newCode = store.generatePurchaseOrderCode();
    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: newCode,
      supplierId: targetSupplier?.id || selectedSupplierId,
      supplierName: targetSupplier?.name || 'Proveedor General',
      supplierTaxId: targetSupplier?.cuit || '',
      supplierPhone: targetSupplier?.phone || '',
      supplierEmail: targetSupplier?.email || '',
      date: new Date().toISOString().split('T')[0],
      expectedDeliveryDate,
      notes,
      items: [newItem],
      subtotal: totalItemCost,
      taxTotal: 0,
      total: totalItemCost,
      status: 'draft',
      paymentCondition: 'credit',
      invoiceNumber: '',
      warehouseId: '1',
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.savePurchaseOrder(newOrder);
    showToast(
      `Pedido ${newCode} creado para ${newOrder.supplierName}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/40">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Armar Pedido de Compra
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccioná el proveedor destinatario para generar la orden
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product preview card */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded text-[11px]">
                  {product.code}
                </span>
                <span className="font-bold text-slate-900 dark:text-white uppercase">
                  {product.name}
                </span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 space-x-3">
                <span>
                  Prov. Configurado:{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {originalSupplier?.name || product.supplierName || 'Sin asignar'}
                  </strong>
                </span>
                {product.supplierCode && (
                  <span>
                    Cód Prov:{' '}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {product.supplierCode}
                    </strong>
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  product.stock <= (product.stockMin || 0)
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                Stock: {product.stock} {product.unit || 'u'}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">
                Mín: {product.stockMin || 0}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Supplier Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                Proveedor para este Pedido:
              </label>
              {isDifferentSupplier && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  ⚠️ Distinto al proveedor configurado
                </span>
              )}
            </div>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {store.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.cuit || 'CUIT N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector if supplier has open orders */}
          {openOrdersForSupplier.length > 0 && (
            <div className="space-y-2 bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block">
                Destino del producto en compras:
              </span>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="orderMode"
                    value="existing"
                    checked={orderMode === 'existing'}
                    onChange={() => setOrderMode('existing')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Sumar a pedido abierto</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="orderMode"
                    value="new"
                    checked={orderMode === 'new'}
                    onChange={() => setOrderMode('new')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Crear nuevo pedido</span>
                </label>
              </div>

              {orderMode === 'existing' && (
                <select
                  value={targetOrderId}
                  onChange={(e) => setTargetOrderId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-lg p-2 border border-slate-300 dark:border-slate-700 font-mono text-xs focus:outline-none"
                >
                  {openOrdersForSupplier.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.code} ({ord.items.length} items - Total: ${ord.total.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Quantities & Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Cantidad a Pedir:
              </label>
              <input
                type="number"
                min="0.001"
                step="any"
                required
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Costo Unit. Estimado ($):
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subtotal preview banner */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
            <span className="font-semibold text-slate-500">Subtotal Estimado:</span>
            <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
              ${totalItemCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
            >
              {orderMode === 'existing' ? 'Agregar al Pedido' : 'Generar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
