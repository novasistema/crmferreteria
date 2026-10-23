import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Factory,
  Beaker,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Play,
  FileText,
  Boxes,
  Layers,
  Sparkles,
  X,
  Droplet,
  Package,
  TrendingUp,
} from 'lucide-react';

interface RawMaterial {
  id: string;
  code: string;
  name: string;
  costPerUnit: number;
  unit: 'kg' | 'litros';
  stock: number;
}

interface PaintFormula {
  id: string;
  name: string;
  category: string;
  // Formula is defined strictly per 100 kg / liters
  ingredients: {
    materialId: string;
    materialName: string;
    qtyPer100: number; // kg or liters per 100 units of finished product
    unit: 'kg' | 'litros';
    costPerUnit: number;
  }[];
}

interface ProductionSheet {
  id: string;
  date: string;
  batchNumber: string;
  formulaName: string;
  totalKgOrLiters: number;
  packagingType: string;
  packagesCount: number;
  operator: string;
  totalCost: number;
  status: 'Completado' | 'Pendiente';
}

export const ProductionView: React.FC = () => {
  const { store, showToast, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<'materias_primas' | 'formulas' | 'hoja_produccion' | 'historial'>('hoja_produccion');

  // 1. Raw Materials (Materias Primas con costos)
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([
    { id: 'rm-1', code: 'RM-001', name: 'Resina Acrílica Estirenada', costPerUnit: 1850, unit: 'kg', stock: 1500 },
    { id: 'rm-2', code: 'RM-002', name: 'Dióxido de Titanio (Pigmento Rutilo)', costPerUnit: 4200, unit: 'kg', stock: 800 },
    { id: 'rm-3', code: 'RM-003', name: 'Carbonato de Calcio (Carga)', costPerUnit: 320, unit: 'kg', stock: 5000 },
    { id: 'rm-4', code: 'RM-004', name: 'Agua Desmineralizada', costPerUnit: 50, unit: 'litros', stock: 10000 },
    { id: 'rm-5', code: 'RM-005', name: 'Espesante Celulósico & Aditivos', costPerUnit: 3100, unit: 'kg', stock: 300 },
    { id: 'rm-6', code: 'RM-006', name: 'Resina Alquídica Media en Aceite', costPerUnit: 2400, unit: 'kg', stock: 2000 },
    { id: 'rm-7', code: 'RM-007', name: 'White Spirit / Solvente Alifático', costPerUnit: 980, unit: 'litros', stock: 1500 },
    { id: 'rm-8', code: 'RM-008', name: 'Emulsión Acrílica Elastomérica', costPerUnit: 2100, unit: 'kg', stock: 1200 },
  ]);

  const [newRmName, setNewRmName] = useState('');
  const [newRmCode, setNewRmCode] = useState('');
  const [newRmCost, setNewRmCost] = useState<number | ''>('');
  const [newRmUnit, setNewRmUnit] = useState<'kg' | 'litros'>('kg');
  const [newRmStock, setNewRmStock] = useState<number | ''>('');

  // 2. Formulas x 100 (Recetas basadas exactamente en 100 kg o litros)
  const [formulas, setFormulas] = useState<PaintFormula[]>([
    {
      id: 'form-1',
      name: 'Látex Interior Mate Blanco (Fórmula x 100L)',
      category: 'Pinturas al Agua',
      ingredients: [
        { materialId: 'rm-4', materialName: 'Agua Desmineralizada', qtyPer100: 45, unit: 'litros', costPerUnit: 50 },
        { materialId: 'rm-1', materialName: 'Resina Acrílica Estirenada', qtyPer100: 20, unit: 'kg', costPerUnit: 1850 },
        { materialId: 'rm-2', materialName: 'Dióxido de Titanio (Pigmento Rutilo)', qtyPer100: 12, unit: 'kg', costPerUnit: 4200 },
        { materialId: 'rm-3', materialName: 'Carbonato de Calcio (Carga)', qtyPer100: 18, unit: 'kg', costPerUnit: 320 },
        { materialId: 'rm-5', materialName: 'Espesante Celulósico & Aditivos', qtyPer100: 5, unit: 'kg', costPerUnit: 3100 },
      ],
    },
    {
      id: 'form-2',
      name: 'Esmalte Sintético Brillante (Fórmula x 100L)',
      category: 'Esmaltes Sintéticos',
      ingredients: [
        { materialId: 'rm-6', materialName: 'Resina Alquídica Media en Aceite', qtyPer100: 50, unit: 'kg', costPerUnit: 2400 },
        { materialId: 'rm-7', materialName: 'White Spirit / Solvente Alifático', qtyPer100: 35, unit: 'litros', costPerUnit: 980 },
        { materialId: 'rm-2', materialName: 'Dióxido de Titanio (Pigmento Rutilo)', qtyPer100: 15, unit: 'kg', costPerUnit: 4200 },
      ],
    },
    {
      id: 'form-3',
      name: 'Impermeabilizante para Techos (Fórmula x 100L)',
      category: 'Impermeabilizantes',
      ingredients: [
        { materialId: 'rm-8', materialName: 'Emulsión Acrílica Elastomérica', qtyPer100: 45, unit: 'kg', costPerUnit: 2100 },
        { materialId: 'rm-4', materialName: 'Agua Desmineralizada', qtyPer100: 30, unit: 'litros', costPerUnit: 50 },
        { materialId: 'rm-3', materialName: 'Carbonato de Calcio (Carga)', qtyPer100: 20, unit: 'kg', costPerUnit: 320 },
        { materialId: 'rm-5', materialName: 'Espesante Celulósico & Aditivos', qtyPer100: 5, unit: 'kg', costPerUnit: 3100 },
      ],
    },
  ]);

  // 3. Hoja de Producción State
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(formulas[0].id);
  const [targetKgOrLiters, setTargetKgOrLiters] = useState<number>(500); // e.g. 500 kg/liters to manufacture
  const [packagingType, setPackagingType] = useState<string>('Balde 20 Litros');
  const [operator, setOperator] = useState<string>('Carlos Operario');
  const [batchNumber, setBatchNumber] = useState<string>(`LOT-2026-${Math.floor(Math.random() * 90000 + 10000)}`);

  // Packaging capacity mapping in liters/kg per unit
  const packagingCapacityMap: Record<string, number> = {
    'Lata 1 Litro': 1,
    'Lata 4 Litros': 4,
    'Balde 10 Litros': 10,
    'Balde 20 Litros': 20,
    'Tambor 200 Litros': 200,
  };

  const selectedFormula = formulas.find((f) => f.id === selectedFormulaId) || formulas[0];

  // Scale factor from base 100 to target quantity
  const scale = targetKgOrLiters / 100;

  const requiredMaterials = selectedFormula.ingredients.map((ing) => {
    const requiredQty = ing.qtyPer100 * scale;
    const materialObj = rawMaterials.find((rm) => rm.id === ing.materialId);
    const currentStock = materialObj ? materialObj.stock : 0;
    const unitCost = materialObj ? materialObj.costPerUnit : ing.costPerUnit;
    const totalCost = requiredQty * unitCost;
    const hasEnoughStock = currentStock >= requiredQty;

    return {
      ...ing,
      requiredQty,
      unitCost,
      totalCost,
      currentStock,
      hasEnoughStock,
    };
  });

  const totalProductionCost = requiredMaterials.reduce((acc, curr) => acc + curr.totalCost, 0);
  const costPerUnitOutput = targetKgOrLiters > 0 ? totalProductionCost / targetKgOrLiters : 0;

  const containerCapacity = packagingCapacityMap[packagingType] || 20;
  const packagesCount = Math.ceil(targetKgOrLiters / containerCapacity);

  const [productionHistory, setProductionHistory] = useState<ProductionSheet[]>([
    {
      id: 'prod-1',
      date: '08/10/2026 11:30',
      batchNumber: 'LOT-2026-83721',
      formulaName: 'Látex Interior Mate Blanco (Fórmula x 100L)',
      totalKgOrLiters: 400,
      packagingType: 'Balde 20 Litros',
      packagesCount: 20,
      operator: 'Carlos Operario',
      totalCost: 784000,
      status: 'Completado',
    },
  ]);

  const handleAddRawMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRmName.trim() || newRmCost === '' || newRmStock === '') {
      showToast('Complete todos los campos de la materia prima', 'error');
      return;
    }
    const newItem: RawMaterial = {
      id: `rm-${Date.now()}`,
      code: newRmCode.trim() || `RM-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: newRmName.trim(),
      costPerUnit: Number(newRmCost),
      unit: newRmUnit,
      stock: Number(newRmStock),
    };
    setRawMaterials([...rawMaterials, newItem]);
    setNewRmName('');
    setNewRmCode('');
    setNewRmCost('');
    setNewRmStock('');
    showToast('Materia prima agregada exitosamente', 'success');
  };

  const handleExecuteProductionSheet = () => {
    if (targetKgOrLiters <= 0) {
      showToast('Ingrese una cantidad válida a fabricar', 'error');
      return;
    }

    // Check stock availability
    const missing = requiredMaterials.find((m) => !m.hasEnoughStock);
    if (missing) {
      showToast(`Stock insuficiente de "${missing.materialName}". Requerido: ${missing.requiredQty.toFixed(1)}, Stock: ${missing.currentStock}`, 'error');
      return;
    }

    // 1. Deduct raw materials from rawMaterials stock
    const updatedRaw = rawMaterials.map((rm) => {
      const used = requiredMaterials.find((m) => m.materialId === rm.id);
      if (used) {
        return { ...rm, stock: rm.stock - used.requiredQty };
      }
      return rm;
    });
    setRawMaterials(updatedRaw);

    // 2. Add finished product to store.products (Alta de producto terminado)
    const finishedProductName = `${selectedFormula.name.split(' (')[0]} - ${targetKgOrLiters}L (${packagingType} x ${packagesCount})`;
    const newProductSku = `PT-${Math.floor(Math.random() * 90000 + 10000)}`;
    store.addProduct({
      code: newProductSku,
      name: finishedProductName,
      salePrice: costPerUnitOutput * 1.6, // recommended 60% markup
      costPrice: costPerUnitOutput,
      stock: packagesCount, // added in packaged units or bulk
      stockMin: 2,
      category: selectedFormula.category,
      active: true,
    });

    // 3. Register production sheet
    const newSheet: ProductionSheet = {
      id: `prod-${Date.now()}`,
      date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      batchNumber,
      formulaName: selectedFormula.name,
      totalKgOrLiters,
      packagingType,
      packagesCount,
      operator,
      totalCost: totalProductionCost,
      status: 'Completado',
    };

    setProductionHistory([newSheet, ...productionHistory]);
    showToast(`¡Hoja de producción ejecutada! Materias primas dadas de baja y producto terminado dado de alta.`, 'success');
    setBatchNumber(`LOT-2026-${Math.floor(Math.random() * 90000 + 10000)}`);
    triggerRefresh();
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl border border-amber-400/40">
              <Factory className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Fábrica de Pintura & Producción Industrial
                </span>
                <span className="text-xs text-amber-200">Insumos, Fórmulas x 100 y Hojas de Producción</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Módulo de Producción y Envasado
              </h1>
              <p className="text-amber-100 text-xs mt-0.5">
                Control de materias primas con costos, recetas base x 100, armado de lotes, baja de insumos y alta de producto terminado.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'hoja_produccion', label: '1. Hoja de Producción & Envasado', icon: Calculator },
            { id: 'materias_primas', label: '2. Carga de Materias Primas & Costos', icon: Boxes },
            { id: 'formulas', label: '3. Fórmulas Base (x 100)', icon: Beaker },
            { id: 'historial', label: '4. Historial de Lotes Producidos', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: HOJA DE PRODUCCIÓN & ENVASADO */}
        {activeTab === 'hoja_produccion' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Configuration */}
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-5 h-fit">
              <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Calculator className="w-5 h-5 text-amber-400" /> Generar Hoja de Producción
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Fórmula de Pintura</label>
                  <select
                    value={selectedFormulaId}
                    onChange={(e) => setSelectedFormulaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400"
                  >
                    {formulas.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Cantidad a Fabricar (Kg o Litros)</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={targetKgOrLiters}
                    onChange={(e) => setTargetKgOrLiters(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-base font-bold focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Fórmula definida x 100. Factor multiplicador: {scale.toFixed(2)}x</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Forma de Envasado</label>
                  <select
                    value={packagingType}
                    onChange={(e) => setPackagingType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="Lata 1 Litro">Lata 1 Litro</option>
                    <option value="Lata 4 Litros">Lata 4 Litros</option>
                    <option value="Balde 10 Litros">Balde 10 Litros</option>
                    <option value="Balde 20 Litros">Balde 20 Litros</option>
                    <option value="Tambor 200 Litros">Tambor 200 Litros</option>
                  </select>
                  <span className="text-[10px] text-amber-400 mt-1 block font-mono">
                    Se requerirán aprox. {packagesCount} unidades de {packagingType}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nro. de Lote</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Operador</label>
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Costo Total Producción:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    ${totalProductionCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Costo por Kg/Litro:</span>
                  <span className="font-mono font-bold text-white">
                    ${costPerUnitOutput.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={handleExecuteProductionSheet}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" /> Ejecutar (Baja Insumos / Alta PT)
                </button>
              </div>
            </div>

            {/* Right Column: Required Materials Breakdown */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-amber-400" /> Insumos Necesarios para {targetKgOrLiters} Kg/Litros
                  </h3>
                  <p className="text-xs text-slate-400">Validación de stock y costos unitarios de materias primas</p>
                </div>
                <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
                  {requiredMaterials.length} Insumos
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">Materia Prima</th>
                      <th className="py-3.5 px-4 text-center">Fórmula (x100)</th>
                      <th className="py-3.5 px-4 text-center">Cant. Requerida</th>
                      <th className="py-3.5 px-4 text-center">Stock Actual</th>
                      <th className="py-3.5 px-4 text-right">Costo Unit. ($)</th>
                      <th className="py-3.5 px-4 text-right">Subtotal ($)</th>
                      <th className="py-3.5 px-4 text-center">Estado Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {requiredMaterials.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{m.materialName}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">{m.qtyPer100} {m.unit}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">
                          {m.requiredQty.toLocaleString('es-AR', { maximumFractionDigits: 1 })} {m.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                          {m.currentStock.toLocaleString('es-AR')} {m.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300">${m.unitCost.toLocaleString('es-AR')}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${m.totalCost.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</td>
                        <td className="py-3.5 px-4 text-center">
                          {m.hasEnoughStock ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">Suficiente</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">Faltante</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATERIAS PRIMAS & COSTOS */}
        {activeTab === 'materias_primas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Registrar Nueva Materia Prima
              </h3>
              <form onSubmit={handleAddRawMaterial} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Insumo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Resina Epoxi, Carbonato..."
                    value={newRmName}
                    onChange={(e) => setNewRmName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Código / SKU</label>
                  <input
                    type="text"
                    placeholder="Ej. RM-009"
                    value={newRmCode}
                    onChange={(e) => setNewRmCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Costo por Unidad ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ej. 1500"
                    value={newRmCost}
                    onChange={(e) => setNewRmCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Unidad</label>
                    <select
                      value={newRmUnit}
                      onChange={(e) => setNewRmUnit(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white"
                    >
                      <option value="kg">Kg</option>
                      <option value="litros">Litros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newRmStock}
                      onChange={(e) => setNewRmStock(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow cursor-pointer transition-all"
                >
                  Guardar Materia Prima
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
                Inventario de Materias Primas e Insumos
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3.5 px-4">Código</th>
                      <th className="py-3.5 px-4">Insumo</th>
                      <th className="py-3.5 px-4 text-right">Costo Unitario ($)</th>
                      <th className="py-3.5 px-4 text-center">Unidad</th>
                      <th className="py-3.5 px-4 text-center">Stock Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {rawMaterials.map((rm) => (
                      <tr key={rm.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{rm.code}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{rm.name}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-white">${rm.costPerUnit.toLocaleString('es-AR')}</td>
                        <td className="py-3.5 px-4 text-center text-slate-300">{rm.unit}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">{rm.stock.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FORMULAS X 100 */}
        {activeTab === 'formulas' && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Fórmulas Base (Proporción exacta calculada x 100 Kg / Litros)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formulas.map((f) => (
                <div key={f.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded">
                      {f.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Base: 100 Unidades</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{f.name}</h4>
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Composición (x100):</span>
                    {f.ingredients.map((ing, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-slate-300">{ing.materialName}</span>
                        <span className="font-mono text-amber-400 font-bold">{ing.qtyPer100} {ing.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HISTORIAL DE LOTES */}
        {activeTab === 'historial' && (
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Historial de Hojas de Producción Ejecutadas
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Nro Lote</th>
                    <th className="py-3.5 px-4">Fórmula</th>
                    <th className="py-3.5 px-4 text-center">Fabricado</th>
                    <th className="py-3.5 px-4 text-center">Envasado</th>
                    <th className="py-3.5 px-4 text-right">Costo Total ($)</th>
                    <th className="py-3.5 px-4">Operador</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {productionHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{h.date}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{h.batchNumber}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{h.formulaName}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-400">{h.totalKgOrLiters} Kg/L</td>
                      <td className="py-3.5 px-4 text-center text-slate-300">{h.packagingType} ({h.packagesCount} un.)</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">${h.totalCost.toLocaleString('es-AR')}</td>
                      <td className="py-3.5 px-4 text-slate-300">{h.operator}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
