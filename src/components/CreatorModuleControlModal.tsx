import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Sliders, 
  ShieldAlert, 
  Sparkles, 
  Power, 
  Search, 
  Layers, 
  LayoutDashboard, 
  Factory, 
  ShoppingCart, 
  Tag, 
  Users, 
  Truck, 
  PackageSearch, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  CreditCard, 
  Wallet, 
  Calculator, 
  TrendingUp, 
  Receipt, 
  Scale, 
  UserCheck, 
  MapPin, 
  Bot, 
  Building2,
  CheckCircle2,
  AlertCircle,
  Package,
  Palette,
  Hammer,
  PaintBucket,
  Lock,
  KeyRound,
  Receipt as ReceiptIcon
} from 'lucide-react';
import { ModuleKey } from '../types';

interface CreatorModuleControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemModuleToggles?: Partial<Record<ModuleKey, boolean>>;
  onToggleModule: (moduleKey: ModuleKey, enabled: boolean) => Promise<void>;
  onBatchToggleModules: (updates: Partial<Record<ModuleKey, boolean>>) => Promise<void>;
  onNavigateToModule?: (moduleKey: ModuleKey) => void;
  onChangePassword?: () => void;
  onLock?: () => void;
  onOpenArcaSetup?: () => void;
  arcaReady?: boolean;
}

interface ModuleMeta {
  key: ModuleKey;
  label: string;
  category: 'control' | 'factory' | 'sales' | 'finances' | 'system';
  icon: React.ElementType;
  desc: string;
  badge?: string;
}

