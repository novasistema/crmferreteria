import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  ChevronDown,
  Search,
  Bell,
  LogOut,
  UserCheck,
  Sliders,
  Crown,
  Compass,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Boxes,
  Truck,
  User,
  Settings,
  ShieldCheck,
  Building2,
  ExternalLink,
  Tag,
  Factory,
  Package,
  Layers,
  Menu,
  X,
  SlidersHorizontal,
  Printer,
  ArrowLeftRight,
  FileDown,
  TrendingUp,
  Landmark,
  ShoppingCart,
  BarChart3,
  Sparkles,
  Receipt,
  Smartphone,
  Wallet,
  CreditCard,
  FileSpreadsheet,
  Award,
  Globe,
  Users,
  Palette
} from 'lucide-react';
import { NotificationItem, ModuleKey, CompanyConfig, AppUser, Seller } from '../types';

interface HeaderProps {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onClearAllNotifications: () => void;
  config: CompanyConfig | null;
  portalClientTaxId: string | null;
  currentUser: AppUser | null;
  activeSellerContext?: Seller | null;
  onSetActiveSellerContext?: (seller: Seller | null) => void;
  onLogout: () => void;
  onExitPortal: () => void;
  onOpenCustomerPortalModal: () => void;
  onOpenMobileSellerApp?: () => void;
  onOpenCreatorModuleControl?: () => void;
  onOpenGlobalSearch?: () => void;
  activeModulesCount?: number;
}

