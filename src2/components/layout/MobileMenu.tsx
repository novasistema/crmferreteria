import React, { useState } from 'react';
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
  X,
  HardHat,
  LogOut,
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

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { activeModule, setActiveModule, store, currentUser, activeWarehouseId, setActiveWarehouseId } = useApp();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ventas: true,
  });

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
        { id: 'cash_register', label: 'Cajas Registradoras', icon: Landmark },
        { id: 'money_boxes', label: 'Cajas de Dinero', icon: Boxes },
        { id: 'payment_receipts', label: 'Recibos de Pago', icon: Receipt },
        { id: 'movements_query', label: 'Consulta Movimientos', icon: ArrowUpDown },
        { id: 'balances_debts', label: 'Saldos y Deudas', icon: Scale },
        { id: 'installments', label: 'Cuotas Internas', icon: Calculator },
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
      ],
    },
    {
      id: 'configuracion',
      label: 'Configuración',
      icon: Settings,
      items: [
        { id: 'settings_backups', label: 'Configuración', icon: Settings },
        { id: 'integrations', label: 'Integraciones', icon: Plug },
        { id: 'marketing_ai', label: 'Marketing con IA', icon: Megaphone },
        { id: 'meta_ads', label: 'Meta Ads', icon: Target },
        { id: 'whatsapp_bot', label: 'Bot WhatsApp', icon: MessageSquare },
        { id: 'agents_panel', label: 'Panel de Agentes', icon: Headphones },
        { id: 'data_management', label: 'Gestión de Datos', icon: Database },
        { id: 'backups_view', label: 'Copias de Seguridad', icon: HardDrive },
        { id: 'internal_chat', label: 'Chat Interno', icon: MessagesSquare },
        { id: 'ai_assistant', label: 'Asistente del Sistema', icon: HelpCircle },
      ],
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-[300px] max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow">
              <HardHat className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-sm text-white">FERRETERÍA</span>
                <span className="text-amber-400 font-bold text-sm">BRUZZONE</span>
              </div>
              <span className="text-[9px] text-slate-400 font-semibold block">Gestión ERP</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Button for Panel Principal */}
        <div className="p-3 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setActiveModule('dashboard');
              onClose();
            }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              activeModule === 'dashboard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-amber-400" />
            <span>Panel Principal</span>
          </button>
        </div>

        {/* Branch / Sucursal Selector */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sucursal / Depósito</label>
          <select
            value={activeWarehouseId}
            onChange={(e) => setActiveWarehouseId(e.target.value)}
            className="w-full bg-slate-950 text-xs text-slate-200 font-semibold rounded-lg p-2 border border-slate-700"
          >
            {store.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable Categories & Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
          {categories.map((cat) => {
            const isExpanded = !!expandedGroups[cat.id];
            const CatIcon = cat.icon;
            const hasActive = cat.items.some((i) => i.id === activeModule);

            return (
              <div key={cat.id} className="rounded-xl border border-slate-800/80 overflow-hidden bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => toggleGroup(cat.id)}
                  className={`w-full flex items-center justify-between p-2.5 text-xs font-bold transition-colors ${
                    hasActive ? 'text-orange-400 bg-orange-500/10' : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CatIcon className="w-4 h-4 text-orange-400/80" />
                    <span>{cat.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="p-1 space-y-0.5 border-t border-slate-800/50 bg-slate-950/40">
                    {cat.items.filter((item) => (store.settings.enabledModules || {})[item.id] !== false).map((item) => {
                      const isActive = activeModule === item.id;
                      const ItemIcon = item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveModule(item.id);
                            onClose();
                          }}
                          className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                            isActive
                              ? 'bg-orange-500 text-white font-bold shadow'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          <ItemIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer User Info */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
              <span className="text-[10px] text-blue-400 uppercase font-semibold">{currentUser.role}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outside click area */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
};
