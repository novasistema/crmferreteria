// Interpreta un gasto dictado por voz, por ejemplo:
// "gasto de combustible pagado con mercado pago, son quince mil" o "luz 45.300 en efectivo".
// Solo completa el formulario: el usuario revisa y confirma.
import { Cashbox, CashMovementCategory } from '../types';

export const normalize = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const WORDS: Record<string, number> = {
  un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, doscientas: 200,
  trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500,
  seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800,
  novecientos: 900, novecientas: 900
};

const parseDigits = (s: string): number | null => {
  const parts = s.split(/[.,]/);
  if (parts.length === 1) return Number(s);
  const last = parts[parts.length - 1];
  const sep = s[s.length - last.length - 1];
  if (last.length <= 2 && (sep === ',' || (parts.length === 2 && last.length === 1))) return Number(parts.slice(0, -1).join('') + '.' + last);
  if (last.length === 3) return Number(parts.join(''));
  return Number(parts.join('.'));
};

// Números escritos con palabras: "quince mil quinientos", "un millon doscientos mil"
const parseWords = (text: string): number | null => {
  const tokens = text.split(/[\s-]+/).filter(t => t !== 'y');
  let total = 0;
  let current = 0;
  let found = false;
  for (const t of tokens) {
    if (WORDS[t] !== undefined) {
      current += WORDS[t];
      found = true;
    } else if (t === 'mil') {
      total += (current || 1) * 1000;
      current = 0;
      found = true;
    } else if (t === 'millon' || t === 'millones') {
      total += (current || 1) * 1_000_000;
      current = 0;
      found = true;
    }
  }
  return found ? total + current : null;
};

export const parseAmount = (raw: string): number | null => {
  const text = normalize(raw).replace(/\$/g, ' ');
  let best: number | null = null;
  for (const m of Array.from(text.matchAll(/(\d+(?:[.,]\d+)*)\s*(mil(?:lones|lon)?|k\b)?/g))) {
    let n = parseDigits(m[1]);
    if (n == null || isNaN(n)) continue;
    if (m[2] === 'mil' || m[2] === 'k') n *= 1000;
    else if (m[2]?.startsWith('millon')) n *= 1_000_000;
    if (best == null || n > best) best = n;
  }
  return best ?? parseWords(text);
};

const CATEGORY_WORDS: [CashMovementCategory, string[]][] = [
  ['mantenimiento_maquinaria', ['mantenimiento', 'reparacion', 'arreglo', 'service', 'repuesto']],
  ['fletes_logistica', ['combustible', 'nafta', 'gasoil', 'flete', 'envio', 'camioneta', 'auto', 'peaje', 'estacionamiento', 'cubierta', 'viatico']],
  ['servicios_luz_gas', ['luz', 'epec', 'gas', 'agua', 'internet', 'telefono', 'celular', 'cable', 'servicio']],
  ['alquiler_planta', ['alquiler']],
  ['sueldos_jornales', ['sueldo', 'jornal', 'empleado', 'aguinaldo', 'cargas sociales']],
  ['adelanto_sueldos', ['adelanto', 'vale']],
  ['impuestos_tasas', ['impuesto', 'afip', 'arca', 'rentas', 'ingresos brutos', 'iibb', 'municipal', 'tasa', 'monotributo', 'iva']],
  ['gastos_oficina', ['oficina', 'limpieza', 'papeleria', 'libreria', 'bolsa', 'cafe', 'comida', 'almuerzo', 'sistema']],
  ['materias_primas', ['materia prima', 'mercaderia', 'insumo']],
  ['envases_embalajes', ['envase', 'embalaje', 'caja de carton', 'film']]
];

export interface VoiceExpenseResult {
  amount: number | null;
  category: CashMovementCategory | null;
  cashboxId: string | null;
  description: string;
}

export const parseVoiceExpense = (said: string, cashboxes: Cashbox[]): VoiceExpenseResult => {
  const text = normalize(said);
  const amount = parseAmount(said);

  let category: CashMovementCategory | null = null;
  for (const [cat, words] of CATEGORY_WORDS) {
    if (words.some(w => new RegExp(`\\b${w}(s|es)?\\b`).test(text))) {
      category = cat;
      break;
    }
  }

  // Origen: primero por nombre de la caja, después por tipo
  let cashboxId: string | null = null;
  const GENERIC = new Set(['pago', 'pagos', 'caja', 'cuenta', 'banco', 'efectivo', 'chica', 'mostrador', 'principal']);
  const byName =
    cashboxes.find(c => normalize(c.name).length > 2 && text.includes(normalize(c.name))) ||
    cashboxes.find(c => normalize(c.name).split(' ').filter(w => w.length > 3 && !GENERIC.has(w)).some(w => new RegExp(`\\b${w}\\b`).test(text)));
  if (byName) cashboxId = byName.id;
  else {
    const type =
      /mercado ?pago|\bmp\b|billetera|uala|naranja x|modo/.test(text) ? 'digital'
      : /transferencia|banco|cuenta|debito/.test(text) ? 'banco'
      : /efectivo|caja chica/.test(text) ? (/caja chica/.test(text) ? 'caja_chica' : 'efectivo')
      : null;
    if (type) cashboxId = cashboxes.find(c => c.type === type)?.id || null;
  }

  // Descripción: lo dicho sin el importe ni las muletillas
  const NUM_WORDS = Object.keys(WORDS).concat(['mil', 'millon', 'millón', 'millones', 'y']).join('|');
  const description = said
    .replace(/(agrega(me)?|registra(me)?|anota(me)?|carga(me)?)\s+(un\s+)?gasto\s*(de|para|por)?/gi, ' ')
    .replace(/^\s*(un\s+)?gasto\s+(de|para|por)\s+/i, ' ')
    .replace(/(pagad[oa]|abonad[oa])\s+(con|por|en|desde)\s+[^,.]+/gi, ' ')
    .replace(/\b(en|con|por|desde)\s+(efectivo|transferencia[^,.]*|mercado ?pago|banco[^,.]*|caja[^,.]*|billetera[^,.]*|d[eé]bito)/gi, ' ')
    .replace(/(son|por|de)?\s*\$?\s*\d+(?:[.,]\d+)*\s*(mil(?:lones|lon)?|k)?\s*(pesos)?/gi, ' ')
    .replace(new RegExp(`(\\s|^)(son\\s+)?((${NUM_WORDS})(\\s+|$))+(pesos)?`, 'gi'), ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  return { amount, category, cashboxId, description: description ? description.charAt(0).toUpperCase() + description.slice(1) : '' };
};
