import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Edit3, 
  Trash2, 
  Check, 
  ArrowLeftRight, 
  AlertCircle,
  Tag
} from 'lucide-react';
import { Product } from '../../types';

interface ModificacionMasivaModuleProps {
  products: Product[];
  onUpdateProducts?: (updated: Product[]) => void;
}

export const ModificacionMasivaModule: React.FC<ModificacionMasivaModuleProps> = ({ 
  products,
  onUpdateProducts 
}) => {
  const [activeTab, setActiveTab] = useState<'edicion_masiva' | 'por_referencia'>('edicion_masiva');

  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterCode, setFilterCode] = useState('');
  const [filterBrand, setFilterBrand] = useState('todas');
  const [filterCategory, setFilterCategory] = useState('todos');
  const [filterSupplier, setFilterSupplier] = useState('todos');
  const [filterOnlyActive, setFilterOnlyActive] = useState(true);
  const [filterWithStock, setFilterWithStock] = useState(false);
  const [filterZeroProfit, setFilterZeroProfit] = useState(false);

  // Selected products
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Change Attributes toggles & values
  const [enableBrand, setEnableBrand] = useState(false);
  const [valBrand, setValBrand] = useState('');

  const [enableRubro, setEnableRubro] = useState(false);
  const [valRubro, setValRubro] = useState('');

  const [enableSupplier, setEnableSupplier] = useState(false);
  const [valSupplier, setValSupplier] = useState('');

  const [enableIva, setEnableIva] = useState(false);
  const [valIva, setValIva] = useState('21');

  const [enableProfit, setEnableProfit] = useState(false);
  const [valProfit, setValProfit] = useState('60');

  const [enableProfitWholesale, setEnableProfitWholesale] = useState(false);
  const [valProfitWholesale, setValProfitWholesale] = useState('30');

  const [enableReorderPoint, setEnableReorderPoint] = useState(false);
  const [valReorderPoint, setValReorderPoint] = useState('10');

  const [enableMinStock, setEnableMinStock] = useState(false);
  const [valMinStock, setValMinStock] = useState('5');

  const [enableMaxStock, setEnableMaxStock] = useState(false);
  const [valMaxStock, setValMaxStock] = useState('100');

  const [enablePackageQty, setEnablePackageQty] = useState(false);
  const [valPackageQty, setValPackageQty] = useState('1');

  const [enableSalesQty, setEnableSalesQty] = useState(false);
  const [valSalesQty, setValSalesQty] = useState('1');

  const [enableStatus, setEnableStatus] = useState(false);
  const [valStatus, setValStatus] = useState('Activo');

  const [enableZeroPrice, setEnableZeroPrice] = useState(false);

  const [enableBuyCurrency, setEnableBuyCurrency] = useState(false);
  const [valBuyCurrency, setValBuyCurrency] = useState('ARS');

  const [enableSellCurrency, setEnableSellCurrency] = useState(false);
  const [valSellCurrency, setValSellCurrency] = useState('ARS');

  // Filter products list
  const filteredProducts = products.filter(p => {
    if (filterOnlyActive && p.active === false) return false;
    if (filterWithStock && (p.stock || 0) <= 0) return false;
    if (filterZeroProfit && (p.profitMarginPercent || 0) !== 0) return false;
    if (filterName && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterCode && !p.code.toLowerCase().includes(filterCode.toLowerCase())) return false;
    if (filterBrand !== 'todas' && p.brand !== filterBrand) return false;
    if (filterCategory !== 'todos' && p.category !== filterCategory) return false;
    if (filterSupplier !== 'todos' && p.supplierName !== filterSupplier) return false;
    return true;
  });

  const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const suppliers = Array.from(new Set(products.map(p => p.supplierName))).filter(Boolean);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApplyChanges = () => {
    if (selectedIds.length === 0) {
      alert('Seleccione al menos un producto de la tabla');
      return;
    }
    const changesCount = [
      enableBrand, enableRubro, enableSupplier, enableIva, enableProfit,
      enableProfitWholesale, enableReorderPoint, enableMinStock, enableMaxStock,
      enablePackageQty, enableSalesQty, enableStatus, enableZeroPrice,
      enableBuyCurrency, enableSellCurrency
    ].filter(Boolean).length;

    if (changesCount === 0) {
      alert('Seleccione al menos un atributo a cambiar marcando su casilla correspondiente.');
      return;
    }

    if (confirm(`¿Confirma aplicar estos cambios a ${selectedIds.length} producto(s)?`)) {
      alert(`¡Se actualizaron con éxito ${selectedIds.length} productos!`);
      setSelectedIds([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`¿Está seguro de eliminar de forma permanente ${selectedIds.length} productos?`)) {
      alert(`Se eliminaron ${selectedIds.length} productos.`);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Modificación Masiva</h1>
        <p className="text-xs text-slate-500 mt-0.5">Edita múltiples productos a la vez</p>
      </div>

      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('edicion_masiva')}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'edicion_masiva'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-700" />
          <span>Edición Masiva</span>
        </button>
        <button
          onClick={() => setActiveTab('por_referencia')}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
            activeTab === 'por_referencia'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-slate-500" />
          <span>Actualización por Referencia</span>
        </button>
      </div>

      {/* Container 1: Filtros de búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Filtros de búsqueda</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Código</label>
            <input
              type="text"
              placeholder="SKU o Barcode..."
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Marca</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="todas">Todas</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rubro</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="todos">Todos</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Proveedor</label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="todos">Todos</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-slate-700">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterOnlyActive}
              onChange={(e) => setFilterOnlyActive(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Activos</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterWithStock}
              onChange={(e) => setFilterWithStock(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Con Stock</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filterZeroProfit}
              onChange={(e) => setFilterZeroProfit(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Ganancia 0%</span>
          </label>
        </div>
      </div>

      {/* Container 2: Seleccione los productos y atributos a cambiar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Edit3 className="w-3.5 h-3.5 text-slate-700" />
          <span>Seleccione los productos y atributos a cambiar</span>
        </div>

        {/* 5-column grid of attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
          {/* Marca */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableBrand} onChange={(e) => setEnableBrand(e.target.checked)} className="rounded text-blue-600" />
              <span>Marca</span>
            </label>
            <select disabled={!enableBrand} value={valBrand} onChange={(e) => setValBrand(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">Seleccionar...</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Rubro */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableRubro} onChange={(e) => setEnableRubro(e.target.checked)} className="rounded text-blue-600" />
              <span>Rubro</span>
            </label>
            <select disabled={!enableRubro} value={valRubro} onChange={(e) => setValRubro(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Proveedor */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableSupplier} onChange={(e) => setEnableSupplier(e.target.checked)} className="rounded text-blue-600" />
              <span>Proveedor</span>
            </label>
            <select disabled={!enableSupplier} value={valSupplier} onChange={(e) => setValSupplier(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">Seleccionar...</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* IVA % */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableIva} onChange={(e) => setEnableIva(e.target.checked)} className="rounded text-blue-600" />
              <span>IVA %</span>
            </label>
            <select disabled={!enableIva} value={valIva} onChange={(e) => setValIva(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="21">21%</option>
              <option value="10.5">10.5%</option>
              <option value="0">0% Exento</option>
            </select>
          </div>

          {/* % Ganancia */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableProfit} onChange={(e) => setEnableProfit(e.target.checked)} className="rounded text-blue-600" />
              <span>% Ganancia</span>
            </label>
            <input disabled={!enableProfit} type="number" value={valProfit} onChange={(e) => setValProfit(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* % Gan. Mayorista */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableProfitWholesale} onChange={(e) => setEnableProfitWholesale(e.target.checked)} className="rounded text-blue-600" />
              <span>% Gan. Mayorista</span>
            </label>
            <input disabled={!enableProfitWholesale} type="number" value={valProfitWholesale} onChange={(e) => setValProfitWholesale(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* Punto Pedido */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableReorderPoint} onChange={(e) => setEnableReorderPoint(e.target.checked)} className="rounded text-blue-600" />
              <span>Punto Pedido</span>
            </label>
            <input disabled={!enableReorderPoint} type="number" value={valReorderPoint} onChange={(e) => setValReorderPoint(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* Stock Mínimo */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableMinStock} onChange={(e) => setEnableMinStock(e.target.checked)} className="rounded text-blue-600" />
              <span>Stock Mínimo</span>
            </label>
            <input disabled={!enableMinStock} type="number" value={valMinStock} onChange={(e) => setValMinStock(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* Stock Máximo */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableMaxStock} onChange={(e) => setEnableMaxStock(e.target.checked)} className="rounded text-blue-600" />
              <span>Stock Máximo</span>
            </label>
            <input disabled={!enableMaxStock} type="number" value={valMaxStock} onChange={(e) => setValMaxStock(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* Cant. por Bulto */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enablePackageQty} onChange={(e) => setEnablePackageQty(e.target.checked)} className="rounded text-blue-600" />
              <span>Cant. por Bulto</span>
            </label>
            <input disabled={!enablePackageQty} type="number" value={valPackageQty} onChange={(e) => setValPackageQty(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* Cant. x Venta */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableSalesQty} onChange={(e) => setEnableSalesQty(e.target.checked)} className="rounded text-blue-600" />
              <span>Cant. x Venta</span>
            </label>
            <input disabled={!enableSalesQty} type="number" value={valSalesQty} onChange={(e) => setValSalesQty(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400" />
          </div>

          {/* Estado */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableStatus} onChange={(e) => setEnableStatus(e.target.checked)} className="rounded text-blue-600" />
              <span>Estado</span>
            </label>
            <select disabled={!enableStatus} value={valStatus} onChange={(e) => setValStatus(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Precio -> $0 */}
          <div className="space-y-1 sm:col-span-2 md:col-span-1">
            <label className="flex items-center gap-1.5 font-semibold text-orange-600">
              <input type="checkbox" checked={enableZeroPrice} onChange={(e) => setEnableZeroPrice(e.target.checked)} className="rounded text-orange-600" />
              <span>Precio → $0</span>
            </label>
            <div className={`px-2 py-1.5 border rounded text-xs text-orange-700 bg-orange-50/50 ${enableZeroPrice ? 'border-orange-400' : 'border-orange-200'}`}>
              Pone precio en $0.00
            </div>
          </div>

          {/* Moneda Compra */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableBuyCurrency} onChange={(e) => setEnableBuyCurrency(e.target.checked)} className="rounded text-blue-600" />
              <span>Moneda Compra</span>
            </label>
            <select disabled={!enableBuyCurrency} value={valBuyCurrency} onChange={(e) => setValBuyCurrency(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (U$S)</option>
            </select>
          </div>

          {/* Moneda Venta */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 font-semibold text-slate-700">
              <input type="checkbox" checked={enableSellCurrency} onChange={(e) => setEnableSellCurrency(e.target.checked)} className="rounded text-blue-600" />
              <span>Moneda Venta</span>
            </label>
            <select disabled={!enableSellCurrency} value={valSellCurrency} onChange={(e) => setValSellCurrency(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs bg-white disabled:bg-slate-50 disabled:text-slate-400">
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (U$S)</option>
            </select>
          </div>
        </div>

        {/* Buttons Right */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar {selectedIds.length} productos</span>
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={selectedIds.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar a {selectedIds.length} productos</span>
          </button>
        </div>
      </div>

      {/* Container 3: Productos table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Productos ({filteredProducts.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 px-2 text-center w-8">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-2.5 px-3">Código ⇅</th>
                <th className="py-2.5 px-3">Nombre ⇅</th>
                <th className="py-2.5 px-3 text-center">Ganancia % ⇅</th>
                <th className="py-2.5 px-3 text-center">Stock ⇅</th>
                <th className="py-2.5 px-3 text-center">P.Pedido ⇅</th>
                <th className="py-2.5 px-3 text-center">St.Mín ⇅</th>
                <th className="py-2.5 px-3 text-center">St.Máx ⇅</th>
                <th className="py-2.5 px-3">Marca ⇅</th>
                <th className="py-2.5 px-3">Rubro ⇅</th>
                <th className="py-2.5 px-3">Proveedor ⇅</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.slice(0, 50).map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(prod.id)}
                      onChange={() => toggleSelectId(prod.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-700">{prod.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 max-w-xs">{prod.name}</td>
                  <td className="py-3 px-3 text-center text-slate-700">{prod.profitMarginPercent || 50}%</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{prod.stock || 0}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{prod.reorderPoint || 10}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{prod.minStock || 5}</td>
                  <td className="py-3 px-3 text-center text-slate-600">100</td>
                  <td className="py-3 px-3 text-slate-600">{prod.brand || '-'}</td>
                  <td className="py-3 px-3 text-slate-600">{prod.category || 'FERRETERIA'}</td>
                  <td className="py-3 px-3 text-slate-600">{prod.supplierName || 'CRUCECOR'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
