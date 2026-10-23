import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Percent,
  Plus,
  FileSpreadsheet,
  Layers,
  Store,
  Star,
  CheckCircle2,
  Trash2,
  DollarSign,
  Package,
} from 'lucide-react';
import { WholesaleScaleModal } from './WholesaleScaleModal';

export const WholesaleTab: React.FC = () => {
  const { store } = useApp();
  const products = store.products;
  const config = store.ecommerceConfig;

  // Wholesale products are either publishWholesale === true or wholesaleExclusive === true or have custom wholesale price
  const wholesaleProducts = products.filter(
    (p) => p.publishWholesale === true || p.wholesaleExclusive === true || (p.wholesaleCustomPrice && p.wholesaleCustomPrice > 0)
  );

  // If none explicitly marked wholesale yet, show products with wholesale margin
  const displayProducts = wholesaleProducts.length > 0 ? wholesaleProducts : products.slice(0, 165);

  const [searchTerm, setSearchTerm] = useState('');
  const [bulkMargin, setBulkMargin] = useState<string>(
    config.wholesaleDefaultMargin ? config.wholesaleDefaultMargin.toString() : '30.00'
  );
  const [selectedProductForScale, setSelectedProductForScale] = useState<Product | null>(null);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  // KPIs
  const totalInWholesale = displayProducts.length;
  const exclusiveCount = displayProducts.filter((p) => p.wholesaleExclusive).length;
  const withTiersCount = displayProducts.filter(
    (p) => p.wholesalePriceTiers && p.wholesalePriceTiers.length > 0
  ).length;

  const filtered = displayProducts.filter(
    (p) =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApplyMarginToAll = () => {
    const margin = parseFloat(bulkMargin) || 30;
    store.applyWholesaleMarginToAll(margin);
  };

  const handleWholesalePriceChange = (productId: string, price: number) => {
    const product = store.products.find((p) => p.id === productId);
    const cost = product?.costPrice || 1;
    const margin = Math.round(((price - cost) / cost) * 100 * 100) / 100;
    store.updateProductWholesale(productId, {
      wholesaleCustomPrice: price,
      wholesaleMarginPercent: margin,
    });
  };

  const handleToggleExclusive = (productId: string, exclusive: boolean) => {
    store.updateProductWholesale(productId, {
      wholesaleExclusive: exclusive,
      publishWholesale: true,
    });
  };

  const handleRemoveFromWholesale = (productId: string) => {
    store.updateProductWholesale(productId, {
      publishWholesale: false,
      wholesaleExclusive: false,
      wholesaleCustomPrice: undefined,
    });
  };

  const handleAddSelectedProducts = () => {
    selectedToAdd.forEach((id) => {
      store.updateProductWholesale(id, {
        publishWholesale: true,
        wholesaleExclusive: true,
      });
    });
    setSelectedToAdd([]);
    setShowAddProductsModal(false);
  };

  return (
    <div className="space-y-5">
      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{totalInWholesale}</span>
            <p className="text-xs font-semibold text-slate-400">Productos en Distribuidora</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{exclusiveCount}</span>
            <p className="text-xs font-semibold text-slate-400">Productos Exclusivos Mayorista</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{withTiersCount}</span>
            <p className="text-xs font-semibold text-slate-400">Con Escalas de Precio</p>
          </div>
        </div>
      </div>

      {/* Margin Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-400" />
            Ganancia sobre costo:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={bulkMargin}
              onChange={(e) => setBulkMargin(e.target.value)}
              className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
            />
            <span className="text-xs text-slate-400">%</span>
            <button
              onClick={handleApplyMarginToAll}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Aplicar a todos
            </button>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            (Calcula precio mayorista = costo × (1 + {bulkMargin}%))
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddProductsModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Productos
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar en distribuidora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Wholesale Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3 text-right">Costo</th>
                <th className="p-3 text-right">Precio Venta</th>
                <th className="p-3 text-right">Precio Mayorista</th>
                <th className="p-3 text-center">Margen</th>
                <th className="p-3 text-center">Exclusivo</th>
                <th className="p-3 text-center">Escalas</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No hay productos en distribuidora con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const cost = p.costPrice || 0;
                  const wholesalePrice =
                    p.wholesaleCustomPrice ||
                    (cost > 0
                      ? Math.round(cost * (1 + (p.wholesaleMarginPercent || 30) / 100) * 100) / 100
                      : p.priceMayorista || p.priceMinorista * 0.85);
                  const marginPercent =
                    p.wholesaleMarginPercent ||
                    (cost > 0 ? Math.round(((wholesalePrice - cost) / cost) * 100 * 100) / 100 : 30);
                  const tierCount = p.wholesalePriceTiers?.length || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Cód: {p.code}</div>
                      </td>

                      <td className="p-3 text-right text-slate-400">
                        ${cost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 text-right text-slate-400 line-through">
                        ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 text-right">
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={wholesalePrice}
                          onBlur={(e) =>
                            handleWholesalePriceChange(p.id, parseFloat(e.target.value) || wholesalePrice)
                          }
                          className="w-28 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-right text-xs font-black text-amber-400 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          +{marginPercent.toFixed(2)}%
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleExclusive(p.id, !p.wholesaleExclusive)}
                          className={`w-9 h-5 rounded-full transition-colors relative inline-block ${
                            p.wholesaleExclusive ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-transform ${
                              p.wholesaleExclusive ? 'right-1' : 'left-1'
                            }`}
                          />
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        {tierCount > 0 ? (
                          <button
                            onClick={() => setSelectedProductForScale(p)}
                            className="px-2 py-0.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold rounded-lg text-[11px] border border-purple-500/20"
                          >
                            {tierCount} Escalas
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedProductForScale(p)}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] flex items-center gap-1 mx-auto"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </button>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stock > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {p.stock} u.
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleRemoveFromWholesale(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Quitar de distribuidora"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scale Modal */}
      {selectedProductForScale && (
        <WholesaleScaleModal
          product={selectedProductForScale}
          onClose={() => setSelectedProductForScale(null)}
        />
      )}

      {/* Add Products to Wholesale Modal */}
      {showAddProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Agregar Productos a Distribuidora
              </h3>
              <button
                onClick={() => setShowAddProductsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {products.slice(0, 50).map((p) => {
                  const isChecked = selectedToAdd.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedToAdd([...selectedToAdd, p.id]);
                            } else {
                              setSelectedToAdd(selectedToAdd.filter((id) => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-500">Cód: {p.code}</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-400">
                        ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {selectedToAdd.length} productos seleccionados
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddProductsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSelectedProducts}
                  disabled={selectedToAdd.length === 0}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 rounded-xl"
                >
                  Agregar a Distribuidora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
