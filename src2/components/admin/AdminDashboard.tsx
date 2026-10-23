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
  Lock,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
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

  const [modulesState, setModulesState] = useState(enabledModules);

  const handleToggleGlobalModule = (key: string) => {
    const current = modulesState[key] !== false;
    const updated = { ...modulesState, [key]: !current };
    setModulesState(updated);
    store.saveSettings({
      ...store.settings,
      enabledModules: updated,
    });
    showToast(`Módulo "${key}" actualizado globalmente`, 'success');
    triggerRefresh();
  };

  const systemModulesList = [
    {
      key: 'sales_group',
      name: 'Módulo de Ventas & POS',
      category: 'Ventas',
      description: 'Punto de venta, historial, remitos, cotizaciones, comprobantes, pedidos y cuenta corriente de clientes.',
      icon: ShoppingCart,
    },
    {
      key: 'distribuidora',
      name: 'Módulo Distribuidora & Mayorista',
      category: 'Distribuidora',
      description: 'Pedidos Mayorista, Gestión de Envíos, Catálogo Visual Mayorista y Portal Mayorista (Distribuidora Bruzzone).',
      icon: PackageCheck,
    },
    {
      key: 'purchases_group',
      name: 'Módulo de Compras & Proveedores',
      category: 'Compras',
      description: 'Pedidos de compra, gestión de proveedores, comprobantes y compras con IA.',
      icon: Building2,
    },
    {
      key: 'products_group',
      name: 'Inventario & Productos',
      category: 'Productos',
      description: 'Stock, combos, faltantes, depósitos/sucursales, listas de precios, etiquetas y actualización de precios.',
      icon: Boxes,
    },
    {
      key: 'accounting_group',
      name: 'Módulo Contable',
      category: 'Contabilidad',
      description: 'Submódulos contables integrados del sistema.',
      icon: BookOpen,
    },
    {
      key: 'admin_group',
      name: 'Administración, Caja & Finanzas',
      category: 'Administración',
      description: 'Dashboard, caja diaria, cuentas bancarias, deudas, préstamos, informes de IVA, CITI y facturación ARCA.',
      icon: LayoutDashboard,
    },
    {
      key: 'config_group',
      name: 'Configuración & Integraciones',
      category: 'Configuración',
      description: 'Parámetros de empresa, respaldos, integraciones y marketing.',
      icon: Settings,
    },
    {
      key: 'workshop',
      name: 'Servicio Técnico / Taller',
      category: 'Especiales',
      description: 'Gestión de reparaciones, órdenes de servicio técnico, estados y repuestos.',
      icon: Wrench,
    },
    {
      key: 'loyalty',
      name: 'Club de Fidelidad & Puntos',
      category: 'Especiales',
      description: 'Acumulación de puntos, niveles de clientes y recompensas.',
      icon: Award,
    },
    {
      key: 'marketing',
      name: 'Marketing IA & Bot Autónomo',
      category: 'Especiales',
      description: 'Campañas en redes, análisis de competencia, WhatsApp/Gmail y automatización.',
      icon: Megaphone,
    },
  ];

  const activeCount = systemModulesList.filter((m) => modulesState[m.key] !== false).length;

  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full h-full min-h-[80vh] flex items-center justify-center p-4 bg-slate-950">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Acceso Restringido (Creador)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingrese la contraseña maestra de creador para acceder al panel de control total.
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
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl border border-blue-400/40">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Panel Exclusivo Superusuario
                </span>
                <span className="text-xs text-blue-200">Control Global de Módulos</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                AdminDashboard (Control de Módulos)
              </h1>
              <p className="text-blue-200 text-xs mt-0.5">
                Activa o desactiva de forma global cada módulo del sistema para adaptarlo a las necesidades de cada cliente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-blue-500/30 text-right space-y-1">
              <span className="text-xs text-slate-400 block">Módulos Activos:</span>
              <span className="font-bold text-lg text-emerald-400 block">{activeCount} / {systemModulesList.length}</span>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all"
              title="Bloquear sesión de creador"
            >
              Bloquear
            </button>
          </div>
        </div>

        {/* Modules List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemModulesList.map((mod) => {
            const Icon = mod.icon;
            const isEnabled = modulesState[mod.key] !== false;

            return (
              <div
                key={mod.key}
                className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                  isEnabled
                    ? 'bg-slate-900 border-slate-800 shadow-sm'
                    : 'bg-slate-950/60 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isEnabled ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {mod.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {isEnabled ? 'Activado' : 'Desactivado'}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm truncate">{mod.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{mod.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleGlobalModule(mod.key)}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    isEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isEnabled ? 'Desactivar módulo globalmente' : 'Activar módulo globalmente'}
                >
                  {isEnabled ? <ToggleRight className="w-6 h-6 text-white" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                  <span className="hidden sm:inline">{isEnabled ? 'Activo' : 'Inactivo'}</span>
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
