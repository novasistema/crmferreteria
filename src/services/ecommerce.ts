import { EcommerceSettings, Product, WebOrder, PriceListType, WebOrderStatus } from '../types';

export const DEFAULT_ECOMMERCE: EcommerceSettings = {
  storeOpen: true,
  storeName: '',
  slogan: '',
  bannerText: '',
  accentColor: '#e11d48',
  whatsapp: '',
  priceList: 'minorista',
  showPricesWithIva: true,
  showStock: false,
  hideOutOfStock: false,
  minOrderAmount: 0,
  pickupEnabled: true,
  pickupAddress: '',
  shippingEnabled: false,
  shippingCost: 0,
  freeShippingFrom: 0,
  shippingNote: '',
  transferEnabled: true,
  transferAlias: '',
  transferCbu: '',
  transferHolder: '',
  transferBank: '',
  cashEnabled: true,
  mercadoPagoEnabled: false
};

export const withEcommerceDefaults = (s?: Partial<EcommerceSettings>): EcommerceSettings => ({ ...DEFAULT_ECOMMERCE, ...(s || {}) });

export const round2 = (n: number) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

// Precio neto (sin IVA) de la lista elegida para la tienda
export const netPrice = (p: Product, list: PriceListType): number => {
  if (list === 'distribuidor') return p.priceDistributor || p.priceWholesale || p.priceRetail || 0;
  if (list === 'mayorista') return p.priceWholesale || p.priceRetail || 0;
  return p.priceRetail || p.priceWholesale || 0;
};

export const ivaRateOf = (p: Product) => (p.ivaRate ?? 21);

// Precio que ve el comprador
export const displayPrice = (p: Product, s: EcommerceSettings) => {
  const net = netPrice(p, s.priceList);
  return s.showPricesWithIva ? round2(net * (1 + ivaRateOf(p) / 100)) : round2(net);
};

export const isPublishable = (p: Product, s: EcommerceSettings) =>
  p.publishOnline === true && p.active !== false && netPrice(p, s.priceList) > 0 && !(s.hideOutOfStock && (p.stock || 0) <= 0);

export interface CartLine {
  productId: string;
  quantity: number;
}

export const computeTotals = (lines: { product: Product; quantity: number }[], s: EcommerceSettings, delivery: 'retiro' | 'envio') => {
  const items = lines.map(({ product, quantity }) => {
    const unit = round2(netPrice(product, s.priceList));
    const sub = round2(unit * quantity);
    return { product, quantity, unitPrice: unit, ivaRate: ivaRateOf(product), subtotal: sub, tax: round2((sub * ivaRateOf(product)) / 100) };
  });
  const subtotal = round2(items.reduce((a, i) => a + i.subtotal, 0));
  const taxAmount = round2(items.reduce((a, i) => a + i.tax, 0));
  const goods = round2(subtotal + taxAmount);
  const shippingCost =
    delivery === 'envio' && s.shippingEnabled ? (s.freeShippingFrom > 0 && goods >= s.freeShippingFrom ? 0 : round2(s.shippingCost || 0)) : 0;
  return { items, subtotal, taxAmount, goods, shippingCost, total: round2(goods + shippingCost) };
};

export const newWebOrderNumber = () => {
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WEB-${ymd}-${rnd}`;
};

export const WEB_STATUS_META: Record<WebOrderStatus, { label: string; cls: string }> = {
  nuevo: { label: 'Nuevo', cls: 'bg-rose-100 text-rose-800' },
  confirmado: { label: 'Confirmado', cls: 'bg-sky-100 text-sky-800' },
  pagado: { label: 'Pagado', cls: 'bg-emerald-100 text-emerald-800' },
  preparando: { label: 'Preparando', cls: 'bg-amber-100 text-amber-800' },
  enviado: { label: 'Enviado', cls: 'bg-indigo-100 text-indigo-800' },
  entregado: { label: 'Entregado', cls: 'bg-slate-200 text-slate-700' },
  cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-400 line-through' }
};

export const PAYMENT_LABEL: Record<WebOrder['payment'], string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo al retirar / recibir',
  mercadopago: 'Mercado Pago'
};

export const money = (n: number) => `$ ${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const callMercadoPago = async (action: string, payload: Record<string, unknown>) => {
  try {
    const res = await fetch('/api/mercadopago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { ok: false, error: res.status === 404 ? 'El servidor de pagos no está disponible en esta instalación.' : `Respuesta inesperada (${res.status}).` };
    }
  } catch {
    return { ok: false, error: 'No hay conexión con el servidor.' };
  }
};

export const whatsappLink = (phone: string | undefined, text: string) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const full = digits.startsWith('54') ? digits : `549${digits.replace(/^0/, '')}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
};
