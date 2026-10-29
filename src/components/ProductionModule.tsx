import React, { useState, useMemo } from 'react';
import { 
  Factory, 
  Plus, 
  FlaskConical, 
  Layers, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  FileText, 
  Trash2, 
  Edit3, 
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  History,
  Scale,
  RefreshCw,
  Tag,
  Search,
  Copy,
  Printer,
  QrCode,
  ShieldCheck,
  Calendar,
  Beaker,
  Thermometer,
  Droplets,
  Sliders
} from 'lucide-react';
import { 
  RawMaterial, 
  Formula, 
  ProductionOrder, 
  PackagingType, 
  Product, 
  InventoryMovement,
  RawMaterialCategory,
  UnitType,
  FormulaItem
} from '../types';

interface ProductionModuleProps {
  rawMaterials: RawMaterial[];
  formulas: Formula[];
  productionOrders: ProductionOrder[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  onSaveRawMaterial: (mat: RawMaterial) => Promise<void>;
  onDeleteRawMaterial: (id: string) => Promise<void>;
  onSaveFormula: (formula: Formula) => Promise<void>;
  onDeleteFormula: (id: string) => Promise<void>;
  onCreateProductionOrder: (order: ProductionOrder) => Promise<void>;
  onCompleteProductionOrder: (order: ProductionOrder) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: ProductionOrder['status']) => Promise<void>;
  onSendToPriceList?: (preload: { formula?: Formula; order?: ProductionOrder }) => void;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({
  rawMaterials,
  formulas,
  productionOrders,
  products,
  inventoryMovements,
  onSaveRawMaterial,
  onDeleteRawMaterial,
  onSaveFormula,
  onDeleteFormula,
  onCreateProductionOrder,
  onCompleteProductionOrder,
  onUpdateOrderStatus,
  onSendToPriceList
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'formulas' | 'materials' | 'kardex'>('orders');

  // Search & Filter state for Orders
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Modals
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<ProductionOrder | null>(null);
  const [viewingLabelsOrder, setViewingLabelsOrder] = useState<ProductionOrder | null>(null);
  const [labelCopiesCount, setLabelCopiesCount] = useState<number>(4);

  // Helper generators for Lote and Partida
  const generateNewBatchNumber = () => {
    const yr = new Date().getFullYear();
    const mo = String(new Date().getMonth() + 1).padStart(2, '0');
    const rnd = String(Math.floor(Math.random() * 899 + 100));
    return `LOT-${yr}-${mo}${rnd}`;
  };

  const generateNewPartidaNumber = () => {
    const yr = new Date().getFullYear().toString().slice(2);
    const mo = String(new Date().getMonth() + 1).padStart(2, '0');
    const rnd = String(Math.floor(Math.random() * 899 + 100));
    return `PAR-${yr}${mo}-${rnd}`;
  };

  // New Material form state
  const [materialForm, setMaterialForm] = useState<Partial<RawMaterial>>({
    code: '',
    name: '',
    category: 'resina',
    unit: 'kg',
    currentStock: 100,
    minStock: 50,
    unitCost: 1000,
    supplierName: ''
  });

  // New Formula form state
  const [formulaForm, setFormulaForm] = useState<{
    code: string;
    name: string;
    paintType: string;
    density: number;
    baseQuantity: number;
    notes: string;
    items: { rawMaterialId: string; percentageOrKg: number }[];
  }>({
    code: '',
    name: '',
    paintType: 'Látex Interior',
    density: 1.35,
    baseQuantity: 100,
    notes: '',
    items: []
  });

  // New Production Order (Hoja de Producción) form state with Lote & Partida
  const [orderForm, setOrderForm] = useState<{
    formulaId: string;
    targetKg: number;
    packagingType: PackagingType;
    operatorName: string;
    batchNumber: string;
    partidaNumber: string;
    manufacturingTank: string;
    manufacturingDate: string;
    expirationDate: string;
    viscosityKU: number;
    ph: number;
    densityReal: number;
    qcStatus: 'pendiente' | 'aprobado' | 'rechazado' | 'ajustado';
    qcInspector: string;
    notes: string;
  }>({
    formulaId: formulas[0]?.id || '',
    targetKg: 1000,
    packagingType: 'balde_20l',
    operatorName: 'Martín Ibarra (Jefe de Planta)',
    batchNumber: generateNewBatchNumber(),
    partidaNumber: generateNewPartidaNumber(),
    manufacturingTank: 'Dispersor Cowles #1 (2.000 L)',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expirationDate: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() + 2);
      return d.toISOString().split('T')[0];
    })(),
    viscosityKU: 102,
    ph: 8.8,
    densityReal: 1.38,
    qcStatus: 'aprobado',
    qcInspector: 'Bioq. Laura Méndez (Control de Calidad)',
    notes: ''
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchMaterial, setSearchMaterial] = useState('');

  // Helpers for packaging units
  const getPackagingVolume = (type: PackagingType) => {
    switch (type) {
      case 'balde_20l': return 20;
      case 'lata_10l': return 10;
      case 'lata_4l': return 4;
      case 'lata_1l': return 1;
      case 'tambor_200l': return 200;
    }
  };

