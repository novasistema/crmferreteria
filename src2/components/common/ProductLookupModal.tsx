import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Search,
  Package,
  X,
  Warehouse,
  TrendingUp,
  Tag,
  DollarSign,
  Barcode,
  Layers,
} from 'lucide-react';

export const ProductLookupModal: React.FC = () => {
  const { store } = useApp();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global F10 key shortcut listener
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F10') {
      e.preventDefault();
      setOpen((prev) => {
        if (!prev) {
          setSearch('');
          setSelectedProduct(null);
          setTimeout(() => inputRef.current?.focus(), 80);
          return true;
        }
        return false;
      });
    }
    if (e.key === 'Escape' && open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleOpen = () => {
    setOpen(true);
    setSearch('');
    setSelectedProduct(null);
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleClose = () => {
    setOpen(false);
    setSearch('');
    setSelectedProduct(null);
  };

  const filteredProducts = React.useMemo(() => {
    const s = search.trim().toLowerCase();
    if (s.length < 1) return [];

    return store.products
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(s) ||
          p.code.toLowerCase().includes(s) ||
          (p.barcode && p.barcode.toLowerCase().includes(s)) ||
          (p.supplierCode && p.supplierCode.toLowerCase().includes(s)) ||
          (p.brandName && p.brandName.toLowerCase().includes(s))
        );
      })
      .slice(0, 25);
  }, [search, store.products]);

  return (
    <>
      {/* Trigger Button (placed in Topbar) */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-orange-400 hover:bg-slate-800 transition-colors text-xs font-semibold"
        title="Consulta Rápida de Producto (F10)"
      >
        <Search className="w-4 h-4 text-orange-400" />
        <span className="hidden xl:inline">Consulta</span>
        <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono">
          F10
        </span>
      </button>

      {/* Modal Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Consulta Rápida de Producto</h3>
                  <span className="text-[11px] text-slate-400">Presiona ESC o clic en cerrar para salir</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-slate-800 border border-slate-700 text-orange-400 px-2 py-0.5 rounded-md font-mono font-bold">
                  F10
                </span>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search or Selected Product View */}
            {!selectedProduct ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar por nombre, código interno, código de barras, SKU proveedor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl pl-10 pr-4 py-3 border border-slate-700 focus:border-orange-500 focus:outline-none placeholder:text-slate-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {search.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    Escribe para buscar productos al instante...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No se encontraron productos para "{search}"
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-bold text-xs text-white group-hover:text-orange-400 transition-colors truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="font-mono text-amber-400">{p.code}</span>
                            {p.supplierCode && p.supplierCode !== '-' && (
                              <span className="text-slate-500 font-mono">SKU: {p.supplierCode}</span>
                            )}
                            {p.brandName && (
                              <span className="text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                {p.brandName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-black text-sm text-emerald-400">
                            ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </p>
                          <p className={`text-[10px] font-semibold ${p.stock > 0 ? 'text-slate-400' : 'text-rose-400'}`}>
                            Stock: {p.stock} {p.unit || 'u'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Product Detail Card View */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-orange-500/30 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-black text-white">{selectedProduct.name}</h4>
                      <p className="text-xs font-mono text-amber-400 mt-0.5">
                        CÓDIGO: {selectedProduct.code} {selectedProduct.barcode ? `· EAN: ${selectedProduct.barcode}` : ''}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedProduct.brandName && (
                          <span className="text-[10px] bg-orange-950 text-orange-300 border border-orange-800/60 px-2 py-0.5 rounded-full font-bold">
                            {selectedProduct.brandName}
                          </span>
                        )}
                        {selectedProduct.categoryName && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                            {selectedProduct.categoryName}
                          </span>
                        )}
                        {selectedProduct.supplierCode && (
                          <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/60 px-2 py-0.5 rounded-full font-mono">
                            Prov: {selectedProduct.supplierCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Stock 2-column stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Precio de Venta Minorista
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ${selectedProduct.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                      {selectedProduct.priceMayorista > 0 && (
                        <span className="text-[11px] text-slate-400 font-mono block mt-1">
                          Mayorista: ${selectedProduct.priceMayorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Stock Total Disponible
                      </span>
                      <span
                        className={`text-2xl font-black font-mono ${
                          selectedProduct.stock > 0 ? 'text-white' : 'text-rose-400'
                        }`}
                      >
                        {selectedProduct.stock} {selectedProduct.unit || 'u'}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Mínimo alerta: {selectedProduct.stockMin || 5}
                      </span>
                    </div>
                  </div>

                  {/* Stock Breakdown per Warehouse / Branch */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center space-x-1.5 mb-2 text-xs font-bold text-slate-300">
                      <Warehouse className="w-3.5 h-3.5 text-blue-400" />
                      <span>Stock por Depósito / Sucursal:</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {store.warehouses.map((wh) => {
                        const qty = selectedProduct.stockByWarehouse?.[wh.id] ?? 
                          (wh.isMain ? selectedProduct.stock : 0);
                        return (
                          <div
                            key={wh.id}
                            className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between items-center"
                          >
                            <span className="text-slate-400 truncate text-[11px]">{wh.name}:</span>
                            <strong className={`font-mono ${qty > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {qty}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cost & Profit Margin */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span>Costo compra: </span>
                      <strong className="text-white font-mono">
                        ${selectedProduct.costPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div>
                      <span>Margen de Ganancia: </span>
                      <strong className="text-emerald-400 font-bold">
                        +{selectedProduct.marginPercent || 40}%
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                >
                  ← Buscar otro producto
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
