import React, { createContext, useContext, useState, useEffect } from 'react';
import { erpStore } from '../lib/store';
import { User, Sale, Client, Product, TechnicalServiceOrder, InternalInstallmentPlan, DocumentType, Remito } from '../types';

export type AppModule =
  // Panel Principal & General
  | 'dashboard'
  | 'escritorio'
  // Ventas
  | 'pos'
  | 'sales_history'
  | 'remitos'
  | 'remitos_editor'
  | 'tickets_editor'
  | 'quotes'
  | 'receipts_vta'
  | 'orders_vta'
  | 'clients_ctacte'
  | 'loyalty_club'
  | 'coupons_offers'
  | 'birthdays'
  | 'raffles'
  | 'returns'
  | 'promotions'
  | 'ecommerce_catalog'
  | 'mercadolibre'
  | 'service_workshop'
  // Distribuidora
  | 'wholesale_orders'
  | 'wholesale_shipping'
  | 'wholesale_portal'
  | 'wholesale_store'
  | 'visual_catalog'
  | 'wholesale_distrib'
  // Compras
  | 'purchase_orders'
  | 'suppliers'
  | 'purchases_ai'
  | 'purchase_receipts'
  | 'purchases_automation'
  // Productos
  | 'inventory'
  | 'combos'
  | 'missing_stock'
  | 'stock_adjust'
  | 'mass_modification'
  | 'warehouses_branches'
  | 'stock_transfers'
  | 'branch_orders'
  | 'import_products'
  | 'import_stock'
  | 'brands_rubros'
  | 'price_tags'
  | 'price_lists'
  | 'mass_price_update'
  // Administración
  | 'finances'
  | 'cash_register'
  | 'money_boxes'
  | 'payment_receipts'
  | 'movements_query'
  | 'balances_debts'
  | 'installments'
  | 'loans_planning'
  | 'fixed_expenses'
  | 'finance_banks'
  | 'financial_intelligence'
  | 'reports_vat'
  | 'reports_citi'
  | 'fiscal_afip'
  | 'users_roles'
  | 'employees_payroll'
  | 'collection_methods'
  | 'mercadopago_payments'
  | 'digital_wallets'
  | 'admin_tasks'
  | 'internal_accountant'
  | 'c_suite_advisors'
  // Configuración
  | 'settings_backups'
  | 'integrations'
  | 'admin_dashboard'
  | 'user_role_manager'
  | 'produccion'
  | 'marketing_ai'
  | 'meta_ads'
  | 'whatsapp_bot'
  | 'agents_panel'
  | 'data_management'
  | 'backups_view'
  | 'internal_chat'
  | 'ai_assistant'
  | 'contabilidad';

interface AppContextType {
  activeModule: AppModule;
  setActiveModule: (module: AppModule) => void;
  setActiveTab: (module: AppModule | string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeWarehouseId: string;
  setActiveWarehouseId: (id: string) => void;
  store: typeof erpStore;
  refreshTrigger: number;
  triggerRefresh: () => void;
  // App Mode & Client Portal
  appMode: 'website' | 'erp' | 'client_portal';
  setAppMode: (mode: 'website' | 'erp' | 'client_portal') => void;
  loggedClient: Client | null;
  portalType: 'ctacte' | 'loyalty' | null;
  isAuthModalOpen: boolean;
  authModalInitialTab: 'staff' | 'ctacte' | 'loyalty';
  openAuthModal: (tab?: 'staff' | 'ctacte' | 'loyalty') => void;
  closeAuthModal: () => void;
  loginClient: (client: Client, type: 'ctacte' | 'loyalty') => void;
  logoutClient: () => void;
  switchToERP: () => void;
  switchToWebsite: () => void;
  // Modals & previews
  previewSale: Sale | null;
  setPreviewSale: (sale: Sale | null) => void;
  previewClientPortal: Client | null;
  setPreviewClientPortal: (client: Client | null) => void;
  pendingRemitoToBill: Remito | null;
  setPendingRemitoToBill: (remito: Remito | null) => void;
  activeToast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  globalSearch: string;
  setGlobalSearch: (s: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appMode, setAppMode] = useState<'website' | 'erp' | 'client_portal'>('website');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [portalType, setPortalType] = useState<'ctacte' | 'loyalty' | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'staff' | 'ctacte' | 'loyalty'>('staff');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [activeModule, setActiveModule] = useState<AppModule>('escritorio');
  const [currentUser, setCurrentUserState] = useState<User>(erpStore.users[0]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() => {
    const defaultUser = erpStore.users[0];
    if (defaultUser?.branchId) {
      return defaultUser.branchId;
    }
    const mainWh = erpStore.warehouses.find((w) => w.isMain) || erpStore.warehouses[0];
    return mainWh ? mainWh.id : '1';
  });

  const openAuthModal = (tab: 'staff' | 'ctacte' | 'loyalty' = 'staff') => {
    setAuthModalInitialTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const loginClient = (client: Client, type: 'ctacte' | 'loyalty') => {
    setLoggedClient(client);
    setPortalType(type);
    setAppMode('client_portal');
  };

  const logoutClient = () => {
    setLoggedClient(null);
    setPortalType(null);
    setAppMode('website');
  };

  const switchToERP = () => {
    setAppMode('erp');
  };

  const switchToWebsite = () => {
    setAppMode('website');
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    if (user.branchId) {
      setActiveWarehouseId(user.branchId);
      const wh = erpStore.warehouses.find((w) => w.id === user.branchId);
      if (wh) {
        showToast(`Operador activo: ${user.name} (${wh.name})`, 'info');
      }
    }
  };
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);
  const [previewClientPortal, setPreviewClientPortal] = useState<Client | null>(null);
  const [pendingRemitoToBill, setPendingRemitoToBill] = useState<Remito | null>(null);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    const unsubscribe = erpStore.subscribe(() => {
      triggerRefresh();
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActiveToast({ message, type });
    setTimeout(() => {
      setActiveToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  return (
    <AppContext.Provider
      value={{
        appMode,
        setAppMode,
        loggedClient,
        portalType,
        isAuthModalOpen,
        authModalInitialTab,
        openAuthModal,
        closeAuthModal,
        loginClient,
        logoutClient,
        switchToERP,
        switchToWebsite,
        activeModule,
        setActiveModule,
        setActiveTab: (mod: AppModule | string) => setActiveModule(mod as AppModule),
        currentUser,
        setCurrentUser,
        activeWarehouseId,
        setActiveWarehouseId,
        store: erpStore,
        refreshTrigger,
        triggerRefresh,
        previewSale,
        setPreviewSale,
        previewClientPortal,
        setPreviewClientPortal,
        pendingRemitoToBill,
        setPendingRemitoToBill,
        activeToast,
        showToast,
        globalSearch,
        setGlobalSearch,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = useApp;
