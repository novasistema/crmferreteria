import React, { useState, useRef, useEffect } from 'react';
import { useApp, AppModule } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  FileText,
  ClipboardList,
  Printer,
  ShoppingBag,
  Users,
  Heart,
  Ticket,
  Cake,
  Dices,
  RotateCcw,
  Tag,
  Globe,
  Store,
  Wrench,
  Truck,
  Image,
  Building2,
  CreditCard,
  Package,
  Factory,
  Boxes,
  AlertTriangle,
  Sliders,
  Layers,
  Building,
  ArrowLeftRight,
  Download,
  PackagePlus,
  Tags,
  DollarSign,
  TrendingUp,
  Landmark,
  Receipt,
  ArrowUpDown,
  Scale,
  Calculator,
  TrendingDown,
  Brain,
  FileSpreadsheet,
  FileCheck,
  UserCheck,
  Wallet,
  Smartphone,
  ListTodo,
  Settings,
  Plug,
  Megaphone,
  Target,
  MessageSquare,
  Headphones,
  Database,
  HardDrive,
  MessagesSquare,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

interface MenuItem {
  id: AppModule;
  label: string;
  icon: React.ElementType;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

export const TopNavbarMenu: React.FC = () => {
  const { activeModule, setActiveModule, store } = useApp();
  const enabledModules = store.settings.enabledModules || {};
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const categories: MenuCategory[] = [
    {
      id: 'ventas',
      label: 'Ventas',
      icon: ShoppingCart,
      items: [
        { id: 'pos', label: 'Ventas (POS)', icon: ShoppingCart },
        { id: 'sales_history', label: 'Historial de Ventas', icon: ReceiptText },
        { id: 'remitos', label: 'Remitos', icon: FileText },
        { id: 'remitos_editor', label: 'Diseño de Remitos', icon: FileText },
        { id: 'tickets_editor', label: 'Diseño de Tickets', icon: Printer },
        { id: 'quotes', label: 'Cotizaciones', icon: ClipboardList },
        { id: 'receipts_vta', label: 'Comprobantes', icon: Printer },
        { id: 'orders_vta', label: 'Pedidos', icon: ShoppingBag },
        { id: 'clients_ctacte', label: 'Clientes', icon: Users },
        { id: 'loyalty_club', label: 'Fidelización', icon: Heart },
        { id: 'coupons_offers', label: 'Cupones y Ofertas', icon: Ticket },
        { id: 'birthdays', label: 'Cumpleaños', icon: Cake },
        { id: 'raffles', label: 'Sorteos', icon: Dices },
        { id: 'returns', label: 'Devoluciones', icon: RotateCcw },
        { id: 'promotions', label: 'Ofertas y Promociones', icon: Tag },
        { id: 'ecommerce_catalog', label: 'E-Commerce', icon: Globe },
        { id: 'mercadolibre', label: 'MercadoLibre', icon: Store },
        { id: 'service_workshop', label: 'Servicio Técnico', icon: Wrench },
      ],
    },
    {
      id: 'distribuidora',
      label: 'Distribuidora',
      icon: Store,
      items: [
        { id: 'wholesale_orders', label: 'Pedidos Mayorista', icon: ClipboardList },
        { id: 'wholesale_shipping', label: 'Gestión de Envíos', icon: Truck },
        { id: 'wholesale_portal', label: 'Portal Mayorista', icon: Store },
        { id: 'wholesale_store', label: 'Tienda Mayorista', icon: ShoppingBag },
        { id: 'visual_catalog', label: 'Catálogo Visual', icon: Image },
      ],
    },
    {
      id: 'produccion',
      label: 'Producción',
      icon: Factory,
      items: [
        { id: 'produccion', label: 'Fábrica & Recetas de Pintura', icon: Factory },
      ],
    },
    {
      id: 'compras',
      label: 'Compras',
      icon: Truck,
      items: [
        { id: 'purchase_orders', label: 'Pedidos Compra', icon: ReceiptText },
        { id: 'suppliers', label: 'Proveedores', icon: Building2 },
        { id: 'purchases_ai', label: 'Compras & IA', icon: CreditCard },
        { id: 'purchase_receipts', label: 'Comprobantes', icon: FileText },
        { id: 'purchases_automation', label: 'Automatización', icon: Globe },
      ],
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: Package,
      items: [
        { id: 'inventory', label: 'Inventario', icon: Package },
        { id: 'combos', label: 'Combos', icon: Boxes },
        { id: 'missing_stock', label: 'Faltantes', icon: AlertTriangle },
        { id: 'stock_adjust', label: 'Ajuste de Stock', icon: Sliders },
        { id: 'mass_modification', label: 'Modificación Masiva', icon: Layers },
        { id: 'warehouses_branches', label: 'Depósitos/Sucursales', icon: Building },
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
      id: 'administracion',
      label: 'Administración',
      icon: Landmark,
      items: [
        { id: 'finances', label: 'Finanzas', icon: DollarSign },
        { id: 'dashboard', label: 'Panel Principal (Dashboard)', icon: LayoutDashboard },
        { id: 'cash_register', label: 'Cajas Registradoras', icon: Landmark },
        { id: 'money_boxes', label: 'Cajas de Dinero', icon: Boxes },
        { id: 'payment_receipts', label: 'Recibos de Pago', icon: Receipt },
        { id: 'movements_query', label: 'Consulta Movimientos', icon: ArrowUpDown },
        { id: 'balances_debts', label: 'Saldos y Deudas', icon: Scale },
        { id: 'installments', label: 'Cuotas Internas', icon: Calculator },
        { id: 'loans_planning', label: 'Préstamos y Planificación', icon: Landmark },
        { id: 'fixed_expenses', label: 'Gastos Fijos', icon: TrendingDown },
        { id: 'finance_banks', label: 'Finanzas y Bancos', icon: TrendingUp },
        { id: 'financial_intelligence', label: 'Inteligencia Financiera', icon: Brain },
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
        { id: 'c_suite_advisors', label: 'Consejo C-Suite (IA Directiva)', icon: Brain },
      ],
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      items: [
        { id: 'settings_backups', label: 'Configuración', icon: Settings },
        { id: 'integrations', label: 'Integraciones', icon: Plug },
        { id: 'marketing_ai', label: 'Marketing IA', icon: Megaphone },
        { id: 'meta_ads', label: 'Meta Ads', icon: Target },
        { id: 'whatsapp_bot', label: 'Bot WhatsApp', icon: MessageSquare },
        { id: 'agents_panel', label: 'Panel de Agentes', icon: Headphones },
        { id: 'data_management', label: 'Gestión de Datos', icon: Database },
        { id: 'backups_view', label: 'Backups', icon: HardDrive },
        { id: 'internal_chat', label: 'Chat Interno', icon: MessagesSquare },
        { id: 'ai_assistant', label: 'Asistente del Sistema', icon: HelpCircle },
      ],
    },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Desktop Horizontal Navigation */}
      <nav ref={menuRef} className="hidden md:flex items-center space-x-1 lg:space-x-1.5 relative select-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isOpen = openMenu === cat.id;
          const isCatActive = cat.items.some((item) => item.id === activeModule);

          return (
            <div key={cat.id} className="relative">
              <button
                onClick={() => setOpenMenu(isOpen ? null : cat.id)}
                className={`flex items-center space-x-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isOpen || isCatActive
                    ? 'bg-slate-800 text-blue-400 font-extrabold shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu matching exact Replit theme */}
              {isOpen && (
                <div className="absolute left-0 mt-1.5 w-56 max-h-[75vh] overflow-y-auto custom-scrollbar bg-[#111927] border border-slate-700/90 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {cat.items.filter((item) => enabledModules[item.id] !== false).map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeModule === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveModule(item.id);
                          setOpenMenu(null);
                        }}
                        className={`w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer ${
                          isItemActive
                            ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-400'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <ItemIcon
                          className={`w-4 h-4 shrink-0 ${
                            isItemActive ? 'text-blue-400' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile Hamburger Toggle for Small Screens */}
      <div className="md:hidden">
        <button
          onClick={() => setOpenMenu(openMenu ? null : 'mobile-drawer')}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
          title="Abrir Menú de Módulos"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${openMenu ? 'rotate-180' : ''}`} />
        </button>

        {openMenu === 'mobile-drawer' && (
          <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto space-y-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="space-y-1 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2 text-xs font-black text-blue-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                    <Icon className="w-4 h-4" />
                    <span>{cat.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1.5">
                    {cat.items.filter((item) => enabledModules[item.id] !== false).map((item) => {
                      const ItemIcon = item.icon;
                      const isItemActive = activeModule === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveModule(item.id);
                            setOpenMenu(null);
                          }}
                          className={`flex items-center space-x-2 p-2 rounded-lg text-left text-xs ${
                            isItemActive
                              ? 'bg-blue-600/30 text-blue-300 font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <ItemIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
