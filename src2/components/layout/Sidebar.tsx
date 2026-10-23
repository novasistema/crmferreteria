import React, { useState } from 'react';
import { useApp, AppModule } from '../../context/AppContext';
import {
  ShoppingCart,
  ReceiptText,
  Boxes,
  Layers,
  Users,
  Truck,
  DollarSign,
  CalendarDays,
  Gift,
  FileCheck,
  PackageCheck,
  Wrench,
  UserCheck,
  Globe,
  Sparkles,
  Settings,
  ChevronRight,
  ChevronDown,
  Scale,
  ArrowUpDown,
  RotateCcw,
  TrendingDown,
  BookOpen,
  FileText,
  Printer,
  ShoppingBag,
  Heart,
  Ticket,
  Cake,
  Dices,
  Tag,
  Store,
  Image,
  Building2,
  CreditCard,
  AlertTriangle,
  Sliders,
  Building,
  ArrowLeftRight,
  Download,
  PackagePlus,
  Tags,
  Factory,
  TrendingUp,
  Landmark,
  Receipt,
  Calculator,
  Brain,
  FileSpreadsheet,
  Wallet,
  Smartphone,
  ListTodo,
  Plug,
  Megaphone,
  Target,
  MessageSquare,
  Headphones,
  Database,
  HardDrive,
  MessagesSquare,
  HelpCircle,
  LayoutDashboard,
} from 'lucide-react';

