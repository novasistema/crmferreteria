import React, { useMemo, useState } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Edit3,
  Printer,
  FlaskConical,
  Calculator,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Copy,
  Ban,
  Scale
} from 'lucide-react';
import {
  RawMaterial,
  Formula,
  ColorRecipe,
  ColorRecipeItem,
  ColorBatch,
  ColorBatchLine
} from '../types';

interface ColorRecipesModuleProps {
  rawMaterials: RawMaterial[];
  formulas: Formula[];
  recipes: ColorRecipe[];
  batches: ColorBatch[];
  companyName?: string;
  onSaveRecipe: (recipe: ColorRecipe) => Promise<void>;
  onDeleteRecipe: (id: string) => Promise<void>;
  onSaveBatch: (batch: ColorBatch) => Promise<void>;
  onCompleteBatch: (batch: ColorBatch) => Promise<void>;
  onCancelBatch: (batch: ColorBatch) => Promise<void>;
}

type Tab = 'calculator' | 'recipes' | 'batches';

const PAINT_TYPES = [
  'Látex Interior',
  'Látex Exterior',
  'Látex Interior/Exterior',
  'Esmalte Sintético',
  'Esmalte al Agua',
  'Impermeabilizante / Membrana',
  'Revestimiento Texturado',
  'Barniz / Laca',
  'Entonador / Concentrado',
  'Otro'
];

