import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  FileText,
  ClipboardList,
  Users,
  Package,
  Boxes,
  TrendingUp,
  DollarSign,
  Landmark,
  Layers,
  Settings,
  Scale,
  Calculator,
  PieChart,
  Calendar,
  Building,
  Wrench,
  RotateCcw,
  Truck,
  Gift,
  Globe,
  FileCheck,
  FileSpreadsheet,
  Brain,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  module: any;
  icon: any;
}

const MODULE_DEFINITIONS: Record<string, { label: string; icon: any }> = {
  dashboard: { label: 'Panel Principal', icon: LayoutDashboard },
  pos: { label: 'Ventas (POS)', icon: ShoppingCart },
  sales_history: { label: 'Historial Ventas', icon: Receipt },
  returns: { label: 'Devoluciones', icon: RotateCcw },
  remitos: { label: 'Remitos', icon: FileText },
  inventory: { label: 'Inventario', icon: Package },
  mass_price_update: { label: 'Actualizar Precios', icon: TrendingUp },
  combos: { label: 'Combos', icon: Boxes },
  quotes: { label: 'Cotizaciones', icon: ClipboardList },
  clients_ctacte: { label: 'Clientes / Cta Cte', icon: Users },
  loyalty_club: { label: 'Fidelización / Puntos', icon: Gift },
  ecommerce_catalog: { label: 'Tienda Online', icon: Globe },
  service_workshop: { label: 'Servicio Técnico', icon: Wrench },
  wholesale_orders: { label: 'Distribuidora', icon: Truck },
  purchase_orders: { label: 'Pedidos Compra', icon: ClipboardList },
  suppliers: { label: 'Proveedores', icon: Truck },
  warehouses_branches: { label: 'Sucursales / Depósitos', icon: Boxes },
  stock_transfers: { label: 'Transferencias Stock', icon: TrendingUp },
  cash_register: { label: 'Cajas Registradoras', icon: DollarSign },
  collection_methods: { label: 'Recaudación Formas de Pago', icon: PieChart },
  payment_receipts: { label: 'Movimientos de Caja', icon: Calendar },
  fixed_expenses: { label: 'Control de Gastos', icon: FileSpreadsheet },
  finance_banks: { label: 'Cuentas Bancarias', icon: Building },
  mercadopago_payments: { label: 'Pagos MercadoPago', icon: DollarSign },
  digital_wallets: { label: 'Billeteras Digitales', icon: DollarSign },
  money_boxes: { label: 'Cajas de Dinero', icon: Landmark },
  movements_query: { label: 'Consulta Movimientos', icon: Receipt },
  balances_debts: { label: 'Saldos & Deudas', icon: Scale },
  installments: { label: 'Cuotas Internas', icon: Calculator },
  internal_installments: { label: 'Cuotas Internas', icon: Calculator },
  financial_intelligence: { label: 'Inteligencia Financiera', icon: Brain },
  finances: { label: 'Finanzas', icon: DollarSign },
  reports_vat: { label: 'Informes e IVA', icon: FileSpreadsheet },
  reports_citi: { label: 'Reportes CITI', icon: FileCheck },
  fiscal_afip: { label: 'Facturación AFIP', icon: FileCheck },
  employees_payroll: { label: 'Personal', icon: Users },
  settings_backups: { label: 'Configuración', icon: Settings },
  settings: { label: 'Configuración', icon: Settings },
  ai_assistant: { label: 'Asistente IA', icon: Sparkles },
};

export const OpenTabsBar: React.FC = () => {
  const { activeModule, setActiveModule, theme } = useApp();

  // Keep list of open tabs
  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    { id: 'pos', label: 'Ventas (POS)', module: 'pos', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventario', module: 'inventory', icon: Package },
  ]);

  // When activeModule changes, auto-add to openTabs if not present
  useEffect(() => {
    if (!activeModule) return;
    const def = MODULE_DEFINITIONS[activeModule] || {
      label: activeModule.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: Package,
    };

    setOpenTabs((prev) => {
      if (prev.some((t) => t.module === activeModule)) return prev;
      return [
        ...prev,
        {
          id: activeModule,
          label: def.label,
          module: activeModule,
          icon: def.icon,
        },
      ];
    });
  }, [activeModule]);

  // Close Tab
  const handleCloseTab = (e: React.MouseEvent, tabModule: string) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t.module !== tabModule);
    setOpenTabs(remaining);

    // If closing active tab, switch to the last available or 'pos'
    if (activeModule === tabModule) {
      if (remaining.length > 0) {
        setActiveModule(remaining[remaining.length - 1].module);
      } else {
        setActiveModule('pos');
      }
    }
  };

  return (
    <div className="bg-[#0b1322] border-b border-slate-800 flex items-center px-2 space-x-1 h-9 overflow-x-auto custom-scrollbar select-none z-20 shrink-0">
      {/* Panel Principal shortcut */}
      <button
        onClick={() => setActiveModule('dashboard')}
        className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
          activeModule === 'dashboard'
            ? theme === 'light'
              ? 'bg-white text-amber-600 font-bold border-t-2 border-amber-500 shadow-sm'
              : 'bg-slate-950 text-amber-400 border-t-2 border-amber-500 shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span>Panel Principal</span>
      </button>

      {/* Home / POS shortcut */}
      <button
        onClick={() => setActiveModule('pos')}
        className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-all shrink-0 cursor-pointer ${
          activeModule === 'pos'
            ? theme === 'light'
              ? 'bg-white text-orange-600 font-bold border-t-2 border-orange-500 shadow-sm'
              : 'bg-slate-950 text-orange-400 border-t-2 border-orange-500 shadow'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Ventas (POS)</span>
      </button>

      {/* Dynamic Open Tabs */}
      {openTabs
        .filter((t) => t.module !== 'pos' && t.module !== 'dashboard')
        .map((tab) => {
          const isActive = activeModule === tab.module;
          const Icon = tab.icon || Package;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveModule(tab.module)}
              className={`group flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-t-lg transition-all cursor-pointer shrink-0 max-w-[200px] ${
                isActive
                  ? theme === 'light'
                    ? 'bg-white text-blue-600 font-bold border-t-2 border-blue-600 shadow-sm'
                    : 'bg-slate-950 text-blue-400 border-t-2 border-blue-500 shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
              <button
                onClick={(e) => handleCloseTab(e, tab.module)}
                className={`p-0.5 rounded transition-colors ml-1 cursor-pointer ${
                  isActive && theme === 'light'
                    ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                }`}
                title="Cerrar pestaña"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
    </div>
  );
};
