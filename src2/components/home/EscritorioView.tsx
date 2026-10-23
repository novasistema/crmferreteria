import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Boxes,
  Users,
  Building2,
  CreditCard,
  Wallet,
  DollarSign,
  Factory,
  Sliders,
  X,
  Check,
  Download,
} from 'lucide-react';

interface ShortcutItem {
  id: string;
  label: string;
  icon: React.ElementType;
  module: any;
  enabled: boolean;
  color: string;
}

export const EscritorioView: React.FC = () => {
  const { setActiveModule, showToast, store } = useApp();
  const currentUser = store.users[0] || { id: 'default-user', name: 'Usuario' };

  const defaultShortcuts: ShortcutItem[] = [
    { id: 'sc-1', label: 'Panel Principal', icon: LayoutDashboard, module: 'dashboard', enabled: true, color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30' },
    { id: 'sc-2', label: 'Producción', icon: Factory, module: 'production', enabled: true, color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30' },
    { id: 'sc-3', label: 'Ventas (POS)', icon: ShoppingCart, module: 'pos', enabled: true, color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30' },
    { id: 'sc-4', label: 'Remitos', icon: FileText, module: 'remitos', enabled: true, color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30' },
    { id: 'sc-5', label: 'Inventario', icon: Boxes, module: 'inventory', enabled: true, color: 'from-violet-500/20 to-violet-600/10 text-violet-400 border-violet-500/30' },
    { id: 'sc-6', label: 'Clientes', icon: Users, module: 'clients_ctacte', enabled: true, color: 'from-teal-500/20 to-teal-600/10 text-teal-400 border-teal-500/30' },
    { id: 'sc-7', label: 'Proveedores', icon: Building2, module: 'suppliers', enabled: true, color: 'from-orange-500/20 to-orange-600/10 text-orange-400 border-orange-500/30' },
    { id: 'sc-8', label: 'Compras & IA', icon: CreditCard, module: 'purchases_ai', enabled: true, color: 'from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30' },
    { id: 'sc-9', label: 'Cajas y Pagos', icon: Wallet, module: 'cash_register', enabled: true, color: 'from-emerald-600/20 to-emerald-700/10 text-emerald-300 border-emerald-500/30' },
    { id: 'sc-10', label: 'Finanzas', icon: DollarSign, module: 'finances', enabled: true, color: 'from-cyan-500/20 to-cyan-600/10 text-cyan-400 border-cyan-500/30' },
  ];

  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(() => {
    try {
      const saved = localStorage.getItem(`escritorio_shortcuts_${currentUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return defaultShortcuts.map((def) => {
          const found = parsed.find((p: any) => p.id === def.id);
          return found ? { ...def, enabled: found.enabled } : def;
        });
      }
    } catch (e) {}
    return defaultShortcuts;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const handleExportReport = () => {
    showToast('Generando e iniciando descarga de informe de 90 días...', 'success');
  };

  const handleToggleShortcut = (id: string) => {
    setShortcuts(
      shortcuts.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem(
        `escritorio_shortcuts_${currentUser.id}`,
        JSON.stringify(shortcuts.map((s) => ({ id: s.id, enabled: s.enabled })))
      );
      showToast(`Preferencias de escritorio guardadas para ${currentUser.name || 'usuario'}`, 'success');
    } catch (e) {
      showToast('Error al guardar preferencias', 'error');
    }
    setIsCustomizeOpen(false);
  };

  const activeShortcuts = shortcuts.filter((s) => s.enabled);

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Escritorio</span>
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                Sesión: {currentUser.name || 'Usuario'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Accesos directos personalizados a tus módulos favoritos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportReport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Download className="w-4 h-4" /> Exportar informe 90 días
            </button>
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Sliders className="w-4 h-4" /> Personalizar
            </button>
          </div>
        </div>

        {/* Grid of Shortcut Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {activeShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setActiveModule(item.module)}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3.5 shadow-md hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color || 'from-slate-800 to-slate-900 text-slate-200 border-slate-700'} border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-extrabold text-white text-xs tracking-tight line-clamp-1">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Modal: Personalizar Escritorio por Usuario */}
        {isCustomizeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-white">Personalizar Escritorio de {currentUser.name || 'Usuario'}</h3>
                  <p className="text-xs text-slate-400">Selecciona los accesos directos que deseas ver en tu panel de inicio.</p>
                </div>
                <button
                  onClick={() => setIsCustomizeOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 flex-1">
                {shortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleShortcut(item.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        item.enabled
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs">{item.label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.enabled ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        {item.enabled ? 'Visible' : 'Oculto'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end pt-4 mt-6 border-t border-slate-800 shrink-0">
                <button
                  onClick={handleSavePreferences}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all"
                >
                  Guardar Preferencias de Usuario
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
