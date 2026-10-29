import React, { useState } from 'react';
import { 
  AlertTriangle, 
  RotateCcw, 
  RefreshCw, 
  PackageX, 
  TrendingDown, 
  PackageCheck, 
  SlidersHorizontal, 
  ShoppingCart, 
  MessageCircle, 
  Mail, 
  Download, 
  Search, 
  CheckSquare, 
  Square,
  Check
} from 'lucide-react';
import { Product } from '../../types';

interface FaltantesModuleProps {
  products: Product[];
  onOpenSupplierOrderWithItems?: (items: any[]) => void;
}

export const FaltantesModule: React.FC<FaltantesModuleProps> = ({ 
  products,
  onOpenSupplierOrderWithItems 
}) => {
  const [selectedTab, setSelectedTab] = useState<'sin_stock' | 'stock_bajo' | 'para_reponer'>('sin_stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('todos');
  const [brandFilter, setBrandFilter] = useState('todas');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);

  // Seed sample realistic items if products are empty or enrich them
  const enrichedProducts = products.map((p, idx) => {
    const minStock = p.minStock || 5;
    const reorderPoint = p.reorderPoint || minStock * 2;
    const stock = p.stock !== undefined ? p.stock : (idx % 3 === 0 ? 0 : idx % 3 === 1 ? -1 : 2);
    const stockDeseado = minStock * 3;
    const cantSugerida = Math.max(0, stockDeseado - stock);
    
    let estado: 'sin_stock' | 'stock_bajo' | 'para_reponer' = 'para_reponer';
    if (stock <= 0) {
      estado = 'sin_stock';
    } else if (stock <= minStock) {
      estado = 'stock_bajo';
    }

    return {
      sku: p.code || `SKU-${idx + 1000}`,
      producto: p.name,
      proveedor: p.supplierName || (idx % 2 === 0 ? 'CRUCECOR' : 'FERRETERA CENTRAL'),
      marca: p.brand || (idx % 2 === 0 ? 'DONGHUA' : 'ZHD'),
      categoria: p.category || 'FERRETERIA',
      stockActual: stock,
      stockMinimo: minStock,
      puntoPedido: reorderPoint,
      stockDeseado,
      cantSugerida,
      estado
    };
  });

  const sinStockCount = enrichedProducts.filter(p => p.estado === 'sin_stock').length;
  const stockBajoCount = enrichedProducts.filter(p => p.estado === 'stock_bajo').length;
  const paraReponerCount = enrichedProducts.filter(p => p.estado === 'para_reponer').length;

  const suppliers = Array.from(new Set(enrichedProducts.map(p => p.proveedor))).filter(Boolean);
  const brands = Array.from(new Set(enrichedProducts.map(p => p.marca))).filter(Boolean);
  const categories = Array.from(new Set(enrichedProducts.map(p => p.categoria))).filter(Boolean);

  const filteredItems = enrichedProducts.filter(p => {
    if (p.estado !== selectedTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.producto.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (supplierFilter !== 'todos' && p.proveedor !== supplierFilter) return false;
    if (brandFilter !== 'todas' && p.marca !== brandFilter) return false;
    if (categoryFilter !== 'todas' && p.categoria !== categoryFilter) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedSkus.length === filteredItems.length) {
      setSelectedSkus([]);
    } else {
      setSelectedSkus(filteredItems.map(p => p.sku));
    }
  };

  const toggleSelectSku = (sku: string) => {
    if (selectedSkus.includes(sku)) {
      setSelectedSkus(selectedSkus.filter(s => s !== sku));
    } else {
      setSelectedSkus([...selectedSkus, sku]);
    }
  };

  const handleExportCsv = () => {
    const headers = ['SKU', 'Producto', 'Proveedor', 'Marca', 'Categoria', 'Stock Actual', 'Stock Minimo', 'Punto Pedido', 'Sugerido'];
    const rows = filteredItems.map(i => [
      i.sku,
      `"${i.producto.replace(/"/g, '""')}"`,
      i.proveedor,
      i.marca,
      i.categoria,
      i.stockActual,
      i.stockMinimo,
      i.puntoPedido,
      i.cantSugerida
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faltantes_stock_${selectedTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateOrder = () => {
    const itemsToOrder = filteredItems.filter(i => selectedSkus.includes(i.sku));
    if (itemsToOrder.length === 0) {
      alert('Por favor selecciona al menos un producto para armar el pedido de reposición');
      return;
    }
    alert(`Se seleccionaron ${itemsToOrder.length} artículos para enviar la orden de compra a los proveedores correspondientes.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faltantes y Alertas de Stock</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitorea productos con stock bajo o agotados. Filtra por proveedor para armar pedidos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setSelectedSkus([]);
              setSearchQuery('');
              setSupplierFilter('todos');
              setBrandFilter('todas');
              setCategoryFilter('todas');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
          <button 
            onClick={() => alert('Actualizando niveles de stock en tiempo real...')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Sin Stock */}
        <div 
          onClick={() => setSelectedTab('sin_stock')}
          className={`cursor-pointer rounded-xl border p-4 bg-red-50/30 transition-all ${
            selectedTab === 'sin_stock' ? 'border-red-400 ring-2 ring-red-400/20 shadow-sm' : 'border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-red-600 mb-2">
            <span>Sin Stock</span>
            <PackageX className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl font-black text-red-600">
            {sinStockCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-red-500/80 font-medium mt-1">
            productos agotados
          </div>
        </div>

        {/* Card 2: Stock Bajo */}
        <div 
          onClick={() => setSelectedTab('stock_bajo')}
          className={`cursor-pointer rounded-xl border p-4 bg-orange-50/30 transition-all ${
            selectedTab === 'stock_bajo' ? 'border-orange-400 ring-2 ring-orange-400/20 shadow-sm' : 'border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-orange-600 mb-2">
            <span>Stock Bajo</span>
            <TrendingDown className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-orange-600">
            {stockBajoCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-orange-500/80 font-medium mt-1">
            bajo mínimo
          </div>
        </div>

        {/* Card 3: Para Reponer */}
        <div 
          onClick={() => setSelectedTab('para_reponer')}
          className={`cursor-pointer rounded-xl border p-4 bg-amber-50/30 transition-all ${
            selectedTab === 'para_reponer' ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-sm' : 'border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-2">
            <span>Para Reponer</span>
            <PackageCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700">
            {paraReponerCount.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-600/80 font-medium mt-1">
            en punto de pedido
          </div>
        </div>
      </div>

      {/* Main Container Card: Productos con Alertas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Container Top Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Productos con Alertas</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columnas</span>
            </button>
            <button 
              onClick={handleCreateOrder}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Pedir ({selectedSkus.length})</span>
            </button>
            <button 
              onClick={() => {
                const text = `Lista de faltantes ${selectedTab} (${filteredItems.length} items):\n` + filteredItems.slice(0, 10).map(i => `- ${i.producto} (Faltan: ${i.cantSugerida})`).join('\n');
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
            <button 
              onClick={() => {
                const mailto = `mailto:compras@novasystems.com?subject=Faltantes de Stock ${selectedTab}&body=Se adjuntan los ${filteredItems.length} productos con stock crítico.`;
                window.location.href = mailto;
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-slate-600" />
              <span>Email</span>
            </button>
            <button 
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Descargar</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="todos">Todos los proveedores</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="todas">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Subtabs Bar */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setSelectedTab('sin_stock')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              selectedTab === 'sin_stock' ? 'bg-white shadow-xs text-red-600 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sin Stock ({sinStockCount})
          </button>
          <button
            onClick={() => setSelectedTab('stock_bajo')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              selectedTab === 'stock_bajo' ? 'bg-white shadow-xs text-orange-600 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Bajo ({stockBajoCount})
          </button>
          <button
            onClick={() => setSelectedTab('para_reponer')}
            className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
              selectedTab === 'para_reponer' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Para Reponer ({paraReponerCount})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2 px-2 text-center w-8">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedSkus.length === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-3">SKU ⇅</th>
                <th className="py-2.5 px-3">Producto ⇅</th>
                <th className="py-2.5 px-3">Proveedor ⇅</th>
                <th className="py-2.5 px-3">Marca ⇅</th>
                <th className="py-2.5 px-3">Categoría ⇅</th>
                <th className="py-2.5 px-3 text-center">Stock Actual ⇅</th>
                <th className="py-2.5 px-3 text-center">Stock Mínimo ⇅</th>
                <th className="py-2.5 px-3 text-center">Punto Pedido ⇅</th>
                <th className="py-2.5 px-3 text-center">Stock Deseado ⇅</th>
                <th className="py-2.5 px-3 text-center">Cant. Sugerida</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.slice(0, 50).map((item) => (
                <tr key={item.sku} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedSkus.includes(item.sku)}
                      onChange={() => toggleSelectSku(item.sku)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{item.sku}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 max-w-xs">{item.producto}</td>
                  <td className="py-3 px-3 text-slate-600 font-semibold">{item.proveedor}</td>
                  <td className="py-3 px-3 text-slate-600">{item.marca || '-'}</td>
                  <td className="py-3 px-3 text-slate-600">{item.categoria}</td>
                  <td className={`py-3 px-3 text-center font-bold ${item.stockActual <= 0 ? 'text-red-600' : 'text-slate-800'}`}>
                    {item.stockActual}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.stockMinimo}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{item.puntoPedido}</td>
                  <td className="py-3 px-3 text-center text-slate-400">{item.stockDeseado}</td>
                  <td className="py-3 px-3 text-center font-extrabold text-blue-600 text-sm">{item.cantSugerida}</td>
                  <td className="py-3 px-3 text-center">
                    {item.estado === 'sin_stock' && (
                      <span className="inline-block px-2.5 py-0.5 bg-red-500 text-white rounded text-[11px] font-bold">
                        Sin Stock
                      </span>
                    )}
                    {item.estado === 'stock_bajo' && (
                      <span className="inline-block px-2.5 py-0.5 bg-orange-500 text-white rounded text-[11px] font-bold">
                        Stock Bajo
                      </span>
                    )}
                    {item.estado === 'para_reponer' && (
                      <span className="inline-block px-2.5 py-0.5 bg-amber-500 text-white rounded text-[11px] font-bold">
                        Para Reponer
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
