import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  TrendingUp, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  Filter, 
  Sparkles, 
  Check, 
  X,
  Factory,
  ArrowDownToLine,
  RefreshCw,
  Info,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { Product, CompanyConfig, Formula, ProductionOrder } from '../types';
import { exportPriceListToExcel, exportPriceListToPDF } from '../utils/exportUtils';

// Standard packaging options with real packaging cost in ARS and volume/weight details
export const PACKAGING_OPTIONS = [
  { id: '20l', label: '20 Litros (Balde plástico)', isLiters: true, volume: 20, containerCost: 3800, defaultContainer: 'Balde 20L', presentation: '20 Litros' },
  { id: '10l', label: '10 Litros (Balde plástico)', isLiters: true, volume: 10, containerCost: 2400, defaultContainer: 'Balde 10L', presentation: '10 Litros' },
  { id: '4l', label: '4 Litros (Lata litografiada)', isLiters: true, volume: 4, containerCost: 1950, defaultContainer: 'Lata 4L', presentation: '4 Litros' },
  { id: '1l', label: '1 Litro (Lata litografiada)', isLiters: true, volume: 1, containerCost: 1100, defaultContainer: 'Lata 1L', presentation: '1 Litro' },
  { id: '1_2l', label: '1/2 Litro (500 ml)', isLiters: true, volume: 0.5, containerCost: 750, defaultContainer: 'Lata 1/2L', presentation: '1/2 LT' },
  { id: '1_4l', label: '1/4 Litro (250 ml)', isLiters: true, volume: 0.25, containerCost: 550, defaultContainer: 'Lata 1/4L', presentation: '1/4 LT' },
  { id: '200l', label: '200 Litros (Tambor Industrial)', isLiters: true, volume: 200, containerCost: 25000, defaultContainer: 'Tambor 200L', presentation: '200 Litros' },
  { id: '30kg', label: '30 KG (Balde especial)', isLiters: false, weightKg: 30, containerCost: 4200, defaultContainer: 'Balde 30KG', presentation: '30 KG' },
  { id: '20kg', label: '20 KG (Balde)', isLiters: false, weightKg: 20, containerCost: 3800, defaultContainer: 'Balde 20KG', presentation: '20 KG' },
  { id: '15kg', label: '15 KG (Balde)', isLiters: false, weightKg: 15, containerCost: 2900, defaultContainer: 'Balde 15KG', presentation: '15 KG' },
  { id: '10kg', label: '10 KG (Balde)', isLiters: false, weightKg: 10, containerCost: 2400, defaultContainer: 'Balde 10KG', presentation: '10 KG' },
  { id: '6kg', label: '6 KG (Balde)', isLiters: false, weightKg: 6, containerCost: 1800, defaultContainer: 'Balde 6KG', presentation: '6 KG' },
  { id: '4kg', label: '4 KG (Pote/Balde)', isLiters: false, weightKg: 4, containerCost: 1500, defaultContainer: 'Balde 4KG', presentation: '4 KG' },
  { id: '1kg', label: '1 KG (Pote)', isLiters: false, weightKg: 1, containerCost: 800, defaultContainer: 'Pote 1KG', presentation: '1 KG' },
  { id: '1_2kg', label: '1/2 KG (Pote)', isLiters: false, weightKg: 0.5, containerCost: 500, defaultContainer: 'Pote 1/2KG', presentation: '1/2 KG' }
];

interface PriceListModuleProps {
  products: Product[];
  formulas?: Formula[];
  productionOrders?: ProductionOrder[];
  initialPreload?: { formula?: Formula; order?: ProductionOrder } | null;
  onClearPreload?: () => void;
  config: CompanyConfig | null;
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onBulkPriceUpdate: (
    percentageIncrease: number, 
    target: 'cost_only' | 'cost_and_sale' | 'sale_only', 
    category?: string
  ) => Promise<void>;
  onSyncOfficialCatalog?: () => Promise<any>;
}