type DropdownKey = 'desktop' | 'sales' | 'products' | 'admin' | 'settings' | 'user' | 'notifs' | null;

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  notifications,
  onMarkNotificationRead,
  onClearAllNotifications,
  config,
  portalClientTaxId,
  currentUser,
  activeSellerContext,
  onSetActiveSellerContext,
  onLogout,
  onExitPortal,
  onOpenCustomerPortalModal,
  onOpenMobileSellerApp,
  onOpenCreatorModuleControl,
  onOpenGlobalSearch,
  activeModulesCount
}) => {
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (key: DropdownKey) => {
    setActiveDropdown(prev => prev === key ? null : key);
  };

  // Módulos de planta: se muestran según el perfil del Control Maestro (el creador ve todo)
  const isCreatorUser = currentUser?.role === 'creador';
  const isModuleOn = (k: ModuleKey) => config?.systemModuleToggles?.[k] !== false;
  const factoryMenuItems = ([
    { key: 'production' as ModuleKey, label: 'Producción & Fórmulas', icon: Factory },
    { key: 'color_recipes' as ModuleKey, label: 'Recetas de Color', icon: Palette }
  ]).filter(it => isCreatorUser || isModuleOn(it.key));

  const handleNavigate = (mod: ModuleKey) => {
    setActiveModule(mod);
    setActiveDropdown(null);
  };

  const brandLogo = config?.logoUrl || '/assets/aistudio/colorear-500px_0158e3cb.webp';
  const brandTradeName = config?.tradeName || config?.companyName || 'Colorear Pinturas';
  const brandLegalName = config?.companyName || 'Colorear Pinturas S.R.L.';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 select-none shadow-md" ref={dropdownRef}>
      {/* Orange accent indicator top hairline */}
      <div className="h-0.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 w-full"></div>

      <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* LEFT ZONE: Logo corporativo configurado + Menús de Navegación */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-max">
          
          {/* Mobile Menu Button (< md) */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Abrir menú de módulos"
          >
            {isMobileNavOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo Corporativo Configurado (Sincronizado con Inicio y Configuración) */}
          <div 
            onClick={() => handleNavigate('desktop')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            title={`${brandTradeName} - Ir al Escritorio`}
          >
            <div className="h-9 px-2.5 py-1 bg-white rounded-lg flex items-center justify-center shadow-md shadow-black/30 border border-slate-700/80 group-hover:border-orange-500/70 group-hover:scale-105 transition-all">
              {brandLogo ? (
                <img 
                  src={brandLogo} 
                  alt={brandTradeName} 
                  className="h-6 sm:h-7 w-auto max-w-[130px] object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-6 h-6 rounded bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                  {brandTradeName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-tight group-hover:text-orange-400 transition-colors">
                {brandTradeName}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 leading-none truncate max-w-[170px]">
                {brandLegalName !== brandTradeName ? brandLegalName : 'ERP Industrial'}
              </span>
            </div>
          </div>

          {/* Menús desplegables con chevrons (Formato unificado con iconos y tema oscuro corporativo) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 text-xs font-semibold text-slate-200">
            
            {/* 1. Menú Escritorio */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('desktop')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeDropdown === 'desktop' || ['desktop', 'reports', 'ai_assistant'].includes(activeModule)
                    ? 'bg-slate-800 text-orange-400 font-bold'
                    : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                }`}
              >
                <Compass className="w-4 h-4 text-orange-500" />
                <span>Escritorio</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'desktop' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'desktop' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-[#141d2b] border border-slate-700/80 rounded-xl shadow-2xl py-1 text-slate-200 z-50 text-xs animate-in fade-in slide-in-from-top-1 font-medium">
                  <button
                    onClick={() => handleNavigate('desktop')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'desktop'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Compass className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'desktop' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Accesos Directos</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Principal
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('reports')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'reports'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BarChart3 className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'reports' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Dashboard con Barras</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Gráficos
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('ai_assistant')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'ai_assistant'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'ai_assistant' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Asistente del Sistema</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Consultas
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. Menú Ventas */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('sales')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeDropdown === 'sales' || ['sales', 'customers', 'sellers', 'arca_fiscal'].includes(activeModule)
                    ? 'bg-slate-800 text-orange-400 font-bold'
                    : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                }`}
              >
                <ShoppingCart className="w-4 h-4 text-orange-500" />
                <span>Ventas</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'sales' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'sales' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-[#141d2b] border border-slate-700/80 rounded-xl shadow-2xl py-1 text-slate-200 z-50 text-xs animate-in fade-in slide-in-from-top-1 font-medium">
                  <button
                    onClick={() => handleNavigate('sales')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'sales'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShoppingCart className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'sales' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Ventas (POS Terminal)</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-orange-600/30 text-orange-400 border border-orange-500/30 shrink-0 font-bold">
                      F8
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('customers')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'customers'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'customers' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Cuentas Corrientes</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Saldos
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('sellers')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'sellers'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserCheck className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'sellers' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Vendedores & Hojas de Ruta</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Preventistas
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-800/80"></div>

                  <button
                    onClick={() => handleNavigate('arca_fiscal')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'arca_fiscal'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Receipt className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'arca_fiscal' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Facturación ARCA</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      CAE
                    </span>
                  </button>

                  {onOpenMobileSellerApp && (
                    <button
                      onClick={() => {
                        onOpenMobileSellerApp();
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Smartphone className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 shrink-0" />
                        <span className="truncate font-semibold">App Móvil Celular</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shrink-0 font-bold">
                        Calle
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 3. Menú Productos */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('products')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeDropdown === 'products' || [
                    'inventory', 'combos', 'faltantes', 'stock_adjustments', 
                    'mass_modification', 'warehouses', 'transfers', 'branch_orders', 
                    'import_products', 'import_stock', 'brands_categories', 'price_tags', 
                    'prices', 'update_prices', 'production', 'color_recipes'
                  ].includes(activeModule)
                    ? 'bg-slate-800 text-orange-400 font-bold'
                    : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                }`}
              >
                <Package className="w-4 h-4 text-orange-500" />
                <span>Productos</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'products' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-[#141d2b] border border-slate-700/80 rounded-xl shadow-2xl py-1 text-slate-200 z-50 text-xs animate-in fade-in slide-in-from-top-1 font-medium max-h-[85vh] overflow-y-auto">
                  {factoryMenuItems.length > 0 && (
                    <>
                      <div className="px-3.5 pt-1.5 pb-1 text-[10px] uppercase font-bold tracking-wider text-amber-400">Planta & Producción</div>
                      {factoryMenuItems.map(it => {
                        const Icon = it.icon;
                        const off = !isModuleOn(it.key);
                        return (
                          <button
                            key={it.key}
                            onClick={() => handleNavigate(it.key)}
                            className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                              activeModule === it.key
                                ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                                : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            <Icon className={`w-4 h-4 transition-colors shrink-0 ${activeModule === it.key ? 'text-orange-500' : 'text-amber-400 group-hover:text-white'}`} />
                            <span className="truncate">{it.label}</span>
                            {off && <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">OFF</span>}
                          </button>
                        );
                      })}
                      <div className="my-1 border-t border-slate-700/70" />
                    </>
                  )}
                  <button
                    onClick={() => handleNavigate('inventory')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'inventory'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Package className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'inventory' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Inventario</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('combos')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'combos'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Boxes className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'combos' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Combos</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('faltantes')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'faltantes'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'faltantes' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Faltantes</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('stock_adjustments')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'stock_adjustments'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'stock_adjustments' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Ajuste de Stock</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('mass_modification')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'mass_modification'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Layers className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'mass_modification' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Modificación Masiva</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('warehouses')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'warehouses'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Building2 className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'warehouses' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Depósitos/Sucursales</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('transfers')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'transfers'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ArrowLeftRight className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'transfers' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Transferencias</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('branch_orders')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'branch_orders'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Truck className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'branch_orders' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Pedidos Sucursal</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('import_products')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'import_products'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FileDown className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'import_products' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Importar Productos</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('import_stock')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'import_stock'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Boxes className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'import_stock' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Importar Stock</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('brands_categories')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'brands_categories'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Tag className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'brands_categories' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Marcas & Rubros</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('price_tags')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'price_tags'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Printer className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'price_tags' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Etiquetas de Precio</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('prices')}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'prices'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <DollarSign className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'prices' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="truncate">Listas de Precios</span>
                  </button>

                  <div className="my-1 border-t border-slate-800/80"></div>

                  <button
                    onClick={() => handleNavigate('update_prices')}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 transition-colors group ${
                      activeModule === 'update_prices'
                        ? 'text-orange-400 bg-orange-950/50 font-bold hover:bg-orange-950/70'
                        : 'hover:bg-slate-800 hover:text-white text-slate-200'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                    <span className="truncate">Actualizar Precios</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Menú Administración */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('admin')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeDropdown === 'admin' || [
                    'purchases', 'cashboxes', 'checks', 'finances', 
                    'accounting', 'profitability', 'employees', 
                    'installments', 'loyalty', 'logistics'
                  ].includes(activeModule)
                    ? 'bg-slate-800 text-orange-400 font-bold'
                    : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                }`}
              >
                <Landmark className="w-4 h-4 text-orange-500" />
                <span>Administración</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'admin' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'admin' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-[#141d2b] border border-slate-700/80 rounded-xl shadow-2xl py-1 text-slate-200 z-50 text-xs animate-in fade-in slide-in-from-top-1 font-medium max-h-[85vh] overflow-y-auto">
                  <button
                    onClick={() => handleNavigate('purchases')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'purchases'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Factory className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'purchases' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Compras & Proveedores</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Insumos
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('cashboxes')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'cashboxes'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Wallet className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'cashboxes' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Cajas de Dinero & Cuentas</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Arqueos
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('checks')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'checks'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CreditCard className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'checks' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Cartelera Cheques</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Cartera
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('finances')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'finances'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <DollarSign className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'finances' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Saldos Cobrar vs Pagar</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Finanzas
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-800/80"></div>

                  <button
                    onClick={() => handleNavigate('accounting')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'accounting'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'accounting' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Contabilidad & Libro IVA</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      F.2002
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('profitability')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'profitability'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TrendingUp className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'profitability' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Estado de Resultados</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Márgenes
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('employees')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'employees'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Users className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'employees' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Personal & Sueldos</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      RRHH
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('installments')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'installments'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Layers className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'installments' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Cuotas & Financiación</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Planes
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('loyalty')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'loyalty'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Award className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'loyalty' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Fidelización & Puntos</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Premios
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('logistics')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'logistics'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Truck className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'logistics' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Transportes & Logística</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Despacho
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Menú Configuración */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('settings')}
                className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                  activeDropdown === 'settings' || ['settings', 'users'].includes(activeModule)
                    ? 'bg-slate-800 text-orange-400 font-bold'
                    : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4 text-orange-500" />
                <span>Configuración</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === 'settings' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'settings' && (
                <div className="absolute left-0 mt-1.5 w-64 bg-[#141d2b] border border-slate-700/80 rounded-xl shadow-2xl py-1 text-slate-200 z-50 text-xs animate-in fade-in slide-in-from-top-1 font-medium">
                  <button
                    onClick={() => handleNavigate('settings')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'settings'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Settings className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'settings' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Configuración General</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      ARCA
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigate('users')}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group ${
                      activeModule === 'users'
                        ? 'text-orange-400 bg-orange-950/40 font-bold hover:bg-orange-950/70'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ShieldCheck className={`w-4 h-4 transition-colors shrink-0 ${activeModule === 'users' ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="truncate">Usuarios & Permisos</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-400 group-hover:text-slate-300 shrink-0">
                      Roles
                    </span>
                  </button>

                  <div className="my-1 border-t border-slate-800/80"></div>

                  {currentUser?.role === 'creador' && onOpenCreatorModuleControl && (
                    <button
                      onClick={() => {
                        onOpenCreatorModuleControl();
                        setActiveDropdown(null);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group text-purple-300 hover:bg-slate-800 hover:text-purple-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Crown className="w-4 h-4 text-purple-400 group-hover:text-purple-300 shrink-0" />
                        <span className="truncate font-semibold">Control de Módulos</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-950/60 border border-purple-500/30 text-purple-300 shrink-0 font-bold">
                        {activeModulesCount !== undefined ? `${activeModulesCount}/22` : '22'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenCustomerPortalModal();
                      setActiveDropdown(null);
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center justify-between gap-2.5 transition-colors group text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Globe className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 shrink-0" />
                      <span className="truncate font-semibold">Portal de Clientes</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 shrink-0 font-bold">
                      Web
                    </span>
                  </button>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* RIGHT ZONE: Atajo F10 Buscar + Notificaciones + Avatar de Usuario (Círculo Naranja 'A') */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Indicador de atajo de teclado: F10 Buscar */}
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs group"
            title="Buscar productos, clientes y módulos (Atajo: F10)"
          >
            <Search className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 text-orange-400 border border-slate-700 rounded">
              F10
            </kbd>
          </button>

          {/* Quick Client Portal Session indicator */}
          {portalClientTaxId && (
            <div className="hidden lg:flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 px-2.5 py-1 rounded-lg text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cliente: <strong>{portalClientTaxId}</strong></span>
              <button 
                onClick={onExitPortal}
                className="ml-1 text-[10px] text-red-400 hover:text-red-200 font-bold"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('notifs')}
              className="relative p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notificaciones del sistema"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-600 text-[9px] font-black text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {activeDropdown === 'notifs' && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl bg-[#141d2b] shadow-2xl border border-slate-700/80 py-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-orange-500" /> Notificaciones
                  </h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={onClearAllNotifications}
                      className="text-[10px] text-slate-400 hover:text-white font-semibold transition-colors"
                    >
                      Limpiar todas
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 text-xs">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No hay notificaciones pendientes.
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          onMarkNotificationRead(notif.id);
                          if (notif.actionUrl) {
                            handleNavigate(notif.actionUrl as ModuleKey);
                          }
                        }}
                        className={`p-2.5 text-left hover:bg-slate-800 transition-colors cursor-pointer flex gap-2.5 ${
                          !notif.isRead ? 'bg-orange-950/20' : ''
                        }`}
                      >
                        <div className="p-1 rounded-md bg-slate-800 shrink-0 self-start">
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white truncate text-[11px]">{notif.title}</span>
                            {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>}
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{notif.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar de Usuario: Círculo Naranja con inicial 'A' / user */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('user')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-orange-600/30 group-hover:ring-2 group-hover:ring-orange-400 transition-all">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">
                  {currentUser?.name || 'Administrador'}
                </span>
                <span className="text-[10px] text-orange-400 font-semibold leading-none">
                  {currentUser?.role === 'creador' ? '👑 Creador' : (currentUser?.roleLabel || 'Admin')}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>

            {activeDropdown === 'user' && (
              <div className="absolute right-0 mt-2 w-60 bg-[#141d2b] rounded-xl shadow-2xl border border-slate-700/80 py-1.5 text-slate-200 z-50 text-xs animate-in fade-in slide-in-from-top-1 divide-y divide-slate-800/80">
                <div className="px-3.5 py-2">
                  <div className="font-black text-white">{currentUser?.name || 'Administrador'}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{currentUser?.email || 'admin@novasystems.ar'}</div>
                  <div className="text-[10px] text-orange-400 font-bold mt-0.5">
                    {currentUser?.role === 'creador' ? 'Creador Maestro del ERP' : (currentUser?.roleLabel || 'Administrador')}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => handleNavigate('settings')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Configuración del Sistema</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('users')}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Mi Perfil & Usuarios</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-950/40 text-red-400 hover:text-red-300 font-bold flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (< md) */}
      {isMobileNavOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 text-xs divide-y divide-slate-800 animate-in slide-in-from-top-2">
          {/* Escritorio */}
          <div className="py-2 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Escritorio</span>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                onClick={() => { handleNavigate('desktop'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Accesos Directos
              </button>
              <button
                onClick={() => { handleNavigate('reports'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Dashboard con Barras
              </button>
              <button
                onClick={() => { handleNavigate('ai_assistant'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Asistente del Sistema
              </button>
            </div>
          </div>

          {/* Ventas */}
          <div className="py-2 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Ventas</span>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                onClick={() => { handleNavigate('sales'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 font-bold text-orange-400"
              >
                Ventas (POS Terminal)
              </button>
              <button
                onClick={() => { handleNavigate('customers'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Cuentas Corrientes
              </button>
              <button
                onClick={() => { handleNavigate('sellers'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Vendedores & Rutas
              </button>
              <button
                onClick={() => { handleNavigate('arca_fiscal'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Facturación ARCA
              </button>
            </div>
          </div>

          {/* Productos */}
          <div className="py-2 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Productos</span>
            <div className="grid grid-cols-2 gap-1 pt-1">
              {factoryMenuItems.map(it => (
                <button
                  key={it.key}
                  onClick={() => { handleNavigate(it.key); setIsMobileNavOpen(false); }}
                  className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-amber-300 font-semibold"
                >
                  {it.label}{!isModuleOn(it.key) ? ' (off)' : ''}
                </button>
              ))}
              <button
                onClick={() => { handleNavigate('inventory'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Inventario
              </button>
              <button
                onClick={() => { handleNavigate('combos'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Combos / Packs
              </button>
              <button
                onClick={() => { handleNavigate('faltantes'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Faltantes & Stock
              </button>
              <button
                onClick={() => { handleNavigate('stock_adjustments'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Ajuste de Stock
              </button>
              <button
                onClick={() => { handleNavigate('mass_modification'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Modificación Masiva
              </button>
              <button
                onClick={() => { handleNavigate('warehouses'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Depósitos / Sucursales
              </button>
              <button
                onClick={() => { handleNavigate('transfers'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Transferencias
              </button>
              <button
                onClick={() => { handleNavigate('branch_orders'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Pedidos Sucursal
              </button>
              <button
                onClick={() => { handleNavigate('import_products'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Importar Productos
              </button>
              <button
                onClick={() => { handleNavigate('import_stock'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Importar Stock
              </button>
              <button
                onClick={() => { handleNavigate('brands_categories'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Marcas & Rubros
              </button>
              <button
                onClick={() => { handleNavigate('price_tags'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Etiquetas de Precio
              </button>
              <button
                onClick={() => { handleNavigate('prices'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Listas de Precios
              </button>
              <button
                onClick={() => { handleNavigate('update_prices'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded bg-orange-950/40 text-orange-400 font-bold hover:bg-orange-900/60"
              >
                Actualizar Precios
              </button>
            </div>
          </div>

          {/* Administración */}
          <div className="py-2 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Administración</span>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                onClick={() => { handleNavigate('purchases'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Compras & Insumos
              </button>
              <button
                onClick={() => { handleNavigate('cashboxes'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Cajas & Cuentas
              </button>
              <button
                onClick={() => { handleNavigate('checks'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Cheques & E-Cheqs
              </button>
              <button
                onClick={() => { handleNavigate('finances'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Finanzas
              </button>
              <button
                onClick={() => { handleNavigate('accounting'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Contabilidad & IVA
              </button>
              <button
                onClick={() => { handleNavigate('employees'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Sueldos & Personal
              </button>
            </div>
          </div>

          {/* Configuración */}
          <div className="py-2 space-y-1">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Configuración</span>
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                onClick={() => { handleNavigate('settings'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Configuración General
              </button>
              <button
                onClick={() => { handleNavigate('users'); setIsMobileNavOpen(false); }}
                className="text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200"
              >
                Usuarios & Roles
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
