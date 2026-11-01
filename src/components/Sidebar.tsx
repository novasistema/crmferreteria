import React, { useState, useMemo } from 'react';
import { 
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
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Layers,
  MapPin,
  Bot,
  Building2,
  Sliders,
  ShieldAlert,
  Package,
  Palette
} from 'lucide-react';
import { ModuleKey, UserRole } from '../types';

interface SidebarProps {
  activeModule: ModuleKey;
  setActiveModule: (module: ModuleKey) => void;
  productionActiveCount: number;
  pendingDispatchCount: number;
  pendingPaymentCount: number;
  urgentChecksCount?: number;
  allowedModules?: ModuleKey[];
  systemModuleToggles?: Partial<Record<ModuleKey, boolean>>;
  currentUserRole?: UserRole;
  onOpenCreatorModuleControl?: () => void;
}

interface MenuItem {
  key: ModuleKey;
  label: string;
  icon: React.ElementType;
  badge?: string | null;
  badgeColor?: string;
  desc: string;
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  accentColor: string;
  badgeCount?: number;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  productionActiveCount,
  pendingDispatchCount,
  pendingPaymentCount,
  urgentChecksCount = 0,
  allowedModules,
  systemModuleToggles = {},
  currentUserRole,
  onOpenCreatorModuleControl
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  
  // Requirement: ALL groupings always start collapsed / contracted by default!
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    return {
      general: true,
      factory: true,
      sales_crm: true,
      finances_treasury: true,
      staff_system: true
    };
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Structured Functional Groups
  const groups: MenuGroup[] = useMemo(() => [
    {
      id: 'general',
      title: 'Panel de Control',
      icon: LayoutDashboard,
      accentColor: 'text-sky-400',
      items: [
        {
          key: 'desktop',
          label: 'Escritorio & KPIs',
          icon: LayoutDashboard,
          badge: null,
          desc: 'Accesos rápidos y alertas del día'
        },
        {
          key: 'reports',
          label: 'Dashboard con Barras',
          icon: BarChart3,
          badge: 'Gráficos',
          badgeColor: 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50',
          desc: 'Ventas, producción y stock en barra'
        },
        {
          key: 'ai_assistant',
          label: 'Asistente Industrial IA',
          icon: Bot,
          badge: 'Gemini',
          badgeColor: 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50',
          desc: 'Faltantes químicos, compras y análisis'
        }
      ]
    },
    {
      id: 'factory',
      title: 'Planta & Producción',
      icon: Factory,
      accentColor: 'text-amber-400',
      badgeCount: productionActiveCount,
      items: [
        {
          key: 'production',
          label: 'Producción & Fórmulas',
          icon: Factory,
          badge: productionActiveCount > 0 ? `${productionActiveCount}` : null,
          badgeColor: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
          desc: 'Lotes de pintura y materias primas'
        },
        {
          key: 'color_recipes',
          label: 'Recetas de Color',
          icon: Palette,
          badge: null,
          badgeColor: 'bg-fuchsia-900/60 text-fuchsia-300 border border-fuchsia-700/50',
          desc: 'Pigmentos por kg/litro y número de lote'
        },
        {
          key: 'inventory',
          label: 'Inventario & Precios',
          icon: Package,
          badge: 'Excel',
          badgeColor: 'bg-orange-900/60 text-orange-300 border border-orange-700/50',
          desc: 'Código, descripción, marca, stock y precios'
        },
        {
          key: 'supplier_orders',
          label: 'Pedidos a Proveedores',
          icon: Truck,
          badge: 'WhatsApp',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'Armado de pedidos y envío por WhatsApp'
        },
        {
          key: 'purchase_invoices',
          label: 'Facturas de Compra',
          icon: Receipt,
          badge: 'AFIP/Stock',
          badgeColor: 'bg-sky-900/60 text-sky-300 border border-sky-700/50',
          desc: 'Carga de facturas de proveedor y stock'
        },
        {
          key: 'purchases',
          label: 'Compras & Proveedores',
          icon: PackageSearch,
          badge: null,
          desc: 'Insumos químicos, resinas y envases'
        },
        {
          key: 'prices',
          label: 'Lista de Precios & SKUs',
          icon: Tag,
          badge: 'Excel/PDF',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'Catálogo de látex y esmaltes 2026'
        }
      ]
    },
    {
      id: 'sales_crm',
      title: 'Ventas & Clientes',
      icon: ShoppingCart,
      accentColor: 'text-blue-400',
      badgeCount: pendingDispatchCount + (pendingPaymentCount > 0 ? pendingPaymentCount : 0),
      items: [
        {
          key: 'sales',
          label: 'Ventas & Despachos',
          icon: ShoppingCart,
          badge: pendingDispatchCount > 0 ? `${pendingDispatchCount}` : null,
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'Pedidos, remitos y facturación'
        },
        {
          key: 'sellers',
          label: 'Vendedores & Hoja de Ruta',
          icon: MapPin,
          badge: 'Calle/Visitas',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'Rutas de calle, visitas y comisiones'
        },
        {
          key: 'customers',
          label: 'Cuentas Corrientes',
          icon: Users,
          badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} alertas` : null,
          badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/50',
          desc: 'Fichas, deuda y recibos de pago'
        },
        {
          key: 'installments',
          label: 'Cuotas Internas & Financiación',
          icon: CreditCard,
          badge: '2 Copias',
          badgeColor: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
          desc: 'Planes en cuotas, contratos y cobros'
        },
        {
          key: 'loyalty',
          label: 'Fidelización & Puntos',
          icon: Sparkles,
          badge: 'Puntos',
          badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
          desc: 'Premios, canjes y sorteos ponderados'
        },
        {
          key: 'logistics',
          label: 'Transportes & Logística',
          icon: Truck,
          badge: null,
          desc: 'Expresos y camiones de fábrica'
        },
        {
          key: 'customer_portal',
          label: 'Portal de Clientes',
          icon: ShieldCheck,
          badge: 'DNI/CUIT',
          badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
          desc: 'Autogestión externa de comprobantes'
        }
      ]
    },
    {
      id: 'finances_treasury',
      title: 'Tesorería & Finanzas',
      icon: Wallet,
      accentColor: 'text-teal-400',
      badgeCount: urgentChecksCount,
      items: [
        {
          key: 'finances',
          label: 'Saldos Cobrar vs Pagar',
          icon: Scale,
          badge: 'WhatsApp/Email',
          badgeColor: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
          desc: 'Recordatorios a clientes y deuda'
        },
        {
          key: 'checks',
          label: 'Cartelera Cheques & E-Cheqs',
          icon: CreditCard,
          badge: urgentChecksCount > 0 ? `${urgentChecksCount} por vencer` : 'Vencimientos',
          badgeColor: urgentChecksCount > 0 
            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse font-bold' 
            : 'bg-amber-900/50 text-amber-300 border border-amber-700/40',
          desc: 'Cartera, alertas y endosos'
        },
        {
          key: 'cashboxes',
          label: 'Cajas de Dinero & Cuentas',
          icon: Wallet,
          badge: 'Tesorería',
          badgeColor: 'bg-teal-900/60 text-teal-300 border border-teal-700/50',
          desc: 'Efectivo, bancos y transferencias'
        },
        {
          key: 'arca_fiscal',
          label: 'Facturación Electrónica ARCA',
          icon: Building2,
          badge: 'CAE / QR',
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'Facturas A/B, CAE y verificación oficial'
        },
        {
          key: 'accounting',
          label: 'Contabilidad & Libro IVA',
          icon: Calculator,
          badge: 'ARCA',
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'IVA Ventas, Compras y F.2002'
        },
        {
          key: 'tax_accountant',
          label: 'Contador Interno',
          icon: Calculator,
          badge: 'IVA · IIBB',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'Cuánto pagar de IVA e IIBB, VEP y vencimientos'
        },
        {
          key: 'profitability',
          label: 'Estado de Resultados',
          icon: TrendingUp,
          badge: 'Rentabilidad',
          badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
          desc: 'CMV, EBITDA y margen por línea'
        }
      ]
    },
    {
      id: 'staff_system',
      title: 'Personal & Sistema',
      icon: Settings,
      accentColor: 'text-violet-400',
      items: [
        {
          key: 'employees',
          label: 'Personal, Sueldos & Recibos',
          icon: Receipt,
          badge: 'Duplicado',
          badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/50',
          desc: 'Legajos, adelantos y haberes'
        },
        {
          key: 'users',
          label: 'Usuarios & Permisos',
          icon: UserCheck,
          badge: 'Personal',
          badgeColor: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
          desc: 'Operarios, choferes y admin'
        },
        {
          key: 'settings',
          label: 'Configuración & Backup',
          icon: Settings,
          badge: 'Fábrica',
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
          desc: 'Copias automáticas y reset a cero'
        }
      ]
    }
  ], [productionActiveCount, pendingDispatchCount, pendingPaymentCount, urgentChecksCount]);

  // Filter items if user types in search, if role-based allowedModules is provided, or if systemModuleToggles disables it
  const filteredGroups = useMemo(() => {
    const query = searchFilter.toLowerCase().trim();
    return groups
      .map(group => {
        // Step 1: Filter by Creator's Global System Module Toggles (only non-creator users have modules hidden)
        const activeSystemItems = group.items.filter(item => {
          if (currentUserRole === 'creador') {
            return true; // Creator always has full visibility
          }
          // If explicitly set to false, regular users cannot see or access it
          return systemModuleToggles[item.key] !== false;
        });

        // Step 2: Filter by RBAC allowedModules (if provided and non-empty)
        const permittedItems = activeSystemItems.filter(item => {
          if (allowedModules && allowedModules.length > 0) {
            return allowedModules.includes(item.key);
          }
          return true;
        });

        // Step 3: Filter by text search query
        const matchingItems = query
          ? permittedItems.filter(item => 
              item.label.toLowerCase().includes(query) ||
              item.desc.toLowerCase().includes(query) ||
              group.title.toLowerCase().includes(query)
            )
          : permittedItems;

        return {
          ...group,
          items: matchingItems
        };
      })
      .filter(group => group.items.length > 0);
  }, [groups, searchFilter, allowedModules, systemModuleToggles, currentUserRole]);

  const expandAll = () => {
    setCollapsedGroups({
      general: false,
      factory: false,
      sales_crm: false,
      finances_treasury: false,
      staff_system: false
    });
  };

  const collapseAll = () => {
    setCollapsedGroups({
      general: true,
      factory: true,
      sales_crm: true,
      finances_treasury: true,
      staff_system: true
    });
  };

  return (
    <aside 
      className="w-72 shrink-0 h-full bg-[#0a0f1d] text-slate-300 flex flex-col justify-between hidden md:flex border-r-2 border-slate-700/90 shadow-[6px_0_30px_rgba(0,0,0,0.35)] select-none z-20 relative"
      aria-label="Barra de Navegación de Módulos"
    >
      {/* Right separation groove with subtle brand accent border */}
      <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-600 via-slate-600/50 to-slate-700 pointer-events-none"></div>

      {/* Top Filter and Actions */}
      <div className="p-3 border-b border-slate-800 bg-[#080d1a] shrink-0">
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar módulo..."
            className="w-full bg-slate-900 border border-slate-700/90 rounded-lg pl-8 pr-6 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-600 shadow-xs shadow-orange-500"></span>
            Menú de Módulos
          </span>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button
              onClick={expandAll}
              title="Abrir todas las secciones"
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              Abrir
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={collapseAll}
              title="Contraer todas las secciones"
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors font-medium text-amber-300/80"
            >
              Contraer
            </button>
          </div>
        </div>
      </div>

      {/* Grouped Modules List - Independent scroll container */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2.5 custom-scrollbar">
        {filteredGroups.map(group => {
          // If searching, keep groups open. Otherwise, respect user contracted state.
          const isCollapsed = !searchFilter && Boolean(collapsedGroups[group.id]);
          const GroupIcon = group.icon;
          
          // Check if the currently active module is inside this group
          const activeItemInGroup = group.items.find(it => it.key === activeModule);

          return (
            <div 
              key={group.id} 
              className={`rounded-xl transition-all duration-200 border ${
                activeItemInGroup 
                  ? 'border-red-500/40 bg-slate-900/90 shadow-md shadow-black/20' 
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              {/* Group Header Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full px-2.5 py-2.5 flex items-center justify-between text-left group rounded-xl transition-colors cursor-pointer ${
                  activeItemInGroup && isCollapsed ? 'bg-red-950/20' : 'hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 shrink-0 ${group.accentColor}`}>
                    <GroupIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-200 truncate block">
                      {group.title}
                    </span>
                    {/* When collapsed and contains active module, inform the user */}
                    {isCollapsed && activeItemInGroup && (
                      <span className="text-[10px] text-red-400 font-bold truncate block">
                        • {activeItemInGroup.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {/* Badge count if any inside this group */}
                  {group.badgeCount !== undefined && group.badgeCount > 0 && isCollapsed && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500/25 text-red-400 border border-red-500/40 animate-pulse">
                      {group.badgeCount}
                    </span>
                  )}
                  <div className="p-0.5 rounded text-slate-400 group-hover:text-white transition-colors">
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-200" />
                    )}
                  </div>
                </div>
              </button>

              {/* Group Items (Revealed upon clicking) */}
              {!isCollapsed && (
                <div className="p-1.5 pt-0.5 space-y-1 border-t border-slate-800/60 mt-0.5">
                  {group.items.map(item => {
                    const ItemIcon = item.icon;
                    const isActive = activeModule === item.key;

                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveModule(item.key)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all group ${
                          isActive
                            ? 'bg-orange-600 text-white shadow-md font-bold'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ItemIcon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`} />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs truncate block font-bold leading-tight">
                              {item.label}
                            </span>
                            <span className={`text-[10px] truncate block leading-tight mt-0.5 ${
                              isActive ? 'text-orange-100' : 'text-slate-400 group-hover:text-slate-300'
                            }`}>
                              {item.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                          {currentUserRole === 'creador' && systemModuleToggles[item.key] === false && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80" title="Módulo desactivado para usuarios regulares">
                              Oculto
                            </span>
                          )}

                          {item.badge && (
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                              isActive 
                                ? 'bg-white/20 text-white border border-white/30' 
                                : item.badgeColor || 'bg-slate-800 text-slate-200 border border-slate-700'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-400">
            No se encontraron módulos con "{searchFilter}"
          </div>
        )}
      </div>

      {/* Creator Direct Control Button */}
      {currentUserRole === 'creador' && onOpenCreatorModuleControl && (
        <div className="p-2.5 border-t border-indigo-900/60 bg-gradient-to-b from-indigo-950/50 to-slate-900/90 shrink-0">
          <button
            type="button"
            onClick={onOpenCreatorModuleControl}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-black flex items-center justify-between shadow-lg shadow-indigo-950/50 transition-all active:scale-[0.98] border border-indigo-400/30 group"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-200 group-hover:rotate-90 transition-transform duration-300" />
              <span>Control Maestro</span>
            </div>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono font-bold">
              👑 Creador
            </span>
          </button>
        </div>
      )}

      {/* Bottom Factory Info Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070b16] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Planta Pilar Conectada</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-mono border border-slate-700/60">
            Agosto 2026
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
          <span>Colorear Pinturas S.R.L.</span>
          <span className="text-[9px] text-slate-400 font-mono">22 Módulos ERP</span>
        </div>
      </div>
    </aside>
  );
};
