import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Layers,
  Search,
  CheckSquare,
  Square,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  DollarSign,
  Tag,
  Building,
  Package,
  Check
} from 'lucide-react';

export const MassModificationView: React.FC = () => {
  const { store, user, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'masiva' | 'referencia'>('masiva');

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterRubro, setFilterRubro] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterActiveStatus, setFilterActiveStatus] = useState<boolean | null>(true);
  const [filterHasStock, setFilterHasStock] = useState(false);

  // Selected products for mass modification
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mass update fields form state (matching the screenshot)
  const [updateFields, setUpdateFields] = useState({
    brand: '',
    rubro: '',
    supplier: '',
    ivaPercent: '',
    profitMarginMinorista: '',
    profitMarginMayorista: '',
    puntoPedido: '',
    stockMinimo: '',
    stockMaximo: '',
    gananciaBulto: '',
    cantidadBulto: '',
    estado: '',
    precioFijo: '',
    monedaCompra: '',
    monedaVenta: '',
  });

  // Active fields toggles (which fields are checked to apply)
  const [activeFieldsToggle, setActiveFieldsToggle] = useState<Record<string, boolean>>({
    brand: false,
    rubro: false,
    supplier: false,
    ivaPercent: false,
    profitMarginMinorista: false,
    profitMarginMayorista: false,
    puntoPedido: false,
    stockMinimo: false,
    stockMaximo: false,
    gananciaBulto: false,
    cantidadBulto: false,
    estado: false,
    precioFijo: false,
    monedaCompra: false,
    monedaVenta: false,
  });

  // Reference update state (Actualización por Referencia)
  const [refBrand, setRefBrand] = useState('all');
  const [refRubro, setRefRubro] = useState('all');
  const [refPercentage, setRefPercentage] = useState<number>(10);
  const [refTargetField, setRefTargetField] = useState<'cost' | 'minorista' | 'mayorista'>('cost');

  const products = store.products || [];

  // Filter products based on search & filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchText = (p.name + ' ' + p.code + ' ' + (p.barcode || '')).toLowerCase();
      if (searchTerm && !matchText.includes(searchTerm.toLowerCase())) return false;
      if (filterBrand !== 'all' && p.brand !== filterBrand) return false;
      if (filterRubro !== 'all' && p.rubro !== filterRubro) return false;
      if (filterSupplier !== 'all' && p.supplierId !== filterSupplier) return false;
      if (filterActiveStatus !== null && p.isActive !== filterActiveStatus) return false;
      if (filterHasStock && (p.stock || 0) <= 0) return false;
      return true;
    });
  }, [products, searchTerm, filterBrand, filterRubro, filterSupplier, filterActiveStatus, filterHasStock]);

  const allSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApplyMassModification = () => {
    if (selectedIds.length === 0) {
      showToast('Por favor selecciona al menos un producto para modificar.', 'error');
      return;
    }

    const updates: Partial<Product> = {};
    if (activeFieldsToggle.brand && updateFields.brand) updates.brand = updateFields.brand;
    if (activeFieldsToggle.rubro && updateFields.rubro) updates.rubro = updateFields.rubro;
    if (activeFieldsToggle.supplier && updateFields.supplier) updates.supplierId = updateFields.supplier;
    if (activeFieldsToggle.ivaPercent && updateFields.ivaPercent !== '') updates.vatRate = Number(updateFields.ivaPercent) as any;
    if (activeFieldsToggle.profitMarginMinorista && updateFields.profitMarginMinorista !== '') updates.marginPercent = Number(updateFields.profitMarginMinorista);
    if (activeFieldsToggle.profitMarginMayorista && updateFields.profitMarginMayorista !== '') updates.marginWholesalePercent = Number(updateFields.profitMarginMayorista);
    if (activeFieldsToggle.puntoPedido && updateFields.puntoPedido !== '') updates.reorderPoint = Number(updateFields.puntoPedido);
    if (activeFieldsToggle.stockMinimo && updateFields.stockMinimo !== '') updates.stockMin = Number(updateFields.stockMinimo);
    if (activeFieldsToggle.stockMaximo && updateFields.stockMaximo !== '') (updates as any).stockMaximo = Number(updateFields.stockMaximo);
    if (activeFieldsToggle.estado && updateFields.estado !== '') updates.active = updateFields.estado === 'activo';

    let count = 0;
    selectedIds.forEach((id) => {
      const prod = products.find((p) => p.id === id);
      if (prod) {
        const updated = { ...prod, ...updates };
        if (activeFieldsToggle.precioFijo && updateFields.precioFijo !== '') {
          const newPrice = Number(updateFields.precioFijo);
          updated.priceMinorista = newPrice;
          updated.priceMayorista = newPrice;
        }
        store.updateProduct(id, updated);
        count++;
      }
    });

    showToast(`Modificación masiva aplicada exitosamente a ${count} productos.`, 'success');
    setSelectedIds([]);
  };

  const handleApplyReferenceUpdate = () => {
    let count = 0;
    products.forEach((p) => {
      const matchBrand = refBrand === 'all' || p.brand === refBrand;
      const matchRubro = refRubro === 'all' || p.rubro === refRubro;
      if (matchBrand && matchRubro) {
        const updated = { ...p };
        const multiplier = 1 + refPercentage / 100;
        if (refTargetField === 'cost') {
          updated.costPrice = Math.round((updated.costPrice || 0) * multiplier * 100) / 100;
          updated.priceMinorista = Math.round(updated.costPrice * (1 + (updated.profitMarginMinorista || 35) / 100) * 100) / 100;
        } else if (refTargetField === 'minorista') {
          updated.priceMinorista = Math.round((updated.priceMinorista || 0) * multiplier * 100) / 100;
        } else if (refTargetField === 'mayorista') {
          updated.priceMayorista = Math.round((updated.priceMayorista || 0) * multiplier * 100) / 100;
        }
        store.updateProduct(p.id, updated);
        count++;
      }
    });

    showToast(`Actualización por referencia aplicada a ${count} productos correctamente.`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <Layers className="w-7 h-7 text-amber-400" />
            <span>Modificación Masiva de Productos</span>
          </h1>
          <p className="text-sm text-slate-400">
            Edita atributos y precios de múltiples productos simultáneamente o mediante reglas de actualización por referencia.
          </p>
        </div>

        {/* Subtabs matching screenshot */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('masiva')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'masiva'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Edición Masiva
          </button>
          <button
            onClick={() => setActiveSubTab('referencia')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'referencia'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Actualización por Referencia
          </button>
        </div>
      </div>

      {activeSubTab === 'masiva' ? (
        <>
          {/* SECTION 1: FILTROS DE BÚSQUEDA */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Search className="w-4 h-4" />
              <span>Filtros de Búsqueda</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Código / SKU</label>
                <input
                  type="text"
                  placeholder="SKU o Código..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Marca</label>
                <select
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todas</option>
                  {Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Rubro</label>
                <select
                  value={filterRubro}
                  onChange={(e) => setFilterRubro(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todos</option>
                  {Array.from(new Set(products.map((p) => p.rubro).filter(Boolean))).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Proveedor</label>
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="all">Todos</option>
                  {store.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end space-x-4 pb-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={filterActiveStatus === true}
                    onChange={(e) => setFilterActiveStatus(e.target.checked ? true : null)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Activos</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={filterHasStock}
                    onChange={(e) => setFilterHasStock(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Con Stock</span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2: SELECCIONE LOS PRODUCTOS Y ATRIBUTOS A CAMBIAR */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Sliders className="w-4 h-4" />
                <span>Seleccione los productos y atributos a cambiar</span>
              </div>
              <span className="text-xs text-slate-400">
                Seleccionados: <strong className="text-white">{selectedIds.length}</strong> de {filteredProducts.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Field 1: Marca */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.brand}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, brand: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">Marca</span>
                </div>
                <input
                  type="text"
                  disabled={!activeFieldsToggle.brand}
                  value={updateFields.brand}
                  onChange={(e) => setUpdateFields({ ...updateFields, brand: e.target.value })}
                  placeholder="Nueva marca..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 2: Rubro */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.rubro}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, rubro: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">Rubro</span>
                </div>
                <input
                  type="text"
                  disabled={!activeFieldsToggle.rubro}
                  value={updateFields.rubro}
                  onChange={(e) => setUpdateFields({ ...updateFields, rubro: e.target.value })}
                  placeholder="Nuevo rubro..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 3: Proveedor */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.supplier}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, supplier: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">Proveedor</span>
                </div>
                <select
                  disabled={!activeFieldsToggle.supplier}
                  value={updateFields.supplier}
                  onChange={(e) => setUpdateFields({ ...updateFields, supplier: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                >
                  <option value="">Seleccionar...</option>
                  {store.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Field 4: IVA % */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.ivaPercent}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, ivaPercent: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">IVA %</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.ivaPercent}
                  value={updateFields.ivaPercent}
                  onChange={(e) => setUpdateFields({ ...updateFields, ivaPercent: e.target.value })}
                  placeholder="21"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 5: % Gan. Minorista */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.profitMarginMinorista}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, profitMarginMinorista: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">% Gan. Minorista</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.profitMarginMinorista}
                  value={updateFields.profitMarginMinorista}
                  onChange={(e) => setUpdateFields({ ...updateFields, profitMarginMinorista: e.target.value })}
                  placeholder="35"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 6: % Gan. Mayorista */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.profitMarginMayorista}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, profitMarginMayorista: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">% Gan. Mayorista</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.profitMarginMayorista}
                  value={updateFields.profitMarginMayorista}
                  onChange={(e) => setUpdateFields({ ...updateFields, profitMarginMayorista: e.target.value })}
                  placeholder="20"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 7: Punto Pedido */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.puntoPedido}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, puntoPedido: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">Punto Pedido</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.puntoPedido}
                  value={updateFields.puntoPedido}
                  onChange={(e) => setUpdateFields({ ...updateFields, puntoPedido: e.target.value })}
                  placeholder="10"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 8: Stock Mínimo */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.stockMinimo}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, stockMinimo: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">Stock Mínimo</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.stockMinimo}
                  value={updateFields.stockMinimo}
                  onChange={(e) => setUpdateFields({ ...updateFields, stockMinimo: e.target.value })}
                  placeholder="5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 9: Stock Máximo */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.stockMaximo}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, stockMaximo: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200">Stock Máximo</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.stockMaximo}
                  value={updateFields.stockMaximo}
                  onChange={(e) => setUpdateFields({ ...updateFields, stockMaximo: e.target.value })}
                  placeholder="100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>

              {/* Field 10: Precio Fijo / Actualización de Precio */}
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/40 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFieldsToggle.precioFijo}
                    onChange={(e) => setActiveFieldsToggle({ ...activeFieldsToggle, precioFijo: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500"
                  />
                  <span className="text-xs font-semibold text-amber-400">Precio Fijo ($)</span>
                </div>
                <input
                  type="number"
                  disabled={!activeFieldsToggle.precioFijo}
                  value={updateFields.precioFijo}
                  onChange={(e) => setUpdateFields({ ...updateFields, precioFijo: e.target.value })}
                  placeholder="Poner precio en bloc..."
                  className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedIds([]);
                  showToast('Selección eliminada.', 'info');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Eliminar Selección
              </button>
              <button
                onClick={handleApplyMassModification}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar a Selección ({selectedIds.length})</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: TABLA DE PRODUCTOS */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden space-y-4">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Productos ({filteredProducts.length})
              </span>
              <span className="text-xs text-slate-400">
                Mostrando lista de artículos filtrados. Usá los filtros para reducir los resultados.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-amber-400">
                        {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="p-3">Código</th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">P. Pedido</th>
                    <th className="p-3">St. Mín</th>
                    <th className="p-3">St. Máx</th>
                    <th className="p-3">Marca</th>
                    <th className="p-3">Rubro</th>
                    <th className="p-3">Precio Minorista</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((p) => {
                    const isSelected = selectedIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggleSelectOne(p.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-800/40'}`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelectOne(p.id)} className="text-slate-400 hover:text-amber-400">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="p-3 font-bold text-amber-400">{p.code}</td>
                        <td className="p-3 text-white font-medium">{p.name}</td>
                        <td className="p-3 font-semibold text-emerald-400">{p.stock || 0}</td>
                        <td className="p-3 text-slate-300">{p.puntoPedido || 10}</td>
                        <td className="p-3 text-slate-300">{p.stockMinimo || 5}</td>
                        <td className="p-3 text-slate-300">{p.stockMaximo || 100}</td>
                        <td className="p-3 text-slate-300">{p.brand || '-'}</td>
                        <td className="p-3 text-slate-300">{p.rubro || '-'}</td>
                        <td className="p-3 font-bold text-white">${(p.priceMinorista || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No se encontraron productos con los filtros especificados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* SUBTAB: ACTUALIZACIÓN POR REFERENCIA */
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto w-full">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Actualización Masiva por Referencia o Porcentaje</h3>
              <p className="text-xs text-slate-400">Aplica incrementos o reducciones porcentuales sobre marcas o rubros enteros.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Filtrar por Marca (Opcional)</label>
              <select
                value={refBrand}
                onChange={(e) => setRefBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todas las Marcas</option>
                {Array.from(new Set(products.map((p) => p.brand).filter(Boolean))).map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Filtrar por Rubro (Opcional)</label>
              <select
                value={refRubro}
                onChange={(e) => setRefRubro(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todos los Rubros</option>
                {Array.from(new Set(products.map((p) => p.rubro).filter(Boolean))).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Campo a Actualizar</label>
              <select
                value={refTargetField}
                onChange={(e) => setRefTargetField(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="cost">Costo (y recalcular precios de venta)</option>
                <option value="minorista">Precio Minorista Directo</option>
                <option value="mayorista">Precio Mayorista Directo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Porcentaje de Ajuste (%) [Ej: 15 para +15%, -5 para -5%]</label>
              <input
                type="number"
                value={refPercentage}
                onChange={(e) => setRefPercentage(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleApplyReferenceUpdate}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Ejecutar Actualización por Referencia</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
