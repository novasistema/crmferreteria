import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShoppingBag, 
  CreditCard, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  ArrowLeft, 
  DollarSign, 
  User, 
  Users, 
  Calendar, 
  ChevronRight, 
  Check, 
  ExternalLink,
  Package,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Share2,
  FileText,
  BadgePercent,
  ShieldCheck,
  Crosshair
} from 'lucide-react';
import { 
  Customer, 
  Product, 
  RouteSheet, 
  RouteSheetStop, 
  SalesOrder, 
  SalesOrderItem, 
  Seller, 
  CompanyConfig, 
  FinancialTransaction,
  VisitStatus,
  PriceListType
} from '../types';

interface MobileSellerAppProps {
  sellers: Seller[];
  routeSheets: RouteSheet[];
  customers: Customer[];
  products: Product[];
  salesOrders: SalesOrder[];
  financialTransactions: FinancialTransaction[];
  config: CompanyConfig | null;
  activeSellerContext: Seller | null;
  onSetActiveSellerContext: (seller: Seller | null) => void;
  onCloseMobileApp: () => void;
  onCreateSalesOrder: (order: SalesOrder) => Promise<void>;
  onRecordCustomerPayment: (
    customerId: string, 
    amount: number, 
    method: 'efectivo' | 'transferencia' | 'cheque' | 'echeq', 
    concept: string, 
    receiptNumber?: string, 
    bankInfo?: string, 
    allocatedOrderIds?: string[]
  ) => Promise<void>;
  onSaveRouteSheet: (routeSheet: RouteSheet) => Promise<void>;
}

type TabType = 'route' | 'order' | 'balances' | 'prices';

