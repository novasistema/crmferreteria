import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  Star,
  Tag,
  Globe,
  Store,
  Edit2,
  CheckSquare,
  Square,
  Package,
  Layers,
} from 'lucide-react';
import { ProductEditOnlineModal } from './ProductEditOnlineModal';

export const CatalogTab: React.FC = () => {
  const { store } = useApp();
  const products = store.products;
  const categories = store.categories;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesOnline =
      filterOnline === 'all' ||
      (filterOnline === 'online' && p.publishOnline !== false) ||
      (filterOnline === 'offline' && p.publishOnline === false);
    return matchesSearch && matchesCat && matchesOnline;
  });

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleBatchPublish = (publish: boolean) => {
    store.batchTogglePublishOnline(selectedProductIds, publish);
    setSelectedProductIds([]);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por código, nombre o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Online Filter */}
          <select
            value={filterOnline}
            onChange={(e) => setFilterOnline(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="online">Publicados Online</option>
            <option value="offline">No Publicados</option>
          </select>
        </div>

        {/* Batch actions */}
        {selectedProductIds.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 animate-in fade-in">
            <span className="text-xs text-slate-300 font-semibold">
              {selectedProductIds.length} seleccionados
            </span>
            <button
              onClick={() => handleBatchPublish(true)}
              className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 rounded-lg transition-colors"
            >
              Publicar Online
            </button>
            <button
              onClick={() => handleBatchPublish(false)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Ocultar de Tienda
            </button>
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-10">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    {selectedProductIds.length === filteredProducts.length &&
                    filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">Producto / Código</th>
                <th className="p-3">Categoría & Marca</th>
                <th className="p-3 text-center">Online</th>
                <th className="p-3 text-center">Mayorista</th>
                <th className="p-3 text-center">Destacado</th>
                <th className="p-3 text-center">Oferta</th>
                <th className="p-3 text-right">Precio Venta</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const isOnline = p.publishOnline !== false;
                  const isWholesale = p.publishWholesale ?? false;
                  const isFeatured = p.isFeatured ?? false;
                  const isOnOffer = p.isOnOffer ?? false;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(p.id)}
                          className="text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          <span>Cód: {p.code}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="text-slate-300 font-medium">{p.categoryName}</span>
                        {p.brandName && (
                          <span className="text-slate-500 text-[10px] block font-mono">
                            {p.brandName}
                          </span>
                        )}
                      </td>

                      {/* Online Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => store.toggleProductPublishOnline(p.id, !isOnline)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                          title={isOnline ? 'Publicado Online' : 'No publicado'}
                        >
                          <Globe className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Wholesale Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => store.toggleProductPublishWholesale(p.id, !isWholesale)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            isWholesale
                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                          title={isWholesale ? 'En Distribuidora' : 'No publicado'}
                        >
                          <Store className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Featured Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => store.toggleProductFeatured(p.id, !isFeatured)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            isFeatured
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                          title={isFeatured ? 'Destacado' : 'No destacado'}
                        >
                          <Star className={`w-4 h-4 ${isFeatured ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>

                      {/* Offer Toggle */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => store.toggleProductOnOffer(p.id, !isOnOffer)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            isOnOffer
                              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                              : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                          }`}
                          title={isOnOffer ? 'En Oferta' : 'Sin oferta'}
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Price */}
                      <td className="p-3 text-right">
                        {isOnOffer && p.offerPrice ? (
                          <div>
                            <span className="text-[10px] text-slate-500 line-through block">
                              ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="font-bold text-rose-400">
                              ${p.offerPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-100">
                            ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stock > 5
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : p.stock > 0
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {p.stock} u.
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-semibold rounded-lg transition-colors flex items-center gap-1 mx-auto text-[11px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar
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

      {editingProduct && (
        <ProductEditOnlineModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};
