import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  ShoppingCart,
  MessageSquare,
  Mail,
  Download,
  Boxes,
  Check,
} from 'lucide-react';

export const MissingStockView: React.FC = () => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'sin_stock' | 'stock_bajo' | 'reponer'>('sin_stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const products = store.products || [];

  // Categorize products based on stock levels
  const sinStockProducts = products.filter((p) => p.stock <= 0);
  const stockBajoProducts = products.filter((p) => p.stock > 0 && p.stock <= (p.stockMin || 5));
  const reponerProducts = products.filter((p) => p.stock > 0 && p.stock <= 10);

  const currentList =
    activeTab === 'sin_stock' ? sinStockProducts : activeTab === 'stock_bajo' ? stockBajoProducts : reponerProducts;

  const filteredProducts = currentList.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) return false;
    }
    if (selectedProvider !== 'all' && p.supplierName !== selectedProvider) return false;
    if (selectedBrand !== 'all' && p.brandName !== selectedBrand) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((i) => i !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleDownloadCSV = () => {
    let csv = 'SKU,Producto,Proveedor,Marca,Categoria,Stock Actual,Stock Minimo,Sugerido\n';
    filteredProducts.forEach((p) => {
      csv += `"${p.code}","${p.name}","${p.supplierName || '-'}","${p.brandName || '-'}","${p.category || '-'}","${p.stock}","${p.stockMin || 5}","${Math.max(1, (p.stockMin || 5) - p.stock + 5)}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_faltantes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Reporte de faltantes descargado', 'success');
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
              <span>Faltantes y Alertas de Stock</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitorea productos con stock bajo o agotados. Filtra por proveedor para armar pedidos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Lista de faltantes reiniciada', 'info')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
            </button>
            <button
              onClick={() => showToast('Stock actualizado correctamente', 'success')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Actualizar
            </button>
          </div>
        </div>

        {/* Top 3 KPI Cards matching exact screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setActiveTab('sin_stock')}
            className={`bg-slate-900 p-6 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'sin_stock' ? 'border-rose-500/80 shadow-lg shadow-rose-950/50' : 'border-slate-800'
            }`}
          >
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Sin Stock</span>
            <div className="mt-2 text-4xl font-black tracking-tight text-rose-500">
              {sinStockProducts.length.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">productos agotados</span>
          </div>

          <div
            onClick={() => setActiveTab('stock_bajo')}
            className={`bg-slate-900 p-6 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'stock_bajo' ? 'border-amber-500/80 shadow-lg shadow-amber-950/50' : 'border-slate-800'
            }`}
          >
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Stock Bajo</span>
            <div className="mt-2 text-4xl font-black tracking-tight text-amber-400">
              {stockBajoProducts.length.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">bajo mínimo</span>
          </div>

          <div
            onClick={() => setActiveTab('reponer')}
            className={`bg-slate-900 p-6 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'reponer' ? 'border-blue-500/80 shadow-lg shadow-blue-950/50' : 'border-slate-800'
            }`}
          >
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Para Reponer</span>
            <div className="mt-2 text-4xl font-black tracking-tight text-blue-400">
              {reponerProducts.length.toLocaleString('es-AR')}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">en punto de pedido</span>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Productos con Alertas
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => showToast('Selección de columnas activa', 'info')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
              >
                Columnas
              </button>
              <button
                onClick={() => showToast(`Agregados ${selectedProductIds.length} ítems para pedido`, 'success')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Pedir ({selectedProductIds.length})
              </button>
              <button
                onClick={() => showToast('Abriendo WhatsApp para pedido...', 'success')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => showToast('Enviando reporte por email...', 'success')}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                onClick={handleDownloadCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium"
            >
              <option value="all">Todos los proveedores</option>
              {Array.from(new Set(products.map((p) => p.supplierName).filter(Boolean))).map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium"
            >
              <option value="all">Todas las marcas</option>
              {Array.from(new Set(products.map((p) => p.brandName).filter(Boolean))).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-medium"
            >
              <option value="all">Todas las categorías</option>
              {Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sub-tabs pills */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('sin_stock')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sin_stock' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sin Stock ({sinStockProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('stock_bajo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stock_bajo' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Stock Bajo ({stockBajoProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('reponer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reponer' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Para Reponer ({reponerProducts.length})
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Proveedor</th>
                  <th className="py-3.5 px-4">Marca</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 text-center">Stock Actual</th>
                  <th className="py-3.5 px-4 text-center">Stock Mínimo</th>
                  <th className="py-3.5 px-4 text-center">Punto Pedido</th>
                  <th className="py-3.5 px-4 text-center">Stock Deseado</th>
                  <th className="py-3.5 px-4 text-center">Cant. Sugerida</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {filteredProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const suggestedQty = Math.max(1, (p.stockMin || 5) - p.stock + 5);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectProduct(p.id)}
                          className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{p.code}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.supplierName || 'CRUCECOR'}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.brandName || 'GENÉRICA'}</td>
                      <td className="py-3.5 px-4 text-slate-300">{p.category || 'FERRETERÍA'}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-500">{p.stock}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">{p.stockMin || 5}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">10</td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">-</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">{suggestedQty}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30">
                          Sin Stock
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs italic">
              No hay productos que coincidan con los filtros de faltantes seleccionados.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