const ALL_MODULES_METADATA: ModuleMeta[] = [
  // Control & Inteligencia
  {
    key: 'desktop',
    label: 'Escritorio & KPIs Principales',
    category: 'control',
    icon: LayoutDashboard,
    desc: 'Panel principal de estadísticas, accesos directos y alertas industriales del día.'
  },
  {
    key: 'reports',
    label: 'Dashboard con Barras y Métricas',
    category: 'control',
    icon: BarChart3,
    desc: 'Visualización gráfica de barras para producción, ventas mensuales y stock de materias primas.',
    badge: 'Gráficos'
  },
  {
    key: 'ai_assistant',
    label: 'Asistente Industrial IA (Gemini)',
    category: 'control',
    icon: Bot,
    desc: 'Análisis inteligente de faltantes químicos, sugerencias de compras y fórmulas por IA.',
    badge: 'IA'
  },

  // Planta & Producción
  {
    key: 'production',
    label: 'Producción, Lotes & Fórmulas',
    category: 'factory',
    icon: Factory,
    desc: 'Gestión de tanques, partidas, control de calidad (viscosidad/pH) y consumo de materias primas.'
  },
  {
    key: 'color_recipes',
    label: 'Recetas de Color & Lotes',
    category: 'factory',
    icon: Palette,
    desc: 'Recetas con pigmentos que escalan a los kg o litros a producir, con número de lote y hoja imprimible.',
    badge: 'Pinturería'
  },
  {
    key: 'purchases',
    label: 'Compras & Proveedores',
    category: 'factory',
    icon: PackageSearch,
    desc: 'Pedidos de compra a proveedores de resinas, pigmentos, cargas y envases litografiados.'
  },
  {
    key: 'prices',
    label: 'Lista Oficial de Precios & SKUs',
    category: 'factory',
    icon: Tag,
    desc: 'Catálogo de látex, sintéticos y esmaltes (Agosto 2026) con exportación oficial a Excel.',
    badge: 'Excel'
  },
  {
    key: 'inventory',
    label: 'Inventario, Precios & Stock',
    category: 'factory',
    icon: Package,
    desc: 'Administración visual de productos, marcas, proveedores, stock por depósito y exportación a Excel.',
    badge: 'Excel'
  },
  {
    key: 'supplier_orders',
    label: 'Pedidos de Mercadería a Proveedores',
    category: 'factory',
    icon: Truck,
    desc: 'Armado de pedidos por proveedor, cierre de orden y envío directo por WhatsApp con PDF.',
    badge: 'WhatsApp'
  },
  {
    key: 'purchase_invoices',
    label: 'Carga de Facturas de Compra',
    category: 'factory',
    icon: Receipt,
    desc: 'Registro de facturas oficiales y comprobantes de compra a proveedores con actualización automática de stock y costos.',
    badge: 'AFIP/Stock'
  },

  // Ventas & Clientes
  {
    key: 'sales',
    label: 'Ventas, Pedidos & Despachos',
    category: 'sales',
    icon: ShoppingCart,
    desc: 'Emisión de órdenes, remitos oficiales R0001, facturación ARCA/no-ARCA y entregas.'
  },
  {
    key: 'sellers',
    label: 'Vendedores de Calle & Hoja de Ruta',
    category: 'sales',
    icon: MapPin,
    desc: 'Seguimiento de preventistas en circuito comercial, paradas GPS y comisiones por venta.'
  },
  {
    key: 'customers',
    label: 'Cuentas Corrientes & Fichas Clientes',
    category: 'sales',
    icon: Users,
    desc: 'Límites de crédito, estados de cuenta corriente, cobranzas con recibos y alertas de deuda.'
  },
  {
    key: 'installments',
    label: 'Cuotas Internas & Financiación Propia',
    category: 'sales',
    icon: CreditCard,
    desc: 'Planes de cuotas de fábrica, contrato legal impreso en 2 copias y control de vencimientos.',
    badge: 'Contratos'
  },
  {
    key: 'loyalty',
    label: 'Programa de Fidelización & Puntos',
    category: 'sales',
    icon: Sparkles,
    desc: 'Acumulación de puntos (1 cada $100), canje por premios, cupones únicos y sorteos ponderados.',
    badge: 'Puntos'
  },
  {
    key: 'logistics',
    label: 'Logística & Transportes de Fábrica',
    category: 'sales',
    icon: Truck,
    desc: 'Flota propia de camiones y expresos externos para reparto a pinturerías del país.'
  },
  {
    key: 'customer_portal',
    label: 'Portal Externo de Clientes',
    category: 'sales',
    icon: ShieldCheck,
    desc: 'Ingreso directo para pinturerías y clientes con CUIT/DNI para consultar saldos y descargar facturas.'
  },

  // Tesorería & Finanzas
  {
    key: 'finances',
    label: 'Finanzas: Saldos Cobrar vs Pagar',
    category: 'finances',
    icon: Scale,
    desc: 'Conciliación integral, flujo de caja proyectado y recordatorios por WhatsApp/Email.'
  },
  {
    key: 'checks',
    label: 'Cartelera de Cheques & E-Cheqs',
    category: 'finances',
    icon: CreditCard,
    desc: 'Cartera física y digital de cheques recibidos de clientes y emitidos a proveedores.'
  },
  {
    key: 'cashboxes',
    label: 'Cajas de Dinero & Sesiones Operativas',
    category: 'finances',
    icon: Wallet,
    desc: 'Caja chica, tesorería central y cuentas bancarias con arqueos estrictos de apertura y cierre.'
  },
  {
    key: 'arca_fiscal',
    label: 'Facturación Electrónica ARCA (AFIP)',
    category: 'finances',
    icon: Building2,
    desc: 'Conexión a servidores fiscales, autorización de CAE, código QR RG 4291 y Facturas A/B.',
    badge: 'CAE/QR'
  },
  {
    key: 'accounting',
    label: 'Contabilidad & Libro IVA',
    category: 'finances',
    icon: Calculator,
    desc: 'Libro IVA Ventas, IVA Compras, retenciones y exportación de datos para Declaración F.2002.'
  },
  {
    key: 'profitability',
    label: 'Estado de Resultados & Rentabilidad',
    category: 'finances',
    icon: TrendingUp,
    desc: 'Cálculo de Costo de Mercaderías Vendidas (CMV), EBITDA y rentabilidad por línea de pintura.'
  },

  // Personal & Sistema
  {
    key: 'employees',
    label: 'Personal, Sueldos & Recibos de Haberes',
    category: 'system',
    icon: Receipt,
    desc: 'Legajos de operarios, registro de ausencias/adelantos y recibos de sueldo en 2 copias con PDF.',
    badge: 'Recibos'
  },
  {
    key: 'users',
    label: 'Usuarios del Sistema & Permisos',
    category: 'system',
    icon: UserCheck,
    desc: 'Administración de cuentas para el personal de planta, choferes, vendedores y directivos.'
  },
  {
    key: 'settings',
    label: 'Configuración General & Backups',
    category: 'system',
    icon: Settings,
    desc: 'Datos fiscales de la empresa, plantillas automáticas, backups completos y reset de fábrica.'
  }
];

const CATEGORY_HEADERS: Record<string, { title: string; color: string }> = {
  control: { title: '📊 Control & Inteligencia Operativa', color: 'border-sky-500/30 bg-sky-50/50' },
  factory: { title: '🏭 Planta Industrial & Fabricación', color: 'border-amber-500/30 bg-amber-50/50' },
  sales: { title: '🛒 Ventas, Rutas, Fidelización & Clientes', color: 'border-blue-500/30 bg-blue-50/50' },
  finances: { title: '💰 Tesorería, Finanzas & ARCA Fiscal', color: 'border-teal-500/30 bg-teal-50/50' },
  system: { title: '⚙️ Personal, Seguridad & Ajustes', color: 'border-purple-500/30 bg-purple-50/50' }
};

