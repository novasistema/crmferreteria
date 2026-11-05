import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { ShoppingCart, Search, X, Plus, Minus, Trash2, Store, Truck, CheckCircle2, Copy, Check, MessageCircle, Loader2, PackageSearch, ArrowLeft } from 'lucide-react';
import { db } from '../services/firebase';
import { setDoc, updateDoc } from '../services/offlineSync';
import { CompanyConfig, Product, WebOrder, WebOrderPayment } from '../types';
import {
  withEcommerceDefaults,
  displayPrice,
  isPublishable,
  computeTotals,
  newWebOrderNumber,
  money,
  callMercadoPago,
  whatsappLink,
  PAYMENT_LABEL,
  CartLine
} from '../services/ecommerce';
import { isModuleOn } from '../utils/modules';

const CART_KEY = 'tienda_cart_v1';
const PAGE = 48;

const readCart = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(l => l && l.productId && l.quantity > 0) : [];
  } catch {
    return [];
  }
};
const writeCart = (c: CartLine[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  } catch {
    /* almacenamiento no disponible */
  }
};

const CopyBtn: React.FC<{ value: string }> = ({ value }) => {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value).then(() => { setOk(true); setTimeout(() => setOk(false), 1200); })}
      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
      title="Copiar"
    >
      {ok ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

export const Storefront: React.FC = () => {
  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(readCart);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [placed, setPlaced] = useState<WebOrder | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', taxId: '', address: '', city: '', notes: '' });
  const [delivery, setDelivery] = useState<'retiro' | 'envio'>('retiro');
  const [payment, setPayment] = useState<WebOrderPayment>('transferencia');
  const [returnInfo, setReturnInfo] = useState<string | null>(null);

  const s = useMemo(() => withEcommerceDefaults(config?.ecommerce), [config?.ecommerce]);
  const enabled = isModuleOn(config?.systemModuleToggles, 'ecommerce');
  const storeName = s.storeName || config?.tradeName || config?.companyName || 'Tienda';
  const accent = s.accentColor || '#e11d48';

  useEffect(() => {
    getDoc(doc(db, 'company_config', 'main_config'))
      .then(d => setConfig(d.exists() ? ({ id: d.id, ...d.data() } as CompanyConfig) : null))
      .catch(() => setConfig(null))
      .finally(() => setConfigLoaded(true));
    const unsub = onSnapshot(
      query(collection(db, 'products'), where('publishOnline', '==', true)),
      snap => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setProductsLoaded(true);
      },
      () => setProductsLoaded(true)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    document.title = storeName;
  }, [storeName]);

  useEffect(() => writeCart(cart), [cart]);

  useEffect(() => {
    if (!s.pickupEnabled && s.shippingEnabled) setDelivery('envio');
    const methods: WebOrderPayment[] = [];
    if (s.transferEnabled) methods.push('transferencia');
    if (s.mercadoPagoEnabled && s.mercadoPagoTokenEnc) methods.push('mercadopago');
    if (s.cashEnabled) methods.push('efectivo');
    if (methods.length && !methods.includes(payment)) setPayment(methods[0]);
  }, [s]);

  // Vuelta desde Mercado Pago: /tienda?pedido=ID&payment_id=...&status=approved
  useEffect(() => {
    if (!configLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('pedido');
    if (!orderId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'web_orders', orderId));
        if (!snap.exists()) return;
        const order = { id: snap.id, ...snap.data() } as WebOrder;
        let finalOrder = order;
        const paymentId = params.get('payment_id') || params.get('collection_id');
        if (order.payment === 'mercadopago' && order.status !== 'pagado' && s.mercadoPagoTokenEnc) {
          const r = await callMercadoPago('check_payment', { tokenEnc: s.mercadoPagoTokenEnc, paymentId: paymentId || undefined, orderId });
          if (r.ok && r.found) {
            const patch: Partial<WebOrder> = { mpPaymentId: r.paymentId, mpStatus: r.status, updatedAt: new Date().toISOString() };
            if (r.status === 'approved') patch.status = 'pagado';
            await updateDoc(doc(db, 'web_orders', orderId), patch);
            finalOrder = { ...order, ...patch };
            setReturnInfo(r.status === 'approved' ? '¡Pago aprobado!' : r.status === 'rejected' ? 'El pago fue rechazado. Podés intentar de nuevo o elegir otro medio.' : 'El pago está pendiente de acreditación.');
          } else if (params.get('status') === 'null' || params.get('status') === 'rejected') {
            setReturnInfo('El pago no se completó.');
          }
        }
        setPlaced(finalOrder);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [configLoaded]);

  const visible = useMemo(() => products.filter(p => isPublishable(p, s)), [products, s]);
  const categories = useMemo(() => Array.from(new Set(visible.map(p => p.category).filter(Boolean))).sort(), [visible]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visible
      .filter(p => (!category || p.category === category) && (!q || `${p.name} ${p.code} ${p.brand || ''} ${p.presentation || ''} ${p.color || ''}`.toLowerCase().includes(q)))
      .sort((a, b) => Number(!!b.isFeatured) - Number(!!a.isFeatured) || Number(!!b.isOffer) - Number(!!a.isOffer) || a.name.localeCompare(b.name));
  }, [visible, search, category]);

  const cartLines = useMemo(
    () => cart.map(l => ({ product: visible.find(p => p.id === l.productId), quantity: l.quantity })).filter((l): l is { product: Product; quantity: number } => !!l.product),
    [cart, visible]
  );
  const totals = useMemo(() => computeTotals(cartLines, s, delivery), [cartLines, s, delivery]);
  const cartCount = cartLines.reduce((a, l) => a + l.quantity, 0);

  const setQty = (productId: string, qty: number) => {
    setCart(prev => {
      if (qty <= 0) return prev.filter(l => l.productId !== productId);
      return prev.some(l => l.productId === productId)
        ? prev.map(l => (l.productId === productId ? { ...l, quantity: qty } : l))
        : [...prev, { productId, quantity: qty }];
    });
  };
  const qtyOf = (productId: string) => cart.find(l => l.productId === productId)?.quantity || 0;
  const add = (p: Product) => setQty(p.id, qtyOf(p.id) + 1);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.phone.trim()) return setError('Completá tu nombre y un teléfono de contacto.');
    if (delivery === 'envio' && !form.address.trim()) return setError('Completá la dirección de envío.');
    if (cartLines.length === 0) return setError('El carrito está vacío.');
    if (s.minOrderAmount > 0 && totals.goods < s.minOrderAmount) return setError(`La compra mínima es de ${money(s.minOrderAmount)}.`);
    setPlacing(true);
    try {
      const order: WebOrder = {
        id: `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        number: newWebOrderNumber(),
        createdAt: new Date().toISOString(),
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim() || undefined,
        customerTaxId: form.taxId.replace(/\D/g, '') || undefined,
        customerAddress: form.address.trim() || undefined,
        customerCity: form.city.trim() || undefined,
        customerNotes: form.notes.trim() || undefined,
        items: totals.items.map(i => ({
          productId: i.product.id,
          code: i.product.code,
          name: i.product.name,
          presentation: i.product.presentation || '',
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          ivaRate: i.ivaRate,
          subtotal: i.subtotal
        })),
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        shippingCost: totals.shippingCost,
        total: totals.total,
        delivery,
        payment,
        status: 'nuevo'
      };
      await setDoc(doc(db, 'web_orders', order.id), order);
      const notifId = `notif-web-${order.id}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        title: `Nuevo pedido web ${order.number}`,
        message: `${order.customerName} · ${money(order.total)} · ${PAYMENT_LABEL[order.payment]}`,
        type: 'pedido_web',
        targetEntityId: order.id,
        isRead: false,
        createdAt: new Date().toISOString(),
        actionUrl: 'ecommerce'
      });

      if (payment === 'mercadopago') {
        const r = await callMercadoPago('create_preference', {
          tokenEnc: s.mercadoPagoTokenEnc,
          baseUrl: window.location.origin,
          order: {
            id: order.id,
            storeName,
            payerName: order.customerName,
            payerEmail: order.customerEmail,
            shippingCost: order.shippingCost,
            // A Mercado Pago se le pasa el precio final de cada producto
            items: totals.items.map(i => ({ code: i.product.code, title: `${i.product.name} ${i.product.presentation || ''}`.trim(), quantity: i.quantity, unitPrice: Math.round(((i.subtotal + i.tax) / i.quantity) * 100) / 100 }))
          }
        });
        if (r.ok && r.initPoint) {
          await updateDoc(doc(db, 'web_orders', order.id), { mpPreferenceId: r.preferenceId });
          setCart([]);
          window.location.href = r.initPoint;
          return;
        }
        setError(`Tu pedido ${order.number} quedó registrado, pero no se pudo abrir Mercado Pago (${r.error || 'error'}). Te vamos a contactar para el pago.`);
      }
      setCart([]);
      setCartOpen(false);
      setStep('cart');
      setPlaced(order);
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar el pedido. Probá de nuevo.');
    } finally {
      setPlacing(false);
    }
  };

  // ---------- Estados de carga y tienda no disponible ----------
  if (!configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (!enabled || !s.storeOpen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Store className="w-12 h-12 text-slate-300 mb-3" />
        <h1 className="text-xl font-black text-slate-800">{enabled ? `${storeName} está cerrada por el momento` : 'Tienda no disponible'}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{enabled ? 'Volvé a visitarnos pronto.' : 'Esta tienda online no está activada.'}</p>
        {enabled && s.whatsapp && (
          <a href={whatsappLink(s.whatsapp, 'Hola, quería hacer una consulta')} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">
            <MessageCircle className="w-4 h-4" /> Escribinos por WhatsApp
          </a>
        )}
      </div>
    );
  }

  const logo = config?.logoUrl;
  const transferRows = [
    s.transferAlias && ['Alias', s.transferAlias],
    s.transferCbu && ['CBU / CVU', s.transferCbu],
    s.transferHolder && ['Titular', s.transferHolder],
    s.transferBank && ['Banco', s.transferBank]
  ].filter(Boolean) as [string, string][];

  // ---------- Pedido confirmado ----------
  if (placed) {
    const waText = `Hola! Hice el pedido ${placed.number} en la tienda online por ${money(placed.total)}.`;
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            {logo ? <img src={logo} alt="" className="h-9 w-auto max-w-[120px] object-contain" /> : <Store className="w-7 h-7" style={{ color: accent }} />}
            <span className="font-black text-slate-900">{storeName}</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <h1 className="text-2xl font-black text-slate-900">{placed.status === 'pagado' ? '¡Pago confirmado!' : '¡Recibimos tu pedido!'}</h1>
            <p className="text-slate-600">Pedido <b className="font-mono">{placed.number}</b> · {money(placed.total)}</p>
            {returnInfo && <p className="text-sm font-bold text-slate-700">{returnInfo}</p>}
            <p className="text-sm text-slate-500">Te vamos a contactar al {placed.customerPhone} para coordinar {placed.delivery === 'envio' ? 'el envío' : 'el retiro'}.</p>
          </div>
          {error && <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">{error}</div>}
          {placed.payment === 'transferencia' && placed.status !== 'pagado' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5">
              <h2 className="font-extrabold text-slate-900 mb-2">Datos para transferir {money(placed.total)}</h2>
              {transferRows.length ? transferRows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="flex items-center gap-1 font-bold font-mono text-slate-900">{v}<CopyBtn value={v} /></span>
                </div>
              )) : <p className="text-sm text-slate-500">Te enviamos los datos de pago por WhatsApp.</p>}
              <p className="text-xs text-slate-500 mt-3">Cuando transfieras, mandanos el comprobante por WhatsApp indicando el número de pedido.</p>
            </div>
          )}
          {placed.payment === 'efectivo' && <div className="bg-white rounded-3xl border border-slate-200 p-5 text-sm text-slate-700">Pagás en efectivo al {placed.delivery === 'envio' ? 'recibir el pedido' : 'retirar'}{s.pickupAddress && placed.delivery === 'retiro' ? ` en ${s.pickupAddress}` : ''}.</div>}
          <div className="flex flex-wrap gap-2 justify-center">
            {s.whatsapp && (
              <a href={whatsappLink(s.whatsapp, waText)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold">
                <MessageCircle className="w-4 h-4" /> Avisar por WhatsApp
              </a>
            )}
            <button onClick={() => { setPlaced(null); setReturnInfo(null); setError(null); window.history.replaceState(null, '', '/tienda'); }} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold">
              Seguir comprando
            </button>
          </div>
        </main>
      </div>
    );
  }

  const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:ring-2';

  // ---------- Catálogo ----------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {logo ? <img src={logo} alt="" className="h-9 w-auto max-w-[110px] object-contain" /> : <Store className="w-7 h-7 shrink-0" style={{ color: accent }} />}
            <div className="min-w-0 hidden sm:block">
              <div className="font-black leading-tight truncate">{storeName}</div>
              {s.slogan && <div className="text-[11px] text-slate-500 truncate">{s.slogan}</div>}
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={e => { setSearch(e.target.value); setLimit(PAGE); }} placeholder="Buscar productos…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 text-sm outline-hidden" />
          </div>
          <button onClick={() => { setCartOpen(true); setStep('cart'); }} className="relative p-2.5 rounded-xl text-white shrink-0" style={{ background: accent }} aria-label="Carrito">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
        {categories.length > 1 && (
          <div className="max-w-6xl mx-auto px-4 pb-2.5 flex gap-1.5 overflow-x-auto">
            {['', ...categories].map(c => (
              <button key={c || 'all'} onClick={() => { setCategory(c); setLimit(PAGE); }} className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 border ${category === c ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'}`} style={category === c ? { background: accent } : undefined}>
                {c || 'Todo'}
              </button>
            ))}
          </div>
        )}
      </header>

      {s.bannerText && (
        <div className="text-white text-center text-sm font-bold px-4 py-2.5" style={{ background: accent }}>{s.bannerText}</div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-5">
        {!productsLoaded ? (
          <div className="py-20 flex justify-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <PackageSearch className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            {visible.length === 0 ? 'Todavía no hay productos publicados.' : 'No encontramos productos con esa búsqueda.'}
          </div>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-3">{filtered.length} productos{s.showPricesWithIva ? ' · precios finales con IVA' : ' · precios sin IVA'}</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.slice(0, limit).map(p => {
                const q = qtyOf(p.id);
                const noStock = (p.stock || 0) <= 0;
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="aspect-square bg-slate-100 relative">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-300">{p.name.slice(0, 2).toUpperCase()}</div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {p.isOffer && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>OFERTA</span>}
                        {p.isNew && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900 text-white">NUEVO</span>}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1 gap-1">
                      <div className="text-[11px] text-slate-400 font-semibold truncate">{[p.brand, p.presentation].filter(Boolean).join(' · ')}</div>
                      <div className="text-sm font-bold leading-snug line-clamp-2 min-h-[2.5em]">{p.name}</div>
                      <div className="mt-auto pt-1">
                        <div className="text-lg font-black">{money(displayPrice(p, s))}</div>
                        {s.showStock && <div className={`text-[11px] font-semibold ${noStock ? 'text-rose-600' : 'text-emerald-700'}`}>{noStock ? 'Sin stock · consultar' : 'En stock'}</div>}
                      </div>
                      {q === 0 ? (
                        <button onClick={() => add(p)} className="mt-2 w-full py-2 rounded-xl text-white text-sm font-bold" style={{ background: accent }}>Agregar</button>
                      ) : (
                        <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200">
                          <button onClick={() => setQty(p.id, q - 1)} className="p-2" aria-label="Quitar uno"><Minus className="w-4 h-4" /></button>
                          <span className="font-black">{q}</span>
                          <button onClick={() => setQty(p.id, q + 1)} className="p-2" aria-label="Agregar uno"><Plus className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length > limit && (
              <div className="text-center mt-6">
                <button onClick={() => setLimit(l => l + PAGE)} className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-bold">Ver más productos</button>
              </div>
            )}
          </>
        )}
      </main>

      {s.whatsapp && (
        <a href={whatsappLink(s.whatsapp, `Hola ${storeName}, quería hacer una consulta`)} target="_blank" rel="noreferrer" className="fixed bottom-4 left-4 z-20 w-12 h-12 rounded-full bg-emerald-500 shadow-lg flex items-center justify-center text-white" aria-label="WhatsApp">
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => { setCartOpen(true); setStep('cart'); }} className="fixed bottom-4 right-4 z-20 px-5 py-3 rounded-2xl shadow-xl text-white font-black text-sm flex items-center gap-2" style={{ background: accent }}>
          <ShoppingCart className="w-5 h-5" /> Ver carrito · {money(totals.goods)}
        </button>
      )}

      {/* Carrito / checkout */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50" onClick={() => setCartOpen(false)}>
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step === 'checkout' && <button onClick={() => setStep('cart')} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Volver"><ArrowLeft className="w-5 h-5" /></button>}
                <h2 className="font-black text-lg">{step === 'cart' ? 'Tu carrito' : 'Finalizar compra'}</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>

            {step === 'cart' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cartLines.length === 0 && <p className="text-sm text-slate-500 text-center py-10">Tu carrito está vacío.</p>}
                  {cartLines.map(({ product: p, quantity }) => (
                    <div key={p.id} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.presentation} · {money(displayPrice(p, s))}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => setQty(p.id, quantity - 1)} className="p-1 rounded-lg border border-slate-200" aria-label="Quitar uno"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-sm font-black w-6 text-center">{quantity}</span>
                          <button onClick={() => setQty(p.id, quantity + 1)} className="p-1 rounded-lg border border-slate-200" aria-label="Agregar uno"><Plus className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setQty(p.id, 0)} className="ml-auto p-1 text-rose-500" aria-label="Eliminar"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal sin IVA</span><span className="font-mono">{money(totals.subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">IVA</span><span className="font-mono">{money(totals.taxAmount)}</span></div>
                  <div className="flex justify-between font-black text-lg"><span>Total</span><span>{money(totals.goods)}</span></div>
                  {s.minOrderAmount > 0 && totals.goods < s.minOrderAmount && <div className="text-xs font-bold text-amber-700">Compra mínima {money(s.minOrderAmount)}</div>}
                  <button disabled={cartLines.length === 0 || (s.minOrderAmount > 0 && totals.goods < s.minOrderAmount)} onClick={() => setStep('checkout')} className="w-full py-3 rounded-xl text-white font-black disabled:opacity-40" style={{ background: accent }}>Continuar</button>
                </div>
              </>
            ) : (
              <form onSubmit={placeOrder} className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="block"><span className="text-xs font-bold text-slate-600">Nombre y apellido *</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} autoComplete="name" /></label>
                    <label className="block"><span className="text-xs font-bold text-slate-600">Teléfono / WhatsApp *</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} inputMode="tel" className={inputCls} autoComplete="tel" /></label>
                    <label className="block"><span className="text-xs font-bold text-slate-600">Email</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} autoComplete="email" /></label>
                    <label className="block"><span className="text-xs font-bold text-slate-600">CUIT / DNI (si necesitás factura)</span><input value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} inputMode="numeric" className={inputCls} /></label>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1.5">Entrega</div>
                    <div className="grid grid-cols-2 gap-2">
                      {s.pickupEnabled && (
                        <button type="button" onClick={() => setDelivery('retiro')} className={`p-3 rounded-xl border-2 text-left text-sm ${delivery === 'retiro' ? 'border-slate-900' : 'border-slate-200'}`}>
                          <Store className="w-4 h-4 mb-1" /><div className="font-bold">Retiro en local</div><div className="text-[11px] text-slate-500">Sin cargo</div>
                        </button>
                      )}
                      {s.shippingEnabled && (
                        <button type="button" onClick={() => setDelivery('envio')} className={`p-3 rounded-xl border-2 text-left text-sm ${delivery === 'envio' ? 'border-slate-900' : 'border-slate-200'}`}>
                          <Truck className="w-4 h-4 mb-1" /><div className="font-bold">Envío</div>
                          <div className="text-[11px] text-slate-500">{s.freeShippingFrom > 0 && totals.goods >= s.freeShippingFrom ? 'Gratis' : s.shippingCost > 0 ? money(s.shippingCost) : 'A coordinar'}</div>
                        </button>
                      )}
                    </div>
                    {delivery === 'retiro' && s.pickupAddress && <p className="text-xs text-slate-500 mt-1.5">Retirás en: {s.pickupAddress}</p>}
                    {delivery === 'envio' && (
                      <div className="grid grid-cols-1 gap-3 mt-3">
                        <label className="block"><span className="text-xs font-bold text-slate-600">Dirección *</span><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} autoComplete="street-address" /></label>
                        <label className="block"><span className="text-xs font-bold text-slate-600">Localidad</span><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputCls} /></label>
                        {s.shippingNote && <p className="text-xs text-slate-500">{s.shippingNote}</p>}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1.5">Forma de pago</div>
                    <div className="space-y-2">
                      {([
                        s.transferEnabled && 'transferencia',
                        s.mercadoPagoEnabled && s.mercadoPagoTokenEnc && 'mercadopago',
                        s.cashEnabled && 'efectivo'
                      ].filter(Boolean) as WebOrderPayment[]).map(m => (
                        <label key={m} className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm cursor-pointer ${payment === m ? 'border-slate-900' : 'border-slate-200'}`}>
                          <input type="radio" name="pago" checked={payment === m} onChange={() => setPayment(m)} />
                          <span className="font-bold">{PAYMENT_LABEL[m]}</span>
                          {m === 'mercadopago' && <span className="text-[11px] text-slate-500 ml-auto">Tarjeta, débito o dinero en cuenta</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="block"><span className="text-xs font-bold text-slate-600">Comentarios</span><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} /></label>
                  {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>}
                </div>
                <div className="p-4 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Productos (IVA incluido)</span><span className="font-mono">{money(totals.goods)}</span></div>
                  {delivery === 'envio' && <div className="flex justify-between text-sm"><span className="text-slate-500">Envío</span><span className="font-mono">{totals.shippingCost > 0 ? money(totals.shippingCost) : 'Sin cargo / a coordinar'}</span></div>}
                  <div className="flex justify-between font-black text-lg"><span>Total</span><span>{money(totals.total)}</span></div>
                  <button disabled={placing} className="w-full py-3 rounded-xl text-white font-black disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: accent }}>
                    {placing && <Loader2 className="w-4 h-4 animate-spin" />} {payment === 'mercadopago' ? 'Pagar con Mercado Pago' : 'Confirmar pedido'}
                  </button>
                </div>
              </form>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};