const fmtKg = (kg: number) => {
  if (!isFinite(kg)) return '—';
  if (Math.abs(kg) < 1) return `${(kg * 1000).toLocaleString('es-AR', { maximumFractionDigits: 1 })} g`;
  return `${kg.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg`;
};
const fmtMoney = (n: number) =>
  `$ ${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n: number) => `${(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 3 })} %`;

// Número de lote correlativo por mes: LC-AAMM-0001
const nextBatchNumber = (batches: ColorBatch[]) => {
  const d = new Date();
  const prefix = `LC-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-`;
  const maxSeq = batches
    .filter(b => b.batchNumber?.startsWith(prefix))
    .reduce((max, b) => Math.max(max, parseInt(b.batchNumber.slice(prefix.length), 10) || 0), 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
};

const nextRecipeCode = (recipes: ColorRecipe[]) => {
  const maxSeq = recipes.reduce((max, r) => {
    const m = /^COL-(\d+)$/.exec(r.code || '');
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  return `COL-${String(maxSeq + 1).padStart(4, '0')}`;
};

// Escala una receta a la cantidad pedida
const computeBatch = (
  recipe: ColorRecipe,
  quantity: number,
  unit: 'kg' | 'litro',
  rawMaterials: RawMaterial[]
) => {
  const density = recipe.density > 0 ? recipe.density : 1;
  const totalKg = unit === 'kg' ? quantity : quantity * density;
  const totalLiters = unit === 'litro' ? quantity : quantity / density;
  const lines: (ColorBatchLine & { stock: number; shortage: number })[] = recipe.items.map(it => {
    const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
    const quantityKg = (it.percentage / 100) * totalKg;
    const stock = mat?.currentStock ?? 0;
    return {
      rawMaterialId: it.rawMaterialId,
      rawMaterialName: mat?.name || it.rawMaterialName,
      unit: mat?.unit || it.unit,
      percentage: it.percentage,
      quantityKg,
      unitCost: mat?.unitCost ?? 0,
      stock,
      shortage: Math.max(0, quantityKg - stock)
    };
  });
  const totalCost = lines.reduce((acc, l) => acc + l.quantityKg * l.unitCost, 0);
  return { totalKg, totalLiters, density, lines, totalCost };
};

const printBatchSheet = (batch: ColorBatch, companyName?: string) => {
  const rows = batch.lines
    .map(
      (l, i) => `<tr>
        <td>${i + 1}</td>
        <td>${l.rawMaterialName}</td>
        <td class="r">${fmtPct(l.percentage)}</td>
        <td class="r"><b>${fmtKg(l.quantityKg)}</b></td>
        <td class="c">☐</td>
        <td></td>
      </tr>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Lote ${batch.batchNumber}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
    h1 { font-size: 18px; margin: 0; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 10px; }
    .lote { font-size: 20px; font-weight: bold; border: 2px solid #111; padding: 6px 10px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; margin-bottom: 12px; }
    .grid div span { color: #555; display: block; font-size: 10px; text-transform: uppercase; }
    .sw { display: inline-block; width: 18px; height: 18px; border: 1px solid #333; vertical-align: middle; margin-right: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #333; padding: 6px; }
    th { background: #eee; text-align: left; font-size: 11px; }
    .r { text-align: right; } .c { text-align: center; }
    tfoot td { font-weight: bold; }
    .sign { display: flex; gap: 24px; margin-top: 50px; }
    .sign div { flex: 1; border-top: 1px solid #111; text-align: center; padding-top: 4px; font-size: 11px; }
    .notes { margin-top: 12px; border: 1px solid #333; min-height: 50px; padding: 6px; }
  </style></head><body>
  <div class="top">
    <div>
      <div style="font-size:11px;color:#555">${companyName || ''}</div>
      <h1>Hoja de Receta de Color</h1>
      <div style="margin-top:4px"><span class="sw" style="background:${batch.colorHex}"></span><b>${batch.recipeName}</b> (${batch.recipeCode})</div>
    </div>
    <div class="lote">LOTE ${batch.batchNumber}</div>
  </div>
  <div class="grid">
    <div><span>Cantidad pedida</span>${batch.requestedQuantity.toLocaleString('es-AR')} ${batch.requestedUnit === 'kg' ? 'kg' : 'litros'}</div>
    <div><span>Total en kg</span>${batch.totalKg.toLocaleString('es-AR', { maximumFractionDigits: 3 })} kg</div>
    <div><span>Total en litros</span>${batch.totalLiters.toLocaleString('es-AR', { maximumFractionDigits: 3 })} L</div>
    <div><span>Densidad</span>${batch.density} kg/L</div>
    <div><span>Fecha</span>${new Date(batch.createdAt).toLocaleString('es-AR')}</div>
    <div><span>Operario</span>${batch.operatorName || '—'}</div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Componente / Pigmento</th><th class="r">%</th><th class="r">Cantidad</th><th class="c">OK</th><th>Peso real</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td></td><td>TOTAL</td><td class="r">${fmtPct(batch.lines.reduce((a, l) => a + l.percentage, 0))}</td><td class="r">${fmtKg(batch.totalKg)}</td><td></td><td></td></tr></tfoot>
  </table>
  <div class="notes"><b>Observaciones:</b> ${batch.notes || ''}</div>
  <div class="sign"><div>Operario</div><div>Control de color</div><div>Responsable</div></div>
  <script>window.onload = () => { window.print(); }</script>
  </body></html>`;
  const w = window.open('', '_blank');
  if (!w) {
    alert('El navegador bloqueó la ventana de impresión. Habilitá las ventanas emergentes para este sitio.');
    return;
  }
  w.document.write(html);
  w.document.close();
};

const emptyRecipe = (recipes: ColorRecipe[]): ColorRecipe => ({
  id: '',
  code: nextRecipeCode(recipes),
  name: '',
  colorHex: '#3b82f6',
  paintType: 'Látex Interior',
  density: 1.35,
  items: [],
  notes: '',
  createdAt: new Date().toISOString()
});

export const ColorRecipesModule: React.FC<ColorRecipesModuleProps> = ({
  rawMaterials,
  formulas,
  recipes,
  batches,
  companyName,
  onSaveRecipe,
  onDeleteRecipe,
  onSaveBatch,
  onCompleteBatch,
  onCancelBatch
}) => {
  const [tab, setTab] = useState<Tab>('calculator');

  // --- Calculadora ---
  const [calcRecipeId, setCalcRecipeId] = useState<string>('');
  const [calcQty, setCalcQty] = useState<number>(20);
  const [calcUnit, setCalcUnit] = useState<'kg' | 'litro'>('litro');
  const [calcBatchNumber, setCalcBatchNumber] = useState<string>('');
  const [calcOperator, setCalcOperator] = useState<string>('');
  const [calcNotes, setCalcNotes] = useState<string>('');
  const [busy, setBusy] = useState(false);

  // --- Editor de recetas ---
  const [editing, setEditing] = useState<ColorRecipe | null>(null);
  const [recipeSearch, setRecipeSearch] = useState('');

  // --- Lotes ---
  const [batchSearch, setBatchSearch] = useState('');
  const [batchStatus, setBatchStatus] = useState<string>('all');

  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [recipes]
  );
  const calcRecipe = sortedRecipes.find(r => r.id === calcRecipeId) || sortedRecipes[0];
  const suggestedBatchNumber = useMemo(() => nextBatchNumber(batches), [batches]);
  const batchNumber = calcBatchNumber.trim() || suggestedBatchNumber;

  const calc = useMemo(
    () => (calcRecipe && calcQty > 0 ? computeBatch(calcRecipe, calcQty, calcUnit, rawMaterials) : null),
    [calcRecipe, calcQty, calcUnit, rawMaterials]
  );
  const calcPctTotal = calcRecipe ? calcRecipe.items.reduce((a, it) => a + (Number(it.percentage) || 0), 0) : 0;
  const hasShortage = !!calc?.lines.some(l => l.shortage > 0);

  const buildBatch = (): ColorBatch | null => {
    if (!calcRecipe || !calc) return null;
    return {
      id: `cb-${Date.now()}`,
      batchNumber,
      recipeId: calcRecipe.id,
      recipeName: calcRecipe.name,
      recipeCode: calcRecipe.code,
      colorHex: calcRecipe.colorHex,
      requestedQuantity: calcQty,
      requestedUnit: calcUnit,
      totalKg: calc.totalKg,
      totalLiters: calc.totalLiters,
      density: calc.density,
      lines: calc.lines.map(({ stock, shortage, ...l }) => l),
      totalCost: calc.totalCost,
      operatorName: calcOperator.trim(),
      status: 'en_proceso',
      notes: calcNotes.trim(),
      createdAt: new Date().toISOString()
    };
  };

  const handleRegisterBatch = async (complete: boolean) => {
    const batch = buildBatch();
    if (!batch) return;
    if (Math.abs(calcPctTotal - 100) > 0.01) {
      alert(`La receta suma ${fmtPct(calcPctTotal)}. Corregila para que sume 100 % antes de registrar un lote.`);
      return;
    }
    if (batches.some(b => b.batchNumber.toLowerCase() === batch.batchNumber.toLowerCase())) {
      alert(`El número de lote ${batch.batchNumber} ya existe. Usá otro.`);
      return;
    }
    if (complete && hasShortage && !window.confirm('Hay componentes con stock insuficiente. ¿Registrar igual y dejar esos stocks en 0?')) {
      return;
    }
    setBusy(true);
    try {
      await onSaveBatch(batch);
      if (complete) await onCompleteBatch(batch);
      setCalcBatchNumber('');
      setCalcNotes('');
      alert(`Lote ${batch.batchNumber} registrado${complete ? ' y stock descontado' : ''}.`);
    } finally {
      setBusy(false);
    }
  };

  // --- Editor helpers ---
  const editingPctTotal = editing ? editing.items.reduce((a, it) => a + (Number(it.percentage) || 0), 0) : 0;
  const editingCostPerKg = editing
    ? editing.items.reduce((a, it) => {
        const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
        return a + ((Number(it.percentage) || 0) / 100) * (mat?.unitCost ?? 0);
      }, 0)
    : 0;

  const updateItem = (idx: number, patch: Partial<ColorRecipeItem>) => {
    if (!editing) return;
    const items = editing.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setEditing({ ...editing, items });
  };

  const addItem = (preferPigment = false) => {
    if (!editing) return;
    const pool = preferPigment ? rawMaterials.filter(m => m.category === 'pigmento') : rawMaterials;
    const mat = pool[0] || rawMaterials[0];
    if (!mat) {
      alert('Primero cargá materias primas en el módulo de Producción.');
      return;
    }
    setEditing({
      ...editing,
      items: [
        ...editing.items,
        { rawMaterialId: mat.id, rawMaterialName: mat.name, category: mat.category, unit: mat.unit, percentage: 0 }
      ]
    });
  };

  const importBaseFormula = (formulaId: string) => {
    if (!editing) return;
    const f = formulas.find(x => x.id === formulaId);
    if (!f) return;
    const base = f.baseQuantity > 0 ? f.baseQuantity : 100;
    const items: ColorRecipeItem[] = f.items.map(it => {
      const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
      return {
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: mat?.name || it.rawMaterialName,
        category: mat?.category,
        unit: mat?.unit || it.unit,
        percentage: Number(((it.percentageOrKg / base) * 100).toFixed(4))
      };
    });
    setEditing({
      ...editing,
      baseFormulaId: f.id,
      density: f.density || editing.density,
      paintType: f.paintType || editing.paintType,
      items
    });
  };

  const normalizeTo100 = () => {
    if (!editing || editingPctTotal <= 0) return;
    const factor = 100 / editingPctTotal;
    setEditing({
      ...editing,
      items: editing.items.map(it => ({ ...it, percentage: Number(((Number(it.percentage) || 0) * factor).toFixed(4)) }))
    });
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim()) return alert('Poné un nombre a la receta.');
    if (editing.items.length === 0) return alert('Agregá al menos un componente.');
    if (Math.abs(editingPctTotal - 100) > 0.01) {
      return alert(`Los porcentajes suman ${fmtPct(editingPctTotal)}. Deben sumar 100 % (podés usar "Ajustar a 100 %").`);
    }
    const ids = editing.items.map(i => i.rawMaterialId);
    if (new Set(ids).size !== ids.length) return alert('Hay un componente repetido en la receta. Unificalo en una sola fila.');
    setBusy(true);
    try {
      const recipe: ColorRecipe = {
        ...editing,
        id: editing.id || `cr-${Date.now()}`,
        name: editing.name.trim(),
        density: Number(editing.density) || 1,
        items: editing.items.map(it => {
          const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
          return {
            ...it,
            rawMaterialName: mat?.name || it.rawMaterialName,
            category: mat?.category ?? it.category ?? 'otro',
            unit: mat?.unit || it.unit,
            percentage: Number(it.percentage) || 0
          };
        }),
        updatedAt: new Date().toISOString()
      };
      // Firestore no acepta undefined
      if (!recipe.baseFormulaId) delete recipe.baseFormulaId;
      await onSaveRecipe(recipe);
      setEditing(null);
    } finally {
      setBusy(false);
    }
  };

  const filteredRecipes = sortedRecipes.filter(r => {
    const q = recipeSearch.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.paintType.toLowerCase().includes(q);
  });

  const filteredBatches = useMemo(
    () =>
      [...batches]
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
        .filter(b => {
          const q = batchSearch.toLowerCase();
          const okQ = !q || b.batchNumber.toLowerCase().includes(q) || b.recipeName.toLowerCase().includes(q) || (b.operatorName || '').toLowerCase().includes(q);
          const okS = batchStatus === 'all' || b.status === batchStatus;
          return okQ && okS;
        }),
    [batches, batchSearch, batchStatus]
  );

  const tabBtn = (id: Tab, label: string, Icon: React.ElementType, count?: number) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
        tab === id ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
      {count !== undefined && <span className="ml-1 text-[10px] opacity-70">({count})</span>}
    </button>
  );

  const statusChip = (s: ColorBatch['status']) => {
    const map = {
      en_proceso: 'bg-amber-100 text-amber-800',
      completado: 'bg-emerald-100 text-emerald-800',
      anulado: 'bg-slate-200 text-slate-600'
    } as const;
    const label = { en_proceso: 'En proceso', completado: 'Completado', anulado: 'Anulado' }[s];
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${map[s]}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-fuchsia-50 text-fuchsia-600">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Recetas de Color & Lotes</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Armá recetas con pigmentos y componentes, calculá las cantidades exactas para los kg o litros a producir y registrá cada lote.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditing(emptyRecipe(recipes));
              setTab('recipes');
            }}
            className="flex items-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nueva receta de color
          </button>
        </div>
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {tabBtn('calculator', 'Calcular & Producir', Calculator)}
          {tabBtn('recipes', 'Recetas', FlaskConical, recipes.length)}
          {tabBtn('batches', 'Lotes', ClipboardList, batches.length)}
        </div>
      </div>

      {/* --- CALCULADORA --- */}
      {tab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Qué vas a producir
            </h2>
            {sortedRecipes.length === 0 ? (
              <div className="text-sm text-slate-500">
                Todavía no hay recetas.{' '}
                <button className="text-fuchsia-600 font-bold underline" onClick={() => { setEditing(emptyRecipe(recipes)); setTab('recipes'); }}>
                  Crear la primera
                </button>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Receta / color</span>
                  <select
                    value={calcRecipe?.id || ''}
                    onChange={e => setCalcRecipeId(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                  >
                    {sortedRecipes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.code} · {r.name} ({r.paintType})
                      </option>
                    ))}
                  </select>
                </label>
                {calcRecipe && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-12 h-12 rounded-xl border border-slate-300 shadow-inner" style={{ background: calcRecipe.colorHex }} />
                    <div className="text-xs text-slate-600">
                      <div className="font-bold text-slate-900 text-sm">{calcRecipe.name}</div>
                      Densidad {calcRecipe.density} kg/L · {calcRecipe.items.length} componentes
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Cantidad</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={calcQty}
                      onChange={e => setCalcQty(Number(e.target.value))}
                      className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Unidad</span>
                    <select
                      value={calcUnit}
                      onChange={e => setCalcUnit(e.target.value as 'kg' | 'litro')}
                      className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="litro">Litros</option>
                      <option value="kg">Kilos</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 4, 10, 20, 100, 200].map(q => (
                    <button key={q} onClick={() => setCalcQty(q)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
                      {q} {calcUnit === 'kg' ? 'kg' : 'L'}
                    </button>
                  ))}
                </div>
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Número de lote</span>
                  <input
                    value={calcBatchNumber}
                    onChange={e => setCalcBatchNumber(e.target.value)}
                    placeholder={suggestedBatchNumber}
                    className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Si lo dejás vacío se usa {suggestedBatchNumber}</span>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Operario</span>
                  <input value={calcOperator} onChange={e => setCalcOperator(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-slate-600">Observaciones</span>
                  <textarea value={calcNotes} onChange={e => setCalcNotes(e.target.value)} rows={2} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
                </label>
              </>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
            {calcRecipe && calc ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-slate-400">Receta calculada · Lote</div>
                    <div className="text-2xl font-black font-mono text-slate-900">{batchNumber}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div><div className="text-[10px] uppercase text-slate-400 font-bold">Total kg</div><div className="font-black font-mono">{calc.totalKg.toLocaleString('es-AR', { maximumFractionDigits: 3 })}</div></div>
                    <div><div className="text-[10px] uppercase text-slate-400 font-bold">Total litros</div><div className="font-black font-mono">{calc.totalLiters.toLocaleString('es-AR', { maximumFractionDigits: 3 })}</div></div>
                    <div><div className="text-[10px] uppercase text-slate-400 font-bold">Costo</div><div className="font-black font-mono">{fmtMoney(calc.totalCost)}</div></div>
                  </div>
                </div>

                {Math.abs(calcPctTotal - 100) > 0.01 && (
                  <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Esta receta suma {fmtPct(calcPctTotal)} en vez de 100 %. Editala antes de producir.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-2">Componente</th>
                        <th className="py-2 px-2 text-right">%</th>
                        <th className="py-2 px-2 text-right">Cantidad a pesar</th>
                        <th className="py-2 px-2 text-right">Stock</th>
                        <th className="py-2 pl-2 text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calc.lines.map(l => (
                        <tr key={l.rawMaterialId} className="border-b border-slate-100">
                          <td className="py-2 pr-2 font-semibold text-slate-800">{l.rawMaterialName}</td>
                          <td className="py-2 px-2 text-right font-mono text-slate-500">{fmtPct(l.percentage)}</td>
                          <td className="py-2 px-2 text-right font-mono font-black text-slate-900">{fmtKg(l.quantityKg)}</td>
                          <td className={`py-2 px-2 text-right font-mono text-xs ${l.shortage > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                            {l.stock.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {l.unit}
                            {l.shortage > 0 && <div>faltan {fmtKg(l.shortage)}</div>}
                          </td>
                          <td className="py-2 pl-2 text-right font-mono text-xs text-slate-600">{fmtMoney(l.quantityKg * l.unitCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hasShortage && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Hay componentes sin stock suficiente para este lote.
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-5">
                  <button
                    onClick={() => { const b = buildBatch(); if (b) printBatchSheet(b, companyName); }}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl"
                  >
                    <Printer className="w-4 h-4" /> Imprimir receta
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => handleRegisterBatch(false)}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl disabled:opacity-50"
                  >
                    <ClipboardList className="w-4 h-4" /> Registrar lote (en proceso)
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => handleRegisterBatch(true)}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Registrar y descontar stock
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 py-10 text-center">Elegí una receta y una cantidad mayor a 0.</div>
            )}
          </div>
        </div>
      )}

      {/* --- RECETAS --- */}
      {tab === 'recipes' && !editing && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} placeholder="Buscar receta, código o tipo..." className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300" />
          </div>
          {filteredRecipes.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No hay recetas cargadas.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRecipes.map(r => {
                const total = r.items.reduce((a, it) => a + it.percentage, 0);
                return (
                  <div key={r.id} className="border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl border border-slate-300 shrink-0" style={{ background: r.colorHex }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono text-slate-400">{r.code}</div>
                        <div className="font-extrabold text-slate-900 truncate">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.paintType} · {r.density} kg/L</div>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-0.5 text-xs text-slate-600">
                      {r.items.slice(0, 5).map(it => (
                        <li key={it.rawMaterialId} className="flex justify-between gap-2">
                          <span className="truncate">{it.rawMaterialName}</span>
                          <span className="font-mono">{fmtPct(it.percentage)}</span>
                        </li>
                      ))}
                      {r.items.length > 5 && <li className="text-slate-400">+ {r.items.length - 5} más</li>}
                    </ul>
                    {Math.abs(total - 100) > 0.01 && <div className="mt-2 text-[11px] font-bold text-rose-600">Suma {fmtPct(total)} — revisar</div>}
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={() => { setCalcRecipeId(r.id); setTab('calculator'); }} className="flex-1 text-xs font-bold px-2 py-1.5 rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 flex items-center justify-center gap-1">
                        <Calculator className="w-3.5 h-3.5" /> Producir
                      </button>
                      <button onClick={() => setEditing({ ...r, items: r.items.map(i => ({ ...i })) })} className="text-xs px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" title="Editar">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditing({ ...r, id: '', code: nextRecipeCode(recipes), name: `${r.name} (copia)`, items: r.items.map(i => ({ ...i })), createdAt: new Date().toISOString() })}
                        className="text-xs px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                        title="Duplicar como nuevo color"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => { if (window.confirm(`¿Eliminar la receta "${r.name}"? Los lotes ya registrados se conservan.`)) await onDeleteRecipe(r.id); }}
                        className="text-xs px-2 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'recipes' && editing && (
        <form onSubmit={handleSaveRecipe} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">{editing.id ? 'Editar receta' : 'Nueva receta de color'}</h2>
            <button type="button" onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <label className="md:col-span-1 block">
              <span className="text-xs font-bold text-slate-600">Código</span>
              <input value={editing.code} onChange={e => setEditing({ ...editing, code: e.target.value })} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono" />
            </label>
            <label className="md:col-span-2 block">
              <span className="text-xs font-bold text-slate-600">Nombre del color</span>
              <input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ej: Verde Manzana" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
            </label>
            <label className="md:col-span-1 block">
              <span className="text-xs font-bold text-slate-600">Muestra</span>
              <input type="color" value={editing.colorHex} onChange={e => setEditing({ ...editing, colorHex: e.target.value })} className="mt-1 w-full h-[38px] border border-slate-300 rounded-xl" />
            </label>
            <label className="md:col-span-1 block">
              <span className="text-xs font-bold text-slate-600">Tipo</span>
              <select value={editing.paintType} onChange={e => setEditing({ ...editing, paintType: e.target.value })} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm">
                {PAINT_TYPES.map(t => <option key={t}>{t}</option>)}
                {!PAINT_TYPES.includes(editing.paintType) && <option>{editing.paintType}</option>}
              </select>
            </label>
            <label className="md:col-span-1 block">
              <span className="text-xs font-bold text-slate-600">Densidad (kg/L)</span>
              <input type="number" step="0.001" min={0.1} value={editing.density} onChange={e => setEditing({ ...editing, density: Number(e.target.value) })} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono" />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block flex-1 min-w-[220px]">
              <span className="text-xs font-bold text-slate-600">Partir de una fórmula base (opcional)</span>
              <select
                value=""
                onChange={e => { if (e.target.value) importBaseFormula(e.target.value); }}
                className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="">— Elegir fórmula para copiar sus componentes —</option>
                {formulas.map(f => <option key={f.id} value={f.id}>{f.code} · {f.name}</option>)}
              </select>
            </label>
            <span className="text-[11px] text-slate-500 pb-2">Copia los componentes de la base; después sumás los pigmentos y ajustás a 100 %.</span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-extrabold text-slate-800">Componentes (% en peso)</h3>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => addItem(true)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Pigmento</button>
                <button type="button" onClick={() => addItem(false)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Componente</button>
              </div>
            </div>
            {editing.items.length === 0 && <div className="text-sm text-slate-500 py-4">Sin componentes todavía.</div>}
            <div className="space-y-2">
              {editing.items.map((it, idx) => {
                const mat = rawMaterials.find(m => m.id === it.rawMaterialId);
                return (
                  <div key={idx} className="flex flex-wrap items-center gap-2">
                    <select
                      value={it.rawMaterialId}
                      onChange={e => {
                        const m = rawMaterials.find(x => x.id === e.target.value);
                        updateItem(idx, { rawMaterialId: e.target.value, rawMaterialName: m?.name || '', category: m?.category, unit: m?.unit || 'kg' });
                      }}
                      className="flex-1 min-w-[220px] border border-slate-300 rounded-xl px-3 py-2 text-sm"
                    >
                      {!mat && <option value={it.rawMaterialId}>{it.rawMaterialName} (no encontrada)</option>}
                      {rawMaterials.map(m => <option key={m.id} value={m.id}>[{m.category}] {m.code} · {m.name}</option>)}
                    </select>
                    <div className="relative w-32">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={it.percentage}
                        onChange={e => updateItem(idx, { percentage: Number(e.target.value) })}
                        className="w-full border border-slate-300 rounded-xl pl-3 pr-7 py-2 text-sm font-mono text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </div>
                    <span className="w-28 text-right text-[11px] font-mono text-slate-500">{fmtKg((Number(it.percentage) || 0) / 100)} / kg</span>
                    <button type="button" onClick={() => setEditing({ ...editing, items: editing.items.filter((_, i) => i !== idx) })} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className={`text-sm font-extrabold ${Math.abs(editingPctTotal - 100) > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Total: {fmtPct(editingPctTotal)}
              </div>
              <div className="text-xs text-slate-600">Costo teórico: <b className="font-mono">{fmtMoney(editingCostPerKg)}</b> / kg · <b className="font-mono">{fmtMoney(editingCostPerKg * (Number(editing.density) || 1))}</b> / L</div>
              {Math.abs(editingPctTotal - 100) > 0.01 && editingPctTotal > 0 && (
                <button type="button" onClick={normalizeTo100} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100">Ajustar a 100 %</button>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-slate-600">Notas (orden de carga, tiempos de dispersión, etc.)</span>
            <textarea value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} rows={2} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200">Cancelar</button>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl text-sm font-bold bg-fuchsia-600 hover:bg-fuchsia-700 text-white disabled:opacity-50">Guardar receta</button>
          </div>
        </form>
      )}

      {/* --- LOTES --- */}
      {tab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={batchSearch} onChange={e => setBatchSearch(e.target.value)} placeholder="Buscar por lote, color u operario..." className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300" />
            </div>
            <select value={batchStatus} onChange={e => setBatchStatus(e.target.value)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm">
              <option value="all">Todos</option>
              <option value="en_proceso">En proceso</option>
              <option value="completado">Completados</option>
              <option value="anulado">Anulados</option>
            </select>
          </div>
          {filteredBatches.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">No hay lotes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-2">Lote</th>
                    <th className="py-2 px-2">Color</th>
                    <th className="py-2 px-2 text-right">Cantidad</th>
                    <th className="py-2 px-2 text-right">Costo</th>
                    <th className="py-2 px-2">Fecha</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 pl-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map(b => (
                    <tr key={b.id} className="border-b border-slate-100">
                      <td className="py-2 pr-2 font-mono font-bold">{b.batchNumber}</td>
                      <td className="py-2 px-2">
                        <span className="inline-block w-3.5 h-3.5 rounded border border-slate-300 align-middle mr-1.5" style={{ background: b.colorHex }} />
                        {b.recipeName}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-xs">
                        {b.requestedQuantity.toLocaleString('es-AR')} {b.requestedUnit === 'kg' ? 'kg' : 'L'}
                        <div className="text-slate-400">{b.totalKg.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg</div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-xs">{fmtMoney(b.totalCost)}</td>
                      <td className="py-2 px-2 text-xs text-slate-500">{new Date(b.createdAt).toLocaleDateString('es-AR')}<div>{b.operatorName}</div></td>
                      <td className="py-2 px-2">{statusChip(b.status)}</td>
                      <td className="py-2 pl-2">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => printBatchSheet(b, companyName)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" title="Imprimir hoja"><Printer className="w-3.5 h-3.5" /></button>
                          {b.status === 'en_proceso' && (
                            <>
                              <button
                                onClick={async () => { if (window.confirm(`¿Completar el lote ${b.batchNumber} y descontar las materias primas del stock?`)) await onCompleteBatch(b); }}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                title="Completar y descontar stock"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => { if (window.confirm(`¿Anular el lote ${b.batchNumber}?`)) await onCancelBatch(b); }}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                                title="Anular"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
