import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Supplier } from '../../types';
import { X, Plus, Search, ShoppingCart, AlertTriangle, Building2, Package } from 'lucide-react';

interface AddPendingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPendingItemModal: React.FC<AddPendingItemModalProps> = ({ isOpen, onClose }) => {
  const { store, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [targetSupplierId, setTargetSupplierId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Set default supplier when modal opens or product changes
  useEffect(() => {
    if (store.suppliers.length > 0 && !targetSupplierId) {
      setTargetSupplierId(store.suppliers[0].id);
    }
  }, [store.suppliers, targetSupplierId]);

  // Handle outside click for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Search filtered products
  const filteredProducts = searchQuery.trim()
    ? store.products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 10)
    : [];

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setSearchQuery(`${p.code} - ${p.name}`);
    setIsSearchDropdownOpen(false);
    setUnitCost(p.costPrice || 0);

    // If product has a configured supplier, default target to it
    if (p.supplierId) {
      setTargetSupplierId(p.supplierId);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast('Seleccioná un producto de la lista', 'error');
      return;
    }
    if (quantity <= 0) {
      showToast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    const originalSupplier = store.suppliers.find((s) => s.id === selectedProduct.supplierId);
    const targetSupplier = store.suppliers.find((s) => s.id === targetSupplierId);

    store.addPendingPurchaseItem({
      productId: selectedProduct.id,
      sku: selectedProduct.code,
      supplierProductCode: selectedProduct.barcode || '',
      productName: selectedProduct.name,
      originalSupplierId: selectedProduct.supplierId,
      originalSupplierName: originalSupplier?.name || 'S/Proveedor',
      targetSupplierId: targetSupplierId || store.suppliers[0]?.id || '',
      targetSupplierName: targetSupplier?.name || store.suppliers[0]?.name || 'PROVEEDOR GENERAL',
      quantity,
      unitCost: unitCost || selectedProduct.costPrice || 0,
      vatRate: selectedProduct.vatRate ?? 21,
    });

    showToast(`"${selectedProduct.name}" agregado a pendientes de pedir`, 'success');
    onClose();
    // Reset state
    setSelectedProduct(null);
    setSearchQuery('');
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Agregar a Pendientes de Pedir
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccioná el producto, la cantidad y el proveedor de destino.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleAdd} className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Product Search */}
          <div ref={searchContainerRef} className="relative">
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Buscar Producto por SKU o Nombre *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                  if (!e.target.value) setSelectedProduct(null);
                }}
                onFocus={() => setIsSearchDropdownOpen(true)}
                placeholder="Escribí para buscar producto..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Dropdown list */}
            {isSearchDropdownOpen && filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className="p-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mr-2">
                        {prod.code}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {prod.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">
                        Stock: {prod.stock || 0}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        ${(prod.costPrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Supplier Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
              Pedir a Proveedor *
            </label>
            <select
              value={targetSupplierId}
              onChange={(e) => setTargetSupplierId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white font-semibold"
            >
              {store.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Cantidad a Pedir *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Costo Unitario ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0c3562] hover:bg-[#082649] text-white flex items-center space-x-1.5 shadow-md shadow-blue-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar a Pendientes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
