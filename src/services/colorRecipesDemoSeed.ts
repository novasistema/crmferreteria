import { doc, getDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { RawMaterial, ColorRecipe, ColorRecipeItem, ColorBatch, ColorBatchLine } from '../types';

// Marca para cargar los datos de demo una sola vez (si después se borran, no vuelven a aparecer)
const SEED_FLAG = { col: 'system_meta', id: 'color_recipes_demo_v1' };

// Pigmentos de color y agua que necesitan las recetas de ejemplo
const DEMO_MATERIALS: Omit<RawMaterial, 'updatedAt'>[] = [
  { id: 'rm-pig-rojo', code: 'MP-PIG-02', name: 'Óxido de Hierro Rojo 130', category: 'pigmento', unit: 'kg', currentStock: 420, minStock: 100, unitCost: 4200, supplierName: 'Pigmentos Industriales' },
  { id: 'rm-pig-amarillo', code: 'MP-PIG-03', name: 'Óxido de Hierro Amarillo 313', category: 'pigmento', unit: 'kg', currentStock: 380, minStock: 100, unitCost: 4500, supplierName: 'Pigmentos Industriales' },
  { id: 'rm-pig-negro', code: 'MP-PIG-04', name: 'Negro de Humo (Carbon Black)', category: 'pigmento', unit: 'kg', currentStock: 95, minStock: 30, unitCost: 6800, supplierName: 'Pigmentos Industriales' },
  { id: 'rm-pig-azul', code: 'MP-PIG-05', name: 'Azul Ftalocianina 15:3', category: 'pigmento', unit: 'kg', currentStock: 60, minStock: 20, unitCost: 18500, supplierName: 'Pigmentos Industriales' },
  { id: 'rm-pig-verde', code: 'MP-PIG-06', name: 'Verde Ftalocianina 7', category: 'pigmento', unit: 'kg', currentStock: 45, minStock: 15, unitCost: 19800, supplierName: 'Pigmentos Industriales' },
  { id: 'rm-agua', code: 'MP-AGU-01', name: 'Agua Desmineralizada', category: 'otro', unit: 'kg', currentStock: 20000, minStock: 2000, unitCost: 15, supplierName: 'Planta propia' }
];

// Componentes de base látex (% en peso) — el agua completa hasta 100 %
const BASE_INTERIOR: [string, number][] = [
  ['rm-1', 22], ['rm-3', 26], ['rm-4', 5], ['rm-5', 0.8], ['rm-6', 0.4], ['rm-7', 0.6], ['rm-8', 0.2]
];
const BASE_EXTERIOR: [string, number][] = [
  ['rm-1', 30], ['rm-3', 20], ['rm-4', 4], ['rm-5', 0.8], ['rm-6', 0.4], ['rm-7', 0.5], ['rm-8', 0.3]
];

interface DemoRecipe {
  id: string;
  name: string;
  hex: string;
  paintType: string;
  density: number;
  base: [string, number][];
  pigments: [string, number][];
  notes: string;
}

const DEMO_RECIPES: DemoRecipe[] = [
  { id: 'cr-demo-blanco', name: 'Blanco Nieve', hex: '#f7f7f2', paintType: 'Látex Interior', density: 1.38, base: BASE_INTERIOR, pigments: [['rm-2', 16]], notes: 'Dispersar el dióxido de titanio 15 min a 1.600 rpm antes de agregar la resina.' },
  { id: 'cr-demo-gris', name: 'Gris Perla', hex: '#c9cbc7', paintType: 'Látex Interior', density: 1.37, base: BASE_INTERIOR, pigments: [['rm-2', 13], ['rm-pig-negro', 0.25]], notes: 'El negro se agrega al final, de a poco, comparando con la carta.' },
  { id: 'cr-demo-verde', name: 'Verde Manzana', hex: '#8cc63f', paintType: 'Látex Interior', density: 1.36, base: BASE_INTERIOR, pigments: [['rm-2', 10], ['rm-pig-amarillo', 2.5], ['rm-pig-verde', 0.8]], notes: 'Primero el amarillo, después el verde. Ajustar tono con verde de a 50 g por cada 100 kg.' },
  { id: 'cr-demo-celeste', name: 'Azul Cielo', hex: '#86c1e6', paintType: 'Látex Interior', density: 1.36, base: BASE_INTERIOR, pigments: [['rm-2', 12], ['rm-pig-azul', 0.6]], notes: 'Azul ftalocianina muy concentrado: pesar en balanza de precisión.' },
  { id: 'cr-demo-amarillo', name: 'Amarillo Patito', hex: '#f6c945', paintType: 'Látex Interior', density: 1.37, base: BASE_INTERIOR, pigments: [['rm-2', 8], ['rm-pig-amarillo', 5]], notes: '' },
  { id: 'cr-demo-terracota', name: 'Terracota', hex: '#c4623e', paintType: 'Látex Exterior', density: 1.40, base: BASE_EXTERIOR, pigments: [['rm-2', 3], ['rm-pig-rojo', 6], ['rm-pig-amarillo', 1.5]], notes: 'Para frentes. Controlar viscosidad 100–105 KU.' },
  { id: 'cr-demo-teja', name: 'Rojo Teja', hex: '#9b2f22', paintType: 'Látex Exterior', density: 1.41, base: BASE_EXTERIOR, pigments: [['rm-pig-rojo', 9], ['rm-pig-negro', 0.3]], notes: 'Sin dióxido de titanio. Ideal techos y tejas.' }
];

const buildItems = (r: DemoRecipe, mats: RawMaterial[]): ColorRecipeItem[] => {
  const parts = [...r.base, ...r.pigments];
  const water = Number((100 - parts.reduce((a, [, p]) => a + p, 0)).toFixed(4));
  return [...parts, ['rm-agua', water] as [string, number]].map(([id, pct]) => {
    const m = mats.find(x => x.id === id);
    return {
      rawMaterialId: id,
      rawMaterialName: m?.name || id,
      category: m?.category || 'otro',
      unit: m?.unit || 'kg',
      percentage: pct
    };
  });
};

export async function seedColorRecipesDemoIfNeeded() {
  try {
    const flagRef = doc(db, SEED_FLAG.col, SEED_FLAG.id);
    const flag = await getDoc(flagRef);
    if (flag.exists()) return;

    const existing = await getDocs(collection(db, 'color_recipes'));
    const rawSnap = await getDocs(collection(db, 'raw_materials'));
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    const mats: RawMaterial[] = rawSnap.docs.map(d => ({ id: d.id, ...d.data() } as RawMaterial));
    DEMO_MATERIALS.forEach(m => {
      if (!mats.some(x => x.id === m.id)) {
        const full = { ...m, updatedAt: now } as RawMaterial;
        batch.set(doc(db, 'raw_materials', m.id), full);
        mats.push(full);
      }
    });

    // Solo carga recetas si la colección está vacía (no pisa recetas reales)
    if (existing.empty) {
      const recipes: ColorRecipe[] = DEMO_RECIPES.map((r, i) => ({
        id: r.id,
        code: `COL-${String(i + 1).padStart(4, '0')}`,
        name: r.name,
        colorHex: r.hex,
        paintType: r.paintType,
        density: r.density,
        items: buildItems(r, mats),
        notes: r.notes,
        createdAt: now
      }));
      recipes.forEach(r => batch.set(doc(db, 'color_recipes', r.id), r));

      // Dos lotes de ejemplo en proceso, para mostrar el historial y el botón "Completar"
      const d = new Date();
      const prefix = `LC-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-`;
      const demoBatches: [string, number, 'kg' | 'litro', string][] = [
        ['cr-demo-verde', 200, 'litro', 'Martín Ibarra'],
        ['cr-demo-terracota', 500, 'kg', 'Martín Ibarra']
      ];
      demoBatches.forEach(([rid, qty, unit, operator], i) => {
        const r = recipes.find(x => x.id === rid)!;
        const totalKg = unit === 'kg' ? qty : qty * r.density;
        const totalLiters = unit === 'litro' ? qty : qty / r.density;
        const lines: ColorBatchLine[] = r.items.map(it => {
          const m = mats.find(x => x.id === it.rawMaterialId);
          return {
            rawMaterialId: it.rawMaterialId,
            rawMaterialName: it.rawMaterialName,
            unit: it.unit,
            percentage: it.percentage,
            quantityKg: (it.percentage / 100) * totalKg,
            unitCost: m?.unitCost ?? 0
          };
        });
        const cb: ColorBatch = {
          id: `cb-demo-${i + 1}`,
          batchNumber: `${prefix}${String(i + 1).padStart(4, '0')}`,
          recipeId: r.id,
          recipeName: r.name,
          recipeCode: r.code,
          colorHex: r.colorHex,
          requestedQuantity: qty,
          requestedUnit: unit,
          totalKg,
          totalLiters,
          density: r.density,
          lines,
          totalCost: lines.reduce((a, l) => a + l.quantityKg * l.unitCost, 0),
          operatorName: operator,
          status: 'en_proceso',
          notes: 'Lote de ejemplo',
          createdAt: new Date(Date.now() - (2 - i) * 3600 * 1000).toISOString()
        };
        batch.set(doc(db, 'color_batches', cb.id), cb);
      });
    }

    batch.set(flagRef, { seededAt: now });
    await batch.commit();
  } catch (err) {
    console.warn('No se pudieron cargar las recetas de color de ejemplo:', err);
  }
}
