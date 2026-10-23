import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Globe,
  Star,
  Tag,
  Edit2,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { ProductEditOnlineModal } from './ProductEditOnlineModal';

export const ActiveProductsTab: React.FC = () => {
  const { store } = useApp();
  const activeProducts = store.products.filter((p) => p.publishOnline !== false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = activeProducts.filter(
    (p) =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRemoveFromOnline = (productId: string) => {
    store.toggleProductPublishOnline(productId, false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Productos Activos en Tienda ({activeProducts.length})
            </h3>
            <p className="text-xs text-slate-400">
              Artículos visibles para los clientes en el catálogo público online.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar productos activos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Producto / Código</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-right">Precio Tienda</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Destacado</th>
                <th className="p-3 text-center">Oferta</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No hay productos activos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isOffer = p.isOnOffer && p.offerPrice;
                  const finalPrice = isOffer ? p.offerPrice! : p.priceMinorista;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Cód: {p.code}</div>
                      </td>

                      <td className="p-3 text-slate-300">{p.categoryName}</td>

                      <td className="p-3 text-right">
                        {isOffer ? (
                          <div>
                            <span className="text-[10px] text-slate-500 line-through block">
                              ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="font-bold text-rose-400">
                              ${finalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-amber-400">
                            ${finalPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
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
                        {p.isFeatured ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-400" /> Sí
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {p.isOnOffer ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                            <Tag className="w-3.5 h-3.5" /> Sí
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <Edit2 className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleRemoveFromOnline(p.id)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                            title="Quitar de tienda online"
                          >
                            <Trash2 className="w-3 h-3" />
                            Quitar
                          </button>
                        </div>
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