export const MobileSellerApp: React.FC<MobileSellerAppProps> = ({
  sellers,
  routeSheets,
  customers,
  products,
  salesOrders,
  financialTransactions,
  config,
  activeSellerContext,
  onSetActiveSellerContext,
  onCloseMobileApp,
  onCreateSalesOrder,
  onRecordCustomerPayment,
  onSaveRouteSheet
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('route');

  // Selected Seller (default to active context, or first seller)
  const currentSeller = useMemo(() => {
    if (activeSellerContext) return activeSellerContext;
    if (sellers.length > 0) return sellers[0];
    return null;
  }, [activeSellerContext, sellers]);

  // Selected Route Sheet for current seller
  const sellerRouteSheets = useMemo(() => {
    if (!currentSeller) return routeSheets;
    return routeSheets.filter(r => r.sellerId === currentSeller.id);
  }, [routeSheets, currentSeller]);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(() => {
    return sellerRouteSheets[0]?.id || routeSheets[0]?.id || '';
  });

  const activeRouteSheet = useMemo(() => {
    return routeSheets.find(r => r.id === selectedRouteId) || sellerRouteSheets[0] || routeSheets[0] || null;
  }, [routeSheets, sellerRouteSheets, selectedRouteId]);

  // --- NEW ORDER STATE ---
  const [orderCustomer, setOrderCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [orderCart, setOrderCart] = useState<{ [productId: string]: number }>({});
  const [orderCategoryFilter, setOrderCategoryFilter] = useState<string>('all');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<SalesOrder | null>(null);

  // --- RECORD PAYMENT MODAL ---
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'cheque' | 'echeq'>('efectivo');
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // --- VISIT CHECK-IN MODAL & GEOTAGGING GPS ---
  const [visitingStop, setVisitingStop] = useState<{ stop: RouteSheetStop; sheetId: string } | null>(null);
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('visitado_con_venta');
  const [visitNotes, setVisitNotes] = useState('');
  const [gpsState, setGpsState] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
    status: 'idle' | 'capturing' | 'success' | 'denied' | 'error';
    errorMsg?: string;
  }>({
    lat: 0,
    lng: 0,
    accuracy: 0,
    timestamp: '',
    status: 'idle'
  });

  // Request high-accuracy GPS coordinates for managerial validation
  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsState({
        lat: 0,
        lng: 0,
        accuracy: 0,
        timestamp: new Date().toISOString(),
        status: 'error',
        errorMsg: 'Geolocalización GPS no soportada en este dispositivo.'
      });
      return;
    }

    setGpsState(prev => ({
      ...prev,
      status: 'capturing',
      errorMsg: undefined
    }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      },
      (err) => {
        let msg = 'No se pudo obtener señal satelital.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permiso de ubicación GPS denegado por el usuario o navegador.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Tiempo de espera de antena GPS agotado.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Señal satelital no disponible en esta zona.';
        }
        setGpsState(prev => ({
          ...prev,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          errorMsg: msg
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000
      }
    );
  };

  // --- BALANCES SEARCH ---
  const [balanceSearchTerm, setBalanceSearchTerm] = useState('');

  // --- PRICE CATALOG SEARCH ---
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');

  // Helper: Format Currency
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Helper: Get product price based on selected customer's price tier
  const getProductPrice = (prod: Product, cust?: Customer | null) => {
    const tier: PriceListType = cust?.priceList || 'mayorista';
    if (tier === 'distribuidor') return prod.priceDistributor || prod.priceWholesale;
    if (tier === 'minorista') return prod.priceRetail || prod.priceWholesale;
    return prod.priceWholesale;
  };

  // Cart Calculations
  const cartItemsArray = useMemo(() => {
    return Object.entries(orderCart)
      .map(([prodId, qty]) => {
        const prod = products.find(p => p.id === prodId);
        if (!prod || qty <= 0) return null;
        const unitPrice = getProductPrice(prod, orderCustomer);
        return {
          product: prod,
          quantity: qty,
          unitPrice,
          subtotal: unitPrice * qty
        };
      })
      .filter(Boolean) as { product: Product; quantity: number; unitPrice: number; subtotal: number }[];
  }, [orderCart, products, orderCustomer]);

  const cartTotalAmount = useMemo(() => {
    return cartItemsArray.reduce((acc, it) => acc + it.subtotal, 0);
  }, [cartItemsArray]);

  const cartTotalUnits = useMemo(() => {
    return cartItemsArray.reduce((acc, it) => acc + it.quantity, 0);
  }, [cartItemsArray]);

  // Quantity controllers
  const handleUpdateCartQuantity = (prodId: string, delta: number) => {
    setOrderCart(prev => {
      const current = prev[prodId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: next };
    });
  };

  const handleSetExactCartQuantity = (prodId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setOrderCart(prev => {
      if (isNaN(parsed) || parsed <= 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return { ...prev, [prodId]: parsed };
    });
  };

  // Start Order for a Customer
  const handleStartOrderForCustomer = (cust: Customer) => {
    setOrderCustomer(cust);
    setActiveTab('order');
  };

  // Submit Sales Order from Mobile
  const handleSubmitOrder = async () => {
    if (!orderCustomer) {
      alert('Por favor selecciona un cliente para el pedido.');
      return;
    }
    if (cartItemsArray.length === 0) {
      alert('Debes agregar al menos 1 producto con cantidad mayor a 0.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderNumber = `NV-CALLE-${String(Math.floor(Math.random() * 89999 + 10000))}`;
      const now = new Date().toISOString();

      const items: SalesOrderItem[] = cartItemsArray.map(it => ({
        productId: it.product.id,
        productName: it.product.name,
        code: it.product.code,
        presentation: it.product.presentation,
        unitPrice: it.unitPrice,
        discount: 0,
        quantity: it.quantity,
        deliveredQuantity: 0,
        subtotal: it.subtotal
      }));

      const newOrder: SalesOrder = {
        id: `so-${Date.now()}`,
        orderNumber,
        customerId: orderCustomer.id,
        customerName: orderCustomer.businessName,
        customerTaxId: orderCustomer.taxId,
        customerAddress: `${orderCustomer.address}, ${orderCustomer.city || ''}`,
        customerPhone: orderCustomer.phone,
        customerEmail: orderCustomer.email,
        billingType: 'no_arca',
        date: now,
        status: 'ingresado', // Enters factory queue, ready for dispatch
        deliveryStatus: 'pendiente_entrega',
        paymentStatus: 'pendiente',
        items,
        subtotal: cartTotalAmount,
        taxAmount: 0,
        total: cartTotalAmount,
        notes: `[Tomado en Calle por ${currentSeller?.name || 'Preventista'}] ${orderNotes ? '- ' + orderNotes : ''} (Fecha entrega sugerida: ${deliveryDate})`,
        sellerId: currentSeller?.id,
        sellerName: currentSeller?.name
      };

      await onCreateSalesOrder(newOrder);

      // If this customer was in the active route sheet, auto-mark stop as visited/order taken
      if (activeRouteSheet) {
        const stopIndex = activeRouteSheet.stops.findIndex(s => s.customerId === orderCustomer.id);
        if (stopIndex >= 0) {
          const hasGps = gpsState.status === 'success' && gpsState.lat !== 0;
          const updatedStops = [...activeRouteSheet.stops];
          updatedStops[stopIndex] = {
            ...updatedStops[stopIndex],
            status: 'visitado_con_venta',
            notes: `Pedido #${orderNumber} tomado por ${formatMoney(cartTotalAmount)}`,
            checkInTime: now,
            salesOrderId: newOrder.id,
            salesAmount: cartTotalAmount,
            latitude: hasGps ? gpsState.lat : updatedStops[stopIndex].latitude,
            longitude: hasGps ? gpsState.lng : updatedStops[stopIndex].longitude,
            accuracyMeters: hasGps ? Math.round(gpsState.accuracy * 10) / 10 : updatedStops[stopIndex].accuracyMeters,
            geotaggedAt: hasGps ? gpsState.timestamp : (updatedStops[stopIndex].geotaggedAt || now),
            geotagStatus: hasGps ? 'verificado_gps' : (updatedStops[stopIndex].geotagStatus || 'sin_gps_manual'),
            deviceInfo: `App Móvil Preventista (${currentSeller?.name || 'Vendedor en Calle'})`
          };
          await onSaveRouteSheet({
            ...activeRouteSheet,
            stops: updatedStops
          });
        }
      }

      setOrderSuccessModal(newOrder);
      // Reset form
      setOrderCart({});
      setOrderNotes('');
    } catch (e: any) {
      alert(`Error al guardar el pedido: ${e.message}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Record Payment in the Street
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;

    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Ingresa un monto de cobro válido.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const receiptNo = paymentReceiptNumber.trim() || `REC-CALLE-${String(Math.floor(Math.random() * 89999 + 10000))}`;
      const concept = `Cobranza en calle por preventista ${currentSeller?.name || ''} - ${paymentNotes || 'Recibo manual'}`;

      await onRecordCustomerPayment(
        paymentCustomer.id,
        amountNum,
        paymentMethod,
        concept,
        receiptNo,
        `Cobrado por: ${currentSeller?.name || 'Vendedor'} | Notas: ${paymentNotes}`
      );

      // If customer is in active route sheet, record collectedAmount
      if (activeRouteSheet) {
        const stopIndex = activeRouteSheet.stops.findIndex(s => s.customerId === paymentCustomer.id);
        if (stopIndex >= 0) {
          const updatedStops = [...activeRouteSheet.stops];
          updatedStops[stopIndex] = {
            ...updatedStops[stopIndex],
            status: 'visitado_cobranza',
            collectedAmount: (updatedStops[stopIndex].collectedAmount || 0) + amountNum,
            receiptNumber: receiptNo,
            checkInTime: new Date().toISOString()
          };
          await onSaveRouteSheet({
            ...activeRouteSheet,
            stops: updatedStops
          });
        }
      }

      setPaymentSuccessMsg(`¡Cobro de ${formatMoney(amountNum)} registrado con éxito! Recibo: ${receiptNo}`);
      setTimeout(() => {
        setPaymentSuccessMsg(null);
        setPaymentCustomer(null);
        setPaymentAmount('');
        setPaymentReceiptNumber('');
        setPaymentNotes('');
      }, 2500);
    } catch (err: any) {
      alert(`Error al registrar cobro: ${err.message}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Submit Visit Check-in with Geotagging GPS
  const handleSubmitVisit = async () => {
    if (!visitingStop || !activeRouteSheet) return;

    try {
      const nowIso = new Date().toISOString();
      const hasGps = gpsState.status === 'success' && gpsState.lat !== 0;

      const updatedStops = activeRouteSheet.stops.map(st => {
        if (st.id === visitingStop.stop.id) {
          return {
            ...st,
            status: visitStatus,
            checkInTime: nowIso,
            notes: visitNotes || st.notes,
            latitude: hasGps ? gpsState.lat : (st.latitude || undefined),
            longitude: hasGps ? gpsState.lng : (st.longitude || undefined),
            accuracyMeters: hasGps ? Math.round(gpsState.accuracy * 10) / 10 : (st.accuracyMeters || undefined),
            geotaggedAt: hasGps ? gpsState.timestamp : (st.geotaggedAt || nowIso),
            geotagStatus: hasGps 
              ? 'verificado_gps' 
              : (gpsState.status === 'denied' ? 'permiso_denegado' : (st.geotagStatus || 'sin_gps_manual')),
            deviceInfo: `App Móvil Preventista (${currentSeller?.name || 'Vendedor en Calle'})`
          };
        }
        return st;
      });

      await onSaveRouteSheet({
        ...activeRouteSheet,
        stops: updatedStops
      });

      setVisitingStop(null);
      setVisitNotes('');
    } catch (e: any) {
      alert(`Error actualizando visita: ${e.message}`);
    }
  };

  // Filtered Products for Order
  const filteredOrderProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = orderCategoryFilter === 'all' || p.category === orderCategoryFilter;
      const term = productSearchTerm.toLowerCase();
      const matchSearch = !term || 
        p.name.toLowerCase().includes(term) || 
        p.category.toLowerCase().includes(term) ||
        (p.code && p.code.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });
  }, [products, orderCategoryFilter, productSearchTerm]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Filtered Customers for Order Picker
  const filteredCustomersForOrder = useMemo(() => {
    const term = customerSearchTerm.toLowerCase();
    if (!term) return customers.slice(0, 10);
    return customers.filter(c => 
      c.businessName.toLowerCase().includes(term) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
      (c.taxId && c.taxId.includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term))
    );
  }, [customers, customerSearchTerm]);

  // Filtered Customers for Balance Tab
  const filteredCustomersForBalances = useMemo(() => {
    const term = balanceSearchTerm.toLowerCase();
    return customers.filter(c => {
      if (!term) return true;
      return (
        c.businessName.toLowerCase().includes(term) ||
        (c.taxId && c.taxId.includes(term)) ||
        (c.city && c.city.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term))
      );
    });
  }, [customers, balanceSearchTerm]);

  // Route Sheet stats
  const routeStats = useMemo(() => {
    if (!activeRouteSheet) return { total: 0, visited: 0, pending: 0, withOrders: 0 };
    const total = activeRouteSheet.stops.length;
    const visited = activeRouteSheet.stops.filter(s => s.status !== 'pendiente').length;
    const withOrders = activeRouteSheet.stops.filter(s => s.status === 'visitado_con_venta').length;
    return {
      total,
      visited,
      pending: total - visited,
      withOrders
    };
  }, [activeRouteSheet]);

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center selection:bg-red-500 selection:text-white">
      {/* Mobile Device Frame Container (optimized for phone width: max 480px, responsive) */}
      <div className="w-full max-w-md bg-slate-100 min-h-screen flex flex-col shadow-2xl relative pb-20 select-none">
        
        {/* TOP STATUS & APP BAR */}
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
          {/* Colorear Spectrum Bar */}
          <div className="h-1.5 w-full flex">
            <div className="flex-1 bg-[#4b0082]"></div>
            <div className="flex-1 bg-[#003399]"></div>
            <div className="flex-1 bg-[#0099cc]"></div>
            <div className="flex-1 bg-[#33cc33]"></div>
            <div className="flex-1 bg-[#f5c800]"></div>
            <div className="flex-1 bg-[#ff7800]"></div>
            <div className="flex-1 bg-[#d31627]"></div>
          </div>

          <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/aistudio/colorear-500px_0158e3cb.webp" 
                alt="Colorear Pinturas" 
                className="h-7 w-auto object-contain"
              />
              <div className="leading-tight">
                <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase block">
                  App Preventistas
                </span>
                <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  {currentSeller?.name || 'Vendedor de Calle'}
                </span>
              </div>
            </div>

            {/* Back to PC ERP Button */}
            <button
              onClick={onCloseMobileApp}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1.5 rounded-xl transition-colors shadow-2xs shrink-0"
              title="Volver a la vista completa de PC"
            >
              <span>🖥️ Modo PC</span>
            </button>
          </div>

          {/* Seller Switcher & Zone (if multiple reps) */}
          <div className="bg-slate-50 border-t border-slate-200/80 px-3.5 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-600 truncate">
              <Compass className="w-3.5 h-3.5 text-[#d31627] shrink-0" />
              <span className="font-semibold truncate">
                Zona: {currentSeller?.zone || 'Todas las Zonas'}
              </span>
            </div>

            {sellers.length > 1 && (
              <select
                value={currentSeller?.id || ''}
                onChange={(e) => {
                  const s = sellers.find(sel => sel.id === e.target.value);
                  if (s) {
                    onSetActiveSellerContext(s);
                  }
                }}
                className="text-[11px] font-bold bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-slate-800 focus:outline-hidden"
              >
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>
                    👤 {s.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* MAIN BODY CONTENT ACCORDING TO ACTIVE TAB */}
        <main className="flex-1 p-3.5 space-y-3.5 overflow-y-auto">

          {/* ============================================================ */}
          {/* TAB 1: HOJA DE RUTA (TODAY'S VISITS & CLIENT ROUTE)           */}
          {/* ============================================================ */}
          {activeTab === 'route' && (
            <div className="space-y-3.5">
              {/* Route Sheet Header Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-[#d31627] flex items-center justify-center font-bold">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 leading-tight">
                        {activeRouteSheet?.title || 'Hoja de Ruta de Calle'}
                      </h2>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Fecha: {activeRouteSheet?.date || 'Hoy'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    activeRouteSheet?.status === 'completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeRouteSheet?.status || 'En curso'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Progreso de Visitas</span>
                    <span className="text-[#d31627]">
                      {routeStats.visited} de {routeStats.total} ({routeStats.total > 0 ? Math.round((routeStats.visited / routeStats.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#d31627] h-full transition-all duration-300"
                      style={{ width: `${routeStats.total > 0 ? (routeStats.visited / routeStats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                    <span>⏳ {routeStats.pending} Pendientes</span>
                    <span>🛒 {routeStats.withOrders} con Pedido</span>
                  </div>
                </div>

                {/* Selector for other routes if any */}
                {sellerRouteSheets.length > 1 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">Cambiar Ruta:</span>
                    <select
                      value={selectedRouteId}
                      onChange={(e) => setSelectedRouteId(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex-1 font-semibold text-slate-800"
                    >
                      {sellerRouteSheets.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.stops?.length || 0} paradas)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Stops List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#d31627]" />
                    Paradas & Clientes a Visitar
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Orden recomendada
                  </span>
                </div>

                {!activeRouteSheet || activeRouteSheet.stops.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold text-slate-700">No hay paradas en esta hoja de ruta.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Crea una hoja de ruta desde el módulo de PC o selecciona otro vendedor.</p>
                  </div>
                ) : (
                  activeRouteSheet.stops.map((stop, idx) => {
                    const cust = customers.find(c => c.id === stop.customerId);
                    const debt = cust?.currentBalance || stop.currentBalance || 0;
                    const isVisited = stop.status !== 'pendiente';

                    return (
                      <div 
                        key={stop.id}
                        className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs ${
                          isVisited ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                        }`}
                      >
                        {/* Stop Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isVisited 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-900 text-white'
                            }`}>
                              {stop.orderIndex || idx + 1}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-slate-900 leading-snug truncate">
                                {stop.customerName}
                              </h4>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{stop.customerAddress || cust?.address || 'Dirección'}, {stop.customerCity || cust?.city || ''}</span>
                              </p>
                              {(stop.customerPhone || cust?.phone) && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{stop.customerPhone || cust?.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            stop.status === 'visitado_con_venta' ? 'bg-purple-100 text-purple-800' :
                            stop.status === 'visitado_cobranza' ? 'bg-teal-100 text-teal-800' :
                            stop.status === 'visitado_sin_venta' ? 'bg-emerald-100 text-emerald-800' :
                            stop.status === 'no_encontrado_ausente' ? 'bg-red-100 text-red-800' :
                            stop.status === 'reprogramado' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {stop.status === 'visitado_con_venta' ? '🛒 Venta' :
                             stop.status === 'visitado_cobranza' ? '💵 Cobro' :
                             stop.status === 'visitado_sin_venta' ? '✓ Visitado' :
                             stop.status === 'no_encontrado_ausente' ? '✗ Ausente' :
                             stop.status === 'reprogramado' ? '↻ Reprog' : 'Pendiente'}
                          </span>
                        </div>

                        {/* Customer Balance Badge */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500 font-medium">Saldo en Cta Cte:</span>
                          <span className={`font-black ${debt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {debt > 0 ? `Debe ${formatMoney(debt)}` : 'Al día ($0)'}
                          </span>
                        </div>

                        {/* Geotagging GPS badge if visited */}
                        {isVisited && (
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            {stop.latitude && stop.longitude ? (
                              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                                <div className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <div>
                                    <div className="text-[11px] font-black flex items-center gap-1">
                                      <span>GPS Verificado</span>
                                      <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1 py-0.2 rounded font-mono font-bold">
                                        ±{stop.accuracyMeters ? Math.round(stop.accuracyMeters) : 10}m
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-emerald-700">
                                      {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={`https://www.google.com/maps?q=${stop.latitude},${stop.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-emerald-800 underline flex items-center gap-0.5"
                                >
                                  <span>Mapa</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-[10px] text-amber-800">
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Visita registrada manualmente (Sin coordenadas GPS)</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons: GPS, Call, WhatsApp, Order, Check-in */}
                        <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-4 gap-1.5">
                          {/* GPS Navigation */}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${stop.customerAddress || cust?.address || ''}, ${stop.customerCity || cust?.city || ''}, Argentina`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            title="Navegar con Google Maps"
                          >
                            <Navigation className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] font-bold">GPS</span>
                          </a>

                          {/* Call */}
                          <a
                            href={`tel:${stop.customerPhone || cust?.phone || ''}`}
                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Llamar al cliente"
                          >
                            <Phone className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] font-bold">Llamar</span>
                          </a>

                          {/* WhatsApp */}
                          <a
                            href={`https://wa.me/${(stop.customerPhone || cust?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${stop.customerName}, soy ${currentSeller?.name || 'el preventista'} de Colorear Pinturas. Estoy en camino para visitarte.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4 mb-0.5" />
                            <span className="text-[10px] font-bold">WhatsApp</span>
                          </a>

                          {/* Visit Check-in with GPS Geotagging */}
                          <button
                            onClick={() => {
                              setVisitingStop({ stop, sheetId: activeRouteSheet.id });
                              setVisitStatus(stop.status !== 'pendiente' ? stop.status : 'visitado_sin_venta');
                              setVisitNotes(stop.notes || '');
                              requestGpsLocation();
                            }}
                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Registrar estado de visita con Geotagging GPS"
                          >
                            <CheckCircle2 className="w-4 h-4 mb-0.5 text-slate-600" />
                            <span className="text-[10px] font-bold">Estado</span>
                          </button>
                        </div>

                        {/* Direct Order Button for this stop */}
                        {cust && (
                          <div className="mt-2.5">
                            <button
                              onClick={() => handleStartOrderForCustomer(cust)}
                              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-red-600 to-[#d31627] hover:from-red-700 hover:to-red-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.99]"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Tomar Pedido para {cust.businessName.split(' ')[0]}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: NUEVO PEDIDO CON CANTIDAD (FAST STREET SALES)          */}
          {/* ============================================================ */}
          {activeTab === 'order' && (
            <div className="space-y-3.5">
              {/* Customer Selector Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  1. Cliente para el Pedido
                </span>

                {orderCustomer ? (
                  <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-black text-slate-900 text-sm truncate">
                        {orderCustomer.businessName}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{orderCustomer.taxId}</span>
                        <span>•</span>
                        <span className="font-bold uppercase text-[#d31627]">
                          Lista {orderCustomer.priceList || 'Mayorista'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        📍 {orderCustomer.address}, {orderCustomer.city}
                      </div>
                    </div>
                    <button
                      onClick={() => setOrderCustomer(null)}
                      className="text-xs text-red-600 hover:text-red-800 font-bold bg-white px-2.5 py-1 rounded-lg border border-red-200 shrink-0 ml-2 shadow-2xs"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, fantasía o CUIT..."
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                      {filteredCustomersForOrder.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No se encontraron clientes.
                        </div>
                      ) : (
                        filteredCustomersForOrder.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setOrderCustomer(c);
                              setCustomerSearchTerm('');
                            }}
                            className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-black text-slate-800 truncate">{c.businessName}</div>
                              <div className="text-[10px] text-slate-500">{c.taxId} • {c.city || 'Bs As'}</div>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                              {c.priceList || 'Mayorista'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Selection & Quantity Steppers */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    2. Seleccionar Productos & Cantidades
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {cartTotalUnits} unidades en el pedido
                  </span>
                </div>

                {/* Search products */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar látex, esmalte, membrana, balde 20L..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
                  />
                </div>

                {/* Category Pills (Horizontal scroll) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setOrderCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-full font-bold text-[11px] shrink-0 transition-all ${
                        orderCategoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>

                {/* Product Cards with Big Steppers */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredOrderProducts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No hay productos que coincidan.
                    </div>
                  ) : (
                    filteredOrderProducts.map(prod => {
                      const qty = orderCart[prod.id] || 0;
                      const unitPrice = getProductPrice(prod, orderCustomer);
                      const subtotal = unitPrice * qty;

                      return (
                        <div
                          key={prod.id}
                          className={`p-3 rounded-xl border transition-all ${
                            qty > 0 
                              ? 'border-red-300 bg-red-50/20 shadow-xs' 
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 leading-snug">
                                {prod.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-bold text-slate-700 bg-slate-200/70 px-1.5 py-0.2 rounded text-[10px]">
                                  {prod.presentation || 'Unidad'}
                                </span>
                                <span>•</span>
                                <span className="font-extrabold text-[#d31627]">
                                  {formatMoney(unitPrice)}
                                </span>
                                {prod.code && <span className="text-[10px] text-slate-400 font-mono">({prod.code})</span>}
                              </div>
                            </div>

                            {/* Stock Indicator */}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              prod.stock > 10 ? 'bg-emerald-100 text-emerald-800' :
                              prod.stock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              Stock: {prod.stock}
                            </span>
                          </div>

                          {/* Stepper Controls & Subtotal */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <div className="text-[11px] font-bold text-slate-600">
                              {qty > 0 ? (
                                <span className="text-slate-900 font-extrabold">
                                  Subtotal: {formatMoney(subtotal)}
                                </span>
                              ) : (
                                <span className="text-slate-400">Sin unidades</span>
                              )}
                            </div>

                            {/* Big Touch Stepper Buttons */}
                            <div className="flex items-center gap-1.5">
                              {qty > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCartQuantity(prod.id, -1)}
                                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-black flex items-center justify-center text-sm active:scale-95 transition-transform"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              )}

                              <input
                                type="number"
                                min="0"
                                value={qty || ''}
                                placeholder="0"
                                onChange={(e) => handleSetExactCartQuantity(prod.id, e.target.value)}
                                className="w-12 h-8 text-center bg-white border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
                              />

                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(prod.id, 1)}
                                className="w-8 h-8 rounded-lg bg-[#d31627] hover:bg-red-700 text-white font-black flex items-center justify-center text-sm active:scale-95 transition-transform shadow-xs"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {/* Quick +5 button */}
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(prod.id, 5)}
                                className="px-2 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold active:scale-95 transition-transform border border-slate-200"
                                title="Sumar 5 unidades"
                              >
                                +5
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Order Notes & Promised Date */}
              {cartItemsArray.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Fecha Estimada de Entrega:
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Observaciones / Horarios de Entrega:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Entregar por la mañana, llamar antes al encargado..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* ORDER SUMMARY BAR & SUBMIT */}
              {cartItemsArray.length > 0 && (
                <div className="sticky bottom-16 z-30 bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                        Total Pedido ({cartTotalUnits} un.)
                      </span>
                      <span className="text-xl font-black text-white">
                        {formatMoney(cartTotalAmount)}
                      </span>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      disabled={isSubmittingOrder || !orderCustomer}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-[#d31627] hover:from-red-700 hover:to-red-800 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-red-900/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar a Fábrica</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: CUENTAS CORRIENTES & COBRANZAS EN CALLE               */}
          {/* ============================================================ */}
          {activeTab === 'balances' && (
            <div className="space-y-3.5">
              {/* Header Info */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Cuentas Corrientes & Cobranzas
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Consulta de deudas y registro de pagos en calle
                    </p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mt-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente, CUIT o ciudad..."
                    value={balanceSearchTerm}
                    onChange={(e) => setBalanceSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#d31627]"
                  />
                </div>
              </div>

              {/* Client List */}
              <div className="space-y-2.5">
                {filteredCustomersForBalances.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                    No se encontraron clientes.
                  </div>
                ) : (
                  filteredCustomersForBalances.map(cust => {
                    const balance = cust.currentBalance || 0;
                    const hasDebt = balance > 0;

                    return (
                      <div
                        key={cust.id}
                        className={`bg-white rounded-2xl p-3.5 border transition-all shadow-2xs ${
                          hasDebt ? 'border-red-200' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {cust.businessName}
                            </h4>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{cust.taxId}</span>
                              <span>•</span>
                              <span>{cust.city || 'Bs As'}</span>
                            </div>
                            {cust.phone && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                📞 {cust.phone}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">
                              Saldo Cta Cte
                            </span>
                            <span className={`text-sm font-black ${
                              hasDebt ? 'text-[#d31627]' : 'text-emerald-600'
                            }`}>
                              {formatMoney(balance)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleStartOrderForCustomer(cust)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                            <span>Vender</span>
                          </button>

                          <button
                            onClick={() => {
                              setPaymentCustomer(cust);
                              setPaymentAmount(balance > 0 ? balance.toString() : '');
                              setPaymentReceiptNumber('');
                              setPaymentNotes('');
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Cobrar en Calle</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: CATÁLOGO DE PRECIOS & STOCK (CONSULTA RÁPIDA)         */}
          {/* ============================================================ */}
          {activeTab === 'prices' && (
            <div className="space-y-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Lista de Precios & Stock de Fábrica
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Precios oficiales actualizados al día
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar látex, esmalte, impermeabilizante..."
                    value={catalogSearchTerm}
                    onChange={(e) => setCatalogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCatalogCategory(cat)}
                      className={`px-3 py-1 rounded-full font-bold text-[11px] shrink-0 transition-all ${
                        catalogCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Price Cards */}
              <div className="space-y-2.5">
                {products
                  .filter(p => {
                    const matchCat = catalogCategory === 'all' || p.category === catalogCategory;
                    const term = catalogSearchTerm.toLowerCase();
                    const matchSearch = !term || 
                      p.name.toLowerCase().includes(term) || 
                      (p.code && p.code.toLowerCase().includes(term));
                    return matchCat && matchSearch;
                  })
                  .map(prod => (
                    <div key={prod.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-snug">
                            {prod.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {prod.presentation || 'Unidad'}
                            </span>
                            {prod.code && <span className="font-mono">Cód: {prod.code}</span>}
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          prod.stock > 10 ? 'bg-emerald-100 text-emerald-800' :
                          prod.stock > 0 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          Stock: {prod.stock} un.
                        </span>
                      </div>

                      {/* 3 Price Tiers Grid */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 rounded-xl bg-purple-50/70 border border-purple-100">
                          <span className="text-[9px] font-bold uppercase text-purple-700 block">Distribuidor</span>
                          <span className="text-xs font-black text-purple-950">
                            {formatMoney(prod.priceDistributor || prod.priceWholesale)}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-blue-50/70 border border-blue-100">
                          <span className="text-[9px] font-bold uppercase text-blue-700 block">Mayorista</span>
                          <span className="text-xs font-black text-blue-950">
                            {formatMoney(prod.priceWholesale)}
                          </span>
                        </div>
                        <div className="p-1.5 rounded-xl bg-slate-100 border border-slate-200">
                          <span className="text-[9px] font-bold uppercase text-slate-600 block">Minorista</span>
                          <span className="text-xs font-black text-slate-900">
                            {formatMoney(prod.priceRetail || prod.priceWholesale)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Add to Current Order Button */}
                      <div className="mt-2 pt-1 text-right">
                        <button
                          onClick={() => {
                            handleUpdateCartQuantity(prod.id, 1);
                            setActiveTab('order');
                          }}
                          className="text-[11px] font-bold text-[#d31627] hover:text-red-700 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar a Pedido</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </main>

        {/* ============================================================ */}
        {/* BOTTOM NAVIGATION BAR (FIXED FOR SMARTPHONE)                 */}
        {/* ============================================================ */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-40 shadow-lg">
          {/* Tab 1: Hoja de Ruta */}
          <button
            onClick={() => setActiveTab('route')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'route' 
                ? 'text-[#d31627] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <Compass className="w-5 h-5 mb-0.5" />
              {routeStats.pending > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#d31627] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {routeStats.pending}
                </span>
              )}
            </div>
            <span className="text-[10px]">Hoja de Ruta</span>
          </button>

          {/* Tab 2: Pedido */}
          <button
            onClick={() => setActiveTab('order')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'order' 
                ? 'text-[#d31627] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              {cartTotalUnits > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cartTotalUnits}
                </span>
              )}
            </div>
            <span className="text-[10px]">Nuevo Pedido</span>
          </button>

          {/* Tab 3: Cuentas Corrientes */}
          <button
            onClick={() => setActiveTab('balances')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'balances' 
                ? 'text-[#d31627] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Cuentas Ctes</span>
          </button>

          {/* Tab 4: Precios */}
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'prices' 
                ? 'text-[#d31627] font-black' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Precios & Stock</span>
          </button>
        </nav>

        {/* ============================================================ */}
        {/* MODAL: REGISTRAR COBRO EN CALLE                              */}
        {/* ============================================================ */}
        {paymentCustomer && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Registrar Cobro en Calle
                    </h3>
                    <p className="text-[11px] text-slate-500">{paymentCustomer.businessName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPaymentCustomer(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {paymentSuccessMsg ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <p className="text-sm font-black text-slate-900">{paymentSuccessMsg}</p>
                  <p className="text-xs text-slate-500">Saldo actualizado automáticamente en el sistema central.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitPayment} className="mt-4 space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Monto a Cobrar ($ ARS):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-lg font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                    {paymentCustomer.currentBalance > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Saldo adeudado total: <strong className="text-red-600">{formatMoney(paymentCustomer.currentBalance)}</strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Forma de Cobro:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="efectivo">💵 Efectivo Billete en Mano</option>
                      <option value="transferencia">📲 Transferencia / QR MercadoPago</option>
                      <option value="cheque">🏷️ Cheque Físico de Terceros</option>
                      <option value="echeq">💳 E-Cheq Electrónico</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      N° Recibo / Talón de Calle:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: REC-00234 (opcional)"
                      value={paymentReceiptNumber}
                      onChange={(e) => setPaymentReceiptNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Observaciones / Banco emisor:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Pago parcial, saldo restante el viernes..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentCustomer(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      {isSubmittingPayment ? 'Registrando...' : 'Confirmar Cobro'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: REGISTRAR RESULTADO DE VISITA                          */}
        {/* ============================================================ */}
        {visitingStop && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Estado de Visita
                    </h3>
                    <p className="text-[11px] text-slate-500">{visitingStop.stop.customerName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setVisitingStop(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    ¿Cuál fue el resultado de la visita?
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'visitado_con_venta', label: '🛒 Venta Realizada', color: 'bg-purple-50 text-purple-800 border-purple-300' },
                      { key: 'visitado_sin_venta', label: '✓ Visitado (Sin pedido)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                      { key: 'visitado_cobranza', label: '💵 Cobro Realizado', color: 'bg-teal-50 text-teal-800 border-teal-300' },
                      { key: 'no_encontrado_ausente', label: '✗ Local Cerrado / Ausente', color: 'bg-red-50 text-red-800 border-red-300' },
                      { key: 'reprogramado', label: '↻ Visitar Mañana / Reprog', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setVisitStatus(opt.key as VisitStatus)}
                        className={`p-2.5 rounded-xl border font-bold text-left transition-all ${
                          visitStatus === opt.key 
                            ? `${opt.color} ring-2 ring-slate-900 font-black` 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Notas de la Visita:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Hablé con el encargado, vuelven a pedir la próxima semana..."
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* --- Geotagging Satelital GPS en Tiempo Real --- */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Compass className={`w-4 h-4 text-blue-600 ${gpsState.status === 'capturing' ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Geotagging GPS (Auditoría de Calle)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={requestGpsLocation}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                      title="Re-calibrar antena GPS"
                    >
                      <RefreshCw className={`w-3 h-3 ${gpsState.status === 'capturing' ? 'animate-spin' : ''}`} />
                      <span>{gpsState.status === 'capturing' ? 'Capturando...' : 'Re-calibrar'}</span>
                    </button>
                  </div>

                  {gpsState.status === 'capturing' && (
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                      <span>Conectando con antena GPS para registrar coordenadas de validación...</span>
                    </div>
                  )}

                  {gpsState.status === 'success' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-black">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>GPS Satelital Verificado</span>
                        </div>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-1.5 py-0.2 rounded font-bold">
                          Precisión ±{Math.round(gpsState.accuracy)} m
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-800 flex items-center justify-between pt-0.5">
                        <span>Lat: {gpsState.lat.toFixed(6)} | Lng: {gpsState.lng.toFixed(6)}</span>
                        <a
                          href={`https://www.google.com/maps?q=${gpsState.lat},${gpsState.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-800 underline font-bold flex items-center gap-0.5"
                        >
                          <span>Ver mapa</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {(gpsState.status === 'denied' || gpsState.status === 'error') && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Señal GPS no disponible</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        {gpsState.errorMsg || 'No se pudo obtener la posición satelital.'} Puede guardar la visita de todas formas (quedará registrada como marcación manual).
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitingStop(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitVisit}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Guardar Estado & Geotag</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MODAL: PEDIDO ENVIADO CON ÉXITO                              */}
        {/* ============================================================ */}
        {orderSuccessModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 text-center shadow-2xl border border-slate-200 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h3 className="text-base font-black text-slate-900">
                ¡Pedido Enviado a Fábrica!
              </h3>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Comprobante:</span>
                  <strong className="font-mono text-slate-900">{orderSuccessModal.orderNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <strong className="text-slate-900 truncate">{orderSuccessModal.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total:</span>
                  <strong className="text-emerald-700 text-sm font-black">{formatMoney(orderSuccessModal.total)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendedor:</span>
                  <span className="text-slate-700">{orderSuccessModal.sellerName || 'Preventista'}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500">
                El pedido ya ingresó al sistema de fábrica para su preparación, remito y entrega.
              </p>

              {/* Share via WhatsApp */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`*COLOREAR PINTURAS - PEDIDO CONFIRMADO*\n\nPedido: ${orderSuccessModal.orderNumber}\nCliente: ${orderSuccessModal.customerName}\nTotal: ${formatMoney(orderSuccessModal.total)}\n\nTomado por: ${orderSuccessModal.sellerName || 'Preventista'}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Compartir Comprobante por WhatsApp</span>
              </a>

              <button
                onClick={() => setOrderSuccessModal(null)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors"
              >
                Volver a la Hoja de Ruta
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
