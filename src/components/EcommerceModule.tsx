import React, { useMemo, useState } from 'react';
import {
  ShoppingCart,
  ExternalLink,
  Copy,
  Check,
  Search,
  Package,
  Settings2,
  ClipboardList,
  MessageCircle,
  X,
  FileCheck,
  ShoppingBag,
  Loader2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { CompanyConfig, Product, WebOrder, WebOrderStatus, EcommerceSettings, UserRole } from '../types';
import {
  withEcommerceDefaults,
  displayPrice,
  isPublishable,
  netPrice,
  money,
  WEB_STATUS_META,
  PAYMENT_LABEL,
  callMercadoPago,
  whatsappLink
} from '../services/ecommerce';
import { NumInput } from './NumInput';

interface EcommerceModuleProps {
  config: CompanyConfig | null;
  products: Product[];
  orders: WebOrder[];
  currentUserRole?: UserRole;
  onSaveSettings: (s: EcommerceSettings) => Promise<void>;
  onUpdateProducts: (ids: string[], patch: Partial<Product>) => Promise<void>;
  onUpdateOrder: (id: string, patch: Partial<WebOrder>) => Promise<void>;
  onConvertToSale: (order: WebOrder, billing: 'arca' | 'no_arca') => Promise<string>;
}

type Tab = 'pedidos' | 'estadisticas' | 'productos' | 'config';
const STATUS_FLOW: WebOrderStatus[] = ['nuevo', 'confirmado', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const EcommerceModule: React.FC<EcommerceModuleProps> = ({ config, products, orders, currentUserRole, onSaveSettings, onUpdateProducts, onUpdateOrder, onConvertToSale }) => {
  const [tab, setTab] = useState<Tab>('pedidos');
  const [copied, setCopied] = useState(false);
  const s = useMemo(() => withEcommerceDefaults(config?.ecommerce), [config?.ecommerce]);
  const canConfigure = currentUserRole === 'creador' || currentUserRole === 'admin';
  const storeUrl = `${window.location.origin}/tienda`;
  const newCount = orders.filter(o => o.status === 'nuevo').length;
  const publishedCount = products.filter(p => isPublishable(p, s)).length;

  const tabBtn = (id: Tab, label: string, Icon: React.ElementType, badge?: number) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 ${tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
      <Icon className="w-4 h-4" /> {label}
      {!!badge && <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center">{badge}</span>}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-pink-50 text-pink-600"><ShoppingCart className="w-6 h-6" /></div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Tienda Online</h1>
              <p className="text-xs text-slate-500">{publishedCount} productos publicados · {s.storeOpen ? 'tienda abierta' : 'tienda cerrada'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl pl-3 pr-1 py-1 text-xs font-mono text-slate-700 max-w-full">
              <span className="truncate">{storeUrl}</span>
              <button onClick={() => navigator.clipboard?.writeText(storeUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); })} className="p-1.5 rounded-lg hover:bg-white" title="Copiar link">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <a href="/tienda" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white">
              Ver tienda <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {tabBtn('pedidos', 'Pedidos web', ClipboardList, newCount)}
          {tabBtn('estadisticas', 'Estadísticas', BarChart3)}
          {tabBtn('productos', 'Productos publicados', Package)}
          {tabBtn('config', 'Configuración', Settings2)}
        </div>
      </div>

      {tab === 'pedidos' && <OrdersPanel orders={orders} settings={s} onUpdateOrder={onUpdateOrder} onConvertToSale={onConvertToSale} />}
      {tab === 'estadisticas' && <StatsPanel orders={orders} />}
      {tab === 'productos' && <ProductsPanel products={products} settings={s} onUpdateProducts={onUpdateProducts} />}
      {tab === 'config' && <SettingsPanel settings={s} canEdit={canConfigure} onSave={onSaveSettings} />}
    </div>
  );
};

// ---------------- Pedidos ----------------
const OrdersPanel: React.FC<{
  orders: WebOrder[];
  settings: EcommerceSettings;
  onUpdateOrder: EcommerceModuleProps['onUpdateOrder'];
  onConvertToSale: EcommerceModuleProps['onConvertToSale'];
}> = ({ orders, settings, onUpdateOrder, onConvertToSale }) => {
  const [filter, setFilter] = useState<'activos' | 'todos' | WebOrderStatus>('activos');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const list = useMemo(
    () =>
      [...orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .filter(o => (filter === 'todos' ? true : filter === 'activos' ? !['entregado', 'cancelado'].includes(o.status) : o.status === filter))
        .filter(o => !q || `${o.number} ${o.customerName} ${o.customerPhone}`.toLowerCase().includes(q.toLowerCase())),
    [orders, filter, q]
  );
  const selected = orders.find(o => o.id === selectedId) || null;

  const checkMp = async (o: WebOrder) => {
    if (!settings.mercadoPagoTokenEnc) return setMsg('Mercado Pago no está configurado.');
    setBusy('mp');
    try {
      const r = await callMercadoPago('check_payment', { tokenEnc: settings.mercadoPagoTokenEnc, paymentId: o.mpPaymentId, orderId: o.id });
      if (!r.ok) return setMsg(r.error || 'No se pudo consultar Mercado Pago.');
      if (!r.found) return setMsg('Mercado Pago todavía no registra un pago para este pedido.');
      const patch: Partial<WebOrder> = { mpPaymentId: r.paymentId, mpStatus: r.status, updatedAt: new Date().toISOString() };
      if (r.status === 'approved' && ['nuevo', 'confirmado'].includes(o.status)) patch.status = 'pagado';
      await onUpdateOrder(o.id, patch);
      setMsg(r.status === 'approved' ? `Pago aprobado (${money(r.amount)}).` : `Estado del pago en Mercado Pago: ${r.status}.`);
    } finally {
      setBusy(null);
    }
  };

  const convert = async (o: WebOrder, billing: 'arca' | 'no_arca') => {
    setBusy(billing);
    try {
      const salesOrderId = await onConvertToSale(o, billing);
      await onUpdateOrder(o.id, { salesOrderId, status: o.status === 'nuevo' ? 'confirmado' : o.status, updatedAt: new Date().toISOString() });
      setMsg(billing === 'arca' ? 'Venta creada con factura: queda pendiente de CAE en Facturación ARCA.' : 'Venta creada como ingreso sin factura.');
    } catch (e: any) {
      setMsg(e?.message || 'No se pudo crear la venta.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar pedido, cliente o teléfono" className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm">
            <option value="activos">En curso</option>
            <option value="todos">Todos</option>
            {STATUS_FLOW.map(st => <option key={st} value={st}>{WEB_STATUS_META[st].label}</option>)}
          </select>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No hay pedidos.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {list.map(o => (
              <button key={o.id} onClick={() => { setSelectedId(o.id); setMsg(null); }} className={`w-full text-left py-3 px-2 rounded-xl flex items-center gap-3 hover:bg-slate-50 ${selectedId === o.id ? 'bg-slate-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{o.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${WEB_STATUS_META[o.status].cls}`}>{WEB_STATUS_META[o.status].label}</span>
                    {o.salesOrderId && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-800">En ventas</span>}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{o.customerName} · {o.customerPhone} · {fmtDateTime(o.createdAt)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-black font-mono text-sm">{money(o.total)}</div>
                  <div className="text-[11px] text-slate-500">{PAYMENT_LABEL[o.payment]} · {o.delivery === 'envio' ? 'Envío' : 'Retiro'}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="xl:col-span-2">
        {!selected ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm text-slate-500">Elegí un pedido para ver el detalle.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 xl:sticky xl:top-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono font-black">{selected.number}</div>
                <div className="text-xs text-slate-500">{fmtDateTime(selected.createdAt)}</div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            {msg && <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">{msg}</div>}
            <div className="text-sm space-y-0.5">
              <div className="font-bold">{selected.customerName}</div>
              <div className="text-slate-600">{selected.customerPhone}{selected.customerEmail ? ` · ${selected.customerEmail}` : ''}</div>
              {selected.customerTaxId && <div className="text-slate-600">CUIT/DNI {selected.customerTaxId}</div>}
              <div className="text-slate-600">{selected.delivery === 'envio' ? `Envío a ${[selected.customerAddress, selected.customerCity].filter(Boolean).join(', ')}` : 'Retira en el local'}</div>
              {selected.customerNotes && <div className="text-slate-500 italic">“{selected.customerNotes}”</div>}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              {selected.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0"><b>{it.quantity}×</b> {it.name} <span className="text-slate-400">{it.presentation}</span></span>
                  <span className="font-mono shrink-0">{money(it.subtotal * (1 + it.ivaRate / 100))}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-slate-500 pt-1"><span>Subtotal sin IVA / IVA</span><span className="font-mono">{money(selected.subtotal)} / {money(selected.taxAmount)}</span></div>
              {selected.shippingCost > 0 && <div className="flex justify-between text-sm"><span>Envío</span><span className="font-mono">{money(selected.shippingCost)}</span></div>}
              <div className="flex justify-between font-black"><span>Total</span><span className="font-mono">{money(selected.total)}</span></div>
              <div className="text-xs text-slate-500">Pago: {PAYMENT_LABEL[selected.payment]}{selected.mpStatus ? ` · MP: ${selected.mpStatus}` : ''}</div>
            </div>

            <label className="block">
              <span className="text-xs font-bold text-slate-600">Estado</span>
              <select value={selected.status} onChange={e => onUpdateOrder(selected.id, { status: e.target.value as WebOrderStatus, updatedAt: new Date().toISOString() })} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm">
                {STATUS_FLOW.map(st => <option key={st} value={st}>{WEB_STATUS_META[st].label}</option>)}
              </select>
            </label>

            <div className="flex flex-wrap gap-2">
              {whatsappLink(selected.customerPhone, '') && (
                <a href={whatsappLink(selected.customerPhone, `Hola ${selected.customerName.split(' ')[0]}! Recibimos tu pedido ${selected.number} por ${money(selected.total)}.`)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                  <MessageCircle className="w-4 h-4" /> WhatsApp al cliente
                </a>
              )}
              {selected.payment === 'mercadopago' && (
                <button disabled={busy !== null} onClick={() => checkMp(selected)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50">
                  {busy === 'mp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Verificar pago
                </button>
              )}
            </div>

            {selected.salesOrderId ? (
              <div className="p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Ya se pasó a Ventas. Seguí el despacho desde ahí.</div>
            ) : selected.status !== 'cancelado' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600">Pasar a Ventas</div>
                <button disabled={busy !== null} onClick={() => convert(selected, 'arca')} className="w-full text-left p-3 rounded-xl border-2 border-blue-200 hover:border-blue-500 disabled:opacity-50">
                  <div className="font-bold text-sm flex items-center gap-1.5"><FileCheck className="w-4 h-4 text-blue-600" /> Con factura ARCA · {money(selected.total)}</div>
                  <div className="text-[11px] text-slate-500">Queda pendiente de CAE en Facturación ARCA.</div>
                </button>
                <button disabled={busy !== null} onClick={() => convert(selected, 'no_arca')} className="w-full text-left p-3 rounded-xl border-2 border-slate-200 hover:border-slate-500 disabled:opacity-50">
                  <div className="font-bold text-sm flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> Ingreso de venta sin factura · {money(selected.total)}</div>
                  <div className="text-[11px] text-slate-500">Se registra por el mismo importe cobrado al cliente.</div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- Estadísticas ----------------
const localDay = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const ADVANCED: WebOrderStatus[] = ['pagado', 'preparando', 'enviado', 'entregado'];

export const computeStoreStats = (orders: WebOrder[], days: number, now = Date.now()) => {
  const today = localDay(new Date(now).toISOString());
  const from = localDay(new Date(now - (days - 1) * 86400000).toISOString());
  const inRange = orders.filter(o => { const d = localDay(o.createdAt); return d >= from && d <= today; });
  const valid = inRange.filter(o => o.status !== 'cancelado');
  const revenue = valid.reduce((a, o) => a + o.total, 0);
  const daysList = Array.from({ length: days }, (_, i) => localDay(new Date(now - (days - 1 - i) * 86400000).toISOString()));
  const byDay = daysList.map(d => {
    const list = valid.filter(o => localDay(o.createdAt) === d);
    return { day: d, count: list.length, amount: list.reduce((a, o) => a + o.total, 0) };
  });
  const products = new Map<string, { name: string; qty: number; amount: number }>();
  valid.forEach(o => o.items.forEach(it => {
    const cur = products.get(it.productId) || { name: `${it.name} ${it.presentation || ''}`.trim(), qty: 0, amount: 0 };
    cur.qty += it.quantity;
    cur.amount += it.subtotal * (1 + it.ivaRate / 100);
    products.set(it.productId, cur);
  }));
  const split = <K extends string>(key: (o: WebOrder) => K) => {
    const m = new Map<K, { count: number; amount: number }>();
    valid.forEach(o => { const k = key(o); const c = m.get(k) || { count: 0, amount: 0 }; c.count++; c.amount += o.total; m.set(k, c); });
    return [...m.entries()].map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.amount - a.amount);
  };
  const customers = new Set(valid.map(o => (o.customerPhone || '').replace(/\D/g, '').slice(-8) || o.customerName));
  return {
    count: valid.length,
    revenue,
    avgTicket: valid.length ? revenue / valid.length : 0,
    paidRate: valid.length ? valid.filter(o => ADVANCED.includes(o.status)).length / valid.length : 0,
    cancelled: inRange.length - valid.length,
    pendingNew: valid.filter(o => o.status === 'nuevo').length,
    uniqueCustomers: customers.size,
    byDay,
    topProducts: [...products.values()].sort((a, b) => b.qty - a.qty || b.amount - a.amount).slice(0, 10),
    byPayment: split(o => o.payment),
    byDelivery: split(o => o.delivery)
  };
};

const StatsPanel: React.FC<{ orders: WebOrder[] }> = ({ orders }) => {
  const [days, setDays] = useState(30);
  const st = useMemo(() => computeStoreStats(orders, days), [orders, days]);
  const maxDay = Math.max(1, ...st.byDay.map(d => d.amount));
  const kpi = (label: string, value: string, sub?: string) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-[11px] font-bold uppercase text-slate-400">{label}</div>
      <div className="text-xl font-black font-mono text-slate-900">{value}</div>
      {sub && <div className="text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
  const splitBlock = (title: string, rows: { key: string; count: number; amount: number }[], labels: Record<string, string>) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="font-extrabold text-slate-900 mb-3">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-slate-400">Sin datos</p>}
      {rows.map(r => (
        <div key={r.key} className="mb-2">
          <div className="flex justify-between text-sm"><span>{labels[r.key] || r.key} · {r.count}</span><span className="font-mono">{money(r.amount)}</span></div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-pink-500" style={{ width: `${st.revenue ? (r.amount / st.revenue) * 100 : 0}%` }} /></div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select value={days} onChange={e => setDays(Number(e.target.value))} className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white">
          <option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option>
        </select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpi('Pedidos', String(st.count), st.cancelled ? `${st.cancelled} cancelados aparte` : undefined)}
        {kpi('Facturación', money(st.revenue), `${st.uniqueCustomers} clientes distintos`)}
        {kpi('Ticket promedio', money(st.avgTicket))}
        {kpi('Pagados o avanzados', `${Math.round(st.paidRate * 100)} %`, st.pendingNew ? `${st.pendingNew} nuevos sin atender` : 'Todos atendidos')}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-extrabold text-slate-900 mb-3">Ventas por día</h3>
        <div className="flex items-end gap-[3px] h-40">
          {st.byDay.map(d => (
            <div key={d.day} className="flex-1 h-full flex flex-col justify-end group relative" title={`${d.day.split('-').reverse().join('/')}: ${d.count} pedidos · ${money(d.amount)}`}>
              <div className={`rounded-t ${d.amount ? 'bg-pink-500 group-hover:bg-pink-600' : 'bg-slate-100'}`} style={{ height: `${d.amount ? Math.max(4, (d.amount / maxDay) * 100) : 2}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>{st.byDay[0]?.day.split('-').reverse().join('/')}</span><span>Hoy</span></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-extrabold text-slate-900 mb-3">Más vendidos</h3>
          {st.topProducts.length === 0 && <p className="text-sm text-slate-400">Sin ventas en el período</p>}
          <ol className="space-y-1.5">
            {st.topProducts.map((p, i) => (
              <li key={i} className="flex justify-between gap-2 text-sm"><span className="truncate"><b className="text-slate-400 mr-1">{i + 1}.</b>{p.name}</span><span className="shrink-0 font-mono text-xs">{p.qty} u · {money(p.amount)}</span></li>
            ))}
          </ol>
        </div>
        {splitBlock('Formas de pago', st.byPayment, PAYMENT_LABEL)}
        {splitBlock('Entrega', st.byDelivery, { retiro: 'Retiro en el local', envio: 'Envío' })}
      </div>
    </div>
  );
};

// ---------------- Productos ----------------
const ProductsPanel: React.FC<{ products: Product[]; settings: EcommerceSettings; onUpdateProducts: EcommerceModuleProps['onUpdateProducts'] }> = ({ products, settings, onUpdateProducts }) => {
  const [q, setQ] = useState('');
  const [view, setView] = useState<'todos' | 'publicados' | 'no_publicados'>('todos');
  const [limit, setLimit] = useState(60);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products
      .filter(p => p.active !== false)
      .filter(p => (view === 'todos' ? true : view === 'publicados' ? p.publishOnline === true : p.publishOnline !== true))
      .filter(p => !t || `${p.name} ${p.code} ${p.brand || ''} ${p.category || ''}`.toLowerCase().includes(t))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, q, view]);

  const bulk = async (publish: boolean, onlyWithStock = false) => {
    const ids = list.filter(p => (publish ? p.publishOnline !== true : p.publishOnline === true) && (!onlyWithStock || (p.stock || 0) > 0)).map(p => p.id);
    if (ids.length === 0) return;
    if (!window.confirm(`¿${publish ? 'Publicar' : 'Despublicar'} ${ids.length} productos${q ? ' de la búsqueda actual' : ''}?`)) return;
    setBusy(true);
    try {
      await onUpdateProducts(ids, { publishOnline: publish });
    } finally {
      setBusy(false);
    }
  };

  const toggleBtn = (on: boolean | undefined, label: string, onClick: () => void, color: string) => (
    <button onClick={onClick} className={`text-[10px] font-bold px-2 py-1 rounded-md border ${on ? `${color} text-white border-transparent` : 'bg-white text-slate-500 border-slate-200'}`}>{label}</button>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => { setQ(e.target.value); setLimit(60); }} placeholder="Buscar por nombre, código, marca o rubro" className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300" />
        </div>
        <select value={view} onChange={e => setView(e.target.value as any)} className="border border-slate-300 rounded-xl px-3 py-2 text-sm">
          <option value="todos">Todos</option>
          <option value="publicados">Publicados</option>
          <option value="no_publicados">Sin publicar</option>
        </select>
        <button disabled={busy} onClick={() => bulk(true, true)} className="px-3 py-2 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white disabled:opacity-50">Publicar los que tienen stock</button>
        <button disabled={busy} onClick={() => bulk(false)} className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50">Despublicar listados</button>
      </div>
      <p className="text-[11px] text-slate-500">Precio en la tienda: lista <b>{settings.priceList}</b> {settings.showPricesWithIva ? 'con IVA incluido' : 'sin IVA'}. La foto se carga en Inventario (campo imagen).</p>
      <div className="divide-y divide-slate-100">
        {list.slice(0, limit).map(p => {
          const net = netPrice(p, settings.priceList);
          return (
            <div key={p.id} className="py-2.5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-xs font-black text-slate-300">
                {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" /> : p.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{p.name} <span className="text-slate-400 font-normal">{p.presentation}</span></div>
                <div className="text-[11px] text-slate-500 truncate">{p.code} · {p.category} · stock {p.stock ?? 0}{!p.imageUrl ? ' · sin foto' : ''}</div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <div className="text-sm font-black font-mono">{net > 0 ? money(displayPrice(p, settings)) : '—'}</div>
                {net <= 0 && <div className="text-[10px] text-rose-600 font-bold">sin precio</div>}
              </div>
              <div className="flex flex-wrap gap-1 justify-end w-[150px] sm:w-auto">
                {toggleBtn(p.publishOnline, p.publishOnline ? 'Publicado' : 'Publicar', () => onUpdateProducts([p.id], { publishOnline: !p.publishOnline }), 'bg-pink-600')}
                {toggleBtn(p.isFeatured, 'Destacado', () => onUpdateProducts([p.id], { isFeatured: !p.isFeatured }), 'bg-slate-900')}
                {toggleBtn(p.isOffer, 'Oferta', () => onUpdateProducts([p.id], { isOffer: !p.isOffer }), 'bg-rose-500')}
              </div>
            </div>
          );
        })}
      </div>
      {list.length > limit && <button onClick={() => setLimit(l => l + 60)} className="w-full py-2 rounded-xl bg-slate-100 text-sm font-bold">Ver más ({list.length - limit})</button>}
    </div>
  );
};

// ---------------- Configuración ----------------
const SettingsPanel: React.FC<{ settings: EcommerceSettings; canEdit: boolean; onSave: (s: EcommerceSettings) => Promise<void> }> = ({ settings, canEdit, onSave }) => {
  const [s, setS] = useState<EcommerceSettings>(settings);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof EcommerceSettings>(k: K, v: EcommerceSettings[K]) => setS(prev => ({ ...prev, [k]: v }));
  const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm disabled:bg-slate-50';
  const check = (k: keyof EcommerceSettings, label: string) => (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!canEdit} checked={!!s[k]} onChange={e => set(k, e.target.checked as any)} /> {label}</label>
  );

  const save = async (next = s) => {
    if (!next.pickupEnabled && !next.shippingEnabled) return setMsg({ ok: false, text: 'Activá al menos retiro en el local o envío.' });
    if (!next.transferEnabled && !next.cashEnabled && !(next.mercadoPagoEnabled && next.mercadoPagoTokenEnc)) return setMsg({ ok: false, text: 'Activá al menos una forma de pago.' });
    setBusy(true);
    try {
      await onSave({ ...next, shippingCost: Number(next.shippingCost) || 0, freeShippingFrom: Number(next.freeShippingFrom) || 0, minOrderAmount: Number(next.minOrderAmount) || 0 });
      setMsg({ ok: true, text: 'Configuración guardada.' });
    } finally {
      setBusy(false);
    }
  };

  const saveToken = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await callMercadoPago('save_token', { accessToken: token });
      if (!r.ok) return setMsg({ ok: false, text: r.error || 'No se pudo validar el token.' });
      const next = { ...s, mercadoPagoTokenEnc: r.tokenEnc, mercadoPagoAccount: r.account, mercadoPagoEnabled: true };
      setS(next);
      setToken('');
      await onSave(next);
      setMsg({ ok: true, text: `Mercado Pago conectado (${r.account}).` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
      {!canEdit && <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">Solo el creador o un administrador pueden cambiar la configuración de la tienda.</div>}
      {msg && <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${msg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{msg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}{msg.text}</div>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <h3 className="md:col-span-3 font-extrabold text-slate-900">Tienda</h3>
        <div className="md:col-span-3">{check('storeOpen', 'Tienda abierta (si la cerrás, los clientes ven un aviso)')}</div>
        <label className="block"><span className="text-xs font-bold text-slate-600">Nombre de la tienda</span><input disabled={!canEdit} value={s.storeName || ''} onChange={e => set('storeName', e.target.value)} placeholder="Se usa el nombre de la empresa" className={inputCls} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Frase / eslogan</span><input disabled={!canEdit} value={s.slogan || ''} onChange={e => set('slogan', e.target.value)} className={inputCls} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Color principal</span><input disabled={!canEdit} type="color" value={s.accentColor} onChange={e => set('accentColor', e.target.value)} className="mt-1 w-full h-[38px] border border-slate-300 rounded-xl" /></label>
        <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-600">Cartel superior (promoción, horarios)</span><input disabled={!canEdit} value={s.bannerText || ''} onChange={e => set('bannerText', e.target.value)} placeholder="Ej: Envío gratis desde $100.000" className={inputCls} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">WhatsApp de la tienda</span><input disabled={!canEdit} value={s.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="3584123456" className={inputCls} /></label>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <h3 className="md:col-span-3 font-extrabold text-slate-900">Precios y stock</h3>
        <label className="block"><span className="text-xs font-bold text-slate-600">Lista de precios</span>
          <select disabled={!canEdit} value={s.priceList} onChange={e => set('priceList', e.target.value as any)} className={inputCls}>
            <option value="minorista">Minorista</option><option value="mayorista">Mayorista</option><option value="distribuidor">Distribuidor</option>
          </select>
        </label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Compra mínima ($)</span><NumInput disabled={!canEdit} min={0} value={s.minOrderAmount} onChange={e => set('minOrderAmount', Number(e.target.value))} className={inputCls} /></label>
        <div className="space-y-2 pt-5">
          {check('showPricesWithIva', 'Mostrar precios con IVA incluido')}
          {check('showStock', 'Mostrar disponibilidad')}
          {check('hideOutOfStock', 'Ocultar productos sin stock')}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <h3 className="md:col-span-3 font-extrabold text-slate-900">Entrega</h3>
        <div className="space-y-2">{check('pickupEnabled', 'Retiro en el local')}{check('shippingEnabled', 'Envío a domicilio')}</div>
        <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-600">Dirección de retiro</span><input disabled={!canEdit} value={s.pickupAddress || ''} onChange={e => set('pickupAddress', e.target.value)} className={inputCls} /></label>
        {s.shippingEnabled && (
          <>
            <label className="block"><span className="text-xs font-bold text-slate-600">Costo de envío ($, 0 = a coordinar)</span><NumInput disabled={!canEdit} min={0} value={s.shippingCost} onChange={e => set('shippingCost', Number(e.target.value))} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Envío gratis desde ($, 0 = nunca)</span><NumInput disabled={!canEdit} min={0} value={s.freeShippingFrom} onChange={e => set('freeShippingFrom', Number(e.target.value))} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Aclaración (zonas, demoras)</span><input disabled={!canEdit} value={s.shippingNote || ''} onChange={e => set('shippingNote', e.target.value)} className={inputCls} /></label>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <h3 className="md:col-span-4 font-extrabold text-slate-900">Formas de pago</h3>
        <div className="md:col-span-4 flex flex-wrap gap-4">{check('transferEnabled', 'Transferencia')}{check('cashEnabled', 'Efectivo al retirar / recibir')}</div>
        {s.transferEnabled && (
          <>
            <label className="block"><span className="text-xs font-bold text-slate-600">Alias</span><input disabled={!canEdit} value={s.transferAlias || ''} onChange={e => set('transferAlias', e.target.value)} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">CBU / CVU</span><input disabled={!canEdit} value={s.transferCbu || ''} onChange={e => set('transferCbu', e.target.value.replace(/\D/g, ''))} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Titular</span><input disabled={!canEdit} value={s.transferHolder || ''} onChange={e => set('transferHolder', e.target.value)} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Banco / billetera</span><input disabled={!canEdit} value={s.transferBank || ''} onChange={e => set('transferBank', e.target.value)} className={inputCls} /></label>
          </>
        )}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-sm">Mercado Pago</div>
            {s.mercadoPagoTokenEnc ? <span className="text-xs font-bold text-emerald-700">Conectado{s.mercadoPagoAccount ? ` · ${s.mercadoPagoAccount}` : ''}</span> : <span className="text-xs text-slate-500">No conectado</span>}
          </div>
          {s.mercadoPagoTokenEnc && check('mercadoPagoEnabled', 'Ofrecer pago con Mercado Pago en la tienda')}
          {canEdit && (
            <div className="flex flex-wrap gap-2 items-end">
              <label className="block flex-1 min-w-[240px]">
                <span className="text-xs font-bold text-slate-600">{s.mercadoPagoTokenEnc ? 'Reemplazar access token' : 'Access token de producción'}</span>
                <input value={token} onChange={e => setToken(e.target.value.trim())} placeholder="APP_USR-..." className={`${inputCls} font-mono`} autoComplete="off" />
              </label>
              <button disabled={busy || !token} onClick={saveToken} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50">Conectar</button>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Se saca en Mercado Pago → Tu negocio → Configuración → Credenciales (o en mercadopago.com.ar/developers → Tus integraciones). Se guarda cifrado; requiere la variable ARCA_SECRET en Vercel.
          </p>
        </div>
      </section>

      {canEdit && (
        <div className="flex justify-end">
          <button disabled={busy} onClick={() => save()} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black text-white disabled:opacity-50">Guardar configuración</button>
        </div>
      )}
    </div>
  );
};
