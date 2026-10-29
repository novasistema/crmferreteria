import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MapPin, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  Calendar, 
  Check, 
  X, 
  Printer, 
  MessageSquare, 
  ExternalLink, 
  ChevronRight, 
  Compass, 
  UserCheck, 
  ShieldCheck, 
  Briefcase, 
  Percent, 
  TrendingUp, 
  Sliders, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Navigation,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Crosshair,
  Copy
} from 'lucide-react';
import { 
  Seller, 
  RouteSheet, 
  RouteSheetStop, 
  VisitStatus, 
  Customer, 
  SalesOrder, 
  FinancialTransaction, 
  ModuleKey, 
  CompanyConfig, 
  AppUser 
} from '../types';

interface SellersModuleProps {
  sellers: Seller[];
  routeSheets: RouteSheet[];
  customers: Customer[];
  salesOrders: SalesOrder[];
  financialTransactions: FinancialTransaction[];
  config: CompanyConfig | null;
  currentUser: AppUser | null;
  activeSellerContext: Seller | null;
  onSetActiveSellerContext: (seller: Seller | null) => void;
  onSaveSeller: (seller: Seller) => Promise<void>;
  onDeleteSeller: (sellerId: string) => Promise<void>;
  onSaveRouteSheet: (routeSheet: RouteSheet) => Promise<void>;
  onDeleteRouteSheet: (routeSheetId: string) => Promise<void>;
  onOpenMobileSellerApp?: () => void;
}

// Available system modules for permission assignment
const ALL_SYSTEM_MODULES: { key: ModuleKey; label: string; group: string; desc: string }[] = [
  { key: 'desktop', label: 'Escritorio & KPIs', group: 'Panel General', desc: 'Panel principal y accesos rápidos' },
  { key: 'reports', label: 'Dashboard con Barras', group: 'Panel General', desc: 'Gráficos comparativos de ventas y stock' },
  
  { key: 'sellers', label: 'Vendedores & Hoja de Ruta', group: 'Comercial & Preventa', desc: 'Hojas de ruta de calle y visitas a clientes' },
  { key: 'sales', label: 'Ventas, Facturas & Despachos', group: 'Comercial & Preventa', desc: 'Emisión de pedidos, remitos y facturación' },
  { key: 'customers', label: 'Cuentas Corrientes & Clientes', group: 'Comercial & Preventa', desc: 'Fichas de clientes, saldos y recibos' },
  { key: 'prices', label: 'Lista de Precios & SKUs', group: 'Comercial & Preventa', desc: 'Catálogo de látex y precios 2026' },
  
  { key: 'production', label: 'Producción & Fórmulas', group: 'Planta Industrial', desc: 'Órdenes de fabricación y mezclas químicas' },
  { key: 'purchases', label: 'Compras & Proveedores', group: 'Planta Industrial', desc: 'Materias primas y cuentas corrientes proveedores' },
  { key: 'logistics', label: 'Transportes & Logística', group: 'Planta Industrial', desc: 'Flota de camiones y choferes de fábrica' },
  
  { key: 'finances', label: 'Saldos Cobrar vs Pagar', group: 'Tesorería & Finanzas', desc: 'Deudas, cobros y recordatorios WhatsApp' },
  { key: 'cashboxes', label: 'Cajas de Dinero & Cuentas', group: 'Tesorería & Finanzas', desc: 'Movimientos de efectivo y transferencias' },
  { key: 'checks', label: 'Cartelera Cheques & E-Cheqs', group: 'Tesorería & Finanzas', desc: 'Gestión y vencimientos de cheques' },
  { key: 'accounting', label: 'Contabilidad & Libro IVA', group: 'Tesorería & Finanzas', desc: 'Libro IVA compras/ventas y F.2002' },
  { key: 'profitability', label: 'Estado de Resultados', group: 'Tesorería & Finanzas', desc: 'EBITDA, CMV y márgenes de ganancia' },
  
  { key: 'employees', label: 'Personal, Sueldos & Recibos', group: 'Personal & Sistema', desc: 'Legajos de empleados y recibos duplicados' },
  { key: 'users', label: 'Usuarios & Permisos', group: 'Personal & Sistema', desc: 'Administración de accesos y contraseñas' },
  { key: 'settings', label: 'Configuración & Backup', group: 'Personal & Sistema', desc: 'Copias de seguridad y datos de fábrica' },
];

