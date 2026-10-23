import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Image,
  Plus,
  Search,
  DollarSign,
  Boxes,
  TrendingUp,
  Tag,
  Check,
  Trash2,
  Edit2,
  X,
  Layers,
  Sparkles,
  Percent,
} from 'lucide-react';

interface WholesaleCatalogItem {
  productId: string;
  markupPercent: number; // e.g. 35%
  customWholesalePrice?: number;
}

export const VisualCatalogView: React.FC = () => {
  const { store, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultMarkup, setDefaultMarkup] = useState<number>(35); // 35% default margin

  // Wholesale catalog items stored in local state or store settings
  const [wholesaleItems, setWholesaleItems] = useState<WholesaleCatalogItem[]>([
    ...(store.products || []).slice(0, 5).map((p) => ({
      productId: p.id,
      markupPercent: 35,
    })),
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [modalSearch, setModalSearch] = useState('');

  const allProducts = store.products || [];

  // Filter products for the catalog view
  const catalogProducts = wholesaleItems
    .map((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) return null;
      const baseCost = product.costPrice || 0;
      const calculatedPrice = item.customWholesalePrice || baseCost * (1 + item.markupPercent / 100);
      return {
        ...product,
        markupPercent: item.markupPercent,
        wholesalePrice: calculatedPrice,
      };
    })
    .filter((p): p is (Product & { markupPercent: number; wholesalePrice: number }) => p !== null)
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    });

  const availableProductsToAdd = allProducts.filter(
    (p) => p.active && !wholesaleItems.some((item) => item.productId === p.id)
  ).filter((p) => {
    if (!modalSearch.trim()) return true;
    const q = modalSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const handleAddSelectedToWholesale = () => {
    if (selectedProductIds.length === 0) {
      showToast('Seleccione al menos un producto del inventario minorista', 'warning');
      return;
    }
    const newItems: WholesaleCatalogItem[] = selectedProductIds.map((id) => ({
      productId: id,
      markupPercent: defaultMarkup,
    }));
    setWholesaleItems([...wholesaleItems, ...newItems]);
    showToast(`Se agregaron ${selectedProductIds.length} artículos al Catálogo Mayorista con ${defaultMarkup}% de ganancia`, 'success');
    setSelectedProductIds([]);
    setIsAddModalOpen(false);
  };

  const handleRemoveFromCatalog = (productId: string) => {
    setWholesaleItems(wholesaleItems.filter((i) => i.productId !== productId));
    showToast('Artículo removido del catálogo mayorista', 'info');
  };

  const handleUpdateMarkup = (productId: string, newMarkup: number) => {
    setWholesaleItems(
      wholesaleItems.map((i) => (i.productId === productId ? { ...i, markupPercent: newMarkup } : i))
    );
    showToast('Margen de ganancia mayorista actualizado', 'success');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-purple-200 dark:border-purple-800">
              <Layers className="w-3.5 h-3.5" /> Lista Mayorista & Ganancia Específica
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Catálogo Visual Mayorista
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Crea y administra la lista mayorista seleccionando artículos desde el inventario minorista con márgenes de ganancia específicos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <Percent className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Margen por defecto:</span>
            <input
              type="number"
              value={defaultMarkup}
              onChange={(e) => setDefaultMarkup(Number(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-center"
            />
            <span className="text-xs text-slate-400">%</span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Agregar Artículos de Inventario</span>
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar en catálogo mayorista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
          />
        </div>

        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Total en lista mayorista: <strong className="text-slate-900 dark:text-white">{catalogProducts.length}</strong> artículos
        </span>
      </div>

      {/* Visual Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {catalogProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
                  {product.code}
                </span>
                <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800">
                  +{product.markupPercent}% Ganancia
                </span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
                {product.name}
              </h3>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Costo Base</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    ${(product.costPrice || 0).toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Precio Mayorista</span>
                  <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                    ${product.wholesalePrice.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions & Markup Editor */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Margen %:</span>
                <input
                  type="number"
                  value={product.markupPercent}
                  onChange={(e) => handleUpdateMarkup(product.id, Number(e.target.value) || 0)}
                  className="w-14 px-2 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center"
                />
              </div>

              <button
                onClick={() => handleRemoveFromCatalog(product.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                title="Quitar de lista mayorista"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {catalogProducts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No hay artículos en el catálogo mayorista</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Haz clic en "Agregar Artículos de Inventario" para seleccionar productos de tu inventario minorista y crear la lista mayorista.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Agregar Artículos
          </button>
        </div>
      )}

      {/* Modal: Select Products from Retail Inventory */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Seleccionar Artículos de Inventario Minorista
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Elige los productos que formarán parte de la lista mayorista con {defaultMarkup}% de ganancia inicial.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar en inventario minorista..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:text-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-2">
              {availableProductsToAdd.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                      } else {
                        setSelectedProductIds([...selectedProductIds, p.id]);
                      }
                    }}
                    className={`p-3 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-mono text-[10px] text-slate-400 block">{p.code}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{p.name}</h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Costo</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                        ${(p.costPrice || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {availableProductsToAdd.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No hay más artículos disponibles en el inventario minorista.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-xs font-bold text-slate-500">
                Seleccionados: {selectedProductIds.length} artículos
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedToWholesale}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Agregar al Catálogo Mayorista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
