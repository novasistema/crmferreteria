import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TopNavbarMenu } from './TopNavbarMenu';
import { ProductLookupModal } from '../common/ProductLookupModal';
import { QuickCloseRegisterModal } from '../cash/QuickCloseRegisterModal';
import { UserBranchLoginModal } from './UserBranchLoginModal';
import { MobileMenu } from './MobileMenu';
import { MobileAppModal } from '../common/MobileAppModal';
import {
  Store,
  DollarSign,
  User,
  ShieldCheck,
  Search,
  Bell,
  HardHat,
  ChevronDown,
  Sparkles,
  QrCode,
  Menu,
  Building,
  KeyRound,
  Sun,
  Moon,
  FileSpreadsheet,
  ShoppingCart,
  Boxes,
  Plus,
  Edit2,
  ReceiptText,
  Users,
  Wrench,
  Globe,
  X,
  Check,
  Smartphone,
} from 'lucide-react';
import { AppModule } from '../../context/AppContext';

const ALL_SHORTCUT_OPTIONS: { id: string; label: string; icon: React.ElementType; colorClass: string }[] = [
  { id: 'fixed_expenses', label: 'Registrar Gasto', icon: FileSpreadsheet, colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30 text-rose-300' },
  { id: 'pos', label: 'POS', icon: ShoppingCart, colorClass: 'text-amber-400 bg-slate-800 text-slate-200' },
  { id: 'inventory', label: 'Inventario', icon: Boxes, colorClass: 'text-blue-400 bg-slate-800 text-slate-200' },
  { id: 'cash_register', label: 'Cajas', icon: DollarSign, colorClass: 'text-emerald-400 bg-slate-800 text-slate-200' },
  { id: 'sales_history', label: 'Ventas', icon: ReceiptText, colorClass: 'text-purple-400 bg-slate-800 text-slate-200' },
  { id: 'clients_ctacte', label: 'Cta. Cte.', icon: Users, colorClass: 'text-cyan-400 bg-slate-800 text-slate-200' },
  { id: 'purchase_orders', label: 'Compras', icon: ReceiptText, colorClass: 'text-orange-400 bg-slate-800 text-slate-200' },
  { id: 'service_workshop', label: 'Servicio Téc.', icon: Wrench, colorClass: 'text-yellow-400 bg-slate-800 text-slate-200' },
  { id: 'finances', label: 'Finanzas', icon: DollarSign, colorClass: 'text-emerald-400 bg-slate-800 text-slate-200' },
  { id: 'ecommerce_catalog', label: 'Tienda', icon: Globe, colorClass: 'text-indigo-400 bg-slate-800 text-slate-200' },
  { id: 'ai_assistant', label: 'IA Ferretero', icon: Sparkles, colorClass: 'text-amber-400 bg-slate-800 text-slate-200' },
];

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    activeWarehouseId,
    setActiveWarehouseId,
    store,
    setActiveModule,
    globalSearch,
    setGlobalSearch,
    openAuthModal,
    showToast,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isMobileAppModalOpen, setIsMobileAppModalOpen] = useState(false);

  const currentShortcuts = store.settings.customShortcuts || ['fixed_expenses', 'pos', 'inventory', 'cash_register'];
  const [tempShortcuts, setTempShortcuts] = useState<string[]>(currentShortcuts);

  const handleOpenShortcutsModal = () => {
    setTempShortcuts(store.settings.customShortcuts || ['fixed_expenses', 'pos', 'inventory', 'cash_register']);
    setIsShortcutsModalOpen(true);
  };

  const handleSaveShortcuts = () => {
    store.saveSettings({ ...store.settings, customShortcuts: tempShortcuts });
    setIsShortcutsModalOpen(false);
    showToast('Accesos directos actualizados correctamente', 'success');
  };

  const currentWarehouse = store.warehouses.find((w) => w.id === activeWarehouseId) || store.warehouses[0];
  const activeSession = store.cashSessions.find(
    (s) => s.status === 'open' && store.cashRegisters.find((r) => r.id === s.registerId)?.branchId === activeWarehouseId
  ) || store.cashSessions.find((s) => s.status === 'open');
  const lowStockCount = store.products.filter((p) => (p.stockByWarehouse?.[activeWarehouseId] ?? 0) <= p.stockMin).length;

  return (
    <>
      <header className="h-16 bg-[#0f172a] text-white border-b border-slate-800 flex items-center justify-between px-3 lg:px-6 sticky top-0 z-30 shadow-md">
        {/* Brand */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            title="Abrir Menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveModule('dashboard')}
            className="flex items-center space-x-3 cursor-pointer group"
            title="Ir al Panel Principal"
          >
            <div className="h-10 w-32 rounded-xl bg-white flex items-center justify-center p-1 shadow-md group-hover:scale-105 transition-transform shrink-0 overflow-hidden border border-slate-700">
              <img 
                src={store.settings.logoUrl || '/assets/aistudio/image_1ec283c6.png'} 
                alt="Logo del Sistema" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>
        </div>

        {/* Top Navbar Horizontal Menu with 6 Categories */}
        {store.settings.menuLayout !== 'vertical' && (
          <div className="hidden lg:flex items-center mx-2">
            <TopNavbarMenu />
          </div>
        )}

        {/* Customizable Quick Shortcuts Bar */}
        <div className="hidden xl:flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700/60 rounded-xl px-2 py-1 shadow-inner">
          {currentShortcuts.map((id) => {
            const opt = ALL_SHORTCUT_OPTIONS.find((o) => o.id === id);
            if (!opt) return null;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveModule(opt.id as AppModule)}
                className={`flex items-center space-x-1.5 px-2 py-1 xl:px-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer border ${opt.colorClass}`}
                title={opt.label}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden 2xl:inline">{opt.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleOpenShortcutsModal}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            title="Personalizar accesos directos"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Controls: Cash Register Status, Low Stock Alert, User Role Switcher */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Mobile App & Barcode Scanner Simulator Button */}
          <button
            type="button"
            onClick={() => setIsMobileAppModalOpen(true)}
            className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 transition-colors cursor-pointer flex items-center justify-center"
            title="Módulo Celular y Lector de Código de Barras por Cámara"
            aria-label="Módulo Celular"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
          </button>

          {/* Quick Product Lookup (F10) */}
          <ProductLookupModal />

          {/* Quick Close Register Modal */}
          <QuickCloseRegisterModal />

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <button
              onClick={() => setActiveModule('inventory')}
              className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-amber-400"
              title={`${lowStockCount} productos con stock crítico en ${currentWarehouse?.name}`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                {lowStockCount}
              </span>
            </button>
          )}

          {/* Role, User & Branch Selector */}
          <div
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center space-x-2 pl-2 border-l border-slate-800 cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors group"
            title="Cambiar Usuario o Sucursal"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-blue-600 flex items-center justify-center text-slate-200 group-hover:text-white font-bold text-xs border border-slate-600 transition-colors shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-blue-400 font-medium flex items-center space-x-1">
                <span>{currentUser.role.toUpperCase()}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-300 truncate max-w-[90px]">
                  {currentWarehouse?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login & Branch Switcher Modal */}
      <UserBranchLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Mobile Slide-Over Menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Mobile App & Scanner Simulator Modal */}
      <MobileAppModal isOpen={isMobileAppModalOpen} onClose={() => setIsMobileAppModalOpen(false)} />

      {/* Shortcuts Customization Modal */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Personalizar Accesos Directos</h3>
                <p className="text-xs text-slate-400 mt-0.5">Selecciona qué accesos quieres mostrar en la barra superior</p>
              </div>
              <button
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {ALL_SHORTCUT_OPTIONS.map((opt) => {
                const isSelected = tempShortcuts.includes(opt.id);
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (isSelected) {
                        setTempShortcuts(tempShortcuts.filter((s) => s !== opt.id));
                      } else {
                        setTempShortcuts([...tempShortcuts, opt.id]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-slate-800 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3 pt-5 mt-5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveShortcuts}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

