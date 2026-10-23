import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Printer,
  Search,
  Plus,
  Trash2,
  Check,
  Tag,
  Sliders,
  FileText,
  BarChart2,
  RefreshCw,
  Info,
} from 'lucide-react';

interface SelectedLabelItem {
  product: Product;
  quantity: number;
}

export const PriceTagsView: React.FC = () => {
  const { store, showToast } = useApp();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');

  // Selected items for printing labels { productId: quantity }
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Configuration state
  const [labelSize, setLabelSize] = useState<'mediana' | 'chica' | 'grande' | 'a4'>('mediana');
  
  // Field toggles
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showInternalCode, setShowInternalCode] = useState(true);
  const [showSupplierCode, setShowSupplierCode] = useState(false);
  const [showBrand, setShowBrand] = useState(true);
  const [showRubro, setShowRubro] = useState(false);

  // Font size states (px)
  const [nameFontSize, setNameFontSize] = useState(10);
  const [priceFontSize, setPriceFontSize] = useState(14);
  const [codesFontSize, setCodesFontSize] = useState(8);
  const [brandFontSize, setBrandFontSize] = useState(8);

  // Brands list helper
  const brandsList = useMemo(() => {
    const list = store.brands || [];
    if (list.length > 0) return list.map((b) => (typeof b === 'string' ? b : b.name));
    const set = new Set<string>();
    store.products.forEach((p) => {
      if (p.brand) set.add(p.brand);
      if (p.brandName) set.add(p.brandName);
    });
    return Array.from(set);
  }, [store.brands, store.products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return store.products.filter((p) => {
      if (p.active === false) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory && p.rubro !== selectedCategory) return false;
      if (selectedBrand !== 'all') {
        const matchesBrand = p.brand === selectedBrand || p.brandName === selectedBrand;
        if (!matchesBrand) return false;
      }
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesCode = p.code.toLowerCase().includes(term);
        const matchesSupplierCode = p.supplierCode?.toLowerCase().includes(term);
        const matchesBrand = p.brand?.toLowerCase().includes(term) || p.brandName?.toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesSupplierCode && !matchesBrand) return false;
      }
      return true;
    });
  }, [store.products, searchTerm, selectedCategory, selectedBrand]);

  const handleAddProduct = (product: Product) => {
    setSelectedItems((prev) => {
      const current = prev[product.id] || 0;
      return { ...prev, [product.id]: current + 1 };
    });
    showToast(`Producto agregado a la lista de etiquetas: ${product.name}`, 'success');
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const handleUpdateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    setSelectedItems((prev) => ({ ...prev, [productId]: qty }));
  };

  const selectedList: SelectedLabelItem[] = useMemo(() => {
    return Object.entries(selectedItems)
      .map(([id, qty]) => {
        const product = store.products.find((p) => p.id === id);
        return product ? { product, quantity: qty } : null;
      })
      .filter(Boolean) as SelectedLabelItem[];
  }, [selectedItems, store.products]);

  const totalLabelsCount = useMemo(() => {
    return selectedList.reduce((acc, item) => acc + item.quantity, 0);
  }, [selectedList]);

  const handlePrint = () => {
    if (selectedList.length === 0) {
      showToast('Seleccione al menos un producto para imprimir etiquetas', 'error');
      return;
    }
    setIsPrintModalOpen(true);
  };

  // Preview product (either first selected or first filtered product)
  const previewProduct = selectedList[0]?.product || store.products[0] || {
    id: 'preview-1',
    code: '223180',
    name: 'PALA ANCHA CABO CORTO',
    brand: 'CHEROKEE',
    priceMinorista: 109723.38,
    costPrice: 85000,
    stock: 15,
    active: true,
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <Printer className="w-7 h-7 text-blue-400" />
            <span>Etiquetas de Precio</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Seleccione productos, configure formatos y genere etiquetas térmicas o de góndola para imprimir.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {totalLabelsCount} {totalLabelsCount === 1 ? 'etiqueta' : 'etiquetas'} a imprimir
          </span>
          <button
            onClick={handlePrint}
            disabled={totalLabelsCount === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Etiquetas</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Search, Right Config & Selected */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Product Search (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Search className="w-4 h-4 text-amber-400" />
              <span>Buscar Productos</span>
            </h2>
            <span className="text-xs text-slate-400">{filteredProducts.length} encontrados</span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código o marca..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Todas las Marcas</option>
                {brandsList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Todos los Rubros</option>
                {store.categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Products List */}
          <div className="flex-1 min-h-[320px] max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No se encontraron productos con los filtros seleccionados.
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = !!selectedItems[p.id];
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500/40 shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-blue-400 font-bold">{p.code}</span>
                        {p.brand && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{p.brand}</span>}
                      </div>
                      <p className="text-xs font-medium text-slate-200 truncate mt-0.5">{p.name}</p>
                      <p className="text-xs font-mono text-emerald-400 font-bold mt-1">
                        ${p.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAddProduct(p)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Agregar a etiquetas"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Configuration & Selected Items (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Configuration Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Configuración de Etiqueta</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Size & Options */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tamaño de Etiqueta</label>
                  <select
                    value={labelSize}
                    onChange={(e: any) => setLabelSize(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="mediana">Mediana (50 × 30 mm)</option>
                    <option value="chica">Chica (30 × 20 mm)</option>
                    <option value="grande">Grande (70 × 40 mm)</option>
                    <option value="a4">A4 Góndola (100 × 50 mm)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Precio</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBarcode}
                      onChange={(e) => setShowBarcode(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Código de barras</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showInternalCode}
                      onChange={(e) => setShowInternalCode(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Código interno</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSupplierCode}
                      onChange={(e) => setShowSupplierCode(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Cod. Proveedor</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBrand}
                      onChange={(e) => setShowBrand(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Marca</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRubro}
                      onChange={(e) => setShowRubro(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>Rubro</span>
                  </label>
                </div>
              </div>

              {/* Font Size controls */}
              <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-xs font-bold text-slate-300 block mb-2">Tamaño de Texto (px)</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Nombre</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setNameFontSize(Math.max(8, nameFontSize - 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >-</button>
                      <span className="font-mono text-white font-bold w-4 text-center">{nameFontSize}</span>
                      <button
                        onClick={() => setNameFontSize(Math.min(18, nameFontSize + 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Precio</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setPriceFontSize(Math.max(10, priceFontSize - 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >-</button>
                      <span className="font-mono text-white font-bold w-4 text-center">{priceFontSize}</span>
                      <button
                        onClick={() => setPriceFontSize(Math.min(26, priceFontSize + 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Códigos</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setCodesFontSize(Math.max(6, codesFontSize - 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >-</button>
                      <span className="font-mono text-white font-bold w-4 text-center">{codesFontSize}</span>
                      <button
                        onClick={() => setCodesFontSize(Math.min(14, codesFontSize + 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >+</button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Marca/Rubro</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setBrandFontSize(Math.max(6, brandFontSize - 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >-</button>
                      <span className="font-mono text-white font-bold w-4 text-center">{brandFontSize}</span>
                      <button
                        onClick={() => setBrandFontSize(Math.min(14, brandFontSize + 1))}
                        className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white flex items-center justify-center font-bold"
                      >+</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Products List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>Productos Seleccionados ({selectedList.length})</span>
              </h2>
              {selectedList.length > 0 && (
                <button
                  onClick={() => setSelectedItems({})}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Limpiar lista
                </button>
              )}
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {selectedList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  Ningún producto seleccionado para imprimir etiquetas. Utilice el buscador de la izquierda.
                </div>
              ) : (
                selectedList.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-slate-100 truncate">{product.name}</p>
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                        ${product.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                        <button
                          onClick={() => handleUpdateQty(product.id, quantity - 1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >-</button>
                        <span className="font-mono text-xs font-bold w-6 text-center text-white">{quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(product.id, quantity + 1)}
                          className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer"
                        >+</button>
                      </div>

                      <button
                        onClick={() => handleRemoveProduct(product.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                        title="Quitar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Live Preview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>Vista Previa de Etiqueta</span>
        </h2>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex items-center justify-center min-h-[220px]">
          {/* Simulated Physical Label Card */}
          <div className="bg-white text-slate-900 p-4 rounded-lg shadow-xl border border-slate-300 w-[280px] flex flex-col justify-between select-none">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-1 mb-1">
              {showBrand && previewProduct.brand && (
                <span className="font-black uppercase tracking-wider" style={{ fontSize: `${brandFontSize}px` }}>
                  {previewProduct.brand}
                </span>
              )}
              {showRubro && (
                <span className="font-semibold text-slate-500 uppercase" style={{ fontSize: `${brandFontSize}px` }}>
                  Rubro: {previewProduct.rubro || 'General'}
                </span>
              )}
            </div>

            {/* Product Name */}
            <div className="py-1">
              <p className="font-bold uppercase leading-tight line-clamp-2" style={{ fontSize: `${nameFontSize}px` }}>
                {previewProduct.name}
              </p>
            </div>

            {/* Price */}
            {showPrice && (
              <div className="py-2 text-center my-1 bg-slate-50 border border-slate-200 rounded">
                <span className="font-black tracking-tight text-slate-900" style={{ fontSize: `${priceFontSize}px` }}>
                  ${previewProduct.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {/* Barcode & Codes */}
            <div className="flex flex-col items-center justify-center pt-1 border-t border-slate-200">
              <div className="flex items-center space-x-2 mb-1">
                {showInternalCode && (
                  <span className="font-mono text-slate-600" style={{ fontSize: `${codesFontSize}px` }}>
                    Cód: {previewProduct.code}
                  </span>
                )}
                {showSupplierCode && previewProduct.supplierCode && (
                  <span className="font-mono text-slate-600" style={{ fontSize: `${codesFontSize}px` }}>
                    Prov: {previewProduct.supplierCode}
                  </span>
                )}
              </div>
              
              {showBarcode && (
                <div className="w-full flex flex-col items-center">
                  {/* Barcode simulation bars */}
                  <div className="font-mono tracking-widest text-[13px] font-bold h-7 flex items-end justify-center overflow-hidden">
                    ||| | |||| || | || |||| | ||
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 tracking-wider">
                    {previewProduct.code}789012
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Print Preview & Print Modal */}
      {isPrintModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPrintModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh] text-slate-100">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 no-print">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  Vista Previa e Impresión de Etiquetas ({totalLabelsCount} etiquetas)
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ahora</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 overflow-y-auto bg-slate-950 flex-1 printable-labels-area">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                {selectedList.flatMap(({ product, quantity }) =>
                  Array.from({ length: quantity }).map((_, idx) => (
                    <div
                      key={`${product.id}-${idx}`}
                      className="bg-white text-slate-900 p-4 rounded-lg shadow-md border border-slate-300 w-[260px] flex flex-col justify-between select-none page-break-inside-avoid"
                    >
                      <div className="flex justify-between items-start border-b border-slate-200 pb-1 mb-1">
                        {showBrand && product.brand && (
                          <span className="font-black uppercase tracking-wider" style={{ fontSize: `${brandFontSize}px` }}>
                            {product.brand}
                          </span>
                        )}
                        {showRubro && (
                          <span className="font-semibold text-slate-500 uppercase" style={{ fontSize: `${brandFontSize}px` }}>
                            {product.rubro || 'General'}
                          </span>
                        )}
                      </div>

                      <div className="py-1">
                        <p className="font-bold uppercase leading-tight line-clamp-2" style={{ fontSize: `${nameFontSize}px` }}>
                          {product.name}
                        </p>
                      </div>

                      {showPrice && (
                        <div className="py-2 text-center my-1 bg-slate-50 border border-slate-200 rounded">
                          <span className="font-black tracking-tight text-slate-900" style={{ fontSize: `${priceFontSize}px` }}>
                            ${product.priceMinorista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col items-center justify-center pt-1 border-t border-slate-200">
                        <div className="flex items-center space-x-2 mb-1">
                          {showInternalCode && (
                            <span className="font-mono text-slate-600" style={{ fontSize: `${codesFontSize}px` }}>
                              Cód: {product.code}
                            </span>
                          )}
                          {showSupplierCode && product.supplierCode && (
                            <span className="font-mono text-slate-600" style={{ fontSize: `${codesFontSize}px` }}>
                              Prov: {product.supplierCode}
                            </span>
                          )}
                        </div>
                        
                        {showBarcode && (
                          <div className="w-full flex flex-col items-center">
                            <div className="font-mono tracking-widest text-[12px] font-bold h-6 flex items-end justify-center overflow-hidden">
                              ||| | |||| || | || |||| | ||
                            </div>
                            <span className="font-mono text-[8px] text-slate-500 tracking-wider">
                              {product.code}789012
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