export const PriceListModule: React.FC<PriceListModuleProps> = ({
  products,
  formulas = [],
  productionOrders = [],
  initialPreload = null,
  onClearPreload,
  config,
  onSaveProduct,
  onDeleteProduct,
  onBulkPriceUpdate,
  onSyncOfficialCatalog
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState<'production' | 'manual'>('production');
  const [productionSource, setProductionSource] = useState<'formula' | 'order'>('formula');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedPackagingId, setSelectedPackagingId] = useState<string>('20l');
  
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState<number>(5);
  const [bulkTarget, setBulkTarget] = useState<'cost_only' | 'cost_and_sale' | 'sale_only'>('cost_and_sale');
  const [bulkCategory, setBulkCategory] = useState<string>('all');
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [importedSourceText, setImportedSourceText] = useState<string | null>(null);

  // Helper to generate SKU: 2 first letters + "-" + 4 digits
  const generateSkuForName = (name: string): string => {
    const clean = name.trim().replace(/[^a-zA-Z]/g, '');
    const prefix = (clean.slice(0, 2) || 'CP').toUpperCase();

    // Find highest existing number for this prefix
    const existingWithPrefix = products
      .filter(p => p.code.startsWith(`${prefix}-`))
      .map(p => {
        const parts = p.code.split('-');
        return parts[1] ? parseInt(parts[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const nextNum = existingWithPrefix.length > 0 ? Math.max(...existingWithPrefix) + 1 : 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  };

  const [productForm, setProductForm] = useState<Partial<Product>>({
    code: '',
    name: '',
    category: 'Terminación para Mampostería',
    presentation: '20 Litros',
    volumeOrWeight: 'Balde 20L',
    color: 'Blanco',
    stock: 50,
    minStock: 20,
    priceDistributor: 42000,
    priceWholesale: 48000,
    priceRetail: 68000,
    unitCost: 26000
  });

  // Calculate costs and pricing when importing from a production formula and package
  const applyFormulaSelection = (formula: Formula, packagingId: string) => {
    const pack = PACKAGING_OPTIONS.find(p => p.id === packagingId) || PACKAGING_OPTIONS[0];
    const density = formula.density || 1.35;
    
    // Calculate theoretical paint mass for this container
    const paintMassKg = pack.isLiters 
      ? (pack.volume || 1) * density 
      : (pack.weightKg || 1);

    // Formula raw materials cost for this container
    const paintContentCost = Math.round(paintMassKg * formula.theoreticalCostPerKg);
    const containerCost = pack.containerCost;
    const totalUnitCost = paintContentCost + containerCost;

    // Factory pricing strategy:
    // Distributor (Pinturerías / Red oficial): Cost + 55%
    // Wholesale (Grandes obras / depósitos): +15% over distributor
    // Retail (Público sugerido): +45% over distributor
    const priceDistributor = Math.round(totalUnitCost * 1.55);
    const priceWholesale = Math.round(priceDistributor * 1.15);
    const priceRetail = Math.round(priceDistributor * 1.45);

    const cleanBaseName = formula.name
      .replace(/\(Base 100 kg\)/gi, '')
      .replace(/Fórmula/gi, '')
      .trim();

    const commercialName = `${cleanBaseName.toUpperCase()} ${pack.presentation}`;
    const skuCode = generateSkuForName(commercialName);

    setProductForm({
      code: skuCode,
      name: commercialName,
      category: formula.paintType || 'Terminación para Mampostería',
      presentation: pack.presentation,
      volumeOrWeight: pack.defaultContainer,
      color: 'Blanco / Estándar',
      stock: 30,
      minStock: 15,
      unitCost: totalUnitCost,
      priceDistributor,
      priceWholesale,
      priceRetail
    });

    setImportedSourceText(
      `Fórmula: "${formula.name}" en ${pack.presentation}. Costo Químico: $${paintContentCost} + Envase: $${containerCost} = Costo Unitario Fábrica $${totalUnitCost.toLocaleString('es-AR')}`
    );
  };

  // Calculate costs and pricing when importing from a production order
  const applyOrderSelection = (order: ProductionOrder) => {
    const packagingLabel = order.packagingType === 'balde_20l' ? '20 Litros' :
                           order.packagingType === 'lata_10l' ? '10 Litros' :
                           order.packagingType === 'lata_4l' ? '4 Litros' :
                           order.packagingType === 'lata_1l' ? '1 Litro' : '200 Litros';

    const calculatedUnitCost = order.packageCount > 0 
      ? Math.round(order.materialCost / order.packageCount) 
      : 25000;
    const priceDistributor = Math.round(calculatedUnitCost * 1.55);
    const priceWholesale = Math.round(priceDistributor * 1.15);
    const priceRetail = Math.round(priceDistributor * 1.45);

    const commercialName = `${order.productName.toUpperCase()} ${packagingLabel}`;
    const skuCode = generateSkuForName(commercialName);

    setProductForm({
      code: skuCode,
      name: commercialName,
      category: 'Terminación para Mampostería',
      presentation: packagingLabel,
      volumeOrWeight: packagingLabel,
      color: 'Estándar Fábrica',
      stock: order.packageCount || 30,
      minStock: 15,
      unitCost: calculatedUnitCost,
      priceDistributor,
      priceWholesale,
      priceRetail
    });

    setImportedSourceText(
      `Orden de Producción #${order.orderNumber} (Lote: ${order.batchNumber}, ${order.packageCount} u fabricadas, Costo: $${calculatedUnitCost.toLocaleString('es-AR')}/u)`
    );
  };

  // Listen for initial preload from Production Module
  useEffect(() => {
    if (initialPreload) {
      setModalMode('production');
      if (initialPreload.formula) {
        setProductionSource('formula');
        setSelectedFormulaId(initialPreload.formula.id);
        applyFormulaSelection(initialPreload.formula, selectedPackagingId);
      } else if (initialPreload.order) {
        setProductionSource('order');
        setSelectedOrderId(initialPreload.order.id);
        applyOrderSelection(initialPreload.order);
      }
      setShowProductModal(true);
      if (onClearPreload) onClearPreload();
    }
  }, [initialPreload]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.color.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.code) return;

    const newProd: Product = {
      id: productForm.id || `prod-${Date.now()}`,
      code: productForm.code.toUpperCase(),
      name: productForm.name,
      category: productForm.category || 'Terminación para Mampostería',
      presentation: productForm.presentation || '20 Litros',
      volumeOrWeight: productForm.volumeOrWeight || 'Balde 20L',
      color: productForm.color || 'Blanco',
      stock: Number(productForm.stock) || 0,
      minStock: Number(productForm.minStock) || 0,
      priceDistributor: Number(productForm.priceDistributor) || 0,
      priceWholesale: Number(productForm.priceWholesale) || 0,
      priceRetail: Number(productForm.priceRetail) || 0,
      unitCost: Number(productForm.unitCost) || 0
    };

    await onSaveProduct(newProd);
    setShowProductModal(false);
  };

  const handleBulkApply = async () => {
    if (bulkPercentage === 0) return;
    setIsApplyingBulk(true);
    try {
      await onBulkPriceUpdate(bulkPercentage, bulkTarget, bulkCategory);
      setShowBulkModal(false);
    } catch (err) {
      console.error('Error in bulk price update:', err);
    } finally {
      setIsApplyingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Lista Oficial de Precios & Catálogo
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Colorear Pinturas Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Listas diferenciadas: Distribuidores/Pinturerías, Mayoristas y Minorista sugerido con SKU codificado (2 letras + 4 dígitos).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* TRAER DESDE PRODUCCIÓN BUTTON */}
            <button
              onClick={() => {
                setModalMode('production');
                setImportedSourceText(null);
                if (formulas.length > 0) {
                  const defaultFormula = formulas[0];
                  setSelectedFormulaId(defaultFormula.id);
                  applyFormulaSelection(defaultFormula, selectedPackagingId);
                } else {
                  setProductForm({
                    code: '',
                    name: '',
                    category: 'Terminación para Mampostería',
                    presentation: '20 Litros',
                    volumeOrWeight: 'Balde 20L',
                    color: 'Blanco',
                    stock: 30,
                    minStock: 15,
                    priceDistributor: 0,
                    priceWholesale: 0,
                    priceRetail: 0,
                    unitCost: 0
                  });
                }
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
              title="Crear producto nuevo calculando costos y datos directamente desde las fórmulas u órdenes de producción"
            >
              <Factory className="w-4 h-4 text-amber-300" />
              <span>Traer desde Producción</span>
            </button>

            {onSyncOfficialCatalog && (
              <button
                disabled={isSyncing}
                onClick={async () => {
                  try {
                    setIsSyncing(true);
                    await onSyncOfficialCatalog();
                    setSyncSuccess(true);
                    setTimeout(() => setSyncSuccess(false), 4000);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all ${
                  syncSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                }`}
                title="Cargar y sincronizar todos los productos de la lista oficial Agosto 2026 con códigos SKU"
              >
                {isSyncing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sincronizando SKUs...
                  </>
                ) : syncSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> ¡Catálogo Agosto 2026 Sincronizado!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Recargar Lista Agosto 2026
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => exportPriceListToExcel(products, config || undefined)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)
            </button>

            <button
              onClick={() => exportPriceListToPDF(products, config || undefined)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4" /> PDF Oficial
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-2.5 rounded-xl border border-slate-200 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" /> % Masivo
            </button>

            <button
              onClick={() => {
                setModalMode('manual');
                setImportedSourceText(null);
                setProductForm({
                  code: '',
                  name: '',
                  category: 'Terminación para Mampostería',
                  presentation: '20 Litros',
                  volumeOrWeight: 'Balde 20L',
                  color: 'Blanco',
                  stock: 40,
                  minStock: 20,
                  priceDistributor: 42000,
                  priceWholesale: 48000,
                  priceRetail: 68000,
                  unitCost: 26000
                });
                setShowProductModal(true);
              }}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2.5 rounded-xl border border-slate-200"
            >
              <Plus className="w-4 h-4" /> Carga Manual
            </button>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por código SKU, pintura o color..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 shrink-0">Líneas:</span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? `Todos (${products.length})` : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Código SKU</th>
                <th className="p-3.5">Descripción del Producto</th>
                <th className="p-3.5">Línea / Categoría</th>
                <th className="p-3.5">Presentación</th>
                <th className="p-3.5">Color</th>
                <th className="p-3.5 text-right font-black text-emerald-800 bg-emerald-50/50">
                  Pinturerías / Distr. ($)
                </th>
                <th className="p-3.5 text-right font-bold text-blue-800">Mayorista ($)</th>
                <th className="p-3.5 text-right font-bold text-slate-700">P. Sugerido Público ($)</th>
                <th className="p-3.5 text-center">Stock</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No se encontraron productos en esta categoría o búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-red-700">
                        <span className="px-1.5 py-0.5 rounded bg-red-50 border border-red-200">
                          {p.code}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {p.presentation}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {p.color}
                      </td>
                      <td className="p-3.5 text-right font-mono font-extrabold text-emerald-700 bg-emerald-50/30">
                        $ {p.priceDistributor.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-blue-700">
                        $ {p.priceWholesale.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-600">
                        $ {p.priceRetail.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                          isLow 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setModalMode('manual');
                            setProductForm(p);
                            setImportedSourceText(null);
                            setShowProductModal(true);
                          }}
                          className="text-slate-400 hover:text-blue-600 p-1"
                          title="Editar producto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PRODUCT CREATION / EDITING WITH ADVANCED "TRAER DESDE PRODUCCIÓN" */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  {productForm.id ? 'Editar Producto de Pintura' : 'Crear Producto en Lista de Precios'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Opciones avanzadas: Traer directamente desde Producción con cálculo de costos o carga manual.
                </span>
              </div>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL TABS: PRODUCCIÓN vs MANUAL */}
            {!productForm.id && (
              <div className="mt-4 flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalMode('production')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    modalMode === 'production'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Factory className="w-4 h-4 text-[#d31627]" />
                  <span>Traer desde Producción (Recomendado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode('manual')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    modalMode === 'manual'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  <span>Carga Manual Directa</span>
                </button>
              </div>
            )}

            {/* SECTION: TRAER DESDE PRODUCCIÓN CONTROLS */}
            {modalMode === 'production' && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-red-50/70 via-amber-50/30 to-white border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#d31627] text-white">
                      <Factory className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      Seleccionar Origen en Planta
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-red-700 uppercase px-2 py-0.5 rounded bg-red-100">
                    Cálculo Automático de Costos & SKU
                  </span>
                </div>

                {/* Sub-selector: Formula vs Order */}
                <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="prodSource"
                      checked={productionSource === 'formula'}
                      onChange={() => setProductionSource('formula')}
                      className="text-[#d31627] focus:ring-red-500"
                    />
                    <span>1. Desde Fórmula Maestra (Receta Base x100)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="prodSource"
                      checked={productionSource === 'order'}
                      onChange={() => setProductionSource('order')}
                      className="text-[#d31627] focus:ring-red-500"
                    />
                    <span>2. Desde Lote Producido / Orden</span>
                  </label>
                </div>

                {/* Dropdowns based on sub-selector */}
                {productionSource === 'formula' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Fórmula de Producción:
                      </label>
                      <select
                        value={selectedFormulaId}
                        onChange={e => {
                          const fId = e.target.value;
                          setSelectedFormulaId(fId);
                          const f = formulas.find(item => item.id === fId);
                          if (f) applyFormulaSelection(f, selectedPackagingId);
                        }}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-medium"
                      >
                        {formulas.length === 0 ? (
                          <option value="">No hay fórmulas cargadas en producción</option>
                        ) : (
                          formulas.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.name} (Costo: ${f.theoreticalCostPerKg.toFixed(1)}/kg)
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Presentación / Envase:
                      </label>
                      <select
                        value={selectedPackagingId}
                        onChange={e => {
                          const pId = e.target.value;
                          setSelectedPackagingId(pId);
                          const f = formulas.find(item => item.id === selectedFormulaId);
                          if (f) applyFormulaSelection(f, pId);
                        }}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-medium"
                      >
                        {PACKAGING_OPTIONS.map(pack => (
                          <option key={pack.id} value={pack.id}>
                            {pack.label} (Envase: ${pack.containerCost})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Seleccionar Orden / Lote Fabricado:
                    </label>
                    <select
                      value={selectedOrderId}
                      onChange={e => {
                        const oId = e.target.value;
                        setSelectedOrderId(oId);
                        const o = productionOrders.find(item => item.id === oId);
                        if (o) applyOrderSelection(o);
                      }}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="">Seleccionar orden de fabricación...</option>
                      {productionOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.orderNumber} - {o.productName} (Lote: {o.batchNumber}, {o.packageCount} u, Costo: ${Math.round(o.materialCost / (o.packageCount || 1))}/u)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {importedSourceText && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-800 font-medium flex items-start gap-2 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="leading-tight">
                      <strong className="block text-emerald-950 font-bold mb-0.5">Datos importados con éxito:</strong>
                      <span>{importedSourceText}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCT EDITING FORM */}
            <form onSubmit={handleProductSubmit} className="mt-4 space-y-3">
              {/* SKU & CATEGORY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Código SKU (XX-####)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (productForm.name) {
                          setProductForm(prev => ({
                            ...prev,
                            code: generateSkuForName(prev.name || '')
                          }));
                        }
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                      title="Regenerar código SKU con las 2 primeras letras de la descripción + 4 dígitos"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto-generar
                    </button>
                  </div>
                  <input
                    type="text"
                    value={productForm.code}
                    onChange={e => setProductForm({ ...productForm, code: e.target.value.toUpperCase() })}
                    placeholder="Ej: LA-0035"
                    className="w-full text-xs p-2 rounded-xl border border-red-300 font-mono font-bold text-red-700 bg-red-50/20"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Formato oficial: 2 primeras letras de la descripción seguido por guion '-' y 4 dígitos correlativos.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Línea / Categoría</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Ej: Terminación para Mampostería, Esmaltes Sintéticos, etc.
                  </span>
                </div>
              </div>

              {/* PRODUCT NAME */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Descripción Comercial del Producto
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={e => {
                    const newName = e.target.value;
                    const newSku = !productForm.id ? generateSkuForName(newName) : productForm.code;
                    setProductForm({ 
                      ...productForm, 
                      name: newName,
                      code: productForm.code || newSku 
                    });
                  }}
                  placeholder="Ej: LÁTEX CIELORRASOS 20 LTS"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  required
                />
              </div>

              {/* PRESENTATION, COLOR, STOCK */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Presentación</label>
                  <input
                    type="text"
                    value={productForm.presentation}
                    onChange={e => setProductForm({ ...productForm, presentation: e.target.value })}
                    placeholder="20 Litros"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Color / Tono</label>
                  <input
                    type="text"
                    value={productForm.color}
                    onChange={e => setProductForm({ ...productForm, color: e.target.value })}
                    placeholder="Blanco Nieve"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* PRICING TIERS */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-extrabold text-slate-700 uppercase block">
                  Escala de Precios de Fábrica
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">
                      P. Pinturería / Distr. ($)
                    </label>
                    <input
                      type="number"
                      value={productForm.priceDistributor}
                      onChange={e => setProductForm({ ...productForm, priceDistributor: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-emerald-300 font-mono font-bold text-emerald-800 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-blue-800 uppercase mb-1">
                      P. Mayorista ($)
                    </label>
                    <input
                      type="number"
                      value={productForm.priceWholesale}
                      onChange={e => setProductForm({ ...productForm, priceWholesale: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-blue-300 font-mono font-bold text-blue-800 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      P. Sugerido Público ($)
                    </label>
                    <input
                      type="number"
                      value={productForm.priceRetail}
                      onChange={e => setProductForm({ ...productForm, priceRetail: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="text-[11px] font-medium text-slate-600">
                    Costo Unitario de Fabricación (Insumos + Envase):
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-800">
                    <span>$</span>
                    <input
                      type="number"
                      value={productForm.unitCost}
                      onChange={e => setProductForm({ ...productForm, unitCost: Number(e.target.value) })}
                      className="w-24 p-1 rounded-lg border border-slate-300 text-right bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                >
                  {productForm.id ? 'Guardar Cambios' : 'Incorporar a Lista de Precios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BULK PERCENTAGE ADJUSTMENT (COSTO / VENTA / AMBOS) */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Ajuste Masivo de Precios & Costos (%)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Actualización general porcentual para el catálogo de pinturas
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {/* TARGET SELECTION: Venta Solo / Costo y Venta / Solo al Costo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  ¿Qué valores deseas actualizar?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkTarget('sale_only')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkTarget === 'sale_only'
                        ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200 text-purple-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs block">Venta Solo</span>
                      <Tag className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Actualiza listas distribuidor, mayorista y minorista. El costo de fábrica no cambia.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkTarget('cost_and_sale')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkTarget === 'cost_and_sale'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs block">Costo y Venta</span>
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Ajusta en paralelo el costo unitario de fabricación y todas las listas de venta.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkTarget('cost_only')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkTarget === 'cost_only'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs block">Solo al Costo</span>
                      <Factory className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] leading-tight text-slate-500">
                      Ajusta únicamente el costo de fabricación (unitCost). Los precios de venta quedan fijos.
                    </p>
                  </button>
                </div>
              </div>

              {/* CATEGORY FILTER */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Alcance / Categoría de Productos
                </label>
                <select
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium bg-white"
                >
                  <option value="all">Todo el Catálogo Oficial ({products.length} productos)</option>
                  {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                    <option key={cat} value={cat}>
                      Solo: {cat} ({products.filter(p => p.category === cat).length} productos)
                    </option>
                  ))}
                </select>
              </div>

              {/* PERCENTAGE INPUT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Porcentaje de Variación (+ o -)
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Factor multiplicador: x{(1 + bulkPercentage / 100).toFixed(4)}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={bulkPercentage}
                    onChange={e => setBulkPercentage(Number(e.target.value))}
                    className="w-full text-base font-mono font-bold p-2.5 rounded-xl border border-slate-300 pr-10 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Ej: 5 o -3"
                  />
                  <span className="absolute right-3.5 top-2.5 font-bold text-slate-400">%</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[-5, 3, 5, 8, 10, 12, 15, 20].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBulkPercentage(pct)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        bulkPercentage === pct
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pct > 0 ? `+${pct}%` : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* PREVIEW SIMULATION BOX */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  Simulación de impacto (Ejemplos):
                </span>
                <div className="space-y-1.5 text-xs">
                  {products.slice(0, 2).map(sample => {
                    const factor = 1 + bulkPercentage / 100;
                    const newCost = Math.round(sample.unitCost * factor);
                    const newDist = Math.round(sample.priceDistributor * factor);

                    return (
                      <div key={sample.id} className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="truncate max-w-[200px]">
                          <strong className="text-slate-900 block truncate">{sample.name}</strong>
                          <span className="text-[10px] font-mono text-slate-500">{sample.code} • {sample.presentation}</span>
                        </div>
                        <div className="text-right font-mono text-[11px]">
                          {(bulkTarget === 'cost_only' || bulkTarget === 'cost_and_sale') && (
                            <div>
                              <span className="text-slate-400 line-through mr-1">${sample.unitCost.toLocaleString('es-AR')}</span>
                              <strong className="text-emerald-700 font-bold">${newCost.toLocaleString('es-AR')} (Costo)</strong>
                            </div>
                          )}
                          {(bulkTarget === 'sale_only' || bulkTarget === 'cost_and_sale') && (
                            <div>
                              <span className="text-slate-400 line-through mr-1">${sample.priceDistributor.toLocaleString('es-AR')}</span>
                              <strong className="text-purple-700 font-bold">${newDist.toLocaleString('es-AR')} (Dist.)</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkApply}
                disabled={isApplyingBulk || bulkPercentage === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-black disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isApplyingBulk ? (
                  <span>Aplicando cambios...</span>
                ) : (
                  <span>
                    Aplicar {bulkPercentage > 0 ? `+${bulkPercentage}%` : `${bulkPercentage}%`} ({bulkTarget === 'cost_only' ? 'Solo al Costo' : bulkTarget === 'sale_only' ? 'Venta Solo' : 'Costo y Venta'})
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