export const CreatorModuleControlModal: React.FC<CreatorModuleControlModalProps> = ({
  isOpen,
  onClose,
  systemModuleToggles = {},
  onToggleModule,
  onBatchToggleModules,
  onNavigateToModule,
  onChangePassword,
  onLock,
  onOpenArcaSetup,
  arcaReady
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isModuleActive = (key: ModuleKey): boolean => {
    // If not explicitly set to false, default is true (active)
    return systemModuleToggles[key] !== false;
  };

  const activeCount = ALL_MODULES_METADATA.filter(m => isModuleActive(m.key)).length;
  const totalCount = ALL_MODULES_METADATA.length;

  const handleToggle = async (key: ModuleKey) => {
    const nextState = !isModuleActive(key);
    setIsUpdating(true);
    try {
      await onToggleModule(key, nextState);
      showToast(`Módulo "${ALL_MODULES_METADATA.find(m => m.key === key)?.label}" ${nextState ? 'activado' : 'desactivado'}.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActivateAll = async () => {
    setIsUpdating(true);
    try {
      const updates: Partial<Record<ModuleKey, boolean>> = {};
      ALL_MODULES_METADATA.forEach(m => {
        updates[m.key] = true;
      });
      await onBatchToggleModules(updates);
      showToast('¡Todos los módulos han sido ACTIVADOS en vivo!');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivateNonEssential = async () => {
    if (!window.confirm('¿Confirmas que deseas desactivar los módulos operativos para los usuarios normales? (Escritorio y Control permanecerán activos para navegación).')) {
      return;
    }
    setIsUpdating(true);
    try {
      const updates: Partial<Record<ModuleKey, boolean>> = {};
      ALL_MODULES_METADATA.forEach(m => {
        // Keep desktop and settings active, disable the rest
        if (m.key === 'desktop' || m.key === 'settings') {
          updates[m.key] = true;
        } else {
          updates[m.key] = false;
        }
      });
      await onBatchToggleModules(updates);
      showToast('Módulos desactivados para usuarios normales.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Perfiles de negocio: dejan el sistema listo según el tipo de cliente
  const BUSINESS_PROFILES: {
    id: string;
    label: string;
    desc: string;
    icon: React.ElementType;
    off: ModuleKey[];
    tone: string;
  }[] = [
    {
      id: 'ferreteria',
      label: 'Ferretería',
      desc: 'Sin producción ni recetas de color',
      icon: Hammer,
      off: ['production', 'color_recipes'],
      tone: 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
    },
    {
      id: 'pintureria',
      label: 'Pinturería (venta + tintométrico)',
      desc: 'Recetas de color sí, planta industrial no',
      icon: PaintBucket,
      off: ['production'],
      tone: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-900 hover:bg-fuchsia-100'
    },
    {
      id: 'fabrica',
      label: 'Fábrica de pintura',
      desc: 'Producción, fórmulas, recetas y lotes',
      icon: Factory,
      off: [],
      tone: 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
    }
  ];

  const currentProfileId = BUSINESS_PROFILES.find(p =>
    ALL_MODULES_METADATA.every(m => isModuleActive(m.key) === !p.off.includes(m.key))
  )?.id;

  const handleApplyProfile = async (profileId: string) => {
    const profile = BUSINESS_PROFILES.find(p => p.id === profileId);
    if (!profile) return;
    if (!window.confirm(`¿Aplicar el perfil "${profile.label}"? Se activan todos los módulos excepto: ${profile.off.length ? profile.off.map(k => ALL_MODULES_METADATA.find(m => m.key === k)?.label).join(', ') : 'ninguno'}.`)) {
      return;
    }
    setIsUpdating(true);
    try {
      const updates: Partial<Record<ModuleKey, boolean>> = {};
      ALL_MODULES_METADATA.forEach(m => {
        updates[m.key] = !profile.off.includes(m.key);
      });
      await onBatchToggleModules(updates);
      showToast(`Perfil "${profile.label}" aplicado.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredModules = ALL_MODULES_METADATA.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 relative">
          {/* Subtle top rainbow strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            <div className="flex-1 bg-[#4b0082]"></div>
            <div className="flex-1 bg-[#003399]"></div>
            <div className="flex-1 bg-[#0099cc]"></div>
            <div className="flex-1 bg-[#33cc33]"></div>
            <div className="flex-1 bg-[#f5c800]"></div>
            <div className="flex-1 bg-[#ff7800]"></div>
            <div className="flex-1 bg-[#d31627]"></div>
          </div>

          <div className="flex items-start justify-between gap-4 mt-2">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/30 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                    👑 Usuario Creador & Dueño Absoluto
                  </span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Sincronización Firestore
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                  Control Maestro de Activación de Módulos
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium">
                  Activa o desactiva cualquier sección del ERP. Los cambios tienen impacto inmediato en la visibilidad para todos los usuarios.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenArcaSetup && (
                <button
                  onClick={onOpenArcaSetup}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${arcaReady ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200' : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200'}`}
                  title="Configurar facturación electrónica ARCA"
                >
                  <ReceiptIcon className="w-4 h-4" /> ARCA {arcaReady ? '✓' : '!'}
                </button>
              )}
              {onChangePassword && (
                <button
                  onClick={onChangePassword}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors"
                  title="Cambiar contraseña del Creador"
                >
                  <KeyRound className="w-4 h-4" /> Contraseña
                </button>
              )}
              {onLock && (
                <button
                  onClick={onLock}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors"
                  title="Bloquear y cerrar"
                >
                  <Lock className="w-4 h-4" /> Bloquear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats & Bulk Actions Bar */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs font-semibold text-slate-300">Estado global:</span>
              <span className="text-sm font-black text-white font-mono">
                {activeCount} de {totalCount} Activos
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeCount === totalCount ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/30 text-amber-300'
              }`}>
                {activeCount === totalCount ? '100% Operativo' : `${totalCount - activeCount} Desactivados`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleActivateAll}
                disabled={isUpdating}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Activar Todos</span>
              </button>

              <button
                type="button"
                onClick={handleDeactivateNonEssential}
                disabled={isUpdating}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-rose-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Power className="w-4 h-4 text-rose-400" />
                <span>Desactivar Todos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top-2">
            <span>✨ {toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-indigo-200 hover:text-white">✕</button>
          </div>
        )}

        {/* Perfiles de negocio */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Perfil de negocio · configuración rápida para vender el sistema
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {BUSINESS_PROFILES.map(p => {
              const Icon = p.icon;
              const active = currentProfileId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleApplyProfile(p.id)}
                  className={`text-left p-3 rounded-2xl border transition-colors disabled:opacity-50 ${p.tone} ${active ? 'ring-2 ring-indigo-500' : ''}`}
                >
                  <div className="flex items-center gap-2 font-extrabold text-sm">
                    <Icon className="w-4 h-4" /> {p.label}
                    {active && <span className="ml-auto text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">ACTUAL</span>}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-80">{p.desc}</div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Después podés afinar módulo por módulo abajo. Como creador seguís viendo todo; los usuarios del cliente solo ven lo activo.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar módulo por nombre..."
              className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos ({ALL_MODULES_METADATA.length})
            </button>
            <button
              onClick={() => setSelectedCategory('control')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedCategory === 'control'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Control
            </button>
            <button
              onClick={() => setSelectedCategory('factory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedCategory === 'factory'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Planta
            </button>
            <button
              onClick={() => setSelectedCategory('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedCategory === 'sales'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Ventas
            </button>
            <button
              onClick={() => setSelectedCategory('finances')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedCategory === 'finances'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Finanzas
            </button>
            <button
              onClick={() => setSelectedCategory('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                selectedCategory === 'system'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Sistema
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Creator Bypass Rule Banner */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-900">
              <strong className="font-extrabold block mb-0.5">Regla de Super Administrador (Creador):</strong>
              Los módulos desactivados aquí quedan <span className="font-bold underline">ocultos e inaccesibles</span> para el personal general (operarios, vendedores, choferes y administradores). Sin embargo, tu usuario <strong>Creador</strong> mantendrá acceso permanente de prueba y auditoría sobre todos ellos.
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredModules.map(module => {
              const active = isModuleActive(module.key);
              const Icon = module.icon;

              return (
                <div
                  key={module.key}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    active 
                      ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' 
                      : 'bg-slate-50/80 border-dashed border-slate-300 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        active 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                            {module.label}
                          </h4>
                          {module.badge && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {module.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {module.desc}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => handleToggle(module.key)}
                        disabled={isUpdating}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          active ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        active ? 'text-emerald-700' : 'text-slate-400'
                      }`}>
                        {active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom status info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      {active ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-800 font-semibold">Visible en menú de usuarios</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-700 font-semibold">Oculto y bloqueado a personal</span>
                        </>
                      )}
                    </div>

                    {onNavigateToModule && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToModule(module.key);
                          onClose();
                        }}
                        className="text-indigo-600 hover:text-indigo-900 font-bold hover:underline"
                      >
                        Abrir módulo →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-left">
            Configuración guardada en colección <code className="font-mono text-slate-700 font-bold">company_config/main_config</code>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-xs"
          >
            Finalizar y Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
