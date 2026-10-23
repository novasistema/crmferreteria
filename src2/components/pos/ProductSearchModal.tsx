import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product } from '../../types';
import { Search, Package, X, Plus, Tag, Boxes, Layers, DollarSign } from 'lucide-react';

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  warehouseId: string;
  priceListId: string;
  onAddProduct: (product: Product, quantity?: number) => void;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  warehouseId,
  priceListId,
  onAddProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRubro, setSelectedRubro] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedBrand('all');
      setSelectedRubro('all');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brandName).filter(Boolean))).sort() as string[];
  }, [products]);

  const uniqueRubros = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.rubro).filter(Boolean))).sort() as string[];
  }, [products]);

  const getPrice = (product: Product): number => {
    if (priceListId === 'pl-mayorista') return product.priceMayorista || product.priceMinorista;
    if (priceListId === 'pl-gremio') return product.priceGremio || product.priceMinorista;
    return product.priceMinorista;
  };

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => {
        if (!p.active) return false;
        if (selectedBrand !== 'all' && p.brandName !== selectedBrand) return false;
        if (selectedRubro !== 'all' && p.rubro !== selectedRubro) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q)) ||
          (p.supplierCode && p.supplierCode.toLowerCase().includes(q)) ||
          (p.brandName && p.brandName.toLowerCase().includes(q))
        );
      })
      .slice(0, 50);
  }, [products, search, selectedBrand, selectedRubro]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, selectedBrand, selectedRubro]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts[selectedIndex]) {
        onAddProduct(filteredProducts[selectedIndex], 1);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Buscador Avanzado de Artículos (F2)</h3>
              <p className="text-[11px] text-slate-400">
                Seleccione un producto para ingresarlo inmediatamente a la venta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Descripción, código, barra, etc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-950 text-white text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todas las marcas ({uniqueBrands.length})</option>
              {uniqueBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedRubro}
              onChange={(e) => setSelectedRubro(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs rounded-xl px-3 py-2 border border-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Todos los rubros ({uniqueRubros.length})</option>
              {uniqueRubros.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 divide-y divide-slate-800/40">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No se encontraron artículos con los filtros aplicados.
            </div>
          ) : (
            filteredProducts.map((product, idx) => {
              const currentStock = product.stockByWarehouse[warehouseId] || 0;
              const isSelected = idx === selectedIndex;
              const price = getPrice(product);

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    onAddProduct(product, 1);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-900/30 border border-blue-500 text-white shadow'
                      : 'hover:bg-slate-800/60 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-amber-400 font-bold text-xs">
                        {product.code}
                      </span>
                      <span className="font-bold text-xs text-white group-hover:text-amber-300">
                        {product.name}
                      </span>
                      {product.brandName && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {product.brandName}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
                      {product.barcode && (
                        <span className="font-mono text-[10px] text-slate-400">
                          Barra: {product.barcode}
                        </span>
                      )}
                      {product.rubro && <span>Rubro: {product.rubro}</span>}
                      <span>Unidad: {product.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-400 block">
                        ${price.toLocaleString('es-AR')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          currentStock <= 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        }`}
                      >
                        Stock: {currentStock}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddProduct(product, 1);
                        onClose();
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold transition-transform active:scale-95 shadow"
                      title="Agregar a la venta"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{filteredProducts.length} productos mostrados • Flechas ↑ ↓ y Enter para ingresar</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cerrar (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