  const getPackagingLabel = (type: PackagingType) => {
    switch (type) {
      case 'balde_20l': return 'Balde 20 Litros';
      case 'lata_10l': return 'Balde / Lata 10 Litros';
      case 'lata_4l': return 'Lata 4 Litros';
      case 'lata_1l': return 'Lata 1 Litro';
      case 'tambor_200l': return 'Tambor 200 Litros';
    }
  };

  // Selected formula calculations in Order Modal
  const selectedFormula = formulas.find(f => f.id === orderForm.formulaId) || formulas[0];
  const calculatedLiters = selectedFormula && selectedFormula.density > 0 
    ? orderForm.targetKg / selectedFormula.density 
    : orderForm.targetKg / 1.35;
  const packageVolume = getPackagingVolume(orderForm.packagingType);
  const calculatedPackageCount = Math.round(calculatedLiters / packageVolume);
  const calculatedTheoreticalCost = selectedFormula 
    ? (selectedFormula.theoreticalCostPerKg * orderForm.targetKg)
    : 0;

  // Handle Material Submit
  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialForm.name || !materialForm.code) return;

    const newMaterial: RawMaterial = {
      id: materialForm.id || `rm-${Date.now()}`,
      code: materialForm.code.toUpperCase(),
      name: materialForm.name,
      category: (materialForm.category as RawMaterialCategory) || 'resina',
      unit: (materialForm.unit as UnitType) || 'kg',
      currentStock: Number(materialForm.currentStock) || 0,
      minStock: Number(materialForm.minStock) || 0,
      unitCost: Number(materialForm.unitCost) || 0,
      supplierName: materialForm.supplierName || 'Proveedor General',
      updatedAt: new Date().toISOString()
    };

    await onSaveRawMaterial(newMaterial);
    setShowMaterialModal(false);
    setMaterialForm({
      code: '',
      name: '',
      category: 'resina',
      unit: 'kg',
      currentStock: 100,
      minStock: 50,
      unitCost: 1000,
      supplierName: ''
    });
  };

  // Add ingredient to formula
  const addFormulaItem = () => {
    if (rawMaterials.length === 0) return;
    setFormulaForm(prev => ({
      ...prev,
      items: [...prev.items, { rawMaterialId: rawMaterials[0].id, percentageOrKg: 10 }]
    }));
  };

  const removeFormulaItem = (index: number) => {
    setFormulaForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateFormulaItem = (index: number, rawMaterialId: string, percentageOrKg: number) => {
    setFormulaForm(prev => {
      const items = [...prev.items];
      items[index] = { rawMaterialId, percentageOrKg };
      return { ...prev, items };
    });
  };

  // Calculate theoretical cost of formula
  const currentFormulaCost = formulaForm.items.reduce((acc, it) => {
    const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
    if (!mat) return acc;
    return acc + (mat.unitCost * (it.percentageOrKg / 100));
  }, 0);

  const totalFormulaPercentage = formulaForm.items.reduce((acc, it) => acc + (Number(it.percentageOrKg) || 0), 0);

  // Handle Formula Submit
  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaForm.name || !formulaForm.code || formulaForm.items.length === 0) return;

    const formattedItems: FormulaItem[] = formulaForm.items.map(it => {
      const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
      return {
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: mat?.name || 'Materia Prima',
        percentageOrKg: Number(it.percentageOrKg),
        unit: mat?.unit || 'kg'
      };
    });

    const newFormula: Formula = {
      id: `form-${Date.now()}`,
      code: formulaForm.code.toUpperCase(),
      name: formulaForm.name,
      paintType: formulaForm.paintType,
      density: Number(formulaForm.density) || 1.35,
      theoreticalCostPerKg: currentFormulaCost,
      baseQuantity: 100,
      items: formattedItems,
      notes: formulaForm.notes,
      createdAt: new Date().toISOString()
    };

    await onSaveFormula(newFormula);
    setShowFormulaModal(false);
    setFormulaForm({
      code: '',
      name: '',
      paintType: 'Látex Interior',
      density: 1.35,
      baseQuantity: 100,
      notes: '',
      items: []
    });
  };

  // Handle Production Order Submit with LOTE and PARTIDA
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFormula) return;

    const orderNumber = `OP-${new Date().getFullYear()}-${String(productionOrders.length + 1).padStart(4, '0')}`;

    const newOrder: ProductionOrder = {
      id: `po-${Date.now()}`,
      orderNumber,
      formulaId: selectedFormula.id,
      productName: selectedFormula.name,
      batchNumber: orderForm.batchNumber.trim(),
      partidaNumber: orderForm.partidaNumber.trim(),
      manufacturingTank: orderForm.manufacturingTank,
      manufacturingDate: orderForm.manufacturingDate,
      expirationDate: orderForm.expirationDate,
      viscosityKU: Number(orderForm.viscosityKU) || 102,
      ph: Number(orderForm.ph) || 8.8,
      densityReal: Number(orderForm.densityReal) || Number(selectedFormula.density) || 1.38,
      qcStatus: orderForm.qcStatus,
      qcInspector: orderForm.qcInspector,
      targetKg: Number(orderForm.targetKg),
      packagingType: orderForm.packagingType,
      packageCount: calculatedPackageCount,
      status: 'en_proceso',
      materialCost: calculatedTheoreticalCost,
      operatorName: orderForm.operatorName,
      notes: orderForm.notes,
      createdAt: new Date().toISOString()
    };

    await onCreateProductionOrder(newOrder);
    setShowOrderModal(false);

    // Refresh form with new progressive IDs for next order
    setOrderForm(prev => ({
      ...prev,
      batchNumber: generateNewBatchNumber(),
      partidaNumber: generateNewPartidaNumber(),
      notes: ''
    }));
  };

  // Filtered Production Orders
  const filteredProductionOrders = useMemo(() => {
    return productionOrders.filter(o => {
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const q = orderSearchQuery.toLowerCase();
      const matchSearch = !q || 
        o.orderNumber.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.batchNumber.toLowerCase().includes(q) ||
        (o.partidaNumber && o.partidaNumber.toLowerCase().includes(q)) ||
        (o.operatorName && o.operatorName.toLowerCase().includes(q)) ||
        (o.manufacturingTank && o.manufacturingTank.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [productionOrders, orderStatusFilter, orderSearchQuery]);

  // Filtered materials
  const filteredMaterials = rawMaterials.filter(m => {
    const matchesCat = categoryFilter === 'all' || m.category === categoryFilter;
    const matchesSearch = searchMaterial === '' || 
      m.name.toLowerCase().includes(searchMaterial.toLowerCase()) ||
      m.code.toLowerCase().includes(searchMaterial.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-[#d31627]">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Módulo de Producción Industrial
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-red-100 text-red-800">
                  Lote, Partida & Trazabilidad
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de lotes, partidas de fabricación, dosificación de materias primas, control de calidad y rótulos de envases.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (formulas.length === 0) {
                  alert('Por favor crea una fórmula primero.');
                  return;
                }
                setOrderForm(prev => ({
                  ...prev,
                  batchNumber: generateNewBatchNumber(),
                  partidaNumber: generateNewPartidaNumber()
                }));
                setShowOrderModal(true);
              }}
              className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Generar Lote & Partida
            </button>
            <button
              onClick={() => {
                setShowFormulaModal(true);
                if (formulaForm.items.length === 0 && rawMaterials.length > 0) {
                  setFormulaForm(prev => ({
                    ...prev,
                    items: [
                      { rawMaterialId: rawMaterials[0].id, percentageOrKg: 30 },
                      { rawMaterialId: rawMaterials[1]?.id || rawMaterials[0].id, percentageOrKg: 20 }
                    ]
                  }));
                }
              }}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors"
            >
              <FlaskConical className="w-4 h-4 text-emerald-400" /> Nueva Fórmula x 100
            </button>
            <button
              onClick={() => setShowMaterialModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-slate-200"
            >
              <Plus className="w-4 h-4" /> Cargar Materia Prima
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'orders'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Lotes & Partidas de Fabricación ({productionOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'formulas'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Fórmulas & Recetas x 100 ({formulas.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'materials'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Materias Primas & Costos ({rawMaterials.length})
          </button>
          <button
            onClick={() => setActiveTab('kardex')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'kardex'
                ? 'bg-[#d31627] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Kardex & Trazabilidad de Salidas ({inventoryMovements.length})
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCTION ORDERS WITH LOTE & PARTIDA */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Search & Status Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por Lote (LOT-), Partida (PAR-), OP o pintura..."
                value={orderSearchQuery}
                onChange={e => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto text-xs font-bold">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'en_proceso', label: 'En Proceso' },
                { id: 'completada', label: 'Completadas / Stock' },
                { id: 'planificada', label: 'Planificadas' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setOrderStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                    orderStatusFilter === st.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {filteredProductionOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400 space-y-2">
              <Factory className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No se encontraron órdenes con los filtros actuales.</p>
              <p className="text-xs text-slate-400">Prueba con otro número de lote, partida o genera una nueva orden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProductionOrders.map(order => {
                const formula = formulas.find(f => f.id === order.formulaId);
                const isCompleted = order.status === 'completada';
                const isInProcess = order.status === 'en_proceso';

                return (
                  <div 
                    key={order.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                      isCompleted 
                        ? 'border-emerald-200 bg-emerald-50/15' 
                        : isInProcess 
                        ? 'border-amber-300 bg-amber-50/15' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Bar: OP Number + Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isInProcess 
                            ? 'bg-amber-100 text-amber-900 animate-pulse' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-extrabold text-slate-900 text-base mt-2.5 leading-snug">
                        {order.productName}
                      </h3>

                      {/* LOTE & PARTIDA HIGHLIGHT BADGES */}
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="p-2 rounded-xl bg-red-50/80 border border-red-200/90 text-left">
                          <span className="text-[9px] uppercase font-black tracking-wider text-red-700 block">
                            🏷️ Lote de Fabricación:
                          </span>
                          <strong className="font-mono text-xs font-black text-slate-900 block truncate">
                            {order.batchNumber}
                          </strong>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/90 text-left">
                          <span className="text-[9px] uppercase font-black tracking-wider text-blue-700 block">
                            🧪 Partida de Fabricación:
                          </span>
                          <strong className="font-mono text-xs font-black text-slate-900 block truncate">
                            {order.partidaNumber || 'PAR-01'}
                          </strong>
                        </div>
                      </div>

                      {/* Batch specifications & QC Parameters */}
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tina / Dispersor:</span>
                          <strong className="text-slate-900 truncate max-w-[160px]">
                            {order.manufacturingTank || 'Dispersor Cowles #1'}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Masa / Rendimiento:</span>
                          <strong className="text-slate-900 font-mono">{order.targetKg.toLocaleString('es-AR')} kg</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Envasado & Bultos:</span>
                          <strong className="text-red-700 font-black font-mono">
                            {order.packageCount} un. ({getPackagingLabel(order.packagingType)})
                          </strong>
                        </div>

                        {/* Quality Control indicators */}
                        <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-1 text-center text-[10px]">
                          <div className="bg-white p-1 rounded border border-slate-200">
                            <span className="text-slate-400 block font-bold">Viscosidad</span>
                            <strong className="text-slate-800 font-mono">{order.viscosityKU || 102} KU</strong>
                          </div>
                          <div className="bg-white p-1 rounded border border-slate-200">
                            <span className="text-slate-400 block font-bold">pH</span>
                            <strong className="text-slate-800 font-mono">{order.ph || 8.8}</strong>
                          </div>
                          <div className="bg-white p-1 rounded border border-slate-200">
                            <span className="text-slate-400 block font-bold">Densidad</span>
                            <strong className="text-slate-800 font-mono">{order.densityReal || 1.38} kg/L</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                          <span className="text-slate-500">Costo Estimado:</span>
                          <strong className="text-emerald-700 font-mono">
                            $ {order.materialCost.toLocaleString('es-AR')}
                          </strong>
                        </div>
                      </div>

                      {order.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-2.5 line-clamp-2">
                          "{order.notes}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                          title="Ver e imprimir Hoja de Fabricación con checklist de planta"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Hoja de Fábrica</span>
                        </button>

                        <button
                          onClick={() => setViewingLabelsOrder(order)}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-blue-200/70"
                          title="Imprimir Rótulos / Etiquetas adhesivas para baldes y latas"
                        >
                          <Tag className="w-3.5 h-3.5 text-blue-600" />
                          <span>Etiquetas Envases</span>
                        </button>
                      </div>

                      {!isCompleted ? (
                        <button
                          onClick={() => onCompleteProductionOrder(order)}
                          className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-transform active:scale-95"
                          title="Baja automática de materias primas y alta a producto terminado con su lote y partida"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Finalizar Partida & Dar Alta
                        </button>
                      ) : (
                        <div className="flex items-center justify-between pt-1 text-xs font-semibold text-emerald-700">
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Stock Oficial Disponible
                          </span>
                          {onSendToPriceList && (
                            <button
                              onClick={() => onSendToPriceList({ order })}
                              className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 transition-colors"
                            >
                              Ver en Lista
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FORMULAS X 100 */}
      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formulas.map(formula => (
            <div key={formula.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {formula.code}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Densidad: {formula.density} kg/L
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base mt-2">
                  {formula.name}
                </h3>
                <span className="text-xs text-slate-400 capitalize block mt-0.5">
                  {formula.paintType}
                </span>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Base de Receta:</span>
                    <strong className="text-slate-900">{formula.baseQuantity} kg</strong>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Costo Teórico / kg:</span>
                    <strong className="text-emerald-700 font-mono">
                      $ {formula.theoreticalCostPerKg.toFixed(2)}
                    </strong>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Componentes Químicos:</span>
                    <strong className="text-slate-900">{formula.items.length} materias primas</strong>
                  </div>
                </div>

                {formula.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-2.5 line-clamp-2">
                    "{formula.notes}"
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setOrderForm(prev => ({
                      ...prev,
                      formulaId: formula.id,
                      targetKg: 1000,
                      batchNumber: generateNewBatchNumber(),
                      partidaNumber: generateNewPartidaNumber()
                    }));
                    setShowOrderModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95"
                >
                  <Factory className="w-3.5 h-3.5" /> Fabricar Partida
                </button>
                <button
                  onClick={() => onDeleteFormula(formula.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Eliminar fórmula"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: RAW MATERIALS WITH STOCK & COST */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar por código, resina, pigmento o aditivo..."
                value={searchMaterial}
                onChange={e => setSearchMaterial(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1">
              {['all', 'resina', 'pigmento', 'carga', 'aditivo', 'solvente', 'envase'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Código</th>
                    <th className="p-3.5">Materia Prima / Insumo</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5 text-right">Stock Actual</th>
                    <th className="p-3.5 text-right">Stock Mínimo</th>
                    <th className="p-3.5 text-right">Costo Unitario ($)</th>
                    <th className="p-3.5 text-right">Valorizado ($)</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(mat => {
                    const isLowStock = mat.currentStock <= mat.minStock;
                    const totalValued = mat.currentStock * mat.unitCost;

                    return (
                      <tr key={mat.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                        <td className="p-3.5 font-mono font-bold text-slate-700">{mat.code}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{mat.name}</div>
                          <div className="text-[11px] text-slate-400">{mat.supplierName}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {mat.category}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-black text-slate-900">
                          {mat.currentStock.toLocaleString('es-AR')} {mat.unit}
                          {isLowStock && (
                            <span className="block text-[10px] text-red-600 font-bold">
                              Stock Crítico
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500">
                          {mat.minStock.toLocaleString('es-AR')} {mat.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                          $ {mat.unitCost.toLocaleString('es-AR')} /{mat.unit}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                          $ {totalValued.toLocaleString('es-AR')}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setMaterialForm(mat);
                              setShowMaterialModal(true);
                            }}
                            className="text-slate-400 hover:text-slate-800 p-1 mr-1"
                            title="Editar materia prima"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRawMaterial(mat.id)}
                            className="text-slate-400 hover:text-red-600 p-1"
                            title="Eliminar materia prima"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KARDEX & TRACEABILITY */}
      {activeTab === 'kardex' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Registro Histórico de Movimientos de Inventario (Kardex)
              </h3>
              <p className="text-xs text-slate-500">
                Auditoría en tiempo real con trazabilidad de Lote y Partida de fabricación en cada salida y entrada.
              </p>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
              {inventoryMovements.length} Registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Fecha y Hora</th>
                  <th className="p-3.5">Tipo Movimiento</th>
                  <th className="p-3.5">Ítem (Materia Prima / Producto)</th>
                  <th className="p-3.5">Lote / Partida</th>
                  <th className="p-3.5 text-right">Cantidad</th>
                  <th className="p-3.5">Referencia</th>
                  <th className="p-3.5">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryMovements.map(mov => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(mov.date).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                          mov.movementType.includes('entrada')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.movementType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {mov.itemName}
                      </td>
                      <td className="p-3.5 font-mono text-xs">
                        {mov.batchNumber ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-bold text-red-700">{mov.batchNumber}</span>
                            {mov.partidaNumber && <span className="text-blue-700">/ {mov.partidaNumber}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className={`p-3.5 text-right font-mono font-extrabold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{mov.quantity} {mov.unit}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 font-bold">
                        {mov.reference}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {mov.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: GENERATE PRODUCTION ORDER (WITH LOTE & PARTIDA)       */}
      {/* ============================================================ */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Factory className="w-5 h-5 text-[#d31627]" /> Generar Hoja de Fabricación, Lote & Partida
                </h3>
                <p className="text-xs text-slate-500">
                  Asigna número oficial de Lote, Partida, Tina de mezclado y parámetros de calidad.
                </p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              {/* Product and Packaging selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fórmula de Pintura a Fabricar
                  </label>
                  <select
                    value={orderForm.formulaId}
                    onChange={e => setOrderForm({ ...orderForm, formulaId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50"
                  >
                    {formulas.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Masa a Producir (Kilogramos)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={orderForm.targetKg}
                    onChange={e => setOrderForm({ ...orderForm, targetKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Equivalente a aprox. <strong>{calculatedLiters.toFixed(0)} Litros</strong> de pintura.
                  </span>
                </div>
              </div>

              {/* Packaging Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Presentación de Envasado
                  </label>
                  <select
                    value={orderForm.packagingType}
                    onChange={e => setOrderForm({ ...orderForm, packagingType: e.target.value as PackagingType })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="balde_20l">Balde Plástico 20 Litros</option>
                    <option value="lata_10l">Balde / Lata 10 Litros</option>
                    <option value="lata_4l">Lata Litografiada 4 Litros</option>
                    <option value="lata_1l">Lata Litografiada 1 Litro</option>
                    <option value="tambor_200l">Tambor Industrial 200 Litros</option>
                  </select>
                  <span className="text-[11px] text-[#d31627] font-bold mt-0.5 block">
                    Rendimiento estimado: <strong>{calculatedPackageCount} unidades</strong>.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tina / Reactor de Dispersión
                  </label>
                  <select
                    value={orderForm.manufacturingTank}
                    onChange={e => setOrderForm({ ...orderForm, manufacturingTank: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Dispersor Cowles #1 (2.000 L)">Dispersor Cowles #1 (Capacidad 2.000 L)</option>
                    <option value="Dispersor Cowles #2 (1.000 L)">Dispersor Cowles #2 (Capacidad 1.000 L)</option>
                    <option value="Mezclador Lento Esmaltes #3 (1.500 L)">Mezclador Lento Esmaltes #3 (1.500 L)</option>
                    <option value="Tina Móvil Auxiliar #4 (500 L)">Tina Móvil Auxiliar #4 (500 L)</option>
                  </select>
                </div>
              </div>

              {/* LOTE & PARTIDA INDUSTRIAL FIELDS */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50/70 via-amber-50/40 to-blue-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#d31627]" />
                    Trazabilidad Industrial: Lote & Partida
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Identificadores grabados en rótulos y remitos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Número de Lote (Batch)
                      </label>
                      <button
                        type="button"
                        onClick={() => setOrderForm(prev => ({ ...prev, batchNumber: generateNewBatchNumber() }))}
                        className="text-[10px] text-red-700 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto
                      </button>
                    </div>
                    <input
                      type="text"
                      value={orderForm.batchNumber}
                      onChange={e => setOrderForm({ ...orderForm, batchNumber: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-black text-slate-900 bg-white"
                      placeholder="Ej: LOT-2026-0043"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Partida de Fabricación
                      </label>
                      <button
                        type="button"
                        onClick={() => setOrderForm(prev => ({ ...prev, partidaNumber: generateNewPartidaNumber() }))}
                        className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto
                      </button>
                    </div>
                    <input
                      type="text"
                      value={orderForm.partidaNumber}
                      onChange={e => setOrderForm({ ...orderForm, partidaNumber: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-black text-slate-900 bg-white"
                      placeholder="Ej: PAR-2610-043"
                      required
                    />
                  </div>
                </div>

                {/* Dates: Fabricación y Vencimiento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fecha de Elaboración / Fabricación:
                    </label>
                    <input
                      type="date"
                      value={orderForm.manufacturingDate}
                      onChange={e => setOrderForm({ ...orderForm, manufacturingDate: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fecha de Vencimiento de Partida (+2 años):
                    </label>
                    <input
                      type="date"
                      value={orderForm.expirationDate}
                      onChange={e => setOrderForm({ ...orderForm, expirationDate: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quality Control Parameters (QC) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    Ensayos de Control de Calidad de Partida
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    Laboratorio
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Viscosidad (Krebs KU)</label>
                    <input
                      type="number"
                      value={orderForm.viscosityKU}
                      onChange={e => setOrderForm({ ...orderForm, viscosityKU: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">pH Medido</label>
                    <input
                      type="number"
                      step="0.1"
                      value={orderForm.ph}
                      onChange={e => setOrderForm({ ...orderForm, ph: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Densidad Real (kg/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={orderForm.densityReal}
                      onChange={e => setOrderForm({ ...orderForm, densityReal: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold bg-white text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Estado de Aprobación QC</label>
                    <select
                      value={orderForm.qcStatus}
                      onChange={e => setOrderForm({ ...orderForm, qcStatus: e.target.value as any })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value="aprobado">✓ Aprobado para Fraccionamiento</option>
                      <option value="pendiente">⏳ Pendiente de Ensayos Finales</option>
                      <option value="ajustado">⚙️ Ajustado en Laboratorio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Bioquímico / Inspector QC</label>
                    <input
                      type="text"
                      value={orderForm.qcInspector}
                      onChange={e => setOrderForm({ ...orderForm, qcInspector: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Operator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Jefe de Planta / Operador Responsable
                </label>
                <input
                  type="text"
                  value={orderForm.operatorName}
                  onChange={e => setOrderForm({ ...orderForm, operatorName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              {/* Theoretical Raw Material Requirements Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase mb-2 flex items-center justify-between">
                  <span>Insumos Necesarios para {orderForm.targetKg} kg:</span>
                  <span className="text-emerald-700 font-mono">
                    Costo Estimado: $ {calculatedTheoreticalCost.toLocaleString('es-AR')}
                  </span>
                </h4>
                <div className="space-y-1 text-xs max-h-36 overflow-y-auto">
                  {selectedFormula?.items.map((item, idx) => {
                    const requiredKg = (item.percentageOrKg / 100) * orderForm.targetKg;
                    const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
                    const isEnough = mat ? mat.currentStock >= requiredKg : false;

                    return (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0">
                        <span className="text-slate-700 truncate pr-2">
                          {item.rawMaterialName}
                        </span>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <strong className="text-slate-900">{requiredKg.toFixed(1)} kg</strong>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isEnough ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {isEnough ? 'Stock OK' : 'Stock Insuficiente'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notas Especiales / Observaciones de Molienda
                </label>
                <textarea
                  rows={2}
                  value={orderForm.notes}
                  onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                  placeholder="Ej: Molienda fina comprobada en Hegman grado 6, agregar biocida en fase final..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  <Factory className="w-4 h-4" /> Lanzar Orden con Lote & Partida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: VIEW PRINTABLE HOJA DE PRODUCCIÓN CON LOTE & PARTIDA  */}
      {/* ============================================================ */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-8 w-auto" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    HOJA OFICIAL DE FABRICACIÓN & TRAZABILIDAD
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono font-bold">
                    ORDEN #{viewingOrder.orderNumber} • Planta Pilar
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Product and Batch Identifiers */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">Pintura Fabricada:</span>
                    <strong className="text-slate-900 text-base">{viewingOrder.productName}</strong>
                    <span className="text-[11px] text-slate-500 block">
                      Reactor / Tina: <strong>{viewingOrder.manufacturingTank || 'Dispersor Cowles #1'}</strong>
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    {viewingOrder.status}
                  </span>
                </div>

                {/* PROMINENT LOTE AND PARTIDA CARDS */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-[10px] uppercase font-black text-red-700 block">🏷️ LOTE OFICIAL:</span>
                    <strong className="text-base font-black font-mono text-slate-950 block">
                      {viewingOrder.batchNumber}
                    </strong>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[10px] uppercase font-black text-blue-700 block">🧪 PARTIDA FABRICACIÓN:</span>
                    <strong className="text-base font-black font-mono text-slate-950 block">
                      {viewingOrder.partidaNumber || 'PAR-01'}
                    </strong>
                  </div>
                </div>

                {/* Quantities and Dates */}
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">Kilogramos:</span>
                    <strong className="font-mono text-slate-900">{viewingOrder.targetKg} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">Bultos Envasados:</span>
                    <strong className="text-red-700 font-bold">{viewingOrder.packageCount} un. ({getPackagingLabel(viewingOrder.packagingType)})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] font-bold block">Fecha Fab / Vto:</span>
                    <span className="text-slate-800 font-mono text-[11px] font-bold">
                      {viewingOrder.manufacturingDate || 'Hoy'} → {viewingOrder.expirationDate || '2 años'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Control Protocol Table */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black uppercase text-emerald-950 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Protocolo de Ensayos Físico-Químicos de Partida
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    IRAM 1023
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-sans block">Viscosidad</span>
                    <strong className="text-slate-900">{viewingOrder.viscosityKU || 102} KU</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-sans block">pH</span>
                    <strong className="text-slate-900">{viewingOrder.ph || 8.8}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-sans block">Densidad Real</span>
                    <strong className="text-slate-900">{viewingOrder.densityReal || 1.38} kg/L</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-slate-500 font-sans block">Molienda</span>
                    <strong className="text-slate-900">Hegman 6</strong>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900">
                  <span>Inspector / Bioquímico: <strong>{viewingOrder.qcInspector || 'Bioq. Laura Méndez'}</strong></span>
                  <span className="font-bold text-emerald-700">Estado: Aprobado para Distribución</span>
                </div>
              </div>

              {/* Raw Material Dosages Table */}
              <div>
                <h4 className="font-extrabold uppercase text-[11px] text-slate-700 mb-1">
                  Desglose de Dosificación de Materias Primas:
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700 text-[10px]">
                      <tr>
                        <th className="p-2">Ingrediente</th>
                        <th className="p-2 text-right">Dosificación</th>
                        <th className="p-2 text-center">Check Operario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formulas.find(f => f.id === viewingOrder.formulaId)?.items.map((it, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{it.rawMaterialName}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {((it.percentageOrKg / 100) * viewingOrder.targetKg).toFixed(1)} kg
                          </td>
                          <td className="p-2 text-center">
                            <span className="w-4 h-4 inline-block border border-slate-300 rounded"></span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {viewingOrder.notes && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong>Instrucciones y Observaciones:</strong> {viewingOrder.notes}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  setViewingLabelsOrder(viewingOrder);
                  setViewingOrder(null);
                }}
                className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold text-xs"
              >
                <Tag className="w-4 h-4" /> Ver Rótulos / Etiquetas
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" /> Imprimir Hoja de Planta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: RÓTULOS / ETIQUETAS ADHESIVAS PARA BALDES Y LATAS     */}
      {/* ============================================================ */}
      {viewingLabelsOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Rótulos Adhesivos de Envases con Lote & Partida
                  </h3>
                  <p className="text-xs text-slate-500">
                    Etiquetas industriales para baldes de 20L y latas litografiadas
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingLabelsOrder(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Quantity Selector */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Cantidad de Rótulos a Imprimir:</span>
              <div className="flex items-center gap-1.5">
                {[1, 4, 12, viewingLabelsOrder.packageCount].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setLabelCopiesCount(cnt)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                      labelCopiesCount === cnt
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cnt === viewingLabelsOrder.packageCount ? `Lote Completo (${cnt})` : `${cnt} un`}
                  </button>
                ))}
              </div>
            </div>

            {/* Label Visual Mockups Preview */}
            <div className="mt-4 space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {Array.from({ length: Math.min(labelCopiesCount, 12) }).map((_, idx) => (
                <div 
                  key={idx}
                  className="border-2 border-dashed border-slate-300 p-4 rounded-2xl bg-white shadow-xs relative overflow-hidden"
                >
                  {/* Brand Spectrum Line */}
                  <div className="h-1.5 w-full flex mb-3 rounded-full overflow-hidden">
                    <div className="flex-1 bg-[#4b0082]"></div>
                    <div className="flex-1 bg-[#003399]"></div>
                    <div className="flex-1 bg-[#0099cc]"></div>
                    <div className="flex-1 bg-[#33cc33]"></div>
                    <div className="flex-1 bg-[#f5c800]"></div>
                    <div className="flex-1 bg-[#ff7800]"></div>
                    <div className="flex-1 bg-[#d31627]"></div>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-6 w-auto" />
                        <span className="text-[10px] font-black uppercase text-slate-400">Industria Argentina</span>
                      </div>
                      <h4 className="text-base font-black text-slate-950 leading-tight">
                        {viewingLabelsOrder.productName}
                      </h4>
                      <span className="text-xs font-extrabold text-[#d31627] block mt-0.5">
                        {getPackagingLabel(viewingLabelsOrder.packagingType)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-300 flex flex-col items-center justify-center text-slate-500">
                        <QrCode className="w-9 h-9 text-slate-900" />
                        <span className="text-[8px] font-mono mt-0.5 font-bold">TRAZA OK</span>
                      </div>
                    </div>
                  </div>

                  {/* Lote & Partida Box on Container Label */}
                  <div className="mt-3.5 pt-2 border-t-2 border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-300">
                      <span className="text-[9px] font-black uppercase text-slate-600 block">LOTE:</span>
                      <strong className="text-sm font-black font-mono text-slate-950">
                        {viewingLabelsOrder.batchNumber}
                      </strong>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-300">
                      <span className="text-[9px] font-black uppercase text-slate-600 block">PARTIDA:</span>
                      <strong className="text-sm font-black font-mono text-slate-950">
                        {viewingLabelsOrder.partidaNumber || 'PAR-01'}
                      </strong>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-300">
                      <span className="text-[9px] font-black uppercase text-slate-600 block">FECHA ELAB:</span>
                      <strong className="text-xs font-black font-mono text-slate-900">
                        {viewingLabelsOrder.manufacturingDate || 'Hoy'}
                      </strong>
                    </div>
                    <div className="bg-slate-100 p-2 rounded-xl border border-slate-300">
                      <span className="text-[9px] font-black uppercase text-slate-600 block">VENCE:</span>
                      <strong className="text-xs font-black font-mono text-red-700">
                        {viewingLabelsOrder.expirationDate || '24 Meses'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-2 text-[9px] text-slate-400 text-center uppercase tracking-wider font-semibold">
                    Colorear Pinturas S.R.L. • Parque Industrial Pilar, Bs As • Viscosidad: {viewingLabelsOrder.viscosityKU || 102} KU • pH: {viewingLabelsOrder.ph || 8.8}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-xs text-slate-500">
                Mostrando {Math.min(labelCopiesCount, 12)} de {labelCopiesCount} rótulos
              </span>
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir {labelCopiesCount} Rótulos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT RAW MATERIAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Cargar / Editar Materia Prima
              </h3>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                  <input
                    type="text"
                    value={materialForm.code || ''}
                    onChange={e => setMaterialForm({ ...materialForm, code: e.target.value })}
                    placeholder="MP-RES-03"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Categoría</label>
                  <select
                    value={materialForm.category}
                    onChange={e => setMaterialForm({ ...materialForm, category: e.target.value as RawMaterialCategory })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 capitalize"
                  >
                    <option value="resina">Resina</option>
                    <option value="pigmento">Pigmento</option>
                    <option value="carga">Carga / Mineral</option>
                    <option value="aditivo">Aditivo</option>
                    <option value="solvente">Solvente</option>
                    <option value="envase">Envase</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  value={materialForm.name || ''}
                  onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="Resina Alquídica Larga en Aceite..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unidad</label>
                  <select
                    value={materialForm.unit}
                    onChange={e => setMaterialForm({ ...materialForm, unit: e.target.value as UnitType })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  >
                    <option value="kg">kg</option>
                    <option value="litro">litro</option>
                    <option value="unidad">unidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={materialForm.currentStock ?? 0}
                    onChange={e => setMaterialForm({ ...materialForm, currentStock: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={materialForm.minStock ?? 0}
                    onChange={e => setMaterialForm({ ...materialForm, minStock: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialForm.unitCost ?? 0}
                    onChange={e => setMaterialForm({ ...materialForm, unitCost: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proveedor Habitual</label>
                  <input
                    type="text"
                    value={materialForm.supplierName || ''}
                    onChange={e => setMaterialForm({ ...materialForm, supplierName: e.target.value })}
                    placeholder="Química del Plata..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Guardar Materia Prima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE FORMULA X 100 */}
      {showFormulaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-emerald-600" /> Cargar Nueva Fórmula (Base 100 kg)
                </h3>
                <p className="text-xs text-slate-500">
                  Define la receta estándar por cada 100 kg. El costo teórico se calcula automáticamente.
                </p>
              </div>
              <button onClick={() => setShowFormulaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormula} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Código</label>
                  <input
                    type="text"
                    value={formulaForm.code}
                    onChange={e => setFormulaForm({ ...formulaForm, code: e.target.value })}
                    placeholder="FOR-LAT-03"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de Pintura</label>
                  <input
                    type="text"
                    value={formulaForm.name}
                    onChange={e => setFormulaForm({ ...formulaForm, name: e.target.value })}
                    placeholder="Látex Exterior Frentes Super Blanco..."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Pintura</label>
                  <input
                    type="text"
                    value={formulaForm.paintType}
                    onChange={e => setFormulaForm({ ...formulaForm, paintType: e.target.value })}
                    placeholder="Látex Interior / Exterior / Esmalte"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Densidad (kg/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulaForm.density}
                    onChange={e => setFormulaForm({ ...formulaForm, density: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Ingredients list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Composición de Ingredientes (% por cada 100 kg)
                  </label>
                  <button
                    type="button"
                    onClick={addFormulaItem}
                    className="text-xs font-bold text-[#d31627] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Materia Prima
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {formulaForm.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <select
                        value={item.rawMaterialId}
                        onChange={e => updateFormulaItem(idx, e.target.value, item.percentageOrKg)}
                        className="flex-1 text-xs p-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        {rawMaterials.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} (${m.unitCost}/{m.unit})
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="100"
                          value={item.percentageOrKg}
                          onChange={e => updateFormulaItem(idx, item.rawMaterialId, Number(e.target.value))}
                          className="w-20 text-xs p-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFormulaItem(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-slate-100 text-xs font-bold">
                  <span>Suma Total de Porcentajes:</span>
                  <span className={`font-mono ${totalFormulaPercentage === 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {totalFormulaPercentage.toFixed(1)} % / 100%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200">
                  <span>Costo Teórico Calculado:</span>
                  <span className="font-mono text-sm">
                    $ {currentFormulaCost.toFixed(2)} por Kilogramo
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instrucciones de Molienda y Dispersión
                </label>
                <textarea
                  rows={2}
                  value={formulaForm.notes}
                  onChange={e => setFormulaForm({ ...formulaForm, notes: e.target.value })}
                  placeholder="Cargar agua y dispersante, incorporar pigmentos a 1.500 RPM durante 25 min..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormulaModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Fórmula Maestra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
