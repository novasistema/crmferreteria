import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  DollarSign, 
  Layers, 
  RotateCw, 
  Globe, 
  Upload, 
  Link as LinkIcon, 
  Plus, 
  Check, 
  AlertTriangle,
  Barcode,
  Building,
  Tag,
  CheckCircle2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { Product, ProductWarehouseStock, Supplier } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (product: Product) => Promise<void>;
  suppliers?: Supplier[];
  categories?: string[];
  brands?: string[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
  suppliers = [],
  categories = [
    'Terminación para Mampostería',
    'Esmaltes y Sintéticos',
    'Impermeabilizantes y Techos',
    'Fijadores y Selladores',
    'Revestimientos Plásticos',
    'Accesorios y Seguridad',
    'Herramientas y Pincelería'
  ],
  brands = ['Colorear', 'Colorear Industrial', 'Stanley', 'Plavicon', 'Alba', 'Sinteplast']
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'costos' | 'inventario' | 'fraccionado' | 'ecommerce'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. General Info State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [altCode1, setAltCode1] = useState('');
  const [altCode2, setAltCode2] = useState('');
  const [altCode3, setAltCode3] = useState('');
  const [altCode4, setAltCode4] = useState('');
  const [barcode, setBarcode] = useState('');
  const [primaryUnit, setPrimaryUnit] = useState('Unidad');
  const [salesUnit, setSalesUnit] = useState('Unidad');
  const [category, setCategory] = useState(categories[0] || 'Pinturas');
  const [brand, setBrand] = useState('Colorear');
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [supplierPrincipal, setSupplierPrincipal] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [currencyBuy, setCurrencyBuy] = useState<'ARS' | 'USD'>('ARS');
  const [currencySell, setCurrencySell] = useState<'ARS' | 'USD'>('ARS');

  // 2. Cost Structure State
  const [costListWithoutIva, setCostListWithoutIva] = useState<number>(0);
  const [qtyPerPackage, setQtyPerPackage] = useState<number>(1);
  const [qtyPackaging, setQtyPackaging] = useState<number>(1);
  const [qtySales, setQtySales] = useState<number>(1);
  const [disc1, setDisc1] = useState<number>(0);
  const [disc2, setDisc2] = useState<number>(0);
  const [disc3, setDisc3] = useState<number>(0);
  const [disc4, setDisc4] = useState<number>(0);
  const [ivaRate, setIvaRate] = useState<number>(21);
  const [profitMarginContado, setProfitMarginContado] = useState<number>(50);
  const [priceContadoWithoutIva, setPriceContadoWithoutIva] = useState<number>(0);
  const [priceContadoWithIva, setPriceContadoWithIva] = useState<number>(0);
  const [profitMarginWholesale, setProfitMarginWholesale] = useState<number>(30);
  const [sellerCommissionPercent, setSellerCommissionPercent] = useState<number>(0);
  const [priceWholesaleWithIva, setPriceWholesaleWithIva] = useState<number>(0);

  // 3. Inventory Details State
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minAlertStock, setMinAlertStock] = useState<number>(5);
  const [reorderPoint, setReorderPoint] = useState<number>(10);
  const [location, setLocation] = useState('A-01');
  const [warehouseStocks, setWarehouseStocks] = useState<ProductWarehouseStock[]>([
    { warehouseId: 'wh-central', warehouseName: 'Depósito Central [Principal]', stock: 0 },
    { warehouseId: 'wh-deposito', warehouseName: 'Deposito', stock: 0 },
    { warehouseId: 'wh-bruzzone', warehouseName: 'Bruzzone Express', stock: 0 }
  ]);

  // 4. Fraccionado State
  const [isFractionable, setIsFractionable] = useState(false);
  const [fractionQuantity, setFractionQuantity] = useState<number>(1);
  const [fractionUnit, setFractionUnit] = useState('Litro');
  const [fractionPrice, setFractionPrice] = useState<number>(0);

  // 5. E-Commerce State
  const [publishOnline, setPublishOnline] = useState(false);
  const [publishWholesale, setPublishWholesale] = useState(false);
  const [wholesaleMinUnits, setWholesaleMinUnits] = useState<number>(1);
  const [wholesalePackageMultiple, setWholesalePackageMultiple] = useState<number>(1);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isOffer, setIsOffer] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLinkInput, setImageLinkInput] = useState('');

  // Load existing product if editing
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setCode(productToEdit.code || '');
      setDescription(productToEdit.description || '');
      setAltCode1(productToEdit.alternativeCodes?.[0] || '');
      setAltCode2(productToEdit.alternativeCodes?.[1] || '');
      setAltCode3(productToEdit.alternativeCodes?.[2] || '');
      setAltCode4(productToEdit.alternativeCodes?.[3] || '');
      setBarcode(productToEdit.barcode || '');
      setPrimaryUnit(productToEdit.primaryUnit || productToEdit.presentation || 'Unidad');
      setSalesUnit(productToEdit.salesUnit || productToEdit.presentation || 'Unidad');
      setCategory(productToEdit.category || 'Terminación para Mampostería');
      setBrand(productToEdit.brand || 'Colorear');
      setSupplierPrincipal(productToEdit.supplierName || '');
      setSupplierCode(productToEdit.supplierCode || '');
      setCurrencyBuy(productToEdit.currencyBuy || 'ARS');
      setCurrencySell(productToSellFromBuy(productToEdit.currencySell));

      // Costs
      const baseCost = productToEdit.costListWithoutIva ?? productToEdit.unitCost ?? 0;
      setCostListWithoutIva(baseCost);
      setDisc1(productToEdit.supplierDiscounts?.[0] || 0);
      setDisc2(productToEdit.supplierDiscounts?.[1] || 0);
      setDisc3(productToEdit.supplierDiscounts?.[2] || 0);
      setDisc4(productToEdit.supplierDiscounts?.[3] || 0);
      setIvaRate(productToEdit.ivaRate ?? 21);
      setProfitMarginContado(productToEdit.profitMarginPercent ?? 50);
      setPriceContadoWithIva(productToEdit.priceRetail || 0);
      setProfitMarginWholesale(productToEdit.profitMarginWholesalePercent ?? 30);
      setSellerCommissionPercent(productToEdit.sellerCommissionPercent ?? 0);
      setPriceWholesaleWithIva(productToEdit.priceWholesale || 0);

      // Stock
      setCurrentStock(productToEdit.stock || 0);
      setMinAlertStock(productToEdit.minStock || 5);
      setReorderPoint(productToEdit.reorderPoint || 10);
      setLocation(productToEdit.location || 'A-01');
      if (productToEdit.warehouseStocks && productToEdit.warehouseStocks.length > 0) {
        setWarehouseStocks(productToEdit.warehouseStocks);
      }

      // Fractionable
      setIsFractionable(productToEdit.isFractionable || false);
      setFractionQuantity(productToEdit.fractionQuantity || 1);
      setFractionUnit(productToEdit.fractionUnit || 'Litro');
      setFractionPrice(productToEdit.fractionPrice || 0);

      // E-Commerce
      setPublishOnline(productToEdit.publishOnline || false);
      setPublishWholesale(productToEdit.publishWholesale || false);
      setWholesaleMinUnits(productToEdit.wholesaleMinUnits || 1);
      setWholesalePackageMultiple(productToEdit.wholesalePackageMultiple || 1);
      setIsFeatured(productToEdit.isFeatured || false);
      setIsOffer(productToEdit.isOffer || false);
      setIsNew(productToEdit.isNew || false);
      setImageUrl(productToEdit.imageUrl || '');
      setImageLinkInput(productToEdit.imageUrl || '');
    } else {
      // Defaults for brand new product
      setName('');
      setCode(`CP-${Math.floor(Math.random() * 89999 + 10000)}`);
      setDescription('');
      setAltCode1('');
      setAltCode2('');
      setAltCode3('');
      setAltCode4('');
      setBarcode(`779000${Math.floor(Math.random() * 8999999 + 1000000)}`);
      setPrimaryUnit('Unidad');
      setSalesUnit('Unidad');
      setCategory(categories[0] || 'Terminación para Mampostería');
      setBrand('Colorear');
      setSupplierPrincipal(suppliers[0]?.businessName || 'Química del Plata S.A.');
      setSupplierCode(`PROV-${Math.floor(Math.random() * 899 + 100)}`);
      setCostListWithoutIva(5000);
      setDisc1(0);
      setDisc2(0);
      setDisc3(0);
      setDisc4(0);
      setIvaRate(21);
      setProfitMarginContado(50);
      setProfitMarginWholesale(30);
      setSellerCommissionPercent(0);
      setCurrentStock(10);
      setMinAlertStock(5);
      setReorderPoint(10);
      setLocation('A-01');
      setIsFractionable(false);
      setPublishOnline(false);
      setPublishWholesale(false);
      setImageUrl('');
      setImageLinkInput('');
    }
  }, [productToEdit, isOpen]);

  function productToSellFromBuy(c?: 'ARS' | 'USD'): 'ARS' | 'USD' {
    return c === 'USD' ? 'USD' : 'ARS';
  }

  // Cost calculation derived values
  const effectiveDiscountMultiplier = (1 - (disc1 || 0) / 100) * 
                                      (1 - (disc2 || 0) / 100) * 
                                      (1 - (disc3 || 0) / 100) * 
                                      (1 - (disc4 || 0) / 100);
  
  const unitNetCost = Math.round((costListWithoutIva || 0) * effectiveDiscountMultiplier * (qtyPerPackage || 1));
  const unitCostWithIva = Math.round(unitNetCost * (1 + ivaRate / 100));

  // Recalculate prices when costs or margins change
  useEffect(() => {
    if (unitNetCost > 0) {
      // Contado / Retail
      const priceNetContado = unitNetCost * (1 + (profitMarginContado || 0) / 100);
      const calculatedContadoWithIva = Math.round(priceNetContado * (1 + ivaRate / 100));
      setPriceContadoWithoutIva(Math.round(priceNetContado));
      if (!productToEdit) {
        setPriceContadoWithIva(calculatedContadoWithIva);
      }

      // Wholesale
      const wholesaleNet = unitNetCost * (1 + ((profitMarginWholesale || 0) + (sellerCommissionPercent || 0)) / 100);
      const calculatedWholesaleWithIva = Math.round(wholesaleNet * (1 + ivaRate / 100));
      if (!productToEdit) {
        setPriceWholesaleWithIva(calculatedWholesaleWithIva);
      }
    }
  }, [unitNetCost, profitMarginContado, profitMarginWholesale, sellerCommissionPercent, ivaRate]);

  // Handle warehouse stock update
  const handleWarehouseQuantityChange = (warehouseId: string, qty: number) => {
    setWarehouseStocks(prev => prev.map(wh => wh.warehouseId === warehouseId ? { ...wh, stock: qty } : wh));
    // Also update total currentStock
    const total = warehouseStocks.reduce((acc, wh) => acc + (wh.warehouseId === warehouseId ? qty : wh.stock), 0);
    setCurrentStock(total);
  };

  // Image upload handler (base64)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyImageLink = () => {
    if (imageLinkInput.trim()) {
      setImageUrl(imageLinkInput.trim());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('El nombre del producto es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalCode = code.trim() || `CP-${Math.floor(Math.random() * 89999 + 10000)}`;

      const newProduct: Product = {
        id: productToEdit?.id || `prod-${Date.now()}`,
        name: name.trim(),
        code: finalCode,
        description: description.trim() || undefined,
        category: category.trim(),
        presentation: salesUnit || primaryUnit || 'Unidad',
        volumeOrWeight: salesUnit || 'Unidad',
        color: 'Estándar',
        stock: currentStock,
        minStock: minAlertStock,
        reorderPoint,
        location: location.trim(),
        warehouseStocks,
        priceRetail: priceContadoWithIva > 0 ? priceContadoWithIva : Math.round(unitCostWithIva * 1.5),
        priceWholesale: priceWholesaleWithIva > 0 ? priceWholesaleWithIva : Math.round(unitCostWithIva * 1.3),
        priceDistributor: Math.round(unitCostWithIva * 1.2),
        unitCost: unitNetCost,
        costListWithoutIva,
        ivaRate,
        profitMarginPercent: profitMarginContado,
        profitMarginWholesalePercent: profitMarginWholesale,
        sellerCommissionPercent,
        supplierDiscounts: [disc1, disc2, disc3, disc4],
        brand: brand.trim(),
        supplierName: supplierPrincipal.trim() || undefined,
        supplierCode: supplierCode.trim() || undefined,
        barcode: barcode.trim() || undefined,
        alternativeCodes: [altCode1, altCode2, altCode3, altCode4].filter(Boolean),
        primaryUnit,
        salesUnit,
        currencyBuy,
        currencySell,
        isFractionable,
        fractionQuantity,
        fractionUnit,
        fractionPrice,
        publishOnline,
        publishWholesale,
        wholesaleMinUnits,
        wholesalePackageMultiple,
        isFeatured,
        isOffer,
        isNew,
        imageUrl: imageUrl.trim() || undefined,
        active: productToEdit ? productToEdit.active !== false : true
      };

      await onSave(newProduct);
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {productToEdit ? 'Modifique los datos del producto.' : 'Complete los datos del producto en las diferentes secciones.'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION TABS (General, Costos, Inventario, Fraccionado, E-Commerce) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-orange-600 text-orange-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('costos')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'costos'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Costos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventario')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'inventario'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Inventario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fraccionado')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'fraccionado'
                ? 'border-purple-600 text-purple-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fraccionado</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ecommerce')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ecommerce'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>E-Commerce</span>
          </button>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* =========================================================================
              TAB 1: INFORMACIÓN GENERAL
             ========================================================================= */}
          {activeTab === 'general' && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
              <h3 className="text-sm font-black text-orange-600 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Package className="w-4 h-4" />
                Información General
              </h3>

              {/* Name & SKU row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Martillo Stanley 20oz o Látex Interior Lavable 20L"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SKU / Código Interno (opcional)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="Se genera automáticamente si se deja vacío"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setCode(`CP-${Math.floor(Math.random() * 89999 + 10000)}`)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-300"
                      title="Generar código aleatorio"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Description textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descripción del producto para la tienda online y uso interno..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Se muestra en la tienda online cuando el cliente abre el producto
                </span>
              </div>

              {/* Alternative codes row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Código 1</label>
                  <input
                    type="text"
                    value={altCode1}
                    onChange={e => setAltCode1(e.target.value)}
                    placeholder="Código 1"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Código 2</label>
                  <input
                    type="text"
                    value={altCode2}
                    onChange={e => setAltCode2(e.target.value)}
                    placeholder="Código 2"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Código 3</label>
                  <input
                    type="text"
                    value={altCode3}
                    onChange={e => setAltCode3(e.target.value)}
                    placeholder="Código 3"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Código 4</label>
                  <input
                    type="text"
                    value={altCode4}
                    onChange={e => setAltCode4(e.target.value)}
                    placeholder="Código 4"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código de Barras
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="Ej: 7790001234567"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setBarcode(`779000${Math.floor(Math.random() * 8999999 + 1000000)}`)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-300"
                    title="Generar código de barras EAN-13"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Escanee o ingrese el código de barras EAN/UPC
                </span>
              </div>

              {/* Units */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidad Primaria (Stock) *
                  </label>
                  <select
                    value={primaryUnit}
                    onChange={e => setPrimaryUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Balde 20L">Balde 20 Litros</option>
                    <option value="Lata 10L">Lata 10 Litros</option>
                    <option value="Lata 4L">Lata 4 Litros</option>
                    <option value="Lata 1L">Lata 1 Litro</option>
                    <option value="Tambor 200L">Tambor 200 Litros</option>
                    <option value="Kg">Kilogramo (Kg)</option>
                    <option value="Litro">Litro</option>
                    <option value="Metro">Metro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unidad de Venta *
                  </label>
                  <select
                    value={salesUnit}
                    onChange={e => setSalesUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Balde 20L">Balde 20 Litros</option>
                    <option value="Lata 10L">Lata 10 Litros</option>
                    <option value="Lata 4L">Lata 4 Litros</option>
                    <option value="Lata 1L">Lata 1 Litro</option>
                    <option value="Tambor 200L">Tambor 200 Litros</option>
                    <option value="Kg">Kilogramo (Kg)</option>
                    <option value="Litro">Litro</option>
                  </select>
                </div>
              </div>

              {/* Category & Brand row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoría / Rubro
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca
                  </label>
                  <div className="flex items-center gap-1.5">
                    {showNewBrandInput ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          placeholder="Nueva marca..."
                          value={newBrandName}
                          onChange={e => setNewBrandName(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newBrandName.trim()) {
                              setBrand(newBrandName.trim());
                              setShowNewBrandInput(false);
                            }
                          }}
                          className="p-2 bg-emerald-600 text-white rounded-lg text-xs"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <select
                          value={brand}
                          onChange={e => setBrand(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                        >
                          {brands.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewBrandInput(true)}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300"
                          title="Agregar nueva marca"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Supplier row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proveedor Principal
                  </label>
                  <input
                    type="text"
                    value={supplierPrincipal}
                    onChange={e => setSupplierPrincipal(e.target.value)}
                    placeholder="Buscar o ingresar proveedor..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código Proveedor
                  </label>
                  <input
                    type="text"
                    value={supplierCode}
                    onChange={e => setSupplierCode(e.target.value)}
                    placeholder="Ej: ST201-M"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Moneda de Compra
                  </label>
                  <select
                    value={currencyBuy}
                    onChange={e => setCurrencyBuy(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares Estadounidenses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Moneda de Venta
                  </label>
                  <select
                    value={currencySell}
                    onChange={e => setCurrencySell(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares Estadounidenses</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: ESTRUCTURA DE COSTOS Y PRECIOS
             ========================================================================= */}
          {activeTab === 'costos' && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
              <h3 className="text-sm font-black text-emerald-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4" />
                Estructura de Costos y Precios
              </h3>

              {/* Costo de lista s/IVA */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo de lista (s/IVA)</label>
                  <input
                    type="number"
                    min="0"
                    value={costListWithoutIva}
                    onChange={e => setCostListWithoutIva(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cant. x bulto</label>
                  <input
                    type="number"
                    min="1"
                    value={qtyPerPackage}
                    onChange={e => setQtyPerPackage(parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cant. envasado</label>
                  <input
                    type="number"
                    min="1"
                    value={qtyPackaging}
                    onChange={e => setQtyPackaging(parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-800 mb-1">$ Costo unitario</label>
                  <div className="p-2 bg-emerald-100 text-emerald-900 rounded-lg font-mono font-black text-center text-sm border border-emerald-300">
                    ${unitNetCost.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              {/* Descuentos del proveedor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Descuentos del Proveedor
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Desc. 1 (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={disc1}
                      onChange={e => setDisc1(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Desc. 2 (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={disc2}
                      onChange={e => setDisc2(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Desc. 3 (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={disc3}
                      onChange={e => setDisc3(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block">Desc. 4 (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={disc4}
                      onChange={e => setDisc4(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Lista Contado */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
                <span className="text-xs font-black text-amber-900 block uppercase tracking-wider">
                  Lista Contado / Mostrador
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">% Ganancia Contado</label>
                    <input
                      type="number"
                      value={profitMarginContado}
                      onChange={e => setProfitMarginContado(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Precio (s/IVA)</label>
                    <div className="p-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-700">
                      ${priceContadoWithoutIva.toLocaleString('es-AR')}
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Precio Final (c/IVA)</label>
                    <input
                      type="number"
                      value={priceContadoWithIva}
                      onChange={e => setPriceContadoWithIva(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-amber-400 rounded-lg font-mono font-black text-amber-950 bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Lista Mayorista */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
                <span className="text-xs font-black text-blue-900 block uppercase tracking-wider">
                  Lista Mayorista / Pinturerías
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">% Ganancia Mayorista</label>
                    <input
                      type="number"
                      value={profitMarginWholesale}
                      onChange={e => setProfitMarginWholesale(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Comisión vendedor (%)</label>
                    <input
                      type="number"
                      value={sellerCommissionPercent}
                      onChange={e => setSellerCommissionPercent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-blue-900 mb-1">Precio Mayorista (c/IVA)</label>
                    <input
                      type="number"
                      value={priceWholesaleWithIva}
                      onChange={e => setPriceWholesaleWithIva(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-blue-400 rounded-lg font-mono font-black text-blue-950 bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-blue-800 bg-white/70 p-2.5 rounded-lg border border-blue-100">
                  Cálculo: Costo unitario s/IVA x (1 + (margen {profitMarginWholesale}% + comisión {sellerCommissionPercent}%) / 100) + IVA {ivaRate}%.
                </div>
              </div>

              {/* IVA rate */}
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-700 mb-1">IVA (%)</label>
                <select
                  value={ivaRate}
                  onChange={e => setIvaRate(parseFloat(e.target.value) || 21)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  <option value={21}>21% (Tasa General)</option>
                  <option value={10.5}>10.5% (Tasa Reducida)</option>
                  <option value={0}>0% (Exento)</option>
                </select>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 3: DETALLES DE INVENTARIO (From Screenshot 3)
             ========================================================================= */}
          {activeTab === 'inventario' && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
              <h3 className="text-sm font-black text-amber-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building className="w-4 h-4" />
                Detalles de Inventario
              </h3>

              {/* Stock numbers row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock actual</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={e => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 mb-1">Mínimo de alerta</label>
                  <input
                    type="number"
                    value={minAlertStock}
                    onChange={e => setMinAlertStock(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300 font-mono font-bold bg-amber-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-700 mb-1">Punto de pedido</label>
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={e => setReorderPoint(parseInt(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-300 font-mono font-bold bg-blue-50/50"
                  />
                </div>
              </div>

              {/* Yellow Alert Box from Screenshot */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Punto de Pedido</strong>
                  <span className="text-[11px] text-amber-800">
                    Cuando el stock llegue a <strong>{reorderPoint} unidades</strong>, el sistema generará automáticamente un aviso de faltante o pedido al proveedor.
                  </span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ej: A-05 o Pasillo 2 - Estantería 4"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Stock por Depósito/Sucursal (From Screenshot 3) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Stock por Depósito / Sucursal
                </label>
                
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                  {warehouseStocks.map(wh => (
                    <div 
                      key={wh.warehouseId}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900">{wh.warehouseName}</strong>
                        {wh.warehouseName.includes('Principal') && (
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          wh.stock <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {wh.stock} un.
                        </span>

                        <div className="flex items-center gap-1.5">
                          <select className="border border-slate-300 rounded px-2 py-1 text-xs bg-slate-50">
                            <option>Fijar en</option>
                            <option>Sumar (+)</option>
                            <option>Restar (-)</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Cant."
                            className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-mono font-bold"
                            onBlur={e => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                handleWarehouseQuantityChange(wh.warehouseId, val);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Confirmar ajuste de stock en sucursal"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 4: FRACCIONADO
             ========================================================================= */}
          {activeTab === 'fraccionado' && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
              <h3 className="text-sm font-black text-purple-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4" />
                Venta y Fraccionamiento de Producto
              </h3>

              <div className="flex items-center justify-between p-3.5 bg-purple-50/60 rounded-xl border border-purple-200">
                <div>
                  <strong className="text-xs text-purple-950 block">Habilitar Venta Fraccionada</strong>
                  <span className="text-[11px] text-purple-800">
                    Permite vender este producto en porciones o fracciones menores (ej: fraccionar balde de 20L en litros sueltos, o caja de 12 unidades por unidad).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isFractionable}
                  onChange={e => setIsFractionable(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {isFractionable && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sub-unidad de fraccionamiento</label>
                    <input
                      type="text"
                      value={fractionUnit}
                      onChange={e => setFractionUnit(e.target.value)}
                      placeholder="Ej: Litro o Unidad"
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cantidad contenida por envase</label>
                    <input
                      type="number"
                      min="1"
                      value={fractionQuantity}
                      onChange={e => setFractionQuantity(parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Precio sugerido por fracción ($)</label>
                    <input
                      type="number"
                      value={fractionPrice}
                      onChange={e => setFractionPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 5: E-COMMERCE & FOTOS (From Screenshot 4)
             ========================================================================= */}
          {activeTab === 'ecommerce' && (
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
              <h3 className="text-sm font-black text-sky-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="w-4 h-4" />
                E-Commerce & Publicación Digital
              </h3>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-xs text-slate-900 block">Publicar Online</strong>
                    <span className="text-[11px] text-slate-500">El producto será visible en tu tienda online.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={publishOnline}
                    onChange={e => setPublishOnline(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-xs text-slate-900 block">Publicar en Mayorista</strong>
                    <span className="text-[11px] text-slate-500">El producto será visible en la tienda mayorista / distribuidora.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={publishWholesale}
                    onChange={e => setPublishWholesale(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                  />
                </div>

                {/* Cantidades de venta mayorista */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Cantidades de venta mayorista</span>
                  <span className="text-[11px] text-slate-500 block">Sólo para mayorista. No modifica el bulto de compra, el costo ni la venta minorista.</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Mínimo de unidades mayorista</label>
                      <input
                        type="number"
                        min="1"
                        value={wholesaleMinUnits}
                        onChange={e => setWholesaleMinUnits(parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">Múltiplo de bulto mayorista</label>
                      <input
                        type="number"
                        min="1"
                        value={wholesalePackageMultiple}
                        onChange={e => setWholesalePackageMultiple(parseInt(e.target.value) || 1)}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-xs text-slate-900 block">Destacado</strong>
                    <span className="text-[11px] text-slate-500">El producto aparecerá en la sección de destacados de la tienda.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-xs text-slate-900 block">Oferta</strong>
                    <span className="text-[11px] text-slate-500">Marcar como producto en oferta. Se mostrará con etiqueta de oferta.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isOffer}
                    onChange={e => setIsOffer(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <strong className="text-xs text-slate-900 block">Novedad</strong>
                    <span className="text-[11px] text-slate-500">Marcar como producto nuevo / recién llegado.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={e => setIsNew(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Imagen del Producto (From Screenshot 4) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Imagen del Producto
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload from device */}
                  <label className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-50/50">
                    <Upload className="w-7 h-7 text-sky-600 mb-2" />
                    <span className="text-xs font-bold text-slate-800">Subir Imagen</span>
                    <span className="text-[11px] text-slate-400">Desde tu dispositivo (PNG, JPG, WEBP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  {/* Paste link */}
                  <div className="border border-slate-300 rounded-2xl p-5 flex flex-col justify-between bg-slate-50/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-sky-600" />
                      <span className="text-xs font-bold text-slate-800">Pegar Link</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={imageLinkInput}
                        onChange={e => setImageLinkInput(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyImageLink}
                        className="bg-sky-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-sky-700"
                      >
                        Aplicar
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Obtener imagen desde MercadoLibre o catálogo web: click derecho → "Copiar dirección de imagen".
                    </span>
                  </div>
                </div>

                {/* Preview if image exists */}
                {imageUrl && (
                  <div className="flex items-center gap-4 p-3 bg-slate-100 rounded-xl border border-slate-200">
                    <img 
                      src={imageUrl} 
                      alt="Vista previa" 
                      className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs" 
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <strong className="block text-slate-800">Imagen configurada</strong>
                      <span className="text-[11px] text-slate-500 truncate block">{imageUrl}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImageLinkInput('');
                      }}
                      className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg text-xs font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL FOOTER */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-md transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : (productToEdit ? 'Actualizar' : 'Guardar')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
