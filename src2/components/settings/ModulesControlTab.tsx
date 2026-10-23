import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  PackageCheck,
  Wrench,
  Award,
  Megaphone,
  ShoppingCart,
  Truck,
  Building2,
  Boxes,
  BookOpen,
  LayoutDashboard,
  Settings,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
} from 'lucide-react';

export const ModulesControlTab: React.FC = () => {
  const { store, showToast, triggerRefresh } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPass = store.settings.creatorPassword || '1234';
    if (passwordInput === masterPass) {
      setIsAuthenticated(true);
      showToast('Acceso de Creador Autorizado', 'success');
    } else {
      showToast('Contraseña de creador incorrecta', 'error');
      setPasswordInput('');
    }
  };

  const enabledModules = store.settings.enabledModules || {};

  const [modulesState, setModulesState] = useState(enabledModules);
  const [expandedModule, setExpandedModule] = useState<string | null>('sales_group');

  const handleToggleModuleGroup = (groupKey: string, status: boolean) => {
    const updated = { ...modulesState, [groupKey]: status };
    setModulesState(updated);
    store.saveSettings({
      ...store.settings,
      enabledModules: updated,
    });
    showToast(`Módulo actualizado correctamente`, 'success');
    triggerRefresh();
  };

  const handleToggleItem = (itemId: string) => {
    const current = modulesState[itemId] !== false;
    const updated = { ...modulesState, [itemId]: !current };
    setModulesState(updated);
    store.saveSettings({
      ...store.settings,
      enabledModules: updated,
    });
    showToast(`Funcionalidad actualizada`, 'success');
    triggerRefresh();
  };

  const moduleDefinitions = [
    {
      key: 'sales_group',
      name: 'Módulo de Ventas & POS',
      description: 'Punto de venta, historial, remitos, cotizaciones, comprobantes, pedidos y cuenta corriente.',
      icon: ShoppingCart,
      items: [
        { id: 'pos', label: 'Ventas (POS)' },
        { id: 'sales_history', label: 'Historial de Ventas' },
        { id: 'remitos', label: 'Remitos' },
        { id: 'remitos_editor', label: 'Diseño de Remitos' },
        { id: 'tickets_editor', label: 'Diseño de Tickets' },
        { id: 'quotes', label: 'Cotizaciones' },
        { id: 'receipts_vta', label: 'Comprobantes' },
        { id: 'orders_vta', label: 'Pedidos' },
        { id: 'clients_ctacte', label: 'Clientes & Cta. Cte.' },
        { id: 'loyalty_club', label: 'Fidelización / Puntos' },
        { id: 'coupons_offers', label: 'Cupones y Ofertas' },
        { id: 'birthdays', label: 'Cumpleaños' },
        { id: 'raffles', label: 'Sorteos' },
        { id: 'returns', label: 'Devoluciones' },
        { id: 'promotions', label: 'Ofertas y Promociones' },
        { id: 'ecommerce_catalog', label: 'E-Commerce (Tienda)' },
        { id: 'mercadolibre', label: 'MercadoLibre' },
        { id: 'service_workshop', label: 'Servicio Técnico' },
      ],
    },
    {
      key: 'distribuidora',
      name: 'Módulo Distribuidora & Mayorista',
      description: 'Pedidos Mayorista, Gestión de Envíos, Portal Mayorista, Tienda Mayorista y Catálogo Visual.',
      icon: PackageCheck,
      items: [
        { id: 'wholesale_orders', label: 'Pedidos Mayorista' },
        { id: 'wholesale_shipping', label: 'Gestión de Envíos' },
        { id: 'wholesale_portal', label: 'Portal Mayorista' },
        { id: 'wholesale_store', label: 'Tienda Mayorista' },
        { id: 'visual_catalog', label: 'Catálogo Visual' },
      ],
    },
    {
      key: 'purchases_group',
      name: 'Módulo de Compras & Proveedores',
      description: 'Pedidos de compra, proveedores, comprobantes y automatización.',
      icon: Building2,
      items: [
        { id: 'purchase_orders', label: 'Pedidos de Compra' },
        { id: 'suppliers', label: 'Proveedores' },
        { id: 'purchases_ai', label: 'Compras & IA' },
        { id: 'purchase_receipts', label: 'Comprobantes' },
        { id: 'purchases_automation', label: 'Automatización' },
      ],
    },
    {
      key: 'products_group',
      name: 'Inventario & Productos',
      description: 'Stock, combos, faltantes, depósitos, etiquetas, listas de precios y actualización masiva.',
      icon: Boxes,
      items: [
        { id: 'inventory', label: 'Inventario de Productos' },
        { id: 'combos', label: 'Combos & Promos' },
        { id: 'missing_stock', label: 'Faltantes' },
        { id: 'stock_adjust', label: 'Ajuste de Stock' },
        { id: 'mass_modification', label: 'Modificación Masiva' },
        { id: 'warehouses_branches', label: 'Depósitos / Sucursales' },
        { id: 'stock_transfers', label: 'Transferencias' },
        { id: 'branch_orders', label: 'Pedidos Sucursal' },
        { id: 'import_products', label: 'Importar Productos' },
        { id: 'import_stock', label: 'Importar Stock' },
        { id: 'brands_rubros', label: 'Marcas & Rubros' },
        { id: 'price_tags', label: 'Etiquetas de Precio' },
        { id: 'price_lists', label: 'Listas de Precios' },
        { id: 'mass_price_update', label: 'Actualizar Precios' },
      ],
    },
    {
      key: 'accounting_group',
      name: 'Módulo Contable',
      description: 'Submódulos contables integrados.',
      icon: BookOpen,
      items: [{ id: 'contabilidad', label: 'Módulo Contable (13 Submódulos)' }],
    },
    {
      key: 'admin_group',
      name: 'Administración, Caja & Finanzas',
      description: 'Dashboard, caja diaria, cuentas, deudas, préstamos, informes de IVA, CITI y ARCA.',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Panel Principal (Dashboard)' },
        { id: 'finances', label: 'Finanzas' },
        { id: 'financial_intelligence', label: 'Inteligencia Financiera' },
        { id: 'cash_register', label: 'Caja Diaria' },
        { id: 'money_boxes', label: 'Cajas de Dinero y Bancos' },
        { id: 'payment_receipts', label: 'Recibos de Cobro' },
        { id: 'movements_query', label: 'Consulta de Movimientos' },
        { id: 'balances_debts', label: 'Saldos y Deudas' },
        { id: 'installments', label: 'Cuotas de Clientes' },
        { id: 'loans_planning', label: 'Préstamos y Planificación' },
        { id: 'finance_banks', label: 'Finanzas y Bancos' },
        { id: 'reports_vat', label: 'Informes e IVA' },
        { id: 'reports_citi', label: 'Reportes CITI' },
        { id: 'fiscal_afip', label: 'Facturación ARCA' },
        { id: 'users_roles', label: 'Usuarios y Roles' },
        { id: 'employees_payroll', label: 'Personal' },
        { id: 'collection_methods', label: 'Formas de Cobro' },
        { id: 'mercadopago_payments', label: 'Pagos MercadoPago' },
        { id: 'digital_wallets', label: 'Billeteras Digitales' },
        { id: 'admin_tasks', label: 'Organización y Tareas' },
        { id: 'internal_accountant', label: 'Contador Interno' },
        { id: 'c_suite_advisors', label: 'Consejo C-Suite (IA Directiva)' },
      ],
    },
    {
      key: 'config_group',
      name: 'Configuración & Integraciones',
      description: 'Parámetros de empresa, respaldos, integraciones y marketing.',
      icon: Settings,
      items: [
        { id: 'settings_backups', label: 'Configuración General' },
        { id: 'integrations', label: 'Integraciones' },
        { id: 'marketing_ai', label: 'Marketing IA' },
      ],
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-md w-full mx-auto my-12 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Acceso Restringido (Creador)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ingrese la contraseña maestra de creador para acceder al Panel de Control Total de Módulos.
          </p>
        </div>
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <input
            type="password"
            required
            autoFocus
            placeholder="Contraseña maestra (ej. 1234)"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-white tracking-widest text-lg font-mono focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Desbloquear Panel
          </button>
        </form>
        <p className="text-[10px] text-slate-500">Contraseña por defecto: 1234</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Panel de Control Total del Creador (Módulos & Funcionalidades)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Habilita o deshabilita módulos completos o despliega cada módulo para activar/desactivar cada funcionalidad individualmente.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
        >
          Bloquear Sesión
        </button>
      </div>

      <div className="space-y-4">
        {moduleDefinitions.map((mod) => {
          const Icon = mod.icon;
          const isGroupEnabled = modulesState[mod.key] !== false;
          const isExpanded = expandedModule === mod.key;

          return (
            <div
              key={mod.key}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isGroupEnabled
                  ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-xs'
                  : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
              }`}
            >
              {/* Group Header */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setExpandedModule(isExpanded ? null : mod.key)}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isGroupEnabled ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-300 dark:bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>{mod.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isGroupEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {isGroupEnabled ? 'Activado' : 'Desactivado'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleModuleGroup(mod.key, !isGroupEnabled)}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      isGroupEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-300 dark:bg-slate-800 hover:bg-slate-400 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isGroupEnabled ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5" />}
                    <span>{isGroupEnabled ? 'Desactivar Módulo' : 'Activar Módulo'}</span>
                  </button>

                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : mod.key)}
                    className="p-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    title="Desplegar funcionalidades internas"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Sub-items List */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-700/80 bg-white/50 dark:bg-slate-900/50 space-y-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Funcionalidades individuales dentro de {mod.name}:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {mod.items.map((subItem) => {
                      const isItemOn = modulesState[subItem.id] !== false;
                      return (
                        <div
                          key={subItem.id}
                          onClick={() => handleToggleItem(subItem.id)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isItemOn
                              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/80 text-slate-900 dark:text-white'
                              : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                          }`}
                        >
                          <span className="text-xs font-medium truncate">{subItem.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isItemOn ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-300 dark:bg-slate-700 text-slate-500'}`}>
                            {isItemOn ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
