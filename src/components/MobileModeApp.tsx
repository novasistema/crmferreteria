import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShoppingCart, Package, Users, Wallet, FileText, Truck, Receipt, ArrowLeft, Search, ScanLine, Plus, Minus, Trash2,
  Phone, MessageCircle, ChevronRight, Home, LogOut, Settings2, RefreshCw, Mic, MicOff, CheckCircle2, X, Copy, Check, Loader2, WifiOff
} from 'lucide-react';
import {
  AppUser, CompanyConfig, Product, Customer, Supplier, SalesOrder, Cashbox, CashMovement, CashMovementCategory, MobileModuleId, PriceListType
} from '../types';
import { BarcodeScanner } from './BarcodeScanner';
import { parseVoiceExpense } from '../utils/voiceExpense';
import { subscribeSync, SyncSnapshot } from '../services/offlineSync';

type View = 'menu' | MobileModuleId | 'settings';

const MODULES: { id: MobileModuleId; name: string; icon: React.ElementType; color: string }[] = [
  { id: 'pos', name: 'Vender', icon: ShoppingCart, color: 'bg-orange-50 text-orange-600' },
  { id: 'products', name: 'Productos y precios', icon: Package, color: 'bg-blue-50 text-blue-600' },
  { id: 'clients', name: 'Clientes', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'balances', name: 'Saldos y cobranzas', icon: Wallet, color: 'bg-amber-50 text-amber-600' },
  { id: 'orders', name: 'Pedidos y ventas', icon: FileText, color: 'bg-purple-50 text-purple-600' },
  { id: 'suppliers', name: 'Proveedores', icon: Truck, color: 'bg-slate-100 text-slate-700' },
  { id: 'expenses', name: 'Cargar gasto', icon: Receipt, color: 'bg-rose-50 text-rose-600' }
];

const EXPENSE_CATEGORIES: { value: CashMovementCategory; label: string }[] = [
  { value: 'fletes_logistica', label: 'Combustible, fletes y vehículos' },
  { value: 'servicios_luz_gas', label: 'Servicios (luz, gas, internet)' },
  { value: 'gastos_oficina', label: 'Oficina, limpieza, comida' },
  { value: 'mantenimiento_maquinaria', label: 'Mantenimiento y reparaciones' },
  { value: 'sueldos_jornales', label: 'Sueldos y jornales' },
  { value: 'adelanto_sueldos', label: 'Adelanto de sueldo' },
  { value: 'impuestos_tasas', label: 'Impuestos y tasas' },
  { value: 'alquiler_planta', label: 'Alquiler' },
  { value: 'materias_primas', label: 'Mercadería / insumos' },
  { value: 'otros_egresos', label: 'Otros gastos' }
];

type PayMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'cuenta_corriente';
const PAY_LABEL: Record<PayMethod, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia / QR', tarjeta: 'Tarjeta', cuenta_corriente: 'Cuenta corriente' };

const money = (n: number) => `$ ${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const norm = (t: string) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const digits = (t?: string) => (t || '').replace(/\D/g, '');
const waLink = (phone: string | undefined, text: string) => {
  const d = digits(phone);
  if (!d) return '';
  return `https://wa.me/${d.startsWith('54') ? d : `549${d.replace(/^0/, '')}`}?text=${encodeURIComponent(text)}`;
};
const priceFor = (p: Product, list: PriceListType) =>
  list === 'distribuidor' ? p.priceDistributor || p.priceWholesale || 0 : list === 'mayorista' ? p.priceWholesale || 0 : p.priceRetail || p.priceWholesale || 0;

interface CartLine { product: Product; quantity: number }

interface Props {
  currentUser: AppUser;
  config: CompanyConfig | null;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  salesOrders: SalesOrder[];
  cashboxes: Cashbox[];
  onExit: () => void;
  onLogout: () => void;
  onCreateSale: (order: SalesOrder, cashboxId?: string, paymentMethod?: string) => Promise<void>;
  onRecordPayment: (customerId: string, amount: number, method: 'efectivo' | 'transferencia' | 'cheque' | 'echeq', concept: string) => Promise<void>;
  onAddExpense: (mov: CashMovement) => Promise<void>;
  onSaveMobileModules: (ids: MobileModuleId[]) => Promise<void>;
}

