import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Download, 
  Upload, 
  Calculator, 
  Plus, 
  Eye, 
  EyeOff, 
  SlidersHorizontal, 
  Camera, 
  Edit3, 
  ShoppingCart, 
  Ban, 
  Trash2, 
  Check, 
  CheckCircle2, 
  X, 
  ArrowUpDown, 
  AlertTriangle,
  Package,
  Layers,
  Image as ImageIcon,
  Truck,
  Send
} from 'lucide-react';
import { Product, Supplier, PurchaseOrderItem } from '../types';
import { ProductFormModal } from './ProductFormModal';

interface InventoryModuleProps {
  products: Product[];
  suppliers?: Supplier[];
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSendToPos?: (product: Product) => void;
  onBulkRecalculate?: () => void;
  activeDraft?: PurchaseOrderItem[];
  activeDraftSupplierId?: string | null;
  onAddToSupplierOrder?: (item: PurchaseOrderItem, supplierId: string) => void;
  onOpenSupplierOrders?: () => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  products,
  suppliers = [],
  onSaveProduct,
  onDeleteProduct,
  onSendToPos,
  onBulkRecalculate,
  activeDraft = [],
  activeDraftSupplierId = null,
  onAddToSupplierOrder,
  onOpenSupplierOrders
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'active' | 'inactive' | 'with_stock' | 'no_stock'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [stockConditionFilter, setStockConditionFilter] = useState<'all' | 'positive' | 'zero' | 'negative'>('all');
  const [showOnlyInactive, setShowOnlyInactive] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<'code' | 'name' | 'brand' | 'supplierCode' | 'stock' | 'price'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Checkbox selections
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Columns visibility toggle modal / popover
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    description: true,
    brand: true,
    supplierCode: true,
    stock: true,
    price: true,
    actions: true
  });

  // Modal State for New / Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Dedicated Image Management Modal State (Acción 1: Ver/Cargar Imagen)
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);
  const [imageInputVal, setImageInputVal] = useState<string>('');
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);

  // Dedicated Product Deletion Confirmation Modal State (Acción 5: Borrar)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Success Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Accion 1: Abrir modal de imagen (ver o cargar)
  const handleOpenImageModal = (prod: Product) => {
    setImageModalProduct(prod);
    setImageInputVal(prod.imageUrl || '');
  };

  // Accion 1: Guardar nueva imagen o eliminarla
  const handleSaveProductImage = async () => {
    if (!imageModalProduct) return;
    setIsSavingImage(true);
    try {
      await onSaveProduct({
        ...imageModalProduct,
        imageUrl: imageInputVal.trim()
      });
      showToast(imageInputVal.trim() ? `Foto actualizada para ${imageModalProduct.code}` : `Foto eliminada para ${imageModalProduct.code}`);
      setImageModalProduct(null);
    } catch (err) {
      console.error(err);
      showToast('Error al guardar la foto del producto');
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen es superior a 3MB. Por favor seleccione una imagen más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageInputVal(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Accion 5: Confirmar eliminación permanente
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProduct(productToDelete.id);
      showToast(`Producto ${productToDelete.code} eliminado correctamente.`);
      setProductToDelete(null);
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar el producto');
    } finally {
      setIsDeleting(false);
    }
  };

  // Supplier Order Quick Modal State ("Pedir a Proveedor")
  const [orderModalProduct, setOrderModalProduct] = useState<Product | null>(null);
  const [orderModalSupplierId, setOrderModalSupplierId] = useState<string>('');
  const [orderModalQuantity, setOrderModalQuantity] = useState<number>(10);
  const [orderModalCost, setOrderModalCost] = useState<number>(0);

  const activeDraftSupplierName = useMemo(() => {
    if (!activeDraftSupplierId) return null;
    return suppliers.find(s => s.id === activeDraftSupplierId)?.businessName || null;
  }, [suppliers, activeDraftSupplierId]);

  const handleOpenOrderModal = (prod: Product) => {
    setOrderModalProduct(prod);
    let matchSupId = activeDraftSupplierId || '';
    if (!matchSupId && prod.supplierId) {
      matchSupId = prod.supplierId;
    } else if (!matchSupId && prod.supplierName) {
      const found = suppliers.find(s => s.businessName.toLowerCase() === prod.supplierName?.toLowerCase());
      if (found) matchSupId = found.id;
    }
    if (!matchSupId && suppliers.length > 0) {
      matchSupId = suppliers[0].id;
    }
    setOrderModalSupplierId(matchSupId);

    const cost = prod.costListWithoutIva || prod.unitCost || 0;
    setOrderModalCost(cost);

    const needed = (prod.minStock || 0) > prod.stock ? (prod.minStock || 0) - prod.stock : 10;
    setOrderModalQuantity(Math.max(1, needed));
  };

  const handleConfirmAddToSupplierOrder = (andNavigate: boolean = false) => {
    if (!orderModalProduct) return;
    const supId = orderModalSupplierId || suppliers[0]?.id || '';
    const item: PurchaseOrderItem = {
      productId: orderModalProduct.id,
      productCode: orderModalProduct.code,
      supplierCode: orderModalProduct.supplierCode || '',
      productName: orderModalProduct.name,
      presentation: orderModalProduct.presentation,
      unit: orderModalProduct.primaryUnit || 'Unidad',
      quantity: Math.max(1, orderModalQuantity),
      unitCost: Number(orderModalCost) || 0,
      subtotal: Math.max(1, orderModalQuantity) * (Number(orderModalCost) || 0)
    };

    if (onAddToSupplierOrder) {
      onAddToSupplierOrder(item, supId);
      const supName = suppliers.find(s => s.id === supId)?.businessName || 'Proveedor';
      showToast(`Producto ${orderModalProduct.code} agregado al pedido para ${supName}.`);
    }

    setOrderModalProduct(null);

    if (andNavigate && onOpenSupplierOrders) {
      onOpenSupplierOrders();
    }
  };

  // Derive unique categories and brands from products list
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const brandsList = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  // Handle Sorting
  const handleSort = (field: 'code' | 'name' | 'brand' | 'supplierCode' | 'stock' | 'price') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.supplierCode && p.supplierCode.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.alternativeCodes && p.alternativeCodes.some(c => c.toLowerCase().includes(q)));

      // Status filter
      if (showOnlyInactive) {
        if (p.active !== false) return false;
      } else {
        if (productStatusFilter === 'active' && p.active === false) return false;
        if (productStatusFilter === 'inactive' && p.active !== false) return false;
        if (productStatusFilter === 'with_stock' && p.stock <= 0) return false;
        if (productStatusFilter === 'no_stock' && p.stock > 0) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // Brand filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) return false;

      // Supplier filter
      if (selectedSupplier !== 'all' && p.supplierName !== selectedSupplier) return false;

      // Stock Condition filter
      if (stockConditionFilter === 'positive' && p.stock <= 0) return false;
      if (stockConditionFilter === 'zero' && p.stock !== 0) return false;
      if (stockConditionFilter === 'negative' && p.stock >= 0) return false;

      return matchesSearch;
    }).sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'code':
          valA = a.code || '';
          valB = b.code || '';
          break;
        case 'name':
          valA = a.name || '';
          valB = b.name || '';
          break;
        case 'brand':
          valA = a.brand || '';
          valB = b.brand || '';
          break;
        case 'supplierCode':
          valA = a.supplierCode || '';
          valB = b.supplierCode || '';
          break;
        case 'stock':
          valA = a.stock || 0;
          valB = b.stock || 0;
          break;
        case 'price':
          valA = a.priceRetail || a.priceWholesale || 0;
          valB = b.priceRetail || b.priceWholesale || 0;
          break;
      }

      if (typeof valA === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }, [
    products, 
    searchQuery, 
    productStatusFilter, 
    selectedCategory, 
    selectedBrand, 
    selectedSupplier, 
    stockConditionFilter, 
    showOnlyInactive, 
    sortField, 
    sortAsc
  ]);

  // Checkbox select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    const updated = new Set(selectedProductIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedProductIds(updated);
  };

  // EXPORT TO EXCEL (.xlsx)
  const handleExportToExcel = () => {
    if (filteredProducts.length === 0) {
      alert('No hay productos para exportar con los filtros seleccionados.');
      return;
    }

    const data = filteredProducts.map(p => ({
      'Código': p.code,
      'Descripción / Producto': p.name,
      'Marca': p.brand || 'Colorear',
      'Cód. Proveedor': p.supplierCode || '-',
      'Rubro / Categoría': p.category,
      'Unidad / Presentación': p.presentation,
      'Stock Total': p.stock,
      'Mínimo Alerta': p.minStock,
      'Punto de Pedido': p.reorderPoint || 10,
      'Ubicación': p.location || '-',
      'Precio Contado ($)': p.priceRetail || 0,
      'Precio Mayorista ($)': p.priceWholesale || 0,
      'Precio Distribuidor ($)': p.priceDistributor || 0,
      'Costo Unitario ($)': p.unitCost || 0,
      'Estado': p.active === false ? 'Inactivo' : 'Activo'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Inventario_Precios_Stock_${dateStr}.xlsx`);
    showToast(`Se exportaron ${filteredProducts.length} productos a Excel.`);
  };

  // Toggle active/inactive for product
  const handleToggleActiveProduct = async (product: Product) => {
    const newStatus = product.active === false ? true : false;
    await onSaveProduct({
      ...product,
      active: newStatus
    });
    showToast(`Producto ${product.code} marcado como ${newStatus ? 'Activo' : 'Inactivo'}.`);
  };

  return (
    <div className="space-y-4 font-sans select-none pb-12">
      
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP TITLE & MASTER ACTION BUTTONS (Matches Image Exactly) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra tus productos, stock y precios.
          </p>
        </div>

        {/* Buttons on the right */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Exportar (X) Button */}
          <button
            onClick={handleExportToExcel}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar ({filteredProducts.length})</span>
          </button>

          {/* Importar */}
          <button
            onClick={() => alert('Función de Importación masiva desde archivo Excel disponible en administración de datos.')}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Importar</span>
          </button>

          {/* Recalcular */}
          <button
            onClick={() => {
              if (onBulkRecalculate) {
                onBulkRecalculate();
              }
              showToast('Precios y costos recalculados correctamente.');
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-300 shadow-2xs transition-colors"
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>Recalcular</span>
          </button>

          {/* Pedidos Proveedor (Cart) Button */}
          {onOpenSupplierOrders && (
            <button
              onClick={onOpenSupplierOrders}
              className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-xl border transition-colors shadow-2xs ${
                activeDraft.length > 0
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Abrir pedidos a proveedores"
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Pedidos Proveedor {activeDraft.length > 0 ? `(${activeDraft.length})` : ''}</span>
            </button>
          )}

          {/* + Agregar Producto (Orange Button from Screenshot) */}
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#ea580c] hover:bg-orange-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Active Draft Supplier Order Banner */}
      {activeDraft.length > 0 && onOpenSupplierOrders && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-950 block">
                Pedido a Proveedor en armado: {activeDraft.length} {activeDraft.length === 1 ? 'producto' : 'productos'} en el carrito
              </span>
              <span className="text-amber-800 text-[11px]">
                {activeDraftSupplierName ? `Proveedor: ${activeDraftSupplierName} • ` : ''}
                Subtotal: ${activeDraft.reduce((s, i) => s + (i.subtotal || 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <button
            onClick={onOpenSupplierOrders}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Ver y Cerrar Pedido</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* FILTER BAR (Matches Image Layout Exactly) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        {/* Search input with search icon */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="GUANTE"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-semibold text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Dropdown 1: Todos los productos */}
        <select
          value={productStatusFilter}
          onChange={e => setProductStatusFilter(e.target.value as any)}
          className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-medium text-slate-700"
        >
          <option value="all">Todos los productos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="with_stock">Con stock</option>
          <option value="no_stock">Sin stock</option>
        </select>

        {/* Dropdown 2: Todos los rubros */}
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-medium text-slate-700 max-w-[150px] truncate"
        >
          <option value="all">Todos los ru...</option>
          {categoriesList.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Dropdown 3: Todas las marcas */}
        <select
          value={selectedBrand}
          onChange={e => setSelectedBrand(e.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-medium text-slate-700 max-w-[140px] truncate"
        >
          <option value="all">Todas las m...</option>
          {brandsList.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Dropdown 4: Todos los proveedores */}
        <select
          value={selectedSupplier}
          onChange={e => setSelectedSupplier(e.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-medium text-slate-700 max-w-[140px] truncate"
        >
          <option value="all">Todos los pr...</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.businessName}>{s.businessName}</option>
          ))}
        </select>

        {/* Dropdown 5: Stock total · todos los... */}
        <select
          value={stockConditionFilter}
          onChange={e => setStockConditionFilter(e.target.value as any)}
          className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-medium text-slate-700 max-w-[160px] truncate"
        >
          <option value="all">Stock total · todos los...</option>
          <option value="positive">Stock positivo (&gt;0)</option>
          <option value="zero">Stock cero (=0)</option>
          <option value="negative">Stock negativo (&lt;0)</option>
        </select>

        {/* Button: Buscar (Blue) */}
        <button
          type="button"
          onClick={() => {}}
          className="bg-[#0256b3] hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscar</span>
        </button>

        {/* Button: Ver inactivos */}
        <button
          type="button"
          onClick={() => setShowOnlyInactive(!showOnlyInactive)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
            showOnlyInactive 
              ? 'bg-rose-50 text-rose-700 border-rose-300' 
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {showOnlyInactive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>Ver inactivos</span>
        </button>

        {/* Button: Columnas */}
        <button
          type="button"
          onClick={() => setShowColumnsModal(!showColumnsModal)}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Columnas</span>
        </button>
      </div>

      {/* TABLE WORKSPACE (Exact Design from Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="bg-white text-slate-600 font-bold border-b border-slate-200">
              <tr>
                {/* Checkbox column */}
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>

                {/* Código */}
                {visibleColumns.code && (
                  <th 
                    onClick={() => handleSort('code')}
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Código</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* Descripción */}
                {visibleColumns.description && (
                  <th 
                    onClick={() => handleSort('name')}
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors min-w-[260px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Descripción</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* Marca */}
                {visibleColumns.brand && (
                  <th 
                    onClick={() => handleSort('brand')}
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Marca</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* Cód. Proveedor */}
                {visibleColumns.supplierCode && (
                  <th 
                    onClick={() => handleSort('supplierCode')}
                    className="p-3 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Cód. Proveedor</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* Stock total */}
                {visibleColumns.stock && (
                  <th 
                    onClick={() => handleSort('stock')}
                    className="p-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Stock total</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* Precio */}
                {visibleColumns.price && (
                  <th 
                    onClick={() => handleSort('price')}
                    className="p-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Precio</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {/* Acciones */}
                {visibleColumns.actions && (
                  <th className="p-3 text-center w-36">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No se encontraron productos en el inventario con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const isChecked = selectedProductIds.has(product.id);
                  const price = product.priceRetail || product.priceWholesale || 0;
                  const isStockZero = product.stock === 0;
                  const isStockNegative = product.stock < 0;

                  return (
                    <tr 
                      key={product.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChecked ? 'bg-blue-50/40' : ''
                      } ${product.active === false ? 'opacity-60 bg-slate-50' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectProduct(product.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Código */}
                      {visibleColumns.code && (
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {product.code}
                        </td>
                      )}

                      {/* Descripción (With picture icon thumbnail) */}
                      {visibleColumns.description && (
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            {/* Image placeholder / thumbnail icon from screenshot */}
                            <button
                              type="button"
                              onClick={() => {
                                if (product.imageUrl) {
                                  setPreviewImage({ url: product.imageUrl, title: product.name });
                                } else {
                                  setProductToEdit(product);
                                  setIsProductModalOpen(true);
                                }
                              }}
                              className="w-7 h-7 rounded border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 shrink-0 overflow-hidden"
                              title="Ver o asignar imagen del producto"
                            >
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <div>
                              <span className="font-extrabold text-slate-900 block uppercase">
                                {product.name}
                              </span>
                              {product.presentation && (
                                <span className="text-[11px] text-slate-400 font-normal">
                                  {product.presentation} {product.category ? `• ${product.category}` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Marca */}
                      {visibleColumns.brand && (
                        <td className="p-3 text-slate-600">
                          {product.brand && product.brand !== '-' ? (
                            <span className="font-semibold text-slate-800">{product.brand}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}

                      {/* Cód. Proveedor */}
                      {visibleColumns.supplierCode && (
                        <td className="p-3 font-mono text-slate-600">
                          {product.supplierCode || '-'}
                        </td>
                      )}

                      {/* Stock total (With Pill Badges: 0 soft red, -28 soft red, >0 green/slate) */}
                      {visibleColumns.stock && (
                        <td className="p-3 text-center">
                          {isStockZero ? (
                            <span className="inline-block bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded text-xs min-w-[28px]">
                              0
                            </span>
                          ) : isStockNegative ? (
                            <span className="inline-block bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded text-xs min-w-[28px]">
                              {product.stock}
                            </span>
                          ) : (
                            <span className="inline-block bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs min-w-[28px]">
                              {product.stock}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Precio */}
                      {visibleColumns.price && (
                        <td className="p-3 text-right font-mono font-black text-slate-900 text-sm">
                          ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      )}

                      {/* Acciones (Matching image icons: 📷 ✏️ 🛒 🚫 🗑️) */}
                      {visibleColumns.actions && (
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-slate-500">
                            {/* 1. Ver / Asignar foto (Camera) */}
                            <button
                              type="button"
                              onClick={() => handleOpenImageModal(product)}
                              className={`p-1.5 rounded-lg transition-all ${
                                product.imageUrl 
                                  ? 'hover:text-sky-700 hover:bg-sky-50 text-sky-600 font-bold' 
                                  : 'hover:text-slate-700 hover:bg-slate-100 text-slate-400'
                              }`}
                              title={product.imageUrl ? "1. Ver o cambiar foto del producto" : "1. Cargar foto a este producto"}
                            >
                              <Camera className="w-4 h-4" />
                            </button>

                            {/* 2. Editar datos del producto (Pencil) */}
                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(product);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-blue-600 transition-all"
                              title="2. Editar datos del producto (Precios, Stock, Categoría, etc.)"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* 3. Pedir a Proveedor (Botón Carrito) */}
                            {(() => {
                              const inDraft = (activeDraft || []).find(it => it.productId === product.id);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderModal(product)}
                                  className={`p-1.5 rounded-lg transition-all relative ${
                                    inDraft 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs' 
                                      : 'hover:text-amber-800 hover:bg-amber-50 text-amber-600'
                                  }`}
                                  title={
                                    inDraft 
                                      ? `3. En pedido de compra (${inDraft.quantity} un.) - Clic para modificar` 
                                      : "3. Pedir a Proveedor (Añadir a Pedido de Mercadería)"
                                  }
                                >
                                  <ShoppingCart className="w-4 h-4" />
                                  {inDraft && (
                                    <span className="absolute -top-1 -right-1 bg-amber-600 text-white rounded-full text-[8px] font-black w-3.5 h-3.5 flex items-center justify-center shadow-xs">
                                      {inDraft.quantity}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            {/* 4. Desactivar / Activar (Ban) */}
                            <button
                              type="button"
                              onClick={() => handleToggleActiveProduct(product)}
                              className={`p-1.5 rounded-lg transition-all ${
                                product.active === false
                                  ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                  : 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                              }`}
                              title={product.active === false ? '4. Reactivar Producto (Actualmente Inactivo)' : '4. Desactivar Producto'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>

                            {/* 5. Eliminar (Trash) */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-rose-500 transition-all"
                              title="5. Eliminar permanentemente el producto"
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>

      {/* MODAL: COLUMNS VISIBILITY TOGGLE */}
      {showColumnsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Columnas Visibles
              </h4>
              <button onClick={() => setShowColumnsModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.code}
                  onChange={e => setVisibleColumns({ ...visibleColumns, code: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Código</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.description}
                  onChange={e => setVisibleColumns({ ...visibleColumns, description: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Descripción</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.brand}
                  onChange={e => setVisibleColumns({ ...visibleColumns, brand: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Marca</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.supplierCode}
                  onChange={e => setVisibleColumns({ ...visibleColumns, supplierCode: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Cód. Proveedor</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.stock}
                  onChange={e => setVisibleColumns({ ...visibleColumns, stock: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Stock total</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.price}
                  onChange={e => setVisibleColumns({ ...visibleColumns, price: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Precio</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowColumnsModal(false)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMAGE MANAGEMENT (Acción 1: Ver y Cargar Foto del Producto) */}
      {imageModalProduct && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Foto del Producto</h4>
                  <p className="text-[11px] text-slate-500 font-mono">{imageModalProduct.code} - {imageModalProduct.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setImageModalProduct(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="relative aspect-video bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-200 group">
              {imageInputVal ? (
                <>
                  <img 
                    src={imageInputVal} 
                    alt={imageModalProduct.name} 
                    className="w-full h-full object-contain p-2" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%2394a3b8"><text x="10" y="50" font-size="12">Error al cargar</text></svg>';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageInputVal('')}
                    className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors"
                    title="Quitar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="text-xs font-semibold text-slate-600">Sin imagen asignada</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sube un archivo o pega una URL para asignarle una foto</p>
                </div>
              )}
            </div>

            {/* Photo Input Controls */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Subir archivo desde la computadora
                </label>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Seleccionar imagen (JPG, PNG, WEBP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. O pegar enlace web directo (URL)
                </label>
                <input
                  type="text"
                  placeholder="https://ejemplo.com/foto-producto.jpg"
                  value={imageInputVal}
                  onChange={(e) => setImageInputVal(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const prod = imageModalProduct;
                  setImageModalProduct(null);
                  setProductToEdit(prod);
                  setIsProductModalOpen(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
              >
                Editar ficha completa
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImageModalProduct(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingImage}
                  onClick={handleSaveProductImage}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingImage ? 'Guardando...' : 'Guardar Foto'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION (Acción 5: Borrar) */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-sm">¿Eliminar producto?</h4>
                <p className="text-xs text-slate-500">
                  Esta acción es irreversible. Se eliminará el producto del catálogo y de la base de datos.
                </p>
              </div>
            </div>

            {/* Product Mini Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{productToDelete.name}</div>
              <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                <span>SKU: <strong className="text-slate-700 font-mono">{productToDelete.code}</strong></span>
                <span>Stock: <strong className="text-slate-700">{productToDelete.stock}</strong></span>
                {productToDelete.brand && (
                  <span>Marca: <strong className="text-slate-700">{productToDelete.brand}</strong></span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar Producto'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIMPLE IMAGE PREVIEW */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm truncate">{previewImage.title}</h4>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
              <img src={previewImage.url} alt={previewImage.title} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* FULL 5-TAB PRODUCT MODAL */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSave={async (prod) => {
          await onSaveProduct(prod);
          showToast(`Producto ${prod.name} guardado correctamente.`);
        }}
        suppliers={suppliers}
        categories={categoriesList}
        brands={brandsList}
      />

      {/* QUICK ADD SUPPLIER ORDER MODAL ("Pedir a Proveedor") */}
      {orderModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Pedir a Proveedor (Armar Pedido)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Añade este producto a la orden de reposición de mercadería
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOrderModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="font-bold text-slate-900 text-xs">
                {orderModalProduct.name}
              </div>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>SKU: <strong className="text-slate-700 font-mono">{orderModalProduct.code}</strong></span>
                {orderModalProduct.supplierCode && (
                  <span>Cód. Prov: <strong className="text-slate-700 font-mono">{orderModalProduct.supplierCode}</strong></span>
                )}
                {orderModalProduct.brand && (
                  <span>Marca: <strong className="text-slate-700">{orderModalProduct.brand}</strong></span>
                )}
                <span>Stock: <strong className={orderModalProduct.stock <= (orderModalProduct.minStock || 0) ? 'text-red-600' : 'text-slate-700'}>{orderModalProduct.stock}</strong></span>
                <span>Mínimo: <strong className="text-slate-700">{orderModalProduct.minStock || 0}</strong></span>
              </div>
            </div>

            {/* Supplier Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Proveedor a quien pedirselo *
              </label>
              <select
                value={orderModalSupplierId}
                onChange={e => setOrderModalSupplierId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Seleccionar Proveedor --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.businessName} {s.phone ? `(${s.phone})` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {orderModalProduct.supplierName 
                  ? `Proveedor en ficha: ${orderModalProduct.supplierName}` 
                  : 'Selecciona el proveedor habitual para este pedido'}
              </span>
            </div>

            {/* Quantity and Unit Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cantidad a Pedir
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setOrderModalQuantity(prev => Math.max(1, prev - 1))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-l-xl font-bold text-slate-700"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={orderModalQuantity}
                    onChange={e => setOrderModalQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full text-center text-xs py-2 border-y border-slate-300 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderModalQuantity(prev => prev + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-r-xl font-bold text-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Costo Unit. Ref. (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={orderModalCost}
                  onChange={e => setOrderModalCost(Number(e.target.value) || 0)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold bg-white"
                />
              </div>
            </div>

            {/* Subtotal Preview */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-amber-900">Subtotal Estimado:</span>
              <span className="text-base font-black text-amber-950 font-mono">
                ${(Math.max(1, orderModalQuantity) * (Number(orderModalCost) || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOrderModalProduct(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAddToSupplierOrder(false)}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
              >
                + Añadir al Pedido
              </button>
              {onOpenSupplierOrders && (
                <button
                  type="button"
                  onClick={() => handleConfirmAddToSupplierOrder(true)}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1"
                >
                  <span>Añadir e Ir al Pedido</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