interface NavItem {
  id: AppModule;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, store } = useApp();

  const activeSession = store.cashSessions.find((s) => s.status === 'open');
  const lowStockCount = store.products.filter((p) => p.stock <= p.stockMin).length;
  const pendingServiceOrders = store.serviceOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const sections: NavSection[] = [
    {
      title: 'INICIO',
      items: [
        { id: 'escritorio', label: 'Escritorio', icon: LayoutDashboard },
      ],
    },
    {
      title: 'VENTAS',
      items: [
        { id: 'pos', label: 'Ventas (POS)', icon: ShoppingCart },
        { id: 'sales_history', label: 'Historial de Ventas', icon: ReceiptText },
        { id: 'remitos', label: 'Remitos', icon: FileText },
        { id: 'remitos_editor', label: 'Diseño de Remitos', icon: FileText },
        { id: 'tickets_editor', label: 'Diseño de Tickets', icon: Printer },
        { id: 'quotes', label: 'Cotizaciones', icon: FileCheck },
        { id: 'receipts_vta', label: 'Comprobantes', icon: Printer },
        { id: 'orders_vta', label: 'Pedidos', icon: ShoppingBag },
        { id: 'clients_ctacte', label: 'Clientes & Cta. Cte.', icon: Users },
        { id: 'loyalty_club', label: 'Fidelización / Puntos', icon: Gift },
        { id: 'coupons_offers', label: 'Cupones y Ofertas', icon: Ticket },
        { id: 'birthdays', label: 'Cumpleaños', icon: Cake },
        { id: 'raffles', label: 'Sorteos', icon: Dices },
        { id: 'returns', label: 'Devoluciones', icon: RotateCcw },
        { id: 'promotions', label: 'Ofertas y Promociones', icon: Tag },
        { id: 'ecommerce_catalog', label: 'E-Commerce (Tienda)', icon: Globe },
        { id: 'mercadolibre', label: 'MercadoLibre', icon: Store },
        {
          id: 'service_workshop',
          label: 'Servicio Técnico',
          icon: Wrench,
          badge: pendingServiceOrders > 0 ? `${pendingServiceOrders}` : undefined,
        },
      ],
    },
    {
      title: 'DISTRIBUIDORA',
      items: [
        { id: 'wholesale_orders', label: 'Pedidos Mayorista', icon: PackageCheck },
        { id: 'wholesale_shipping', label: 'Gestión de Envíos', icon: Truck },
        { id: 'wholesale_portal', label: 'Portal Mayorista', icon: Store },
        { id: 'wholesale_store', label: 'Tienda Mayorista', icon: ShoppingBag },
        { id: 'visual_catalog', label: 'Catálogo Visual', icon: Image },
      ],
    },
    {
      title: 'PRODUCCIÓN',
      items: [
        { id: 'produccion', label: 'Fábrica & Recetas de Pintura', icon: Factory },
      ],
    },
    {
      title: 'COMPRAS',
      items: [
        { id: 'purchase_orders', label: 'Pedidos de Compra', icon: ReceiptText },
        { id: 'suppliers', label: 'Proveedores', icon: Building2 },
        { id: 'purchases_ai', label: 'Compras & IA', icon: CreditCard },
        { id: 'purchase_receipts', label: 'Comprobantes', icon: FileText },
        { id: 'purchases_automation', label: 'Automatización', icon: Globe },
      ],
    },
    {
      title: 'PRODUCTOS',
      items: [
        {
          id: 'inventory',
          label: 'Inventario de Productos',
          icon: Boxes,
          badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
        },
        { id: 'combos', label: 'Combos & Promos', icon: Layers },
        { id: 'missing_stock', label: 'Faltantes', icon: AlertTriangle },
        { id: 'stock_adjust', label: 'Ajuste de Stock', icon: Sliders },
        { id: 'mass_modification', label: 'Modificación Masiva', icon: Layers },
        { id: 'warehouses_branches', label: 'Depósitos / Sucursales', icon: Building },
        { id: 'stock_transfers', label: 'Transferencias', icon: ArrowLeftRight },
        { id: 'branch_orders', label: 'Pedidos Sucursal', icon: Truck },
        { id: 'import_products', label: 'Importar Productos', icon: Download },
        { id: 'import_stock', label: 'Importar Stock', icon: PackagePlus },
        { id: 'brands_rubros', label: 'Marcas & Rubros', icon: Tags },
        { id: 'price_tags', label: 'Etiquetas de Precio', icon: Printer },
        { id: 'price_lists', label: 'Listas de Precios', icon: DollarSign },
        { id: 'mass_price_update', label: 'Actualizar Precios', icon: TrendingUp },
      ],
    },
    {
      title: 'CONTABILIDAD',
      items: [
        { id: 'contabilidad', label: 'Módulo Contable (13 Submódulos)', icon: BookOpen },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { id: 'dashboard', label: 'Panel Principal (Dashboard)', icon: LayoutDashboard },
        {
          id: 'finances',
          label: 'Finanzas',
          icon: DollarSign,
        },
        {
          id: 'financial_intelligence',
          label: 'Inteligencia Financiera',
          icon: Scale,
          badge: 'PRO',
        },
        {
          id: 'cash_register',
          label: 'Cajas Registradoras',
          icon: DollarSign,
          badge: activeSession ? 'Abierta' : 'Cerrada',
        },
        {
          id: 'money_boxes',
          label: 'Cajas de Dinero',
          icon: Boxes,
        },
        { id: 'payment_receipts', label: 'Recibos de Pago', icon: Receipt },
        {
          id: 'movements_query',
          label: 'Consulta Movimientos',
          icon: ArrowUpDown,
        },
        {
          id: 'balances_debts',
          label: 'Saldos y Deudas',
          icon: Scale,
        },
        { id: 'fixed_expenses', label: 'Gastos Fijos / Control Gastos', icon: TrendingDown },
        { id: 'installments', label: 'Cuotas Internas', icon: CalendarDays },
        { id: 'loans_planning', label: 'Préstamos y Planificación', icon: Landmark, badge: 'PRO' },
        { id: 'finance_banks', label: 'Finanzas y Bancos', icon: TrendingUp },
        { id: 'reports_vat', label: 'Informes e IVA', icon: FileSpreadsheet },
        { id: 'reports_citi', label: 'Reportes CITI', icon: FileCheck },
        { id: 'fiscal_afip', label: 'Facturación ARCA', icon: FileSpreadsheet },
        { id: 'users_roles', label: 'Usuarios y Roles', icon: UserCheck },
        { id: 'employees_payroll', label: 'Personal', icon: Users },
        { id: 'collection_methods', label: 'Formas de Cobro', icon: CreditCard },
        { id: 'mercadopago_payments', label: 'Pagos MercadoPago', icon: Wallet },
        { id: 'digital_wallets', label: 'Billeteras Digitales', icon: Smartphone },
        { id: 'admin_tasks', label: 'Organización y Tareas', icon: ListTodo },
        { id: 'internal_accountant', label: 'Contador Interno', icon: Calculator },
        { id: 'c_suite_advisors', label: 'Consejo C-Suite (IA Directiva)', icon: Brain, badge: 'PRO' },
      ],
    },
    {
      title: 'CONFIGURACIÓN',
      items: [
        { id: 'settings_backups', label: 'Configuración General', icon: Settings },
        { id: 'integrations', label: 'Integraciones', icon: Plug },
        { id: 'marketing_ai', label: 'Marketing IA', icon: Megaphone },
        { id: 'meta_ads', label: 'Meta Ads', icon: Target },
        { id: 'whatsapp_bot', label: 'Bot WhatsApp', icon: MessageSquare },
        { id: 'agents_panel', label: 'Panel de Agentes', icon: Headphones },
        { id: 'data_management', label: 'Gestión de Datos', icon: Database },
        { id: 'backups_view', label: 'Backups', icon: HardDrive },
        { id: 'internal_chat', label: 'Chat Interno', icon: MessagesSquare },
        { id: 'ai_assistant', label: 'Asistente IA Ferretero', icon: Sparkles },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sections.forEach(sec => {
      const hasActive = sec.items.some(item => item.id === activeModule);
      initial[sec.title] = hasActive;
    });
    return initial;
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const enabledModules = store.settings.enabledModules || {
    sales_group: true,
    distribuidora: true,
    purchases_group: true,
    products_group: true,
    accounting_group: true,
    admin_group: true,
    config_group: true,
    workshop: true,
    loyalty: true,
    marketing: true,
  };

  const filteredSections = sections
    .map((section) => {
      const title = section.title;
      if (title === 'VENTAS' && enabledModules.sales_group === false) return null;
      if (title === 'DISTRIBUIDORA' && enabledModules.distribuidora === false) return null;
      if (title === 'COMPRAS' && enabledModules.purchases_group === false) return null;
      if (title === 'PRODUCTOS' && enabledModules.products_group === false) return null;
      if (title === 'CONTABILIDAD' && enabledModules.accounting_group === false) return null;
      if (title === 'ADMINISTRACIÓN' && enabledModules.admin_group === false) return null;
      if (title === 'CONFIGURACIÓN' && enabledModules.config_group === false) return null;

      const filteredItems = section.items.filter((item) => {
        if (enabledModules[item.id] === false) return false;
        if (item.id === 'ecommerce_catalog' && enabledModules.ecommerce_catalog === false) return false;
        if (item.id === 'service_workshop' && enabledModules.workshop === false) return false;
        if ((item.id === 'loyalty_club' || item.id === 'coupons_offers') && enabledModules.loyalty === false) return false;
        if (item.id === 'marketing_ai' && enabledModules.marketing === false) return false;
        return true;
      });
      if (filteredItems.length === 0) return null;
      return { ...section, items: filteredItems };
    })
    .filter((s): s is NavSection => s !== null);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-[calc(100vh-4rem)] sticky top-16 border-r border-slate-800 shrink-0 select-none">
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4 custom-scrollbar">
        {filteredSections.map((section, idx) => {
          const isOpen = openSections[section.title] ?? true;
          const hasActiveItem = section.items.some(item => item.id === activeModule);

          return (
            <div key={idx} className="space-y-1">
              <button
                onClick={() => toggleSection(section.title)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  hasActiveItem ? 'text-amber-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="space-y-0.5 pl-1 pt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                              isActive
                                ? 'bg-slate-950 text-amber-400'
                                : item.badge === 'Abierta'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                                : item.badge === 'Cerrada'
                                ? 'bg-rose-950 text-rose-300 border border-rose-700/50'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-300">Nova Systems ERP</span>
          <span className="block text-[10px]">v2.6.4 • Argentina</span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-400 font-medium text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online</span>
        </div>
      </div>
    </aside>
  );
};