export const MobileModeApp: React.FC<Props> = props => {
  const { currentUser, config, products, customers, suppliers, salesOrders, cashboxes } = props;
  const [view, setView] = useState<View>('menu');
  const [q, setQ] = useState('');
  const [scanFor, setScanFor] = useState<null | 'pos' | 'products'>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [sync, setSync] = useState<SyncSnapshot | null>(null);
  useEffect(() => subscribeSync(setSync), []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const isAdmin = currentUser.role === 'creador' || currentUser.role === 'admin';
  const enabled = config?.mobileModules?.length ? MODULES.filter(m => config.mobileModules!.includes(m.id)) : MODULES;
  const companyName = config?.tradeName || config?.companyName || 'Mi negocio';
  const arsBoxes = cashboxes.filter(c => c.currency === 'ARS');
  const defaultBox = arsBoxes.find(c => c.isDefault) || arsBoxes.find(c => c.type === 'efectivo') || arsBoxes[0];

  const go = (v: View) => { setView(v); setQ(''); window.scrollTo({ top: 0 }); };

  const findByCode = (code: string) => {
    const c = norm(code.trim());
    return products.find(p => norm(p.barcode || '') === c || norm(p.code) === c || (p.alternativeCodes || []).some(a => norm(a) === c) || norm(p.supplierCode || '') === c);
  };
  const productMatches = (p: Product, text: string) => {
    const t = norm(text);
    return !t || t.split(' ').every(w => norm(`${p.name} ${p.code} ${p.barcode || ''} ${p.brand || ''} ${p.presentation || ''} ${p.color || ''}`).includes(w));
  };

  // ---------------- Vender ----------------
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saleCustomerId, setSaleCustomerId] = useState<string>('');
  const [pickCustomer, setPickCustomer] = useState(false);
  const [withInvoice, setWithInvoice] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('efectivo');
  const [payBox, setPayBox] = useState<string>('');
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const saleCustomer = customers.find(c => c.id === saleCustomerId) || null;
  const priceList: PriceListType = saleCustomer?.priceList || 'minorista';

  const addToCart = (p: Product, n = 1) => setCart(prev => {
    const ex = prev.find(l => l.product.id === p.id);
    return ex ? prev.map(l => (l.product.id === p.id ? { ...l, quantity: l.quantity + n } : l)) : [...prev, { product: p, quantity: n }];
  });
  const setQty = (id: string, qty: number) => setCart(prev => (qty <= 0 ? prev.filter(l => l.product.id !== id) : prev.map(l => (l.product.id === id ? { ...l, quantity: qty } : l))));
  const subtotal = cart.reduce((a, l) => a + priceFor(l.product, priceList) * l.quantity, 0);
  const iva = withInvoice ? Math.round(cart.reduce((a, l) => a + priceFor(l.product, priceList) * l.quantity * ((l.product.ivaRate ?? 21) / 100), 0) * 100) / 100 : 0;
  const total = Math.round((subtotal + iva) * 100) / 100;

  const confirmSale = async () => {
    if (!cart.length) return;
    if (payMethod === 'cuenta_corriente' && !saleCustomer) return setToast({ ok: false, text: 'Para cuenta corriente elegí un cliente.' });
    setBusy(true);
    try {
      const emitter = config?.taxSettings?.ivaCondition || config?.arcaTaxCondition || 'responsable_inscripto';
      const cat = saleCustomer?.taxCategory || 'consumidor_final';
      const invoiceType: SalesOrder['invoiceType'] = !withInvoice ? 'RECIBO_X_NO_ARCA' : emitter !== 'responsable_inscripto' ? 'FACTURA_C' : cat === 'responsable_inscripto' || cat === 'monotributo' ? 'FACTURA_A' : 'FACTURA_B';
      const pending = payMethod === 'cuenta_corriente';
      const id = `sale-mov-${Date.now()}`;
      const order: SalesOrder = {
        id,
        orderNumber: `MOV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        customerId: saleCustomer?.id || 'occasional',
        customerName: saleCustomer?.businessName || 'Consumidor final',
        customerTaxId: saleCustomer?.taxId || '',
        customerPhone: saleCustomer?.phone,
        customerEmail: saleCustomer?.email,
        customerAddress: saleCustomer ? `${saleCustomer.address}, ${saleCustomer.city}` : 'Mostrador',
        billingType: withInvoice ? 'arca' : 'no_arca',
        invoiceType,
        invoiceNumber: withInvoice ? undefined : `TKT-M-${String(Date.now()).slice(-8)}`,
        date: new Date().toISOString(),
        status: 'entregado',
        deliveryStatus: 'entrega_total',
        paymentStatus: pending ? 'pendiente' : 'pagado',
        paidAmount: pending ? 0 : total,
        items: cart.map(l => ({
          productId: l.product.id,
          productName: `${l.product.name} (${l.product.presentation})`,
          code: l.product.code,
          presentation: l.product.presentation,
          quantity: l.quantity,
          deliveredQuantity: l.quantity,
          unitPrice: priceFor(l.product, priceList),
          discount: 0,
          subtotal: Math.round(priceFor(l.product, priceList) * l.quantity * 100) / 100
        })),
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: iva,
        total,
        notes: `Venta desde Modo Móvil · ${PAY_LABEL[payMethod]} · ${currentUser.name}`
      };
      await props.onCreateSale(order, payMethod === 'efectivo' ? payBox || defaultBox?.id : undefined, payMethod);
      setCart([]);
      setSaleCustomerId('');
      setCheckout(false);
      setToast({ ok: true, text: withInvoice ? `Venta registrada por ${money(total)}. Queda pendiente de CAE en Facturación ARCA.` : `Venta registrada por ${money(total)}.` });
    } catch (e: any) {
      setToast({ ok: false, text: e?.message || 'No se pudo registrar la venta.' });
    } finally {
      setBusy(false);
    }
  };

  // ---------------- Gastos ----------------
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCat, setExpCat] = useState<CashMovementCategory | ''>('');
  const [expBox, setExpBox] = useState('');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const recRef = useRef<any>(null);
  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* nada */ } }, []);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setToast({ ok: false, text: 'Este navegador no permite dictar. Usá Chrome o el micrófono del teclado.' });
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'es-AR';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev: any) => {
      const said = ev.results?.[0]?.[0]?.transcript || '';
      setHeard(said);
      const r = parseVoiceExpense(said, arsBoxes);
      if (r.amount) setExpAmount(String(r.amount));
      if (r.category) setExpCat(r.category);
      if (r.cashboxId) setExpBox(r.cashboxId);
      if (r.description) setExpDesc(r.description);
      const missing = [!r.amount && 'importe', !r.category && 'categoría', !r.cashboxId && 'de dónde sale'].filter(Boolean);
      setToast({ ok: !missing.length, text: missing.length ? `Revisá: falta ${missing.join(', ')}` : 'Listo, revisá y tocá Registrar gasto' });
    };
    rec.onerror = (ev: any) => setToast({ ok: false, text: ev.error === 'not-allowed' ? 'Permití el micrófono para esta página.' : 'No se pudo escuchar. Probá de nuevo.' });
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setHeard('');
    setListening(true);
    rec.start();
  };

  const saveExpense = async () => {
    const amount = Number(String(expAmount).replace(/\./g, '').replace(',', '.'));
    const box = arsBoxes.find(b => b.id === (expBox || defaultBox?.id));
    if (!(amount > 0)) return setToast({ ok: false, text: 'Ingresá un importe mayor a cero.' });
    if (!expCat) return setToast({ ok: false, text: 'Elegí una categoría.' });
    if (!box) return setToast({ ok: false, text: 'Elegí de qué caja sale el pago.' });
    setBusy(true);
    try {
      await props.onAddExpense({
        id: `mov-mob-${Date.now()}`,
        cashboxId: box.id,
        cashboxName: box.name,
        type: 'egreso',
        amount: Math.round(amount * 100) / 100,
        category: expCat,
        concept: expDesc.trim() || EXPENSE_CATEGORIES.find(c => c.value === expCat)?.label || 'Gasto',
        date: new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10),
        user: currentUser.name,
        createdAt: new Date().toISOString()
      });
      setExpAmount(''); setExpDesc(''); setExpCat(''); setHeard('');
      setToast({ ok: true, text: `Gasto de ${money(amount)} registrado en ${box.name}.` });
    } finally {
      setBusy(false);
    }
  };

  // ---------------- Cobranzas ----------------
  const [openClient, setOpenClient] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payKind, setPayKind] = useState<'efectivo' | 'transferencia' | 'cheque' | 'echeq'>('efectivo');

  const registerPayment = async (c: Customer) => {
    const amount = Number(String(payAmount).replace(/\./g, '').replace(',', '.'));
    if (!(amount > 0)) return setToast({ ok: false, text: 'Ingresá el importe cobrado.' });
    setBusy(true);
    try {
      await props.onRecordPayment(c.id, Math.round(amount * 100) / 100, payKind, `Cobranza desde Modo Móvil · ${currentUser.name}`);
      setPayAmount('');
      setToast({ ok: true, text: `Cobro de ${money(amount)} registrado a ${c.businessName}.` });
    } catch (e: any) {
      setToast({ ok: false, text: e?.message || 'No se pudo registrar el cobro.' });
    } finally {
      setBusy(false);
    }
  };

  // ---------------- Configuración de módulos ----------------
  const [moduleSel, setModuleSel] = useState<MobileModuleId[]>(enabled.map(m => m.id));

  // ---------------- Render helpers ----------------
  const header = (title: string, right?: React.ReactNode) => (
    <div className="sticky top-0 z-20 bg-slate-900 text-white px-3 py-3 flex items-center gap-2">
      <button onClick={() => go('menu')} className="p-2 rounded-full hover:bg-white/10" aria-label="Volver"><ArrowLeft className="w-5 h-5" /></button>
      <h1 className="font-black text-lg flex-1 truncate">{title}</h1>
      {right}
    </div>
  );
  const searchBox = (placeholder: string, scan?: 'pos' | 'products') => (
    <div className="p-3 bg-white border-b border-slate-200 flex gap-2 sticky top-[60px] z-10">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} className="w-full pl-9 pr-3 py-3 rounded-xl bg-slate-100 text-base outline-hidden focus:bg-white focus:ring-2 focus:ring-slate-300" />
      </div>
      {scan && <button onClick={() => setScanFor(scan)} className="px-3 rounded-xl bg-slate-900 text-white" aria-label="Escanear código"><ScanLine className="w-5 h-5" /></button>}
    </div>
  );
  const empty = (text: string) => <div className="p-10 text-center text-slate-400 text-sm">{text}</div>;

  const renderMenu = () => (
    <div className="min-h-full flex flex-col">
      <div className="bg-slate-900 text-white px-5 pt-6 pb-8">
        <div className="flex items-center gap-3">
          {config?.logoUrl ? <img src={config.logoUrl} alt="" className="w-12 h-12 rounded-xl object-contain bg-white p-1" /> : <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center"><Package className="w-6 h-6" /></div>}
          <div className="min-w-0">
            <div className="font-black text-xl truncate">{companyName}</div>
            <div className="text-xs text-slate-300">Modo Móvil · {currentUser.name}</div>
          </div>
        </div>
      </div>
      <div className="-mt-5 px-4 grid grid-cols-2 gap-3">
        {enabled.map(m => (
          <button key={m.id} onClick={() => go(m.id)} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-left active:scale-[0.98] transition-transform">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${m.color}`}><m.icon className="w-6 h-6" /></div>
            <div className="mt-2 font-bold text-slate-800 leading-tight">{m.name}</div>
            {m.id === 'pos' && cart.length > 0 && <div className="text-[11px] font-bold text-orange-600 mt-0.5">{cart.length} en el carrito</div>}
          </button>
        ))}
      </div>
      <div className="px-4 mt-4">
        <div className={`rounded-2xl p-3.5 text-sm flex items-center gap-2.5 ${sync?.state === 'offline' ? 'bg-rose-50 text-rose-700' : sync?.pending ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
          {sync?.state === 'offline' ? <WifiOff className="w-5 h-5" /> : sync?.pending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          <div className="flex-1">
            {sync?.state === 'offline' ? `Sin internet: ${sync.pending} cambio(s) se van a sincronizar al volver.` : sync?.pending ? `Sincronizando ${sync.pending} cambio(s)…` : 'Todo sincronizado'}
          </div>
        </div>
      </div>
      <div className="mt-auto p-4 space-y-2">
        {isAdmin && <button onClick={() => { setModuleSel(enabled.map(m => m.id)); go('settings'); }} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700"><Settings2 className="w-4 h-4" /> Elegir módulos del celular</button>}
        <button onClick={props.onExit} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700"><Home className="w-4 h-4" /> Versión completa</button>
        <button onClick={props.onLogout} className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-rose-600"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
      </div>
    </div>
  );

  const renderPos = () => {
    const results = q.trim() ? products.filter(p => p.active !== false && productMatches(p, q)).slice(0, 40) : [];
    return (
      <div className="pb-28">
        {header('Vender', <span className="text-xs font-bold bg-white/10 rounded-full px-2.5 py-1">{saleCustomer ? saleCustomer.businessName.slice(0, 16) : 'Consumidor final'}</span>)}
        {searchBox('Buscar o escanear producto', 'pos')}
        {q.trim() && (
          <div className="bg-white divide-y divide-slate-100">
            {results.map(p => (
              <button key={p.id} onClick={() => { addToCart(p); setQ(''); setToast({ ok: true, text: `${p.name} agregado` }); }} className="w-full p-3 flex items-center gap-3 text-left active:bg-slate-50">
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{p.name} <span className="text-slate-400 font-normal">{p.presentation}</span></div><div className="text-[11px] text-slate-500">{p.code} · stock {p.stock ?? 0}</div></div>
                <div className="font-black text-sm">{money(priceFor(p, priceList))}</div>
                <Plus className="w-5 h-5 text-orange-600" />
              </button>
            ))}
            {results.length === 0 && empty('No se encontraron productos')}
          </div>
        )}
        {!q.trim() && (
          <div className="p-3 space-y-2">
            {cart.length === 0 && empty('Buscá un producto o escaneá el código de barras para empezar.')}
            {cart.map(l => (
              <div key={l.product.id} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{l.product.name}</div><div className="text-xs text-slate-500">{money(priceFor(l.product, priceList))} c/u</div></div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setQty(l.product.id, l.quantity - 1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center" aria-label="Quitar uno">{l.quantity === 1 ? <Trash2 className="w-4 h-4 text-rose-500" /> : <Minus className="w-4 h-4" />}</button>
                  <input value={l.quantity} onChange={e => setQty(l.product.id, Math.max(0, Number(e.target.value) || 0))} inputMode="decimal" className="w-12 text-center font-black text-base bg-transparent" />
                  <button onClick={() => setQty(l.product.id, l.quantity + 1)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center" aria-label="Agregar uno"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {cart.length > 0 && (
              <button onClick={() => setPickCustomer(true)} className="w-full bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3 text-left">
                <Users className="w-5 h-5 text-slate-500" />
                <div className="flex-1"><div className="text-xs text-slate-500">Cliente</div><div className="font-semibold text-sm">{saleCustomer ? `${saleCustomer.businessName} · lista ${saleCustomer.priceList}` : 'Consumidor final'}</div></div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        )}
        {cart.length > 0 && !q.trim() && (
          <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <button onClick={() => setCheckout(true)} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black text-lg flex items-center justify-center gap-2">
              Cobrar {money(subtotal)}
            </button>
          </div>
        )}

        {pickCustomer && (
          <div className="fixed inset-0 z-40 bg-white flex flex-col">
            <div className="p-3 flex items-center gap-2 border-b border-slate-200">
              <button onClick={() => setPickCustomer(false)} className="p-2" aria-label="Cerrar"><X className="w-5 h-5" /></button>
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cliente por nombre o CUIT" className="flex-1 px-3 py-3 rounded-xl bg-slate-100 text-base outline-hidden" />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              <button onClick={() => { setSaleCustomerId(''); setPickCustomer(false); setQ(''); }} className="w-full p-4 text-left font-semibold">Consumidor final</button>
              {customers.filter(c => !q || norm(`${c.businessName} ${c.taxId}`).includes(norm(q))).slice(0, 60).map(c => (
                <button key={c.id} onClick={() => { setSaleCustomerId(c.id); setPickCustomer(false); setQ(''); }} className="w-full p-4 text-left">
                  <div className="font-semibold text-sm">{c.businessName}</div>
                  <div className="text-xs text-slate-500">{c.taxId} · lista {c.priceList}{c.currentBalance > 0 ? ` · debe ${money(c.currentBalance)}` : ''}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {checkout && (
          <div className="fixed inset-0 z-40 bg-slate-950/60 flex items-end" onClick={() => !busy && setCheckout(false)}>
            <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto pb-[max(20px,env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h2 className="font-black text-lg">Cobrar</h2><button onClick={() => setCheckout(false)} className="p-1"><X className="w-5 h-5" /></button></div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setWithInvoice(false)} className={`p-3 rounded-2xl border-2 text-left ${!withInvoice ? 'border-slate-900' : 'border-slate-200'}`}><div className="font-bold text-sm">Sin factura</div><div className="text-[11px] text-slate-500">Ingreso de venta</div></button>
                <button onClick={() => setWithInvoice(true)} className={`p-3 rounded-2xl border-2 text-left ${withInvoice ? 'border-slate-900' : 'border-slate-200'}`}><div className="font-bold text-sm">Con factura</div><div className="text-[11px] text-slate-500">Suma IVA · CAE en ARCA</div></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PAY_LABEL) as PayMethod[]).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)} disabled={m === 'cuenta_corriente' && !saleCustomer} className={`p-3 rounded-2xl border-2 text-sm font-bold disabled:opacity-40 ${payMethod === m ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>{PAY_LABEL[m]}</button>
                ))}
              </div>
              {payMethod === 'efectivo' && arsBoxes.length > 0 && (
                <label className="block"><span className="text-xs font-bold text-slate-600">Entra en la caja</span>
                  <select value={payBox || defaultBox?.id || ''} onChange={e => setPayBox(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-3 text-base">{arsBoxes.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                </label>
              )}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-mono">{money(subtotal)}</span></div>
                {withInvoice && <div className="flex justify-between"><span className="text-slate-500">IVA</span><span className="font-mono">{money(iva)}</span></div>}
                <div className="flex justify-between text-xl font-black"><span>Total</span><span>{money(total)}</span></div>
              </div>
              <button disabled={busy} onClick={confirmSale} className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black text-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-5 h-5 animate-spin" />} Confirmar venta
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const renderProducts = () => {
    const list = products.filter(p => p.active !== false && productMatches(p, q)).slice(0, 80);
    return (
      <div>
        {header('Productos y precios')}
        {searchBox('Nombre, código o código de barras', 'products')}
        <div className="bg-white divide-y divide-slate-100">
          {list.map(p => {
            const open = openProduct === p.id;
            const cost = p.unitCost || p.costListWithoutIva || 0;
            const retail = priceFor(p, 'minorista');
            return (
              <button key={p.id} onClick={() => setOpenProduct(open ? null : p.id)} className="w-full p-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm leading-snug">{p.name} <span className="text-slate-400 font-normal">{p.presentation}</span></div><div className="text-[11px] text-slate-500 font-mono">{p.code}{p.barcode ? ` · ${p.barcode}` : ''}</div></div>
                  <div className="text-right shrink-0"><div className="font-black text-emerald-700">{money(retail)}</div><div className={`text-[11px] font-bold ${(p.stock || 0) > 0 ? 'text-slate-500' : 'text-rose-600'}`}>{(p.stock || 0) > 0 ? `Stock ${p.stock}` : 'Sin stock'}</div></div>
                </div>
                {open && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {[['Minorista', priceFor(p, 'minorista')], ['Mayorista', priceFor(p, 'mayorista')], ['Distribuidor', priceFor(p, 'distribuidor')], ['Costo', cost]].map(([k, v]) => (
                      <div key={k as string} className="bg-slate-50 rounded-xl p-2"><div className="text-slate-500">{k}</div><div className="font-black text-sm">{money(v as number)}</div></div>
                    ))}
                    <div className="bg-slate-50 rounded-xl p-2"><div className="text-slate-500">Margen minorista</div><div className={`font-black text-sm ${cost > 0 && (retail - cost) / cost >= 0.3 ? 'text-emerald-700' : 'text-amber-700'}`}>{cost > 0 ? `${Math.round(((retail - cost) / cost) * 100)} %` : '—'}</div></div>
                    <div className="bg-slate-50 rounded-xl p-2"><div className="text-slate-500">IVA · ubicación</div><div className="font-black text-sm">{p.ivaRate ?? 21}% · {p.location || '—'}</div></div>
                    {(p.warehouseStocks || []).length > 0 && <div className="col-span-2 bg-slate-50 rounded-xl p-2">{p.warehouseStocks!.map(w => <div key={w.warehouseId} className="flex justify-between"><span>{w.warehouseName}</span><b>{w.stock}</b></div>)}</div>}
                    {p.brand && <div className="col-span-2 text-slate-500">Marca: <b>{p.brand}</b>{p.supplierName ? ` · Proveedor: ${p.supplierName}` : ''}</div>}
                  </div>
                )}
              </button>
            );
          })}
          {list.length === 0 && empty('No se encontraron productos')}
        </div>
      </div>
    );
  };

  const contactButtons = (phone?: string, waText = '') => (
    <div className="flex gap-1.5 shrink-0">
      {digits(phone) && <a href={`tel:${digits(phone)}`} onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center" aria-label="Llamar"><Phone className="w-4 h-4" /></a>}
      {waLink(phone, waText) && <a href={waLink(phone, waText)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center" aria-label="WhatsApp"><MessageCircle className="w-4 h-4" /></a>}
    </div>
  );

  const renderClients = () => {
    const list = customers.filter(c => !q || norm(`${c.businessName} ${c.tradeName || ''} ${c.taxId} ${c.city}`).includes(norm(q))).slice(0, 80);
    return (
      <div>
        {header('Clientes')}
        {searchBox('Nombre, CUIT o localidad')}
        <div className="bg-white divide-y divide-slate-100">
          {list.map(c => (
            <div key={c.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{c.businessName}</div>
                <div className="text-[11px] text-slate-500">{c.taxId} · {c.city} · lista {c.priceList}</div>
                <div className={`text-xs font-bold ${c.currentBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{c.currentBalance > 0 ? `Debe ${money(c.currentBalance)}` : c.currentBalance < 0 ? `A favor ${money(-c.currentBalance)}` : 'Sin deuda'}{c.creditLimit > 0 ? ` · límite ${money(c.creditLimit)}` : ''}</div>
              </div>
              {contactButtons(c.phone, `Hola ${c.businessName}!`)}
            </div>
          ))}
          {list.length === 0 && empty('No se encontraron clientes')}
        </div>
      </div>
    );
  };

  const renderBalances = () => {
    const debtors = customers.filter(c => c.currentBalance > 0 && (!q || norm(`${c.businessName} ${c.taxId}`).includes(norm(q)))).sort((a, b) => b.currentBalance - a.currentBalance);
    const totalDebt = debtors.reduce((a, c) => a + c.currentBalance, 0);
    return (
      <div>
        {header('Saldos y cobranzas')}
        <div className="bg-amber-50 px-4 py-3 text-sm"><span className="text-amber-800">Te deben en total</span> <b className="text-lg text-amber-900 block">{money(totalDebt)}</b><span className="text-xs text-amber-700">{debtors.length} clientes</span></div>
        {searchBox('Buscar cliente')}
        <div className="bg-white divide-y divide-slate-100">
          {debtors.map(c => {
            const open = openClient === c.id;
            const pend = salesOrders.filter(o => o.customerId === c.id && o.paymentStatus !== 'pagado').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
            return (
              <div key={c.id} className="p-3">
                <button onClick={() => { setOpenClient(open ? null : c.id); setPayAmount(''); }} className="w-full flex items-center gap-3 text-left">
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{c.businessName}</div><div className="text-[11px] text-slate-500">{c.phone || 'sin teléfono'}</div></div>
                  <div className="font-black text-rose-600">{money(c.currentBalance)}</div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
                </button>
                {open && (
                  <div className="mt-3 space-y-3">
                    {pend.length > 0 && (
                      <div className="text-xs bg-slate-50 rounded-xl p-2.5 space-y-1">
                        {pend.map(o => <div key={o.id} className="flex justify-between"><span>{new Date(o.date).toLocaleDateString('es-AR')} · {o.orderNumber}</span><b>{money(o.total - (o.paidAmount || 0))}</b></div>)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={payAmount} onChange={e => setPayAmount(e.target.value)} inputMode="decimal" placeholder="Importe cobrado" className="flex-1 border border-slate-300 rounded-xl px-3 py-3 text-base" />
                      <select value={payKind} onChange={e => setPayKind(e.target.value as any)} className="border border-slate-300 rounded-xl px-2 text-sm"><option value="efectivo">Efectivo</option><option value="transferencia">Transfer.</option><option value="cheque">Cheque</option><option value="echeq">E-cheq</option></select>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => registerPayment(c)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-50">Registrar cobro</button>
                      {waLink(c.phone, '') && <a href={waLink(c.phone, `Hola ${c.businessName}! Te recordamos que tenés un saldo pendiente de ${money(c.currentBalance)}. Cualquier consulta estamos a disposición. ${companyName}`)} target="_blank" rel="noreferrer" className="px-4 py-3 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> Recordar</a>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {debtors.length === 0 && empty('Ningún cliente tiene saldo pendiente')}
        </div>
      </div>
    );
  };

  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const renderOrders = () => {
    const list = [...salesOrders].filter(o => !q || norm(`${o.orderNumber} ${o.customerName}`).includes(norm(q))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
    return (
      <div>
        {header('Pedidos y ventas')}
        {searchBox('Número o cliente')}
        <div className="bg-white divide-y divide-slate-100">
          {list.map(o => (
            <button key={o.id} onClick={() => setOpenOrder(openOrder === o.id ? null : o.id)} className="w-full p-3 text-left">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{o.customerName}</div>
                  <div className="text-[11px] text-slate-500">{o.orderNumber} · {new Date(o.date).toLocaleDateString('es-AR')}</div>
                  <div className="flex gap-1 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${o.status === 'entregado' ? 'bg-emerald-100 text-emerald-800' : o.status === 'cancelado' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>{o.status.replace('_', ' ')}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${o.paymentStatus === 'pagado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`}>{o.paymentStatus}</span>
                    {o.billingType === 'arca' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">{o.cae ? 'Facturada' : 'Sin CAE'}</span>}
                  </div>
                </div>
                <div className="font-black text-sm">{money(o.total)}</div>
              </div>
              {openOrder === o.id && (
                <div className="mt-2 text-xs bg-slate-50 rounded-xl p-2.5 space-y-1">
                  {o.items.map((it, i) => <div key={i} className="flex justify-between gap-2"><span className="truncate">{it.quantity} × {it.productName}</span><b className="shrink-0">{money(it.subtotal)}</b></div>)}
                  {o.notes && <div className="text-slate-500 pt-1">{o.notes}</div>}
                </div>
              )}
            </button>
          ))}
          {list.length === 0 && empty('No hay pedidos')}
        </div>
      </div>
    );
  };

  const [copied, setCopied] = useState('');
  const renderSuppliers = () => {
    const list = suppliers.filter(s => !q || norm(`${s.businessName} ${s.name || ''} ${s.taxId} ${s.category}`).includes(norm(q))).slice(0, 80);
    return (
      <div>
        {header('Proveedores')}
        {searchBox('Nombre, CUIT o rubro')}
        <div className="bg-white divide-y divide-slate-100">
          {list.map(s => (
            <div key={s.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{s.businessName}</div>
                <div className="text-[11px] text-slate-500">{s.taxId} · {s.category}{s.paymentTerms ? ` · ${s.paymentTerms}` : ''}</div>
                {s.cbuOrAlias && (
                  <button onClick={() => navigator.clipboard?.writeText(s.cbuOrAlias!).then(() => { setCopied(s.id); setTimeout(() => setCopied(''), 1200); })} className="text-[11px] font-mono text-sky-700 flex items-center gap-1">
                    {s.cbuOrAlias} {copied === s.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
              {contactButtons(s.phone, `Hola ${s.businessName}, te escribo de ${companyName}.`)}
            </div>
          ))}
          {list.length === 0 && empty('No se encontraron proveedores')}
        </div>
      </div>
    );
  };

  const renderExpenses = () => (
    <div>
      {header('Cargar gasto')}
      <div className="p-4 space-y-4">
        <button onClick={startVoice} className={`w-full py-5 rounded-2xl font-black text-base flex items-center justify-center gap-2 ${listening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-900 text-white'}`}>
          {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />} {listening ? 'Escuchando… tocá para terminar' : 'Dictar el gasto'}
        </button>
        <p className="text-xs text-slate-500 text-center -mt-2">Ej: “combustible quince mil pagado con Mercado Pago”</p>
        {heard && <div className="text-sm bg-slate-100 rounded-xl p-3 italic text-slate-600">“{heard}”</div>}
        <label className="block"><span className="text-xs font-bold text-slate-600">Importe</span><input value={expAmount} onChange={e => setExpAmount(e.target.value)} inputMode="decimal" placeholder="0" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-3 text-2xl font-black" /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Descripción</span><input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Ej: Nafta camioneta" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-3 text-base" /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Categoría</span>
          <select value={expCat} onChange={e => setExpCat(e.target.value as CashMovementCategory)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-3 text-base">
            <option value="">Elegí la categoría…</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Sale de</span>
          <select value={expBox || defaultBox?.id || ''} onChange={e => setExpBox(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-3 text-base">
            {arsBoxes.length === 0 && <option value="">No hay cajas cargadas</option>}
            {arsBoxes.map(b => <option key={b.id} value={b.id}>{b.name} · {money(b.currentBalance)}</option>)}
          </select>
        </label>
        <button disabled={busy} onClick={saveExpense} className="w-full py-4 rounded-2xl bg-rose-600 text-white font-black text-lg disabled:opacity-50">Registrar gasto</button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      {header('Módulos del celular')}
      <div className="p-4 space-y-2">
        <p className="text-sm text-slate-600">Elegí qué ven los usuarios en el Modo Móvil.</p>
        {MODULES.map(m => (
          <label key={m.id} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-3">
            <input type="checkbox" className="w-5 h-5" checked={moduleSel.includes(m.id)} onChange={e => setModuleSel(prev => (e.target.checked ? [...prev, m.id] : prev.filter(x => x !== m.id)))} />
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.color}`}><m.icon className="w-5 h-5" /></div>
            <span className="font-semibold text-sm">{m.name}</span>
          </label>
        ))}
        <button
          disabled={busy || moduleSel.length === 0}
          onClick={async () => { setBusy(true); try { await props.onSaveMobileModules(MODULES.map(m => m.id).filter(id => moduleSel.includes(id))); setToast({ ok: true, text: 'Módulos guardados.' }); go('menu'); } finally { setBusy(false); } }}
          className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </div>
  );

  const onScan = (code: string) => {
    const target = scanFor;
    setScanFor(null);
    const p = findByCode(code);
    if (target === 'pos') {
      if (p) { addToCart(p); setQ(''); setToast({ ok: true, text: `${p.name} agregado` }); }
      else { setQ(code); setToast({ ok: false, text: `No hay un producto con el código ${code}.` }); }
    } else {
      setQ(p ? p.code : code);
      if (p) setOpenProduct(p.id);
      else setToast({ ok: false, text: `No hay un producto con el código ${code}.` });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-100 overflow-y-auto text-slate-900">
      {view === 'menu' && renderMenu()}
      {view === 'pos' && renderPos()}
      {view === 'products' && renderProducts()}
      {view === 'clients' && renderClients()}
      {view === 'balances' && renderBalances()}
      {view === 'orders' && renderOrders()}
      {view === 'suppliers' && renderSuppliers()}
      {view === 'expenses' && renderExpenses()}
      {view === 'settings' && renderSettings()}
      {scanFor && <BarcodeScanner onDetected={onScan} onClose={() => setScanFor(null)} />}
      {toast && (
        <div className={`fixed left-3 right-3 top-3 z-[90] rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl ${toast.ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>{toast.text}</div>
      )}
    </div>
  );
};