export const SellersModule: React.FC<SellersModuleProps> = ({
  sellers,
  routeSheets,
  customers,
  salesOrders,
  financialTransactions,
  config,
  currentUser,
  activeSellerContext,
  onSetActiveSellerContext,
  onSaveSeller,
  onDeleteSeller,
  onSaveRouteSheet,
  onDeleteRouteSheet,
  onOpenMobileSellerApp
}) => {
  const [activeTab, setActiveTab] = useState<'rutas' | 'vendedores' | 'comisiones'>('rutas');
  
  // Routes tab filters
  const [selectedRouteDate, setSelectedRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('all');
  const [searchRouteQuery, setSearchRouteQuery] = useState('');
  
  // Modals
  const [showNewSellerModal, setShowNewSellerModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [showNewRouteModal, setShowNewRouteModal] = useState(false);
  const [editingRouteSheet, setEditingRouteSheet] = useState<RouteSheet | null>(null);
  const [checkInStopModal, setCheckInStopModal] = useState<{ route: RouteSheet; stop: RouteSheetStop } | null>(null);
  const [viewPrintRoute, setViewPrintRoute] = useState<RouteSheet | null>(null);
  const [auditGpsModalStop, setAuditGpsModalStop] = useState<{ route: RouteSheet; stop: RouteSheetStop } | null>(null);
  const [auditGpsModalRoute, setAuditGpsModalRoute] = useState<RouteSheet | null>(null);
  const [copiedCoord, setCopiedCoord] = useState(false);

  // New Seller Form state
  const [sellerForm, setSellerForm] = useState<Partial<Seller>>({
    name: '',
    code: '',
    phone: '',
    email: '',
    zone: 'GBA Norte',
    dniOrTaxId: '',
    salesCommissionPct: 3.5,
    collectionCommissionPct: 1.5,
    active: true,
    allowedModules: ['desktop', 'sellers', 'sales', 'customers', 'prices'],
    notes: ''
  });

  // Check-in Form state
  const [checkInStatus, setCheckInStatus] = useState<VisitStatus>('visitado_con_venta');
  const [checkInTime, setCheckInTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkInSaleAmount, setCheckInSaleAmount] = useState<number>(0);
  const [checkInCollectAmount, setCheckInCollectAmount] = useState<number>(0);
  const [checkInReceiptNumber, setCheckInReceiptNumber] = useState('');
  const [checkInGps, setCheckInGps] = useState<{ lat?: number; lng?: number; accuracy?: number; status?: string; isLocating?: boolean }>({});

  // New Route Form state
  const [newRouteTitle, setNewRouteTitle] = useState('');
  const [newRouteDate, setNewRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [newRouteSellerId, setNewRouteSellerId] = useState(sellers[0]?.id || '');
  const [newRouteZone, setNewRouteZone] = useState(sellers[0]?.zone || 'GBA Norte');
  const [selectedCustomerStops, setSelectedCustomerStops] = useState<{ customerId: string; estimatedTime: string; notes: string }[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Commission settlement calculation
  const [commissionMonth, setCommissionMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filtered Route Sheets
  const filteredRouteSheets = useMemo(() => {
    return routeSheets.filter(r => {
      const matchesSeller = selectedSellerFilter === 'all' || r.sellerId === selectedSellerFilter;
      const matchesSearch = searchRouteQuery === '' || 
        r.title.toLowerCase().includes(searchRouteQuery.toLowerCase()) ||
        r.sellerName.toLowerCase().includes(searchRouteQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchRouteQuery.toLowerCase()) ||
        r.zone.toLowerCase().includes(searchRouteQuery.toLowerCase()) ||
        r.stops.some(s => s.customerName.toLowerCase().includes(searchRouteQuery.toLowerCase()));
      return matchesSeller && matchesSearch;
    });
  }, [routeSheets, selectedSellerFilter, searchRouteQuery]);

  // Open modal for editing a seller
  const handleOpenEditSeller = (seller: Seller) => {
    setEditingSeller(seller);
    setSellerForm({
      ...seller,
      allowedModules: seller.allowedModules || ['desktop', 'sellers', 'sales', 'customers', 'prices']
    });
    setShowNewSellerModal(true);
  };

  // Open modal for creating a seller
  const handleOpenCreateSeller = () => {
    setEditingSeller(null);
    const nextCode = `VEN-${String(sellers.length + 1).padStart(2, '0')}`;
    setSellerForm({
      name: '',
      code: nextCode,
      phone: '',
      email: '',
      zone: 'GBA Norte',
      dniOrTaxId: '',
      salesCommissionPct: 3.5,
      collectionCommissionPct: 1.5,
      active: true,
      allowedModules: ['desktop', 'sellers', 'sales', 'customers', 'prices'],
      notes: ''
    });
    setShowNewSellerModal(true);
  };

  // Save Seller
  const handleSaveSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.name || !sellerForm.code) {
      alert('Por favor completa el nombre y el código del vendedor.');
      return;
    }

    const sellerToSave: Seller = {
      id: editingSeller?.id || `sel-${Date.now()}`,
      name: sellerForm.name.trim(),
      code: sellerForm.code.trim().toUpperCase(),
      phone: sellerForm.phone?.trim() || '',
      email: sellerForm.email?.trim().toLowerCase() || '',
      zone: sellerForm.zone || 'GBA Norte',
      dniOrTaxId: sellerForm.dniOrTaxId?.trim() || '',
      salesCommissionPct: Number(sellerForm.salesCommissionPct) || 0,
      collectionCommissionPct: Number(sellerForm.collectionCommissionPct) || 0,
      active: sellerForm.active ?? true,
      allowedModules: sellerForm.allowedModules && sellerForm.allowedModules.length > 0 
        ? sellerForm.allowedModules 
        : ['desktop', 'sellers', 'sales', 'customers', 'prices'],
      notes: sellerForm.notes?.trim() || '',
      createdAt: editingSeller?.createdAt || new Date().toISOString()
    };

    await onSaveSeller(sellerToSave);
    setShowNewSellerModal(false);
  };

  // Toggle Module in Seller's allowedModules list
  const toggleSellerModule = (modKey: ModuleKey) => {
    const current = sellerForm.allowedModules || [];
    if (current.includes(modKey)) {
      setSellerForm({
        ...sellerForm,
        allowedModules: current.filter(k => k !== modKey)
      });
    } else {
      setSellerForm({
        ...sellerForm,
        allowedModules: [...current, modKey]
      });
    }
  };

  // Set Preset Modules
  const setModulePreset = (preset: 'vendedor_calle' | 'vendedor_senior' | 'todos') => {
    if (preset === 'vendedor_calle') {
      setSellerForm({
        ...sellerForm,
        allowedModules: ['desktop', 'sellers', 'sales', 'customers', 'prices']
      });
    } else if (preset === 'vendedor_senior') {
      setSellerForm({
        ...sellerForm,
        allowedModules: ['desktop', 'reports', 'sellers', 'sales', 'customers', 'prices', 'logistics']
      });
    } else if (preset === 'todos') {
      setSellerForm({
        ...sellerForm,
        allowedModules: ALL_SYSTEM_MODULES.map(m => m.key)
      });
    }
  };

  // Open Route Creation Modal
  const handleOpenCreateRoute = () => {
    const nextCode = `HDR-${new Date().getFullYear()}-${String(routeSheets.length + 1).padStart(3, '0')}`;
    setNewRouteTitle(`Ruta Preventa - ${new Date().toLocaleDateString('es-AR')}`);
    setNewRouteDate(new Date().toISOString().split('T')[0]);
    const firstSeller = sellers[0];
    setNewRouteSellerId(firstSeller?.id || '');
    setNewRouteZone(firstSeller?.zone || 'GBA Norte');
    setSelectedCustomerStops([]);
    setCustomerSearchQuery('');
    setShowNewRouteModal(true);
  };

  // Add customer stop to route form
  const handleAddCustomerToRoute = (customer: Customer) => {
    if (selectedCustomerStops.some(s => s.customerId === customer.id)) return;
    setSelectedCustomerStops([
      ...selectedCustomerStops,
      {
        customerId: customer.id,
        estimatedTime: '10:00',
        notes: ''
      }
    ]);
  };

  const handleRemoveCustomerFromRoute = (idx: number) => {
    setSelectedCustomerStops(selectedCustomerStops.filter((_, i) => i !== idx));
  };

  // Submit New Route Sheet
  const handleCreateRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteSellerId || selectedCustomerStops.length === 0) {
      alert('Debes seleccionar un vendedor y agregar al menos un cliente a la hoja de ruta.');
      return;
    }

    const seller = sellers.find(s => s.id === newRouteSellerId);
    const routeCode = `HDR-${new Date().getFullYear()}-${String(routeSheets.length + 1).padStart(3, '0')}`;

    const stops: RouteSheetStop[] = selectedCustomerStops.map((stopItem, index) => {
      const cust = customers.find(c => c.id === stopItem.customerId);
      return {
        id: `stop-${Date.now()}-${index}`,
        orderIndex: index + 1,
        customerId: stopItem.customerId,
        customerName: cust?.businessName || 'Cliente',
        customerAddress: cust ? `${cust.address}, ${cust.city}` : 'Dirección cliente',
        customerPhone: cust?.phone || '',
        customerCity: cust?.city || '',
        currentBalance: cust?.currentBalance || 0,
        estimatedTime: stopItem.estimatedTime,
        status: 'pendiente',
        notes: stopItem.notes
      };
    });

    const newRoute: RouteSheet = {
      id: `hdr-${Date.now()}`,
      code: routeCode,
      sellerId: newRouteSellerId,
      sellerName: seller?.name || 'Vendedor',
      date: newRouteDate,
      zone: newRouteZone,
      title: newRouteTitle.trim() || `Ruta ${newRouteZone}`,
      status: 'en_progreso',
      stops,
      totalStops: stops.length,
      visitedStops: 0,
      totalSalesGenerated: 0,
      totalCollectionsGenerated: 0,
      createdAt: new Date().toISOString()
    };

    await onSaveRouteSheet(newRoute);
    setShowNewRouteModal(false);
  };

  // Open Check-in Modal for a Stop
  const handleOpenCheckIn = (route: RouteSheet, stop: RouteSheetStop) => {
    setCheckInStopModal({ route, stop });
    setCheckInStatus(stop.status === 'pendiente' ? 'visitado_con_venta' : stop.status);
    setCheckInTime(stop.checkInTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setCheckInNotes(stop.notes || '');
    setCheckInSaleAmount(stop.salesAmount || 0);
    setCheckInCollectAmount(stop.collectedAmount || 0);
    setCheckInReceiptNumber(stop.receiptNumber || '');
    setCheckInGps({
      lat: stop.latitude,
      lng: stop.longitude,
      accuracy: stop.accuracyMeters,
      status: stop.geotagStatus || (stop.latitude ? 'verificado_gps' : undefined),
      isLocating: false
    });
  };

  // Capture GPS on PC for supervisory check-in
  const handleCapturePcGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este navegador.');
      return;
    }
    setCheckInGps(prev => ({ ...prev, isLocating: true }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCheckInGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: 'verificado_gps',
          isLocating: false
        });
      },
      err => {
        alert('No se pudo obtener la ubicación GPS: ' + err.message);
        setCheckInGps(prev => ({ ...prev, isLocating: false }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Check-in on a stop
  const handleSaveCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInStopModal) return;

    const { route, stop } = checkInStopModal;

    const updatedStops: RouteSheetStop[] = route.stops.map(s => {
      if (s.id === stop.id) {
        return {
          ...s,
          status: checkInStatus,
          checkInTime,
          notes: checkInNotes.trim(),
          salesAmount: Number(checkInSaleAmount) || 0,
          collectedAmount: Number(checkInCollectAmount) || 0,
          receiptNumber: checkInReceiptNumber.trim() || undefined,
          latitude: checkInGps.lat ?? s.latitude,
          longitude: checkInGps.lng ?? s.longitude,
          accuracyMeters: checkInGps.accuracy ?? s.accuracyMeters,
          geotaggedAt: checkInGps.lat ? (s.geotaggedAt || new Date().toISOString()) : s.geotaggedAt,
          geotagStatus: checkInGps.lat ? 'verificado_gps' : (s.geotagStatus || 'sin_gps_manual'),
          deviceInfo: s.deviceInfo || 'Gestión Gerencial PC'
        };
      }
      return s;
    });

    // Compute updated totals
    const visitedCount = updatedStops.filter(s => s.status !== 'pendiente').length;
    const totalSales = updatedStops.reduce((acc, s) => acc + (s.salesAmount || 0), 0);
    const totalCollect = updatedStops.reduce((acc, s) => acc + (s.collectedAmount || 0), 0);
    const isCompleted = visitedCount === updatedStops.length;

    const updatedRoute: RouteSheet = {
      ...route,
      stops: updatedStops,
      visitedStops: visitedCount,
      totalSalesGenerated: totalSales,
      totalCollectionsGenerated: totalCollect,
      status: isCompleted ? 'completada' : 'en_progreso',
      completedAt: isCompleted ? new Date().toISOString() : undefined
    };

    await onSaveRouteSheet(updatedRoute);
    setCheckInStopModal(null);
  };

  // Helper: visit status badges
  const getVisitStatusBadge = (status: VisitStatus) => {
    switch (status) {
      case 'visitado_con_venta':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-600" /> Visitado (Venta)</span>;
      case 'visitado_cobranza':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><DollarSign className="w-3 h-3 text-teal-600" /> Visitado (Cobro)</span>;
      case 'visitado_sin_venta':
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> Visitado (Sin Venta)</span>;
      case 'no_encontrado_ausente':
        return <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><XCircle className="w-3 h-3 text-red-600" /> Ausente / Cerrado</span>;
      case 'reprogramado':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><RotateCcw className="w-3 h-3 text-purple-600" /> Reprogramado</span>;
      case 'pendiente':
      default:
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> Pendiente</span>;
    }
  };

  // Calculations for Commissions tab
  const commissionsSummary = useMemo(() => {
    const [year, month] = commissionMonth.split('-');
    
    return sellers.map(seller => {
      // 1. Sales made by or assigned to this seller in this month
      const sellerOrders = salesOrders.filter(o => {
        if (!o.date.startsWith(`${year}-${month}`)) return false;
        return o.sellerId === seller.id || o.sellerName === seller.name;
      });

      // Sum of sales (from orders or from route sheet check-ins if not linked)
      const ordersSalesTotal = sellerOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
      
      // Route sheets sales in this month
      const sellerRoutes = routeSheets.filter(r => {
        if (!r.date.startsWith(`${year}-${month}`)) return false;
        return r.sellerId === seller.id;
      });
      const routeSalesTotal = sellerRoutes.reduce((sum, r) => sum + (r.totalSalesGenerated || 0), 0);
      const totalSales = Math.max(ordersSalesTotal, routeSalesTotal);

      // 2. Collections made by or assigned to this seller
      const routeCollectionsTotal = sellerRoutes.reduce((sum, r) => sum + (r.totalCollectionsGenerated || 0), 0);
      const totalCollections = routeCollectionsTotal;

      // 3. Commission amounts
      const salesCommAmount = Math.round((totalSales * (seller.salesCommissionPct || 0)) / 100);
      const collCommAmount = Math.round((totalCollections * (seller.collectionCommissionPct || 0)) / 100);
      const totalToPay = salesCommAmount + collCommAmount;

      return {
        seller,
        totalSales,
        salesCommPct: seller.salesCommissionPct || 0,
        salesCommAmount,
        totalCollections,
        collCommPct: seller.collectionCommissionPct || 0,
        collCommAmount,
        totalToPay,
        routesCount: sellerRoutes.length,
        ordersCount: sellerOrders.length
      };
    });
  }, [sellers, salesOrders, routeSheets, commissionMonth]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Active Seller Persona Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Navigation className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3" /> Preventa & Calle
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                Control de Roles por Módulo
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              Vendedores de Calle, Hojas de Ruta & Comisiones
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Planificación diaria de clientes a visitar, marcación de visitas en tiempo real, 
              liquidación de comisiones por venta y cobranza, y asignación de permisos de módulos desde administración.
            </p>
          </div>

          {/* Active Context Banner / Impersonation */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d31627] flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xs">
              {activeSellerContext ? activeSellerContext.name.charAt(0) : '👑'}
            </div>
            <div className="text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-300 block">
                Perfil Activo en Menú:
              </span>
              <strong className="text-white block text-sm">
                {activeSellerContext ? activeSellerContext.name : 'Administrador (Acceso Total)'}
              </strong>
              <span className="text-[11px] text-emerald-300">
                {activeSellerContext ? `Zona: ${activeSellerContext.zone} (${activeSellerContext.allowedModules?.length || 5} módulos)` : 'Todos los módulos visibles'}
              </span>
            </div>
            {activeSellerContext && (
              <button
                onClick={() => onSetActiveSellerContext(null)}
                className="ml-2 text-xs bg-white text-slate-900 font-bold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
                title="Volver a ver todos los módulos como Administrador"
              >
                Restaurar Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('rutas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'rutas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Hojas de Ruta & Visitas</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === 'rutas' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {routeSheets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('vendedores')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'vendedores'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo de Vendedores ({sellers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('comisiones')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'comisiones'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Liquidación de Comisiones</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMobileSellerApp && (
            <button
              onClick={onOpenMobileSellerApp}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
              title="Abrir la App Móvil simplificada para celulares de vendedores"
            >
              <Compass className="w-4 h-4 text-emerald-200" />
              <span>📱 Ver App Celular Preventista</span>
            </button>
          )}

          {activeTab === 'rutas' && (
            <button
              onClick={handleOpenCreateRoute}
              className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nueva Hoja de Ruta
            </button>
          )}

          {activeTab === 'vendedores' && (
            <button
              onClick={handleOpenCreateSeller}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo Vendedor de Calle
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HOJAS DE RUTA & VISITAS A CLIENTES */}
      {activeTab === 'rutas' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:w-80">
              <input
                type="text"
                placeholder="Buscar ruta, cliente, zona o código..."
                value={searchRouteQuery}
                onChange={e => setSearchRouteQuery(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-300 w-full focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Seller filter */}
              <select
                value={selectedSellerFilter}
                onChange={e => setSelectedSellerFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-700 bg-white"
              >
                <option value="all">Todos los vendedores</option>
                {sellers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code} - {s.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Sheets List */}
          {filteredRouteSheets.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200 text-xs space-y-3">
              <Compass className="w-10 h-10 mx-auto text-slate-300" />
              <div>No hay hojas de ruta registradas con los filtros seleccionados.</div>
              <button
                onClick={handleOpenCreateRoute}
                className="inline-flex items-center gap-1.5 bg-[#d31627] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <Plus className="w-4 h-4" /> Crear Primera Hoja de Ruta
              </button>
            </div>
          ) : (
            filteredRouteSheets.map(route => {
              const progressPct = route.totalStops > 0 ? Math.round((route.visitedStops / route.totalStops) * 100) : 0;
              const sellerObj = sellers.find(s => s.id === route.sellerId);

              return (
                <div 
                  key={route.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Top Row: Code, Title, Seller, Progress */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {route.code}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        {route.title}
                      </h3>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {route.zone}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        route.status === 'completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {route.status === 'completada' ? 'Ruta Concluida' : 'En Progreso'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(route.date).toLocaleDateString('es-AR')}
                      </span>
                      <span className="text-slate-300">|</span>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">
                          {route.sellerName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Bar: Stops & Sales Generated */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Progreso de Visitas:</span>
                      <div className="font-mono font-bold text-slate-900">
                        {route.visitedStops} de {route.totalStops} clientes ({progressPct}%)
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${progressPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Ventas Concretadas en Ruta:</span>
                      <div className="font-mono font-black text-emerald-700 text-sm">
                        $ {route.totalSalesGenerated.toLocaleString('es-AR')}
                      </div>
                      {sellerObj && (
                        <span className="text-[10px] text-slate-500">
                          Comisión estimada ({sellerObj.salesCommissionPct}%): $ {Math.round(route.totalSalesGenerated * sellerObj.salesCommissionPct / 100).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cobranzas Percibidas en Ruta:</span>
                      <div className="font-mono font-black text-teal-700 text-sm">
                        $ {route.totalCollectionsGenerated.toLocaleString('es-AR')}
                      </div>
                      {sellerObj && (
                        <span className="text-[10px] text-slate-500">
                          Comisión estimada ({sellerObj.collectionCommissionPct}%): $ {Math.round(route.totalCollectionsGenerated * sellerObj.collectionCommissionPct / 100).toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAuditGpsModalRoute(route)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border shadow-xs transition-colors ${
                          route.stops.some(s => s.status !== 'pendiente' && s.latitude)
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                        title="Auditoría Gerencial de Geotagging de la hoja de ruta"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Auditoría GPS ({route.stops.filter(s => s.status !== 'pendiente' && s.latitude).length}/{route.stops.filter(s => s.status !== 'pendiente').length})</span>
                      </button>

                      <button
                        onClick={() => setViewPrintRoute(route)}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir Hoja</span>
                      </button>
                    </div>
                  </div>

                  {/* Stops Timeline / Cards */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center justify-between">
                      <span>Paradas & Clientes en Itinerario ({route.stops.length}):</span>
                      <span className="text-slate-500 font-normal">Haga clic en "Registrar Visita" para realizar el check-in</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {route.stops.map((stop, idx) => {
                        const cleanPhone = stop.customerPhone?.replace(/[^0-9]/g, '') || '';
                        const hasDebt = (stop.currentBalance || 0) > 0;
                        const isVisited = stop.status !== 'pendiente';

                        return (
                          <div 
                            key={stop.id}
                            className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                              isVisited
                                ? 'bg-slate-50/70 border-slate-200' 
                                : 'bg-white border-blue-200/80 shadow-xs'
                            }`}
                          >
                            {/* Stop Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                  {stop.orderIndex || idx + 1}
                                </span>
                                <div>
                                  <div className="font-extrabold text-slate-900 text-xs">
                                    {stop.customerName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                    {stop.customerAddress}
                                  </div>
                                </div>
                              </div>

                              {getVisitStatusBadge(stop.status)}
                            </div>

                            {/* Details: Horario, Saldo deudor */}
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                              <span className="text-slate-500 font-mono">
                                Hora prevista: <strong>{stop.estimatedTime || 'S/D'}</strong>
                              </span>
                              <span className={`font-mono font-bold ${hasDebt ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {hasDebt ? `Deuda Cta Cte: $ ${stop.currentBalance?.toLocaleString('es-AR')}` : 'Sin saldo adeudado'}
                              </span>
                            </div>

                            {/* Check-in result and Geotagging verification if visited */}
                            {isVisited && (
                              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2 shadow-2xs">
                                <div className="flex items-center justify-between text-[10px] text-slate-500">
                                  <span>Hora check-in: <strong className="text-slate-800">{stop.checkInTime || 'Registrado'} hs</strong></span>
                                  {stop.salesAmount ? <span className="text-emerald-700 font-bold font-mono">Venta: $ {stop.salesAmount.toLocaleString('es-AR')}</span> : null}
                                  {stop.collectedAmount ? <span className="text-teal-700 font-bold font-mono">Cobro: $ {stop.collectedAmount.toLocaleString('es-AR')}</span> : null}
                                </div>
                                {stop.notes && (
                                  <div className="text-slate-700 text-[11px] italic bg-slate-50 p-1.5 rounded-lg">
                                    "{stop.notes}"
                                  </div>
                                )}

                                {/* Geotagging GPS details for manager */}
                                {stop.latitude && stop.longitude ? (
                                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                                    <div className="flex items-center gap-1.5">
                                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[11px] font-black text-emerald-950">GPS Verificado en Destino</span>
                                          <span className="text-[9px] bg-emerald-200 text-emerald-900 font-mono px-1 py-0.2 rounded font-bold">
                                            ±{stop.accuracyMeters ? Math.round(stop.accuracyMeters) : 10}m
                                          </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-emerald-700">
                                          {stop.latitude.toFixed(6)}, {stop.longitude.toFixed(6)}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <a
                                        href={`https://www.google.com/maps?q=${stop.latitude},${stop.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-300 transition-colors"
                                        title="Ver en Google Maps externo"
                                      >
                                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                                        <span>Maps</span>
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setAuditGpsModalStop({ route, stop })}
                                        className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-md shadow-2xs transition-colors"
                                        title="Auditar Geotagging en PC con mapa satelital"
                                      >
                                        <MapPin className="w-3 h-3" />
                                        <span>Auditar en PC</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                    <span className="flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                      Visita registrada sin Geotagging GPS (Marcación Manual)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCheckIn(route, stop)}
                                      className="text-amber-900 font-bold underline hover:text-amber-950"
                                    >
                                      Geolocalizar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Actions for stop: Optimized for street reps on smartphone */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                              <div className="flex items-center gap-1.5">
                                {/* GPS Navigation with Google Maps / Waze */}
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.customerAddress + (stop.customerCity ? ', ' + stop.customerCity : ''))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200"
                                  title="Abrir GPS Google Maps para llegar al cliente"
                                >
                                  <MapPin className="w-3 h-3 text-blue-600" />
                                  <span>Cómo llegar</span>
                                </a>

                                {/* Direct Call */}
                                {cleanPhone && (
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200"
                                    title="Llamar al cliente"
                                  >
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    <span>Llamar</span>
                                  </a>
                                )}

                                {/* WhatsApp */}
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${stop.customerName}, te saluda ${route.sellerName} de Colorear Pinturas. Estoy en recorrido hacia su local.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                                    title="Enviar WhatsApp al cliente"
                                  >
                                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                              </div>

                              <button
                                onClick={() => handleOpenCheckIn(route, stop)}
                                className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{stop.status === 'pendiente' ? 'Marcar Visita' : 'Check-in'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: EQUIPO DE VENDEDORES (ROLES, MODULOS Y COMISIONES) */}
      {activeTab === 'vendedores' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Vendedores de Calle & Control de Acceso por Módulo
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure comisiones de venta/cobranza y elija exactamente qué módulos de la barra lateral puede ver cada vendedor.
                </p>
              </div>

              <button
                onClick={handleOpenCreateSeller}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4" /> Alta Vendedor
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {sellers.map(seller => {
                const isCurrentActive = activeSellerContext?.id === seller.id;
                const allowedCount = seller.allowedModules?.length || 5;

                return (
                  <div 
                    key={seller.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-all space-y-4 relative ${
                      isCurrentActive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isCurrentActive && (
                      <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Perfil Activo
                      </span>
                    )}

                    {/* Header: Avatar, Name, Code */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-lg flex items-center justify-center shadow-xs">
                        {seller.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-sm">{seller.name}</h3>
                          <span className="font-mono text-[10px] font-black text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {seller.code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold">{seller.zone}</div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{seller.phone || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{seller.email || 'Sin email'}</span>
                      </div>
                    </div>

                    {/* Commission percentages badges */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 block">Comisión Venta</span>
                        <strong className="text-emerald-900 text-base font-black font-mono">
                          {seller.salesCommissionPct}%
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-center">
                        <span className="text-[10px] font-bold uppercase text-teal-800 block">Comisión Cobranza</span>
                        <strong className="text-teal-900 text-base font-black font-mono">
                          {seller.collectionCommissionPct}%
                        </strong>
                      </div>
                    </div>

                    {/* Modules Allowed summary */}
                    <div className="text-xs text-slate-600">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-700">Módulos Asignados:</span>
                        <span className="font-mono font-bold text-blue-700">{allowedCount} de {ALL_SYSTEM_MODULES.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(seller.allowedModules || []).slice(0, 4).map(mod => (
                          <span key={mod} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {mod}
                          </span>
                        ))}
                        {allowedCount > 4 && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            +{allowedCount - 4} más
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (isCurrentActive) {
                            onSetActiveSellerContext(null);
                          } else {
                            onSetActiveSellerContext(seller);
                          }
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors ${
                          isCurrentActive 
                            ? 'bg-slate-900 text-white hover:bg-black' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                        }`}
                        title="Simula la vista del sistema restringida solo a los módulos de este vendedor"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isCurrentActive ? 'Salir de Vista' : 'Simular Vista'}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditSeller(seller)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Roles & Comisiones</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIQUIDACIÓN DE COMISIONES */}
      {activeTab === 'comisiones' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-600" />
                Liquidación de Comisiones por Venta y Cobranza
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cálculo automático de haberes devengados según las ventas netas y las cobranzas efectuadas por cada vendedor.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Período:</span>
              <input
                type="month"
                value={commissionMonth}
                onChange={e => setCommissionMonth(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-300 font-bold bg-slate-50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase border-y border-slate-200">
                <tr>
                  <th className="p-3">Vendedor</th>
                  <th className="p-3">Zona</th>
                  <th className="p-3 text-right">Total Ventas Mes</th>
                  <th className="p-3 text-right">Comisión Venta (%)</th>
                  <th className="p-3 text-right">Total Cobranzas Mes</th>
                  <th className="p-3 text-right">Comisión Cobro (%)</th>
                  <th className="p-3 text-right font-black">Total a Liquidar</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissionsSummary.map(row => (
                  <tr key={row.seller.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{row.seller.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.seller.code}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{row.seller.zone}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      $ {row.totalSales.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="text-slate-500 text-[11px]">{row.salesCommPct}% = </span>
                      <strong className="text-emerald-700 font-bold">$ {row.salesCommAmount.toLocaleString('es-AR')}</strong>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      $ {row.totalCollections.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3 text-right font-mono">
                      <span className="text-slate-500 text-[11px]">{row.collCommPct}% = </span>
                      <strong className="text-teal-700 font-bold">$ {row.collCommAmount.toLocaleString('es-AR')}</strong>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-slate-900">
                      $ {row.totalToPay.toLocaleString('es-AR')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          alert(`Liquidación de Comisiones ${commissionMonth}\nVendedor: ${row.seller.name}\nComisión por Venta: $ ${row.salesCommAmount.toLocaleString('es-AR')}\nComisión por Cobranza: $ ${row.collCommAmount.toLocaleString('es-AR')}\nTotal Liquidado: $ ${row.totalToPay.toLocaleString('es-AR')}`);
                        }}
                        className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs"
                      >
                        Recibo Liquidación
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ALTA / EDICIÓN DE VENDEDOR & PERMISOS DE MÓDULOS */}
      {showNewSellerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingSeller ? 'Configuración de Vendedor, Comisiones & Permisos' : 'Alta de Nuevo Vendedor de Calle'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asigne las comisiones por venta y cobranza, y los módulos que podrá visualizar en el sistema.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowNewSellerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSellerSubmit} className="mt-4 space-y-4">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerForm.name}
                    onChange={e => setSellerForm({ ...sellerForm, name: e.target.value })}
                    placeholder="Ej: Marcos Gómez"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Código de Vendedor
                  </label>
                  <input
                    type="text"
                    required
                    value={sellerForm.code}
                    onChange={e => setSellerForm({ ...sellerForm, code: e.target.value })}
                    placeholder="Ej: VEN-04"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={sellerForm.phone}
                    onChange={e => setSellerForm({ ...sellerForm, phone: e.target.value })}
                    placeholder="+54 11 ..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={sellerForm.email}
                    onChange={e => setSellerForm({ ...sellerForm, email: e.target.value })}
                    placeholder="vendedor@colorear.com.ar"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Zona Asignada
                  </label>
                  <input
                    type="text"
                    value={sellerForm.zone}
                    onChange={e => setSellerForm({ ...sellerForm, zone: e.target.value })}
                    placeholder="GBA Norte, CABA, etc."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              {/* Commission rates */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-600" /> Esquema de Comisiones Acordado
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Comisión por Venta (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={sellerForm.salesCommissionPct}
                        onChange={e => setSellerForm({ ...sellerForm, salesCommissionPct: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Aplicable sobre el total facturado neto generado.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Comisión por Cobranza (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={sellerForm.collectionCommissionPct}
                        onChange={e => setSellerForm({ ...sellerForm, collectionCommissionPct: Number(e.target.value) })}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold pr-8"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">%</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Aplicable sobre los cobros efectivos percibidos de clientes.
                    </span>
                  </div>
                </div>
              </div>

              {/* Module Visibility / Roles configuration */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Permisos de Módulos (Visibilidad en Barra Lateral)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Marque los módulos que este vendedor puede ver. Los no seleccionados estarán ocultos.
                    </p>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setModulePreset('vendedor_calle')}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Básico Calle
                    </button>
                    <button
                      type="button"
                      onClick={() => setModulePreset('vendedor_senior')}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Senior
                    </button>
                    <button
                      type="button"
                      onClick={() => setModulePreset('todos')}
                      className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Todos
                    </button>
                  </div>
                </div>

                {/* Checkboxes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {ALL_SYSTEM_MODULES.map(mod => {
                    const isChecked = (sellerForm.allowedModules || []).includes(mod.key);
                    return (
                      <label 
                        key={mod.key} 
                        className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors ${
                          isChecked ? 'bg-white border-blue-400 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSellerModule(mod.key)}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-900 block">{mod.label}</span>
                          <span className="text-[10px] text-slate-500 block leading-tight">{mod.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSellerModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Vendedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA HOJA DE RUTA */}
      {showNewRouteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Nueva Hoja de Ruta de Calle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleccione el vendedor de calle y agregue los clientes a visitar en el día.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowNewRouteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRouteSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Vendedor Asignado
                  </label>
                  <select
                    value={newRouteSellerId}
                    onChange={e => {
                      setNewRouteSellerId(e.target.value);
                      const sel = sellers.find(s => s.id === e.target.value);
                      if (sel?.zone) setNewRouteZone(sel.zone);
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-slate-50"
                    required
                  >
                    {sellers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code} - {s.zone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Fecha de la Ruta
                  </label>
                  <input
                    type="date"
                    required
                    value={newRouteDate}
                    onChange={e => setNewRouteDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Zona de Recorrido
                  </label>
                  <input
                    type="text"
                    value={newRouteZone}
                    onChange={e => setNewRouteZone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Título de la Jornada
                </label>
                <input
                  type="text"
                  value={newRouteTitle}
                  onChange={e => setNewRouteTitle(e.target.value)}
                  placeholder="Ej: Circuito San Martín & Pinturerías Caseros"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              {/* Add customer stops section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase">
                    Clientes a Visitar en la Ruta ({selectedCustomerStops.length})
                  </label>
                </div>

                {/* Search customer to add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Buscar clientes por nombre o CUIT para sumar a la ruta..."
                    value={customerSearchQuery}
                    onChange={e => setCustomerSearchQuery(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                {customerSearchQuery.trim() && (
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
                    {customers
                      .filter(c => 
                        c.businessName.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
                        c.taxId.includes(customerSearchQuery)
                      )
                      .slice(0, 5)
                      .map(cust => (
                        <div key={cust.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">{cust.businessName}</div>
                            <div className="text-[11px] text-slate-500">{cust.address}, {cust.city}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddCustomerToRoute(cust);
                              setCustomerSearchQuery('');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                          >
                            + Agregar Parada
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Selected stops list */}
                {selectedCustomerStops.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Aún no se han agregado paradas. Busque clientes arriba para armar el circuito.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedCustomerStops.map((stopItem, idx) => {
                      const cust = customers.find(c => c.id === stopItem.customerId);
                      return (
                        <div key={stopItem.customerId} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <strong className="text-slate-900 block truncate">{cust?.businessName}</strong>
                            <span className="text-[11px] text-slate-500 block truncate">{cust?.address}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[11px] text-slate-400">Hora:</span>
                            <input
                              type="time"
                              value={stopItem.estimatedTime}
                              onChange={e => {
                                const newStops = [...selectedCustomerStops];
                                newStops[idx].estimatedTime = e.target.value;
                                setSelectedCustomerStops(newStops);
                              }}
                              className="w-20 text-xs p-1 rounded-lg border border-slate-300 font-mono font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomerFromRoute(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewRouteModal(false)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Crear Hoja de Ruta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHECK-IN / MARCACIÓN DE VISITA */}
      {checkInStopModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Registrar Marcación de Visita
                </h3>
                <p className="text-xs text-slate-500">
                  Cliente: <strong>{checkInStopModal.stop.customerName}</strong>
                </p>
              </div>
              <button onClick={() => setCheckInStopModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheckInSubmit} className="mt-4 space-y-4 text-xs">
              {/* Address and Balance info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-slate-700 font-semibold">{checkInStopModal.stop.customerAddress}</div>
                <div className="text-[11px] font-mono font-bold text-rose-700 mt-1">
                  Saldo en Cta Cte: $ {checkInStopModal.stop.currentBalance?.toLocaleString('es-AR') || 0}
                </div>
              </div>

              {/* Status choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resultado de la Visita
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'visitado_con_venta', label: '✅ Venta Concretada' },
                    { val: 'visitado_cobranza', label: '💵 Cobranza Realizada' },
                    { val: 'visitado_sin_venta', label: '📝 Sin Venta / Consulta' },
                    { val: 'no_encontrado_ausente', label: '🚪 Ausente / Cerrado' },
                    { val: 'reprogramado', label: '🔄 Reprogramar' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCheckInStatus(opt.val as VisitStatus)}
                      className={`p-2.5 rounded-xl border text-left font-bold text-xs transition-all ${
                        checkInStatus === opt.val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of visit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Hora de la Visita (Check-in)
                </label>
                <input
                  type="text"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                />
              </div>

              {/* Sales amount if venta */}
              {(checkInStatus === 'visitado_con_venta' || checkInStatus === 'visitado_cobranza') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      Monto de Venta ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={checkInSaleAmount}
                      onChange={e => setCheckInSaleAmount(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-blue-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-900 mb-1">
                      Monto Cobrado ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={checkInCollectAmount}
                      onChange={e => setCheckInCollectAmount(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-blue-300 font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Observaciones de la Visita
                </label>
                <textarea
                  rows={3}
                  value={checkInNotes}
                  onChange={e => setCheckInNotes(e.target.value)}
                  placeholder="Detalles de la reunión, pedidos pendientes de cotizar, respuesta del cliente..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Geotagging GPS Widget */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    Georreferenciación GPS de la Visita
                  </span>
                  <button
                    type="button"
                    onClick={handleCapturePcGps}
                    disabled={checkInGps.isLocating}
                    className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
                  >
                    <Crosshair className={`w-3 h-3 text-blue-600 ${checkInGps.isLocating ? 'animate-spin' : ''}`} />
                    {checkInGps.isLocating ? 'Detectando...' : checkInGps.lat ? 'Recalibrar GPS' : 'Capturar GPS PC'}
                  </button>
                </div>
                {checkInGps.lat && checkInGps.lng ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-800 text-[11px]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-mono font-bold">
                          {checkInGps.lat.toFixed(6)}, {checkInGps.lng.toFixed(6)}
                        </div>
                        <div className="text-[10px] text-emerald-600">
                          {checkInGps.accuracy ? `Precisión de antena ±${Math.round(checkInGps.accuracy)}m` : 'Coordenadas verificadas'}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${checkInGps.lat},${checkInGps.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      Ver mapa <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Sin coordenadas registradas aún. Al realizar la visita desde el móvil del preventista, las coordenadas se capturan de forma satelital instantánea al marcar 'Visitado'.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckInStopModal(null)}
                  className="text-xs font-semibold px-4 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Guardar Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW PRINTABLE ROUTE SHEET */}
      {viewPrintRoute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/assets/aistudio/colorear-500px_0158e3cb.webp" alt="Colorear" className="h-8 w-auto" />
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase">
                    HOJA DE RUTA COMERCIAL - PREVENTA CALLE
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {viewPrintRoute.code} | {new Date(viewPrintRoute.date).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewPrintRoute(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Vendedor:</span>
                  <strong className="text-slate-900 block text-sm">{viewPrintRoute.sellerName}</strong>
                  <span className="text-slate-600 text-[11px]">Zona: {viewPrintRoute.zone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Circuito / Jornada:</span>
                  <strong className="text-slate-900 block">{viewPrintRoute.title}</strong>
                  <span className="text-slate-600 text-[11px]">Paradas a realizar: {viewPrintRoute.totalStops}</span>
                </div>
              </div>

              {/* Stops list table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[10px] uppercase">
                    <tr>
                      <th className="p-2 text-center w-8">#</th>
                      <th className="p-2">Cliente & Domicilio</th>
                      <th className="p-2">Teléfono</th>
                      <th className="p-2 text-right">Saldo Deuda</th>
                      <th className="p-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewPrintRoute.stops.map(s => (
                      <tr key={s.id}>
                        <td className="p-2 text-center font-bold">{s.orderIndex}</td>
                        <td className="p-2">
                          <div className="font-bold text-slate-900">{s.customerName}</div>
                          <div className="text-[10px] text-slate-500">{s.customerAddress}</div>
                        </td>
                        <td className="p-2 font-mono text-[11px]">{s.customerPhone || 'S/D'}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-800">
                          $ {s.currentBalance?.toLocaleString('es-AR') || 0}
                        </td>
                        <td className="p-2 text-center">
                          <span className="text-[10px] font-bold uppercase">
                            {s.status === 'pendiente' ? '⬜ Pendiente' : '☑️ ' + s.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-dashed border-slate-300 text-center text-[11px] text-slate-500">
                <div className="border-t border-slate-300 pt-1">
                  Firma Vendedor / Preventista
                </div>
                <div className="border-t border-slate-300 pt-1">
                  Firma Supervisión / Ventas Fábrica
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end border-t border-slate-200 pt-3">
              <button
                onClick={() => window.print()}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Imprimir Hoja de Ruta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INDIVIDUAL VISIT GPS AUDIT */}
      {auditGpsModalStop && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  auditGpsModalStop.stop.latitude ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">
                      Auditoría Gerencial de Geotagging
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      auditGpsModalStop.stop.latitude
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {auditGpsModalStop.stop.latitude ? 'GPS Verificado' : 'Sin GPS Satelital'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Hoja <span className="font-mono font-bold text-slate-700">{auditGpsModalStop.route.code}</span> • Preventista: <strong className="text-slate-800">{auditGpsModalStop.route.sellerName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditGpsModalStop(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-4">
              {/* Customer and Visit Metadata Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cliente & Destino</span>
                  <strong className="text-sm text-slate-900 block mt-0.5">{auditGpsModalStop.stop.customerName}</strong>
                  <div className="text-slate-600 flex items-center gap-1 mt-1 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{auditGpsModalStop.stop.customerAddress}</span>
                  </div>
                  {auditGpsModalStop.stop.customerPhone && (
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      Tel: {auditGpsModalStop.stop.customerPhone}
                    </div>
                  )}
                </div>

                <div className="border-t md:border-t-0 md:border-l md:pl-3 border-slate-200 pt-2 md:pt-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resultado Comercial</span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      {auditGpsModalStop.stop.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    {auditGpsModalStop.stop.checkInTime && (
                      <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {auditGpsModalStop.stop.checkInTime}
                      </span>
                    )}
                  </div>
                  {((auditGpsModalStop.stop.salesAmount || 0) > 0 || (auditGpsModalStop.stop.collectedAmount || 0) > 0) && (
                    <div className="mt-2 space-y-0.5 font-mono text-[11px]">
                      {(auditGpsModalStop.stop.salesAmount || 0) > 0 && (
                        <div className="text-emerald-700 font-bold">
                          Venta registrada: $ {auditGpsModalStop.stop.salesAmount?.toLocaleString('es-AR')}
                        </div>
                      )}
                      {(auditGpsModalStop.stop.collectedAmount || 0) > 0 && (
                        <div className="text-blue-700 font-bold">
                          Cobranza realizada: $ {auditGpsModalStop.stop.collectedAmount?.toLocaleString('es-AR')}
                        </div>
                      )}
                    </div>
                  )}
                  {auditGpsModalStop.stop.notes && (
                    <div className="mt-2 text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200">
                      "{auditGpsModalStop.stop.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* GPS Satellite Evidence */}
              {auditGpsModalStop.stop.latitude && auditGpsModalStop.stop.longitude ? (
                <div className="space-y-3">
                  {/* Verification Banner */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-emerald-900">
                            Geolocalización Satelital Certificada en Punto de Venta
                          </div>
                          <div className="text-[11px] text-emerald-700 font-mono">
                            Lat: {auditGpsModalStop.stop.latitude.toFixed(6)} | Lng: {auditGpsModalStop.stop.longitude.toFixed(6)}
                            {auditGpsModalStop.stop.accuracyMeters && (
                              <span className="ml-2 font-sans font-semibold bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded">
                                Margen de antena: ±{Math.round(auditGpsModalStop.stop.accuracyMeters)}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const coordText = `${auditGpsModalStop.stop.latitude}, ${auditGpsModalStop.stop.longitude}`;
                            navigator.clipboard.writeText(coordText);
                            setCopiedCoord(true);
                            setTimeout(() => setCopiedCoord(false), 2000);
                          }}
                          className="text-[10px] font-bold px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 shadow-2xs"
                        >
                          <Copy className="w-3 h-3" />
                          {copiedCoord ? '¡Copiado!' : 'Copiar GPS'}
                        </button>
                        <a
                          href={`https://www.google.com/maps?q=${auditGpsModalStop.stop.latitude},${auditGpsModalStop.stop.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                        >
                          Google Maps <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Meta timestamps */}
                    <div className="mt-2 pt-2 border-t border-emerald-200/60 flex flex-wrap items-center justify-between text-[10px] text-emerald-800">
                      <span>
                        Momento del Geotag: <strong>{auditGpsModalStop.stop.geotaggedAt ? new Date(auditGpsModalStop.stop.geotaggedAt).toLocaleString('es-AR') : (auditGpsModalStop.stop.checkInTime || 'Registrado en visita')}</strong>
                      </span>
                      <span>
                        Dispositivo: <strong>{auditGpsModalStop.stop.deviceInfo || 'App Preventa Móvil (GPS Satelital)'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* OpenStreetMap Interactive Embed */}
                  <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
                    <iframe
                      title={`Mapa Satelital ${auditGpsModalStop.stop.customerName}`}
                      width="100%"
                      height="260"
                      className="border-0 w-full"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${auditGpsModalStop.stop.longitude - 0.006},${auditGpsModalStop.stop.latitude - 0.005},${auditGpsModalStop.stop.longitude + 0.006},${auditGpsModalStop.stop.latitude + 0.005}&layer=mapnik&marker=${auditGpsModalStop.stop.latitude},${auditGpsModalStop.stop.longitude}`}
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-emerald-600" />
                      Marcador de Check-in Presencial
                    </div>
                    <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-mono font-bold text-slate-700 shadow-xs">
                      {auditGpsModalStop.stop.latitude.toFixed(6)}, {auditGpsModalStop.stop.longitude.toFixed(6)}
                    </div>
                  </div>

                  {/* Comparative Validation Callout */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Validación Cruzada de Coordenadas
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">📍 Domicilio Comercial de Ficha</span>
                        <span className="text-slate-800 font-medium text-[11px]">{auditGpsModalStop.stop.customerAddress}</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 block font-semibold">🛰️ Posición Satelital del Vendedor</span>
                        <span className="text-emerald-700 font-mono font-bold text-[11px]">
                          {auditGpsModalStop.stop.latitude.toFixed(6)}, {auditGpsModalStop.stop.longitude.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h4 className="font-bold text-xs">Visita sin Geotagging Satelital Registrado</h4>
                  </div>
                  <p className="text-xs text-amber-800">
                    Esta parada fue asentada de forma manual en el sistema o el dispositivo móvil no tenía activado el permiso de GPS al momento de marcar el estado 'Visitado'.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(auditGpsModalStop.stop.customerAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg inline-flex items-center gap-1 shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Buscar dirección en Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Auditoría Gerencial Colorear Pinturas • Trazabilidad en Calle
              </span>
              <button
                type="button"
                onClick={() => setAuditGpsModalStop(null)}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              >
                Cerrar Auditoría
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ROUTE-LEVEL GPS AUDIT */}
      {auditGpsModalRoute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Navigation className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">
                      Panel Gerencial de Auditoría GPS de Hoja de Ruta
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-300">
                      {auditGpsModalRoute.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Vendedor: <strong className="text-slate-800">{auditGpsModalRoute.sellerName}</strong> • Fecha: <strong className="text-slate-800">{new Date(auditGpsModalRoute.date).toLocaleDateString('es-AR')}</strong> • Zona: {auditGpsModalRoute.zone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAuditGpsModalRoute(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* KPI Summary Cards */}
            {(() => {
              const total = auditGpsModalRoute.stops.length;
              const visited = auditGpsModalRoute.stops.filter(s => s.status !== 'pendiente').length;
              const withGps = auditGpsModalRoute.stops.filter(s => s.latitude && s.longitude).length;
              const withoutGps = visited - withGps;
              const gpsCoveragePct = visited > 0 ? Math.round((withGps / visited) * 100) : 0;

              return (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Paradas</span>
                      <strong className="text-xl text-slate-900 font-mono">{total}</strong>
                      <span className="text-[10px] text-slate-500 block">En hoja de ruta</span>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase block flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> GPS Verificado
                      </span>
                      <strong className="text-xl text-emerald-900 font-mono">{withGps}</strong>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        {gpsCoveragePct}% de las visitas
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">Sin GPS / Manual</span>
                      <strong className="text-xl text-amber-900 font-mono">{withoutGps}</strong>
                      <span className="text-[10px] text-amber-600 block">Revisar con preventista</span>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] font-bold text-blue-700 uppercase block">Pendientes</span>
                      <strong className="text-xl text-blue-900 font-mono">{total - visited}</strong>
                      <span className="text-[10px] text-blue-600 block">En tránsito</span>
                    </div>
                  </div>

                  {/* Stops Compliance Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Detalle de Paradas y Validación Satelital
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {withGps} de {total} paradas con coordenadas registradas
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 font-bold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-2.5 text-center w-10">#</th>
                            <th className="p-2.5">Cliente & Dirección</th>
                            <th className="p-2.5">Estado Visita</th>
                            <th className="p-2.5">Hora</th>
                            <th className="p-2.5">Geotagging</th>
                            <th className="p-2.5 font-mono">Coordenadas</th>
                            <th className="p-2.5 text-right">Auditoría</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {auditGpsModalRoute.stops.map(s => {
                            const isPending = s.status === 'pendiente';
                            const hasGps = !!(s.latitude && s.longitude);

                            return (
                              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-2.5 text-center font-bold text-slate-500">
                                  {s.orderIndex}
                                </td>
                                <td className="p-2.5">
                                  <div className="font-bold text-slate-900">{s.customerName}</div>
                                  <div className="text-[11px] text-slate-500">{s.customerAddress}</div>
                                </td>
                                <td className="p-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                    isPending
                                      ? 'bg-slate-100 text-slate-600'
                                      : s.status === 'visitado_con_venta'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : s.status === 'visitado_cobranza'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {isPending ? 'Pendiente' : s.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-600">
                                  {s.checkInTime || '-'}
                                </td>
                                <td className="p-2.5">
                                  {hasGps ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      GPS OK {s.accuracyMeters ? `(±${Math.round(s.accuracyMeters)}m)` : ''}
                                    </span>
                                  ) : isPending ? (
                                    <span className="text-[11px] text-slate-400">
                                      Por visitar
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                      Manual / Sin GPS
                                    </span>
                                  )}
                                </td>
                                <td className="p-2.5 font-mono text-[10px] text-slate-600">
                                  {hasGps ? `${s.latitude!.toFixed(4)}, ${s.longitude!.toFixed(4)}` : '-'}
                                </td>
                                <td className="p-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setAuditGpsModalStop({ route: auditGpsModalRoute, stop: s })}
                                      className="text-[10px] font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-2xs flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3 text-blue-600" />
                                      Auditar
                                    </button>
                                    {hasGps && (
                                      <a
                                        href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-500 hover:text-blue-600 shadow-2xs"
                                        title="Abrir en Google Maps"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Sistema de Control y Georreferenciación de Preventa • Fábrica Colorear
              </span>
              <button
                type="button"
                onClick={() => setAuditGpsModalRoute(null)}
                className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
