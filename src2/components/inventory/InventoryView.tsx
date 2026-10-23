import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Supplier } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { QuickOrderModal } from '../purchases/QuickOrderModal';
import {
  Search,
  Download,
  Upload,
  Calculator,
  Plus,
  Eye,
  EyeOff,
  Columns,
  Camera,
  Edit2,
  ShoppingCart,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  X,
  ArrowUpDown,
  Building,
  TrendingUp,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { store, currentUser, activeWarehouseId, setActiveWarehouseId, showToast, activeModule, setActiveModule } = useApp();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('active');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [onlyMissingStock, setOnlyMissingStock] = useState(false);

  // Active warehouse resolution
  const activeWarehouse = useMemo(() => {
    return store.warehouses.find((w) => w.id === activeWarehouseId) || store.warehouses.find((w) => w.isMain) || store.warehouses[0];
  }, [store.warehouses, activeWarehouseId]);

  const viewingWarehouse = useMemo(() => {
    if (selectedWarehouseFilter === 'all') return null;
    if (selectedWarehouseFilter === 'active') return activeWarehouse;
    return store.warehouses.find((w) => w.id === selectedWarehouseFilter) || activeWarehouse;
  }, [selectedWarehouseFilter, activeWarehouse, store.warehouses]);

  // Auto-respond to activeModule
  React.useEffect(() => {
    if (activeModule === 'missing_stock') {
      setOnlyMissingStock(true);
    } else if (activeModule === 'mass_price_update') {
      setIsMassPriceOpen(true);
    } else if (activeModule === 'import_products' || activeModule === 'import_stock') {
      setIsImportModalOpen(true);
    }
  }, [activeModule]);

  // Sorting
  const [sortField, setSortField] = useState<'code' | 'name' | 'brand' | 'supplierCode' | 'stock' | 'priceMinorista'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Multi-selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Columns visibility dropdown
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    description: true,
    brand: true,
    supplierCode: true,
    stock: true,
    price: true,
    actions: true,
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [orderModalProduct, setOrderModalProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(10);
  const [orderSupplierId, setOrderSupplierId] = useState<string>('');
  const [orderWarehouseId, setOrderWarehouseId] = useState<string>('wh-main');

  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);
  const [isMassPriceOpen, setIsMassPriceOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);

  // Recalculate prices state
  const [massPercentage, setMassPercentage] = useState<number>(15);
  const [massRubro, setMassRubro] = useState<string>('all');
  const [massBrand, setMassBrand] = useState<string>('all');
  const [massTargetField, setMassTargetField] = useState<'minorista' | 'cost' | 'all'>('minorista');

  // Extract unique brands and rubros for dropdowns
  const categoriesList = useMemo(() => store.categories || [], [store.categories]);
  const brandsList = useMemo(() => store.brands || [], [store.brands]);
  const suppliersList = useMemo(() => store.suppliers || [], [store.suppliers]);

  // Filtered & sorted products list
  const filteredProducts = useMemo(() => {
    return store.products.filter((p) => {
      // Inactive filter
      if (!showInactive && !p.active) return false;
      if (showInactive && p.active) return true; // when viewing inactives, show both or inactives

      // Missing / Low stock filter
      if (onlyMissingStock && p.stock > p.stockMin) return false;

      // Category / Rubro filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory && p.rubro !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'all') {
        const brandMatch =
          p.brandId === selectedBrand ||
          (p.brandName && p.brandName.toLowerCase() === selectedBrand.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase() === selectedBrand.toLowerCase());
        if (!brandMatch) return false;
      }

      // Supplier filter
      if (selectedSupplier !== 'all') {
        const supMatch =
          p.supplierId === selectedSupplier ||
          (p.supplierName && p.supplierName.toLowerCase().includes(selectedSupplier.toLowerCase()));
        if (!supMatch) return false;
      }

      // Search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.supplierCode && p.supplierCode.toLowerCase().includes(q)) ||
        (p.brandName && p.brandName.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      let aVal: any = a[sortField] ?? '';
      let bVal: any = b[sortField] ?? '';
      if (sortField === 'stock') {
        const whId = viewingWarehouse?.id;
        aVal = whId ? (a.stockByWarehouse?.[whId] ?? 0) : (a.stock || 0);
        bVal = whId ? (b.stockByWarehouse?.[whId] ?? 0) : (b.stock || 0);
      } else {
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [store.products, showInactive, selectedCategory, selectedBrand, selectedSupplier, searchTerm, sortField, sortDirection, viewingWarehouse]);

  // Multi-select toggle
  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSort = (field: 'code' | 'name' | 'brand' | 'supplierCode' | 'stock' | 'priceMinorista') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle active status (Desactivar / Activar)
  const handleToggleActive = (product: Product) => {
    const newStatus = store.toggleProductActive(product.id);
    showToast(
      `Producto ${product.name} ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
      newStatus ? 'success' : 'info'
    );
  };

  // Delete product (Eliminar)
  const handleConfirmDelete = () => {
    if (!deleteModalProduct) return;
    const prodName = deleteModalProduct.name;
    store.deleteProduct(deleteModalProduct.id);
    setSelectedIds((prev) => prev.filter((id) => id !== deleteModalProduct.id));
    setDeleteModalProduct(null);
    showToast(`Producto "${prodName}" eliminado correctamente.`, 'success');
  };

  // Quick Order (Pedir a Proveedor)
  const handleConfirmOrder = () => {
    if (!orderModalProduct) return;
    const sup = store.suppliers.find((s) => s.id === orderSupplierId) || store.suppliers[0];
    const warehouse = store.warehouses.find((w) => w.id === orderWarehouseId) || store.warehouses[0];

    const orderNumber = `OC-RAPIDA-${Date.now().toString().slice(-6)}`;
    const subtotal = orderModalProduct.costPrice * orderQuantity;
    const taxTotal = subtotal * (orderModalProduct.vatRate / 100);
    const total = subtotal + taxTotal;

    const newPO = {
      id: `po-${Date.now()}`,
      code: orderNumber,
      supplierId: sup?.id || 'sup-direct',
      supplierName: sup?.name || orderModalProduct.supplierName || 'Proveedor Mostrador',
      supplierTaxId: sup?.cuit || '30-71123456-9',
      date: new Date().toISOString(),
      items: [
        {
          productId: orderModalProduct.id,
          productCode: orderModalProduct.code,
          productName: orderModalProduct.name,
          quantity: orderQuantity,
          unitCost: orderModalProduct.costPrice,
          vatRate: orderModalProduct.vatRate,
          subtotal,
        },
      ],
      subtotal,
      taxTotal,
      total,
      status: 'pending' as const,
      paymentCondition: 'credit' as const,
      invoiceNumber: 'S/N - PEDIDO AUTOMÁTICO',
      warehouseId: warehouse.id,
      userId: currentUser.id,
      userName: currentUser.name,
    };

    store.purchaseOrders.unshift(newPO);
    showToast(
      `Pedido generado: ${orderQuantity} u. de "${orderModalProduct.name}" asignados a ${newPO.supplierName}`,
      'success'
    );
    setOrderModalProduct(null);
  };

  // Mass recalculate
  const handleRecalculatePrices = (e: React.FormEvent) => {
    e.preventDefault();
    const count = store.massUpdatePrices({
      percentage: massPercentage,
      categoryId: massRubro === 'all' ? undefined : massRubro,
      brandId: massBrand === 'all' ? undefined : massBrand,
      targetField: massTargetField,
    });
    showToast(`Se recalcularon los precios de ${count} productos (+${massPercentage}%)`, 'success');
    setIsMassPriceOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const listToExport = selectedIds.length > 0
      ? filteredProducts.filter((p) => selectedIds.includes(p.id))
      : filteredProducts;

    const headers = 'Codigo,Codigo_Barras,Descripcion,Marca,Cod_Proveedor,Stock,Costo,Precio_Minorista,Precio_Gremio,Precio_Mayorista,Estado\n';
    const rows = listToExport
      .map((p) => {
        const brand = p.brand || p.brandName || '-';
        const supCode = p.supplierCode || '-';
        const status = p.active ? 'Activo' : 'Inactivo';
        return `"${p.code}","${p.barcode}","${p.name}","${brand}","${supCode}",${p.stock},${p.costPrice},${p.priceMinorista},${p.priceGremio},${p.priceMayorista},"${status}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Inventario_Productos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast(`Exportados ${listToExport.length} productos a CSV`, 'success');
  };

  // Bulk actions
  const handleBulkDeactivate = () => {
    const count = store.bulkToggleActive(selectedIds, false);
    showToast(`${count} productos desactivados.`, 'info');
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`¿Está seguro de eliminar ${selectedIds.length} productos seleccionados?`)) {
      const count = store.bulkDeleteProducts(selectedIds);
      showToast(`${count} productos eliminados correctamente.`, 'success');
      setSelectedIds([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Top Header matching screenshot */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inventario</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Administra tus productos, stock y precios.
          </p>
        </div>

        {/* Top Actions: Exportar, Importar, Recalcular, + Agregar Producto */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar ({filteredProducts.length})</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importar</span>
          </button>

          <button
            onClick={() => setActiveModule('mass_price_update')}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/40 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Actualizar Precios</span>
          </button>

          <button
            onClick={() => setIsMassPriceOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/80 flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>Recalcular</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black flex items-center space-x-1.5 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar matching screenshot */}
      <div className="px-6 py-3.5 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center gap-3">
        {/* Dropdown 0: Almacén / Sucursal */}
        <div className="w-52">
          <select
            value={selectedWarehouseFilter}
            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
            className="w-full bg-slate-950 text-xs font-bold text-amber-300 rounded-xl px-3 py-2.5 border border-amber-500/50 focus:border-amber-400 focus:outline-none shadow-sm"
          >
            <option value="active">📍 Sucursal Activa ({activeWarehouse.name})</option>
            {store.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.isMain ? '🏢' : '🏪'} {w.name} {w.isMain ? '(Casa Central)' : ''}
              </option>
            ))}
            <option value="all">🌐 Todas las Sucursales (Consolidado)</option>
          </select>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descripción, código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 text-xs font-medium text-white rounded-xl pl-10 pr-4 py-2.5 border border-slate-700/80 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown 1: Todos los rubros */}
        <div className="w-40">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-300 rounded-xl px-3 py-2.5 border border-slate-700/80 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los rubros</option>
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropdown 2: Todas las marcas */}
        <div className="w-40">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-300 rounded-xl px-3 py-2.5 border border-slate-700/80 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todas las marcas</option>
            {brandsList.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
            <option value="MONCOTO">MONCOTO</option>
            <option value="SIFOLIMP">SIFOLIMP</option>
          </select>
        </div>

        {/* Dropdown 3: Todos los proveedores */}
        <div className="w-44">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-300 rounded-xl px-3 py-2.5 border border-slate-700/80 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Todos los proveedores</option>
            {suppliersList.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.name}
              </option>
            ))}
          </select>
        </div>

        {/* Blue Buscar Button */}
        <button
          onClick={() => {}}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscar</span>
        </button>

        {/* Ver inactivos Toggle Button */}
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
            showInactive
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          {showInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showInactive ? 'Ocultar inactivos' : 'Ver inactivos'}</span>
        </button>

        {/* Columnas Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Columnas</span>
          </button>

          {isColumnsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-30 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 block">Mostrar Columnas</span>
              {Object.entries(visibleColumns).map(([col, val]) => (
                <label
                  key={col}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-800 cursor-pointer text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={val}
                    onChange={() =>
                      setVisibleColumns((prev) => ({ ...prev, [col]: !prev[col as keyof typeof visibleColumns] }))
                    }
                    className="rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span className="capitalize">
                    {col === 'code'
                      ? 'Código'
                      : col === 'description'
                      ? 'Descripción'
                      : col === 'brand'
                      ? 'Marca'
                      : col === 'supplierCode'
                      ? 'Cód. Proveedor'
                      : col === 'stock'
                      ? 'Stock'
                      : col === 'price'
                      ? 'Precio'
                      : 'Acciones'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bulk selection action bar */}
      {selectedIds.length > 0 && (
        <div className="px-6 py-2.5 bg-blue-950/40 border-b border-blue-500/30 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-2">
            <span className="font-bold">{selectedIds.length} productos seleccionados</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkDeactivate}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700"
            >
              Desactivar seleccionados
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-lg border border-rose-500/40"
            >
              Eliminar seleccionados
            </button>
          </div>
        </div>
      )}

      {/* Main List Table matching screenshot */}
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider">
            <tr>
              <th className="p-3.5 pl-6 w-12">
                <button onClick={handleSelectAll} className="text-slate-400 hover:text-white cursor-pointer">
                  {selectedIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {visibleColumns.code && (
                <th
                  onClick={() => handleSort('code')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Código</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              )}

              {visibleColumns.description && (
                <th
                  onClick={() => handleSort('name')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors min-w-[280px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Descripción</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              )}

              {visibleColumns.brand && (
                <th
                  onClick={() => handleSort('brand')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Marca</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              )}

              {visibleColumns.supplierCode && (
                <th
                  onClick={() => handleSort('supplierCode')}
                  className="p-3.5 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Cód. Proveedor</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              )}

              {visibleColumns.stock && (
                <th
                  onClick={() => handleSort('stock')}
                  className="p-3.5 text-center cursor-pointer hover:text-white transition-colors min-w-[140px]"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>
                      Stock {viewingWarehouse ? `(${viewingWarehouse.isMain ? 'Casa Central' : viewingWarehouse.name})` : '(Total)'}
                    </span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              )}

              {visibleColumns.price && (
                <th
                  onClick={() => handleSort('priceMinorista')}
                  className="p-3.5 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Precio</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              )}

              {visibleColumns.actions && (
                <th className="p-3.5 pr-6 text-center">Acciones</th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500 text-sm">
                  No se encontraron productos que coincidan con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = selectedIds.includes(p.id);
                const brand = p.brand || p.brandName || '-';
                const supplierCode = p.supplierCode || '-';
                const isOutOfStock = p.stock <= 0;

                return (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-slate-900/60 ${
                      !p.active ? 'opacity-50 bg-slate-950/40' : ''
                    } ${isSelected ? 'bg-blue-950/20' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="p-3.5 pl-6">
                      <button
                        onClick={() => handleToggleSelect(p.id)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Código */}
                    {visibleColumns.code && (
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-white text-xs tracking-wide">{p.code}</span>
                          {p.barcode && (
                            <span className="font-mono text-[10px] text-slate-500">{p.barcode}</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Descripción */}
                    {visibleColumns.description && (
                      <td className="p-3.5">
                        <div className="flex items-center space-x-3">
                          {/* Thumbnail / Image preview */}
                          <div
                            onClick={() => setImageModalProduct(p)}
                            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-700 cursor-pointer overflow-hidden shrink-0"
                            title="Ver / Cambiar imagen"
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-600" />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="font-bold text-white text-xs uppercase tracking-tight">{p.name}</span>
                            {p.description && (
                              <span className="text-[10px] text-slate-400 line-clamp-1">{p.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Marca */}
                    {visibleColumns.brand && (
                      <td className="p-3.5 font-semibold text-slate-300 uppercase text-xs">
                        {brand}
                      </td>
                    )}

                    {/* Cód. Proveedor */}
                    {visibleColumns.supplierCode && (
                      <td className="p-3.5 font-mono text-slate-400 text-xs">
                        {supplierCode}
                      </td>
                    )}

                    {/* Stock */}
                    {visibleColumns.stock && (() => {
                      const primaryStock = viewingWarehouse
                        ? (p.stockByWarehouse?.[viewingWarehouse.id] ?? 0)
                        : (p.stock || 0);
                      const isOutOfStock = primaryStock <= 0;
                      const isLowStock = primaryStock <= (p.stockMin || 5);

                      return (
                        <td className="p-3.5 text-center">
                          <div className="flex flex-col items-center">
                            {/* Main stock for viewed warehouse */}
                            <span
                              className={`inline-flex items-center justify-center min-w-[32px] px-2.5 py-0.5 rounded-md font-mono font-black text-xs shadow-sm ${
                                isOutOfStock
                                  ? 'bg-rose-950/50 text-rose-400 border border-rose-500/40'
                                  : isLowStock
                                  ? 'bg-amber-950/50 text-amber-400 border border-amber-500/40'
                                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                              }`}
                              title={`Stock en ${viewingWarehouse ? viewingWarehouse.name : 'Todas las sucursales'}: ${primaryStock}`}
                            >
                              {primaryStock}
                            </span>

                            {/* Secondary Stock Breakdown across all warehouses */}
                            <div className="flex flex-wrap items-center justify-center gap-1 mt-1 text-[10px]">
                              {store.warehouses.map((w) => {
                                const isCurrentWh = viewingWarehouse && w.id === viewingWarehouse.id;
                                const wStock = p.stockByWarehouse?.[w.id] ?? 0;
                                const wLabel = w.isMain ? 'CC' : (w.code || w.name.slice(0, 3).toUpperCase());

                                return (
                                  <span
                                    key={w.id}
                                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono transition-all ${
                                      isCurrentWh
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                        : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:border-slate-700'
                                    }`}
                                    title={`${w.name}: ${wStock} ${p.unit || 'u'}`}
                                  >
                                    <span className="text-slate-400 font-sans">{wLabel}:</span>{' '}
                                    <strong className={wStock <= 0 ? 'text-rose-400' : 'text-slate-200'}>
                                      {wStock}
                                    </strong>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      );
                    })()}

                    {/* Precio */}
                    {visibleColumns.price && (
                      <td className="p-3.5 text-right font-mono font-black text-white text-xs">
                        ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* Acciones: Foto (📷), Editar (✏️), Pedir (🛒), Desactivar (🚫), Eliminar (🗑️) */}
                    {visibleColumns.actions && (
                      <td className="p-3.5 pr-6 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* 1. Foto / Imagen */}
                          <button
                            onClick={() => setImageModalProduct(p)}
                            title="Ver / Cambiar imagen"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Editar */}
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsAddModalOpen(true);
                            }}
                            title="Editar producto"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-950/30 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Pedir / Comprar */}
                          <button
                            onClick={() => setOrderModalProduct(p)}
                            title="Pedir a proveedor (Armar pedido de compra)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-950/30 transition-colors cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {/* 4. Desactivar / Activar */}
                          <button
                            onClick={() => handleToggleActive(p)}
                            title={p.active ? 'Desactivar producto' : 'Activar producto'}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              p.active
                                ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-950/30'
                                : 'text-amber-400 hover:text-emerald-400 hover:bg-emerald-950/30'
                            }`}
                          >
                            {p.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          {/* 5. Eliminar */}
                          <button
                            onClick={() => setDeleteModalProduct(p)}
                            title="Eliminar producto"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ==================================================== */}
      {/* MODAL: Pedir Producto (Pedido de Compra)              */}
      {/* ==================================================== */}
      <QuickOrderModal
        product={orderModalProduct}
        isOpen={!!orderModalProduct}
        onClose={() => setOrderModalProduct(null)}
        onOpenPurchaseOrders={() => setActiveModule('purchase_orders')}
      />

      {/* ==================================================== */}
      {/* MODAL: Eliminar Producto                             */}
      {/* ==================================================== */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Eliminar Producto</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente el producto{' '}
              <strong className="text-white">"{deleteModalProduct.name}"</strong> (Código:{' '}
              <span className="font-mono text-slate-200">{deleteModalProduct.code}</span>)?
            </p>

            <div className="flex space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModalProduct(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Recalcular Precios                            */}
      {/* ==================================================== */}
      {isMassPriceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Recalcular / Aumento Masivo de Precios</h3>
              </div>
              <button onClick={() => setIsMassPriceOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecalculatePrices} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Porcentaje de Ajuste (+% Aumento o -% Descuento):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={massPercentage}
                    onChange={(e) => setMassPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-amber-400 font-mono font-bold text-base rounded-lg p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Filtrar por Rubro / Categoría:</label>
                <select
                  value={massRubro}
                  onChange={(e) => setMassRubro(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700"
                >
                  <option value="all">Todos los Rubros</option>
                  {store.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Filtrar por Marca:</label>
                <select
                  value={massBrand}
                  onChange={(e) => setMassBrand(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700"
                >
                  <option value="all">Todas las Marcas</option>
                  {store.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Aplicar sobre:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMassTargetField('minorista')}
                    className={`py-2 rounded-lg font-bold text-center border ${
                      massTargetField === 'minorista'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => setMassTargetField('cost')}
                    className={`py-2 rounded-lg font-bold text-center border ${
                      massTargetField === 'cost'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    Costo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMassTargetField('all')}
                    className={`py-2 rounded-lg font-bold text-center border ${
                      massTargetField === 'all'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-950 text-slate-300 border-slate-700'
                    }`}
                  >
                    Ambos
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMassPriceOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow"
                >
                  Aplicar Aumento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Ver / Cambiar Imagen                         */}
      {/* ==================================================== */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <span>Imagen del Producto</span>
              </h3>
              <button onClick={() => setImageModalProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="w-full h-48 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                {imageModalProduct.imageUrl ? (
                  <img
                    src={imageModalProduct.imageUrl}
                    alt={imageModalProduct.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-500 space-y-1">
                    <ImageIcon className="w-8 h-8 mx-auto" />
                    <p>Sin imagen cargada</p>
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">URL de la imagen:</label>
                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto.jpg"
                  defaultValue={imageModalProduct.imageUrl || ''}
                  id="productImageUrlInput"
                  className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700 text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setImageModalProduct(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('productImageUrlInput') as HTMLInputElement;
                  if (input) {
                    imageModalProduct.imageUrl = input.value;
                    store.saveProduct(imageModalProduct);
                    showToast('Imagen actualizada correctamente', 'success');
                    setImageModalProduct(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow"
              >
                Guardar Imagen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Importar Productos                           */}
      {/* ==================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-black text-white">Importar Lista de Productos</h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Selecciona un archivo Excel (.xlsx) o CSV con las columnas: Código, Código de Barras, Descripción, Marca, Cód. Proveedor, Stock, Costo, Precio de Venta.
              </p>

              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-950">
                <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <span className="font-bold text-white block">Haz clic para subir o arrastra el archivo aquí</span>
                <span className="text-[10px] text-slate-500">Soporta .CSV y .XLSX</span>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={() => {
                    showToast('Archivo importado y procesado exitosamente.', 'success');
                    setIsImportModalOpen(false);
                  }}
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 text-slate-300 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Plantilla Completa de Artículo (5 Pestañas)   */}
      {/* ==================================================== */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        onSaved={() => {
          setEditingProduct(null);
        }}
      />
    </div>
  );
};
