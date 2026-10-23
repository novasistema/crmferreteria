import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, Brand, Supplier } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Package,
  DollarSign,
  Boxes,
  Scale,
  Globe,
  X,
  RefreshCw,
  Plus,
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  Check,
  Percent,
  Calculator,
  Image as ImageIcon,
  Building2,
  Tag,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved?: (product: Product) => void;
}

type TabType = 'general' | 'costos' | 'inventario' | 'fraccionado' | 'ecommerce';

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
}) => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // New Brand inline modal
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  // -------------------------------------------------------------
  // FORM STATES
  // -------------------------------------------------------------

  // Tab 1: General
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [code3, setCode3] = useState('');
  const [code4, setCode4] = useState('');
  const [barcode, setBarcode] = useState('');
  const [primaryUnit, setPrimaryUnit] = useState('Unidad');
  const [salesUnit, setSalesUnit] = useState('Unidad');
  const [categoryId, setCategoryId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [purchaseCurrency, setPurchaseCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [salesCurrency, setSalesCurrency] = useState<'ARS' | 'USD'>('ARS');

  // Tab 2: Costos y Precios
  const [costReferenceProductId, setCostReferenceProductId] = useState('');
  const [costReferenceFactor, setCostReferenceFactor] = useState(1);
  const [costListNoVat, setCostListNoVat] = useState<number>(0);
  const [packageQuantity, setPackageQuantity] = useState<number>(1); // cant x bulto
  const [packagingUnits, setPackagingUnits] = useState<number>(1); // cant envasado
  const [salesPackUnits, setSalesPackUnits] = useState<number>(1); // cant x venta
  const [exchangeRate, setExchangeRate] = useState<number>(1420); // TC USD

  // Descuentos en cascada
  const [discount1, setDiscount1] = useState<number>(0);
  const [discount2, setDiscount2] = useState<number>(0);
  const [discount3, setDiscount3] = useState<number>(0);
  const [discount4, setDiscount4] = useState<number>(0);

  // IVA y Márgenes
  const [vatRate, setVatRate] = useState<21 | 10.5 | 27 | 0>(21);
  const [marginPercent, setMarginPercent] = useState<number>(50); // % Ganancia Lista Contado
  const [marginWholesalePercent, setMarginWholesalePercent] = useState<number>(20); // % Ganancia Mayorista

  // Precios Manuales Override / Sincronizados
  const [priceMinoristaOverride, setPriceMinoristaOverride] = useState<number | null>(null);

  // Tab 3: Inventario
  const [stock, setStock] = useState<number>(0);
  const [stockByWarehouse, setStockByWarehouse] = useState<Record<string, number>>({});
  const [stockMin, setStockMin] = useState<number>(5);
  const [reorderPoint, setReorderPoint] = useState<number>(10);
  const [shelfLocation, setShelfLocation] = useState('A-05');

  // Tab 4: Fraccionado
  const [allowFractional, setAllowFractional] = useState(false);
  const [fractionalUnit, setFractionalUnit] = useState('Metro');
  const [fractionalFactor, setFractionalFactor] = useState<number>(10);
  const [fractionalPrice, setFractionalPrice] = useState<number>(0);

  // Tab 5: E-Commerce
  const [publishOnline, setPublishOnline] = useState(false);
  const [publishWholesale, setPublishWholesale] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOnOffer, setIsOnOffer] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // -------------------------------------------------------------
  // INITIALIZE / RESET FORM
  // -------------------------------------------------------------
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.code || '');
      setDescription(productToEdit.description || '');
      setCode1(productToEdit.code1 || '');
      setCode2(productToEdit.code2 || '');
      setCode3(productToEdit.code3 || '');
      setCode4(productToEdit.code4 || '');
      setBarcode(productToEdit.barcode || '');
      setPrimaryUnit(productToEdit.primaryUnit || 'Unidad');
      setSalesUnit(productToEdit.salesUnit || 'Unidad');
      setCategoryId(productToEdit.categoryId || store.categories[0]?.id || '');
      setBrandName(productToEdit.brand || productToEdit.brandName || '');
      setSupplierId(productToEdit.supplierId || store.suppliers[0]?.id || '');
      setSupplierCode(productToEdit.supplierCode || '');
      setPurchaseCurrency(productToEdit.purchaseCurrency || 'ARS');
      setSalesCurrency(productToEdit.salesCurrency || 'ARS');

      setCostReferenceProductId(productToEdit.costReferenceProductId || '');
      setCostReferenceFactor(productToEdit.costReferenceFactor || 1);
      setCostListNoVat(productToEdit.costListNoVat ?? productToEdit.costPrice ?? 0);
      setPackageQuantity(productToEdit.packageQuantity || 1);
      setPackagingUnits(productToEdit.packagingUnits || 1);
      setSalesPackUnits(productToEdit.salesPackUnits || 1);
      setExchangeRate(productToEdit.exchangeRate || 1420);

      setDiscount1(productToEdit.discount1 || 0);
      setDiscount2(productToEdit.discount2 || 0);
      setDiscount3(productToEdit.discount3 || 0);
      setDiscount4(productToEdit.discount4 || 0);

      setVatRate(productToEdit.vatRate || 21);
      setMarginPercent(productToEdit.marginPercent || 50);
      setMarginWholesalePercent(productToEdit.marginWholesalePercent || 20);
      setPriceMinoristaOverride(productToEdit.priceMinorista || null);

      // Initialize stock and warehouse breakdown
      const initialWhStock: Record<string, number> = { ...(productToEdit.stockByWarehouse || {}) };
      store.warehouses.forEach((w) => {
        if (initialWhStock[w.id] === undefined) initialWhStock[w.id] = 0;
      });
      setStockByWarehouse(initialWhStock);
      const totalInitialStock = Object.values(initialWhStock).reduce((a, b) => a + (Number(b) || 0), 0);
      setStock(totalInitialStock > 0 ? totalInitialStock : (productToEdit.stock || 0));

      setStockMin(productToEdit.stockMin || 5);
      setReorderPoint(productToEdit.reorderPoint || 10);
      setShelfLocation(productToEdit.shelfLocation || 'A-05');

      setAllowFractional(!!productToEdit.allowFractional);
      setFractionalUnit(productToEdit.fractionalUnit || 'Metro');
      setFractionalFactor(productToEdit.fractionalFactor || 10);
      setFractionalPrice(productToEdit.fractionalPrice || 0);

      setPublishOnline(!!productToEdit.publishOnline);
      setPublishWholesale(!!productToEdit.publishWholesale);
      setIsFeatured(!!productToEdit.isFeatured);
      setIsOnOffer(!!productToEdit.isOnOffer);
      setIsNewArrival(!!productToEdit.isNewArrival);
      setImageUrl(productToEdit.imageUrl || '');
    } else {
      // Defaults for new product
      setName('');
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
      setDescription('');
      setCode1('');
      setCode2('');
      setCode3('');
      setCode4('');
      setBarcode(`779${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setPrimaryUnit('Unidad');
      setSalesUnit('Unidad');
      setCategoryId(store.categories[0]?.id || '');
      setBrandName('STANLEY');
      setSupplierId(store.suppliers[0]?.id || '');
      setSupplierCode('');
      setPurchaseCurrency('ARS');
      setSalesCurrency('ARS');

      setCostReferenceProductId('');
      setCostReferenceFactor(1);
      setCostListNoVat(0);
      setPackageQuantity(1);
      setPackagingUnits(1);
      setSalesPackUnits(1);
      setExchangeRate(1420);

      setDiscount1(0);
      setDiscount2(0);
      setDiscount3(0);
      setDiscount4(0);

      setVatRate(21);
      setMarginPercent(50);
      setMarginWholesalePercent(20);
      setPriceMinoristaOverride(null);

      const newWhStock: Record<string, number> = {};
      store.warehouses.forEach((w) => {
        newWhStock[w.id] = 0;
      });
      setStockByWarehouse(newWhStock);
      setStock(0);
      setStockMin(5);
      setReorderPoint(10);
      setShelfLocation('A-05');

      setAllowFractional(false);
      setFractionalUnit('Metro');
      setFractionalFactor(10);
      setFractionalPrice(0);

      setPublishOnline(false);
      setPublishWholesale(false);
      setIsFeatured(false);
      setIsOnOffer(false);
      setIsNewArrival(false);
      setImageUrl('');
    }
  }, [productToEdit, isOpen]);

  // -------------------------------------------------------------
  // DYNAMIC CALCULATIONS (Matching Screenshot 2 - Costos)
  // -------------------------------------------------------------

  // If cost by reference is selected
  let baseCost = costListNoVat;
  if (costReferenceProductId) {
    const refProduct = store.products.find((p) => p.id === costReferenceProductId);
    if (refProduct) {
      baseCost = refProduct.costPrice * (costReferenceFactor || 1);
    }
  }

  // Costo Unitario = Lista ÷ cant x vta
  const safeSalesPackUnits = salesPackUnits > 0 ? salesPackUnits : 1;
  const rawUnitCost = baseCost / safeSalesPackUnits;

  // Apply supplier discounts in cascade
  const factorD1 = (100 - (discount1 || 0)) / 100;
  const factorD2 = (100 - (discount2 || 0)) / 100;
  const factorD3 = (100 - (discount3 || 0)) / 100;
  const factorD4 = (100 - (discount4 || 0)) / 100;
  const netCostNoVat = rawUnitCost * factorD1 * factorD2 * factorD3 * factorD4;

  const vatMultiplier = 1 + (vatRate || 0) / 100;
  const netCostWithVat = netCostNoVat * vatMultiplier;

  // Precios Lista Contado
  const calculatedPriceNoVat = netCostNoVat * (1 + (marginPercent || 0) / 100);
  const calculatedPriceWithVat = calculatedPriceNoVat * vatMultiplier;

  const finalPriceMinoristaWithVat =
    priceMinoristaOverride !== null ? priceMinoristaOverride : calculatedPriceWithVat;
  const finalPriceMinoristaNoVat = finalPriceMinoristaWithVat / vatMultiplier;

  // Precios Lista Mayorista
  const wholesalePriceNoVat = netCostNoVat * (1 + (marginWholesalePercent || 0) / 100);
  const wholesalePriceWithVat = wholesalePriceNoVat * vatMultiplier;

  // Helper to generate new SKU
  const generateNewSku = () => {
    setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  // Helper to generate new Barcode
  const generateNewBarcode = () => {
    setBarcode(`779${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  };

  // -------------------------------------------------------------
  // SAVE HANDLER
  // -------------------------------------------------------------
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Por favor ingrese el nombre del producto', 'error');
      setActiveTab('general');
      return;
    }

    const selectedCategory = store.categories.find((c) => c.id === categoryId);
    const selectedSupplier = store.suppliers.find((s) => s.id === supplierId);

    const savedProduct: Product = {
      id: productToEdit?.id || `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      code: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: barcode.trim(),
      name: name.trim().toUpperCase(),
      description: description.trim(),
      code1: code1.trim(),
      code2: code2.trim(),
      code3: code3.trim(),
      code4: code4.trim(),
      primaryUnit,
      salesUnit,
      categoryId: categoryId || store.categories[0]?.id || 'cat-gral',
      categoryName: selectedCategory?.name || 'General',
      rubro: selectedCategory?.name || 'General',
      brandId: 'brand-custom',
      brandName: brandName.trim().toUpperCase() || 'GENÉRICO',
      brand: brandName.trim().toUpperCase() || 'GENÉRICO',
      supplierId: supplierId || store.suppliers[0]?.id || 'sup-1',
      supplierName: selectedSupplier?.name || 'Proveedor General',
      supplierCode: supplierCode.trim(),
      purchaseCurrency,
      salesCurrency,
      exchangeRate,
      unit: primaryUnit === 'Metro' ? 'mt' : primaryUnit === 'Kg' ? 'kg' : primaryUnit === 'Litro' ? 'lt' : 'u',

      // Costos y Precios
      costReferenceProductId: costReferenceProductId || undefined,
      costReferenceFactor,
      costListNoVat,
      packageQuantity,
      packagingUnits,
      salesPackUnits,
      costPrice: netCostNoVat,
      discount1,
      discount2,
      discount3,
      discount4,
      marginPercent,
      marginWholesalePercent,
      priceMinorista: finalPriceMinoristaWithVat,
      priceMayorista: wholesalePriceWithVat,
      priceGremio: finalPriceMinoristaWithVat * 0.9,
      vatRate,

      // Inventario
      stock: (Object.values(stockByWarehouse) as number[]).reduce((a, b) => a + (Number(b) || 0), 0) || stock,
      stockMin,
      reorderPoint,
      stockByWarehouse,
      shelfLocation,

      // Fraccionado
      allowFractional,
      fractionalUnit,
      fractionalFactor,
      fractionalPrice: allowFractional
        ? fractionalPrice || finalPriceMinoristaWithVat / (fractionalFactor || 1)
        : undefined,

      // E-Commerce
      publishOnline,
      publishWholesale,
      isFeatured,
      isOnOffer,
      isNewArrival,
      imageUrl: imageUrl.trim(),
      active: true,
    };

    store.saveProduct(savedProduct);
    showToast(
      productToEdit ? 'Producto actualizado correctamente' : 'Nuevo producto creado con éxito',
      'success'
    );

    if (onSaved) onSaved(savedProduct);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-[#0f172a] text-slate-100 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] animate-in zoom-in-95 duration-150">
        {/* ========================================================= */}
        {/* MODAL HEADER                                              */}
        {/* ========================================================= */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete los datos del producto en las diferentes secciones.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* SECTION TABS (General, Costos, Inventario, Fraccionado, E-Commerce) */}
        {/* ========================================================= */}
        <div className="px-6 pt-3 bg-slate-900/40 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'general'
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm border-b-2 border-b-orange-500'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Package className="w-4 h-4 text-orange-400" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('costos')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'costos'
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm border-b-2 border-b-emerald-500'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Costos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'inventario'
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm border-b-2 border-b-amber-500'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-400" />
            <span>Inventario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fraccionado')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'fraccionado'
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm border-b-2 border-b-purple-500'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Scale className="w-4 h-4 text-purple-400" />
            <span>Fraccionado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ecommerce')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'ecommerce'
                ? 'bg-slate-900 text-white border-slate-700 shadow-sm border-b-2 border-b-cyan-500'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>E-Commerce</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* FORM CONTENT BODY                                         */}
        {/* ========================================================= */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* ===================================================== */}
          {/* TAB 1: GENERAL (SCREENSHOT 1)                         */}
          {/* ===================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-5 border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
              {/* Section Header */}
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Package className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wide">
                  Información General
                </h3>
              </div>

              {/* Row 1: Nombre del Producto & SKU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Nombre del Producto <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Martillo Stanley 20oz"
                    className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none placeholder-slate-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    SKU / Código Interno (opcional)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Se genera automáticamente si se deja vacío"
                      className="flex-1 bg-slate-950 text-white font-mono text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none placeholder-slate-500 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={generateNewSku}
                      title="Generar código automático"
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Descripción */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del producto para la tienda online y uso interno..."
                  className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none placeholder-slate-500 shadow-inner resize-none"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se muestra en la tienda online cuando el cliente abre el producto
                </span>
              </div>

              {/* Row 3: Código 1, Código 2, Código 3, Código 4 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Código 1</label>
                  <input
                    type="text"
                    value={code1}
                    onChange={(e) => setCode1(e.target.value)}
                    placeholder="Código 1"
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Código 2</label>
                  <input
                    type="text"
                    value={code2}
                    onChange={(e) => setCode2(e.target.value)}
                    placeholder="Código 2"
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Código 3</label>
                  <input
                    type="text"
                    value={code3}
                    onChange={(e) => setCode3(e.target.value)}
                    placeholder="Código 3"
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Código 4</label>
                  <input
                    type="text"
                    value={code4}
                    onChange={(e) => setCode4(e.target.value)}
                    placeholder="Código 4"
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 4: Código de Barras */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">Código de Barras</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ej: 7790001234567"
                    className="flex-1 bg-slate-950 text-white font-mono text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none placeholder-slate-500 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={generateNewBarcode}
                    title="Generar EAN-13 automático"
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Escanee o ingrese el código de barras EAN/UPC
                </span>
              </div>

              {/* Row 5: Unidad Primaria (Stock) & Unidad de Venta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Unidad Primaria (Stock) <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={primaryUnit}
                    onChange={(e) => setPrimaryUnit(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Kg">Kilogramo (Kg)</option>
                    <option value="Metro">Metro (mt)</option>
                    <option value="Litro">Litro (lt)</option>
                    <option value="Caja">Caja</option>
                    <option value="Bolsa">Bolsa</option>
                    <option value="Rollo">Rollo</option>
                    <option value="Pack">Pack</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Unidad de Venta <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={salesUnit}
                    onChange={(e) => setSalesUnit(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Kg">Kilogramo (Kg)</option>
                    <option value="Metro">Metro (mt)</option>
                    <option value="Litro">Litro (lt)</option>
                    <option value="Caja">Caja</option>
                    <option value="Bolsa">Bolsa</option>
                    <option value="Rollo">Rollo</option>
                    <option value="Pack">Pack</option>
                  </select>
                </div>
              </div>

              {/* Row 6: Categoría / Rubro & Marca */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Categoría / Rubro</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    {store.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Marca</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Buscar o ingresar marca..."
                      className="flex-1 bg-slate-950 text-white text-xs uppercase rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(true)}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-colors"
                      title="Agregar nueva marca"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 7: Proveedor Principal & Código Proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Proveedor Principal</label>
                  <select
                    value={supplierId}
                    onChange={(e) => {
                      const newSupId = e.target.value;
                      setSupplierId(newSupId);
                      const sup = store.suppliers.find((s) => s.id === newSupId);
                      if (sup && sup.defaultDiscountPercent !== undefined && sup.defaultDiscountPercent > 0) {
                        setDiscount1(sup.defaultDiscountPercent);
                      }
                    }}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    {store.suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Código Proveedor</label>
                  <input
                    type="text"
                    value={supplierCode}
                    onChange={(e) => setSupplierCode(e.target.value)}
                    placeholder="Ej: ST201-M"
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 8: Moneda de Compra & Moneda de Venta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Moneda de Compra</label>
                  <select
                    value={purchaseCurrency}
                    onChange={(e) => setPurchaseCurrency(e.target.value as 'ARS' | 'USD')}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares Estadounidenses</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Moneda de Venta</label>
                  <select
                    value={salesCurrency}
                    onChange={(e) => setSalesCurrency(e.target.value as 'ARS' | 'USD')}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares Estadounidenses</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 2: COSTOS (SCREENSHOT 2)                          */}
          {/* ===================================================== */}
          {activeTab === 'costos' && (
            <div className="space-y-5 border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
              {/* Section Header */}
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  Estructura de Costos y Precios
                </h3>
              </div>

              {/* 1. Costo por Referencia (opcional) */}
              <div className="border border-amber-500/40 bg-amber-950/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <LinkIcon className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">Costo por Referencia (opcional)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Si está activado, el costo se calcula tomando el costo de otro producto y multiplicándolo por
                  el factor que indiques. Útil para artículos por m² o fracciones.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Producto base (costo de referencia)
                    </label>
                    <select
                      value={costReferenceProductId}
                      onChange={(e) => setCostReferenceProductId(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">-- Sin referencia directa (Costo propio) --</option>
                      {store.products.slice(0, 40).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Costo: ${p.costPrice.toLocaleString('es-AR')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Factor (m² o proporción)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={costReferenceFactor}
                      onChange={(e) => setCostReferenceFactor(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      60x60=0.36 · 60x120=0.72 · 30x40=0.36
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Costo de lista (s/IVA) */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">Costo de lista (s/IVA):</label>
                <input
                  type="number"
                  step="0.01"
                  value={costListNoVat}
                  onChange={(e) => setCostListNoVat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-white font-mono font-bold text-sm rounded-xl p-3 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* 3. Cálculo de embalajes / unidades (Recuadro Azul) */}
              <div className="border border-sky-500/30 bg-sky-950/20 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
                {/* Cant. x bulto */}
                <div>
                  <label className="text-[11px] font-semibold text-sky-300 flex items-center space-x-1 mb-1">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Cant. x bulto:</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={packageQuantity}
                    onChange={(e) => setPackageQuantity(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-lg p-2 border border-slate-700 focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">unidades x caja</span>
                </div>

                {/* Cant. envasado */}
                <div>
                  <label className="text-[11px] font-semibold text-amber-300 flex items-center space-x-1 mb-1">
                    <Package className="w-3.5 h-3.5" />
                    <span>Cant. envasado:</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={packagingUnits}
                    onChange={(e) => setPackagingUnits(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-lg p-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">unidades x envase</span>
                </div>

                {/* Cant. x venta */}
                <div>
                  <label className="text-[11px] font-semibold text-purple-300 flex items-center space-x-1 mb-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Cant. x venta:</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={salesPackUnits}
                    onChange={(e) => setSalesPackUnits(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-lg p-2 border border-slate-700 focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">unid. venta x compra</span>
                </div>

                {/* Costo Unitario & Ejemplo */}
                <div className="space-y-1">
                  <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2 text-center">
                    <span className="text-[9px] font-bold uppercase text-emerald-400 block">Costo unitario:</span>
                    <span className="text-sm font-black font-mono text-emerald-300">
                      ${rawUnitCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[8px] text-slate-400 block">= Lista ÷ cant x vta</span>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-1 text-[9px] text-amber-300 font-mono text-center">
                    EJEMPLO: ${baseCost.toFixed(2)} ÷ {safeSalesPackUnits} = $
                    {rawUnitCost.toFixed(2)}/u
                  </div>
                </div>
              </div>

              {/* 4. Costo en ARS & TC */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Costo (s/IVA):</label>
                  <input
                    type="text"
                    readOnly
                    value={`$${netCostNoVat.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    className="w-full bg-slate-950 text-slate-300 font-mono font-bold text-xs rounded-xl p-2.5 border border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Moneda Compra:</label>
                  <input
                    type="text"
                    readOnly
                    value={purchaseCurrency}
                    className="w-full bg-slate-950 text-slate-300 font-mono font-bold text-xs rounded-xl p-2.5 border border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">TC (Tipo Cambio):</label>
                  <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1420)}
                    className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Costo con IVA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Costo (c/IVA):</label>
                  <input
                    type="text"
                    readOnly
                    value={`$${netCostWithVat.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    className="w-full bg-slate-950 text-emerald-400 font-mono font-black text-xs rounded-xl p-2.5 border border-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">IVA (%):</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) as any)}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value={21}>21% (Tasa General)</option>
                    <option value={10.5}>10.5% (Tasa Reducida)</option>
                    <option value={27}>27% (Servicios/Electrónica)</option>
                    <option value={0}>0% (Exento)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Costo en USD:</label>
                  <input
                    type="text"
                    readOnly
                    value={`USD $${(netCostWithVat / (exchangeRate || 1)).toFixed(2)}`}
                    className="w-full bg-slate-950 text-slate-300 font-mono text-xs rounded-xl p-2.5 border border-slate-800"
                  />
                </div>
              </div>

              {/* 5. Descuentos del Proveedor */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">Descuentos del Proveedor</label>
                  <button
                    type="button"
                    onClick={() => showToast('Descuentos sincronizados del proveedor habitual', 'info')}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Traer Descuentos</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Desc. 1 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={discount1}
                      onChange={(e) => setDiscount1(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Desc. 2 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={discount2}
                      onChange={(e) => setDiscount2(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Desc. 3 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={discount3}
                      onChange={(e) => setDiscount3(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Desc. 4 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={discount4}
                      onChange={(e) => setDiscount4(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Lista Contado (Recuadro) */}
              <div className="border border-slate-700/80 bg-slate-950/60 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-extrabold text-white block">Lista Contado</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">% Ganancia:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={marginPercent}
                      onChange={(e) => {
                        setMarginPercent(parseFloat(e.target.value) || 0);
                        setPriceMinoristaOverride(null);
                      }}
                      className="w-full bg-slate-900 text-white font-mono font-bold text-xs rounded-xl p-2.5 border border-slate-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Precio (s/IVA):</label>
                    <input
                      type="text"
                      readOnly
                      value={`$${finalPriceMinoristaNoVat.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      className="w-full bg-slate-900 text-slate-300 font-mono text-xs rounded-xl p-2.5 border border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-blue-400 block mb-1">
                      Precio (c/IVA): <span className="text-[9px] text-blue-300 font-normal">(editable)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={finalPriceMinoristaWithVat}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        setPriceMinoristaOverride(newPrice);
                        // Back-calculate margin
                        if (netCostWithVat > 0) {
                          const calculatedMargin = ((newPrice - netCostWithVat) / netCostWithVat) * 100;
                          setMarginPercent(parseFloat(calculatedMargin.toFixed(2)));
                        }
                      }}
                      className="w-full bg-blue-950/40 text-blue-300 font-mono font-black text-sm rounded-xl p-2.5 border border-blue-500/60 focus:border-blue-400 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 7. Lista Mayorista (Recuadro beige) */}
              <div className="border border-amber-500/30 bg-amber-950/20 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-extrabold text-amber-300 block">Lista Mayorista</span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      % Ganancia Mayorista:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={marginWholesalePercent}
                      onChange={(e) => setMarginWholesalePercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700/80 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      Precio Mayorista (c/IVA):
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`$${wholesalePriceWithVat.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      className="w-full bg-amber-500/10 text-amber-300 font-mono font-bold text-xs rounded-xl p-2.5 border border-amber-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 3: INVENTARIO (SCREENSHOT 3)                      */}
          {/* ===================================================== */}
          {activeTab === 'inventario' && (
            <div className="space-y-5 border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
              {/* Section Header */}
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Boxes className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                  Detalles de Inventario
                </h3>
              </div>

              {/* Row 1: Stock total, Mínimo de alerta, Punto de pedido */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">Stock Total (Suma Sucursales)</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setStock(val);
                      const mainId = store.warehouses.find((w) => w.isMain)?.id || store.warehouses[0]?.id || '1';
                      setStockByWarehouse((prev) => ({
                        ...prev,
                        [mainId]: val,
                      }));
                    }}
                    className="w-full bg-slate-950 text-white font-mono font-bold text-sm rounded-xl p-3 border border-slate-700/80 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-400 block mb-1.5">Mínimo de alerta</label>
                  <input
                    type="number"
                    value={stockMin}
                    onChange={(e) => setStockMin(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-amber-300 font-mono font-bold text-sm rounded-xl p-3 border border-amber-500/50 focus:border-amber-400 focus:outline-none shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-sky-400 block mb-1.5">Punto de pedido</label>
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-sky-300 font-mono font-bold text-sm rounded-xl p-3 border border-sky-500/50 focus:border-sky-400 focus:outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Stock por Sucursal / Depósito */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Distribución de Stock por Depósito / Sucursal
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Total: <strong className="text-white">{(Object.values(stockByWarehouse) as number[]).reduce((a, b) => a + (Number(b) || 0), 0)}</strong> unidades
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {store.warehouses.map((wh) => (
                    <div key={wh.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-200 truncate">{wh.name}</span>
                        {wh.isMain && <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">Principal</span>}
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={stockByWarehouse[wh.id] ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          const updated = { ...stockByWarehouse, [wh.id]: val };
                          setStockByWarehouse(updated);
                          setStock((Object.values(updated) as number[]).reduce((a, b) => a + (Number(b) || 0), 0));
                        }}
                        className="w-full bg-slate-950 text-white font-mono font-bold text-sm rounded-lg p-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerta de Punto de Pedido (Recuadro Amarillo) */}
              <div className="border border-amber-500/40 bg-amber-950/20 rounded-2xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">Punto de Pedido</span>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Cuando el stock llegue a <strong className="text-amber-400">{reorderPoint} unidades</strong>,
                    el sistema generará automáticamente un pedido de reposición al proveedor habitual.
                  </p>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">Ubicación</label>
                <input
                  type="text"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  placeholder="Ej: A-05, Pasillo 3 - Estante B2"
                  className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700/80 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 4: FRACCIONADO (SCREENSHOT 4)                     */}
          {/* ===================================================== */}
          {activeTab === 'fraccionado' && (
            <div className="space-y-5 border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
              {/* Section Header */}
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Scale className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wide">
                  Venta Fraccionada
                </h3>
              </div>

              {/* Toggle Habilitar Fraccionado */}
              <div className="border border-slate-700/80 bg-slate-950/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Habilitar Fraccionado</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permite vender en una unidad distinta al stock (ej: corte de cable por metro, venta de
                    tornillos por unidad, fraccionamiento de líquidos).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowFractional}
                    onChange={(e) => setAllowFractional(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Configuración adicional de fraccionado si está habilitado */}
              {allowFractional && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-purple-500/30 bg-purple-950/10 rounded-2xl p-4 animate-in fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-purple-300 block mb-1">
                      Unidad Fraccionada:
                    </label>
                    <select
                      value={fractionalUnit}
                      onChange={(e) => setFractionalUnit(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700"
                    >
                      <option value="Metro">Metro (mt)</option>
                      <option value="Unidad">Unidad suelta</option>
                      <option value="Gramo">Gramo (gr)</option>
                      <option value="Mililitro">Mililitro (ml)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-purple-300 block mb-1">
                      Factor de conversión:
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={fractionalFactor}
                      onChange={(e) => setFractionalFactor(parseFloat(e.target.value) || 1)}
                      className="w-full bg-slate-950 text-white font-mono text-xs rounded-xl p-2.5 border border-slate-700"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">ej: 1 rollo = 50 metros</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-purple-300 block mb-1">
                      Precio Fraccionado ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={
                        fractionalPrice ||
                        parseFloat((finalPriceMinoristaWithVat / (fractionalFactor || 1)).toFixed(2))
                      }
                      onChange={(e) => setFractionalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 text-white font-mono font-bold text-xs rounded-xl p-2.5 border border-purple-500/50"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================== */}
          {/* TAB 5: E-COMMERCE (SCREENSHOT 5)                      */}
          {/* ===================================================== */}
          {activeTab === 'ecommerce' && (
            <div className="space-y-5 border border-slate-800 bg-slate-900/40 p-5 rounded-2xl">
              {/* Section Header */}
              <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide">E-Commerce</h3>
              </div>

              {/* 5 Toggle Cards */}
              <div className="space-y-2.5">
                {/* 1. Publicar Online */}
                <div className="border border-slate-700/80 bg-slate-950/60 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Publicar Online</span>
                    <span className="text-[11px] text-slate-400">El producto será visible en tu tienda online.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishOnline}
                      onChange={(e) => setPublishOnline(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* 2. Publicar en Mayorista */}
                <div className="border border-slate-700/80 bg-slate-950/60 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Publicar en Mayorista</span>
                    <span className="text-[11px] text-slate-400">
                      El producto será visible en la tienda mayorista / distribuidora.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishWholesale}
                      onChange={(e) => setPublishWholesale(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* 3. Destacado */}
                <div className="border border-slate-700/80 bg-slate-950/60 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Destacado</span>
                    <span className="text-[11px] text-slate-400">
                      El producto aparecerá en la sección de destacados de la tienda.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* 4. Oferta */}
                <div className="border border-slate-700/80 bg-slate-950/60 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Oferta</span>
                    <span className="text-[11px] text-slate-400">
                      Marcar como producto en oferta. Se mostrará con etiqueta de oferta.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOnOffer}
                      onChange={(e) => setIsOnOffer(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* 5. Novedad */}
                <div className="border border-slate-700/80 bg-slate-950/60 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Novedad</span>
                    <span className="text-[11px] text-slate-400">Marcar como producto nuevo / recién llegado.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={(e) => setIsNewArrival(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Imagen del Producto */}
              <div className="border border-slate-700/80 bg-slate-950/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Imagen del Producto</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opción 1: Subir imagen */}
                  <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer bg-slate-900/50 flex flex-col items-center justify-center transition-colors group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 mb-1.5 transition-colors" />
                    <span className="text-xs font-bold text-slate-200 block">Subir imagen</span>
                    <span className="text-[10px] text-slate-400">Desde tu dispositivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImageUrl(reader.result as string);
                            showToast('Imagen cargada correctamente', 'success');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Opción 2: Pegar Link */}
                  <div className="border border-slate-700/80 rounded-xl p-4 bg-slate-900/50 flex flex-col justify-center space-y-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
                      <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pegar Link:</span>
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 text-white text-xs rounded-lg p-2.5 border border-slate-700 focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Preview if exists */}
                {imageUrl && (
                  <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden mx-auto p-1">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Instrucciones de ayuda */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">Obtener imagen desde MercadoLibre:</span>
                  <p>1. Abrí el producto en MercadoLibre</p>
                  <p>2. Clic derecho sobre la imagen → "Copiar dirección de imagen"</p>
                  <p>3. Pegá el link en "Pegar Link"</p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================== */}
          {/* MODAL FOOTER ACTION (GREEN GUARDAR BUTTON)            */}
          {/* ===================================================== */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-[#10b981] hover:bg-[#059669] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar</span>
            </button>
          </div>
        </form>

        {/* Modal Inline: Agregar Marca */}
        {showAddBrandModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-xs w-full space-y-3">
              <h4 className="text-xs font-bold text-white">Agregar Nueva Marca</h4>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Nombre de la marca..."
                className="w-full bg-slate-950 text-white text-xs rounded-lg p-2.5 border border-slate-700 uppercase"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddBrandModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newBrandName.trim()) {
                      setBrandName(newBrandName.trim().toUpperCase());
                      setShowAddBrandModal(false);
                      setNewBrandName('');
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
