// Lectura de facturas de compra con IA: prepara el archivo, llama a /api/factura-ia
// y vincula los renglones leídos con los productos y proveedores cargados.
import { Product, Supplier, PurchaseInvoiceType } from '../types';

export interface AiInvoiceItem {
  codigo?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  bonificacion1?: number;
  bonificacion2?: number;
  bonificacion3?: number;
  alicuotaIva?: number;
}

export interface AiInvoice {
  proveedorRazonSocial?: string;
  proveedorCuit?: string;
  tipo: 'A' | 'B' | 'C' | 'M' | 'X' | 'R';
  puntoVenta?: string;
  numero?: string;
  fecha?: string;
  vencimiento?: string;
  items: AiInvoiceItem[];
  percepcionIibb?: number;
  percepcionIva?: number;
  impuestosInternos?: number;
  otrosImpuestos?: number;
  total?: number;
}

const MAX_SIDE = 2000;

const readAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    fr.readAsDataURL(blob);
  });

// Achica las fotos del celular (suelen pesar 4-8 MB) a JPEG de hasta 2000 px.
const compressImage = async (file: File): Promise<{ base64: string; mimeType: string }> => {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('canvas'))), 'image/jpeg', 0.85)
    );
    return { base64: await readAsDataUrl(blob), mimeType: 'image/jpeg' };
  } catch {
    // Formato que el navegador no sabe dibujar (p. ej. HEIC): se manda tal cual.
    return { base64: await readAsDataUrl(file), mimeType: file.type || 'image/jpeg' };
  }
};

export const readInvoiceWithAI = async (file: File): Promise<AiInvoice> => {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf && file.size > 3 * 1024 * 1024) {
    throw new Error('El PDF pesa más de 3 MB. Probá con una foto de la factura.');
  }
  const prepared = isPdf
    ? { base64: await readAsDataUrl(file), mimeType: 'application/pdf' }
    : await compressImage(file);

  let res: Response;
  try {
    res = await fetch('/api/factura-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileBase64: prepared.base64, mimeType: prepared.mimeType })
    });
  } catch {
    throw new Error('No hay conexión con el servidor. La lectura con IA necesita internet.');
  }
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    if (res.status === 404) {
      throw new Error('La lectura con IA no está disponible en esta instalación (falta desplegar en Vercel).');
    }
    throw new Error(body?.error || `Error ${res.status} al leer la factura.`);
  }
  return body.invoice as AiInvoice;
};

// ---------- Vinculación con datos del sistema ----------

const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const digits = (s?: string) => (s || '').replace(/\D/g, '');

const tokens = (s: string) => new Set(norm(s).split(' ').filter(t => t.length > 1));

// Parecido entre dos descripciones: proporción de palabras en común (0 a 1).
export const similarity = (a: string, b: string): number => {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let common = 0;
  ta.forEach(t => {
    if (tb.has(t)) common++;
  });
  return common / Math.min(ta.size, tb.size);
};

export const MATCH_THRESHOLD = 0.75;

// Busca el producto: primero por código (proveedor, interno o de barras), después por descripción.
export const matchProduct = (item: AiInvoiceItem, products: Product[]): Product | null => {
  const code = norm(item.codigo || '');
  if (code) {
    const byCode =
      products.find(p => p.supplierCode && norm(p.supplierCode) === code) ||
      products.find(p => norm(p.code) === code) ||
      products.find(p => p.barcode && norm(p.barcode) === code);
    if (byCode) return byCode;
  }
  let best: Product | null = null;
  let bestScore = 0;
  for (const p of products) {
    const s = similarity(item.descripcion, p.name);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : null;
};

// Los productos más parecidos, para que el usuario elija cuando no hubo vínculo automático.
export const suggestProducts = (description: string, products: Product[], limit = 6): Product[] =>
  products
    .map(p => ({ p, s: similarity(description, p.name) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => x.p);

export const matchSupplier = (inv: AiInvoice, suppliers: Supplier[]): Supplier | null => {
  const cuit = digits(inv.proveedorCuit);
  if (cuit.length === 11) {
    const byCuit = suppliers.find(s => digits(s.taxId) === cuit);
    if (byCuit) return byCuit;
  }
  const name = inv.proveedorRazonSocial || '';
  if (!name.trim()) return null;
  let best: Supplier | null = null;
  let bestScore = 0;
  for (const s of suppliers) {
    const sc = similarity(name, s.businessName);
    if (sc > bestScore) {
      bestScore = sc;
      best = s;
    }
  }
  return bestScore >= 0.6 ? best : null;
};

export const toInvoiceType = (tipo: AiInvoice['tipo']): PurchaseInvoiceType => {
  switch (tipo) {
    case 'A': return 'Factura A';
    case 'B': return 'Factura B';
    case 'C': return 'Factura C';
    case 'M': return 'Factura M';
    case 'R': return 'Remito R';
    default: return 'Factura X';
  }
};

export const isIsoDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
