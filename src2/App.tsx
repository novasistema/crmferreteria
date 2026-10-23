/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { POSView } from './components/pos/POSView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { RemitosView } from './components/sales/RemitosView';
import { InventoryView } from './components/inventory/InventoryView';
import { MissingStockView } from './components/inventory/MissingStockView';
import { StockAdjustView } from './components/inventory/StockAdjustView';
import { CombosView } from './components/inventory/CombosView';
import { PriceUpdateWizard } from './components/inventory/PriceUpdateWizard';
import { MassModificationView } from './components/inventory/MassModificationView';
import { PriceTagsView } from './components/inventory/PriceTagsView';
import { PriceListsView } from './components/inventory/PriceListsView';
import { BranchesManagementView } from './components/inventory/BranchesManagementView';
import { BrandsRubrosView } from './components/inventory/BrandsRubrosView';
import { OpenTabsBar } from './components/layout/OpenTabsBar';
import { RemitoTemplateEditor } from './components/templates/RemitoTemplateEditor';
import { TicketTemplateEditor } from './components/templates/TicketTemplateEditor';
import { ClientsView } from './components/clients/ClientsView';
import { CashRegisterView } from './components/cash/CashRegisterView';
import { MoneyBoxesView } from './components/cash/MoneyBoxesView';
import { MovementsQueryView } from './components/cash/MovementsQueryView';
import { BalancesDebtsView } from './components/finance/BalancesDebtsView';
import { FixedExpensesView } from './components/finance/FixedExpensesView';
import { LoansPlanningView } from './components/finance/LoansPlanningView';
import { InternalInstallmentsView } from './components/installments/InternalInstallmentsView';
import { QuotesView } from './components/quotes/QuotesView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { PurchaseOrdersView } from './components/purchases/PurchaseOrdersView';
import { PurchaseReceiptsView } from './components/purchases/PurchaseReceiptsView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { PurchasesAIManagementView } from './components/purchases/PurchasesAIManagementView';
import { LoyaltyView } from './components/loyalty/LoyaltyView';
import { ReportsView } from './components/reports/ReportsView';
import { FinancialIntelligenceView } from './components/finance/FinancialIntelligenceView';
import { FinancesView } from './components/finance/FinancesView';
import { MainDashboardView } from './components/dashboard/MainDashboardView';
import { EscritorioView } from './components/home/EscritorioView';
import { SettingsView } from './components/settings/SettingsView';
import { PersonalView } from './components/personal/PersonalView';
import { ServicioTecnicoView } from './components/workshop/ServicioTecnicoView';
import { MarketingAutonomousBotView } from './components/marketing/MarketingAutonomousBotView';
import { WholesaleOrdersView } from './components/wholesale/WholesaleOrdersView';
import { WholesaleShippingView } from './components/wholesale/WholesaleShippingView';
import { VisualCatalogView } from './components/wholesale/VisualCatalogView';
import { WholesalePortalView } from './components/wholesale/WholesalePortalView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserRoleManager } from './components/admin/UserRoleManager';
import { HomeWebsiteView } from './components/home/HomeWebsiteView';
import { AuthPortalModal } from './components/home/AuthPortalModal';
import { ClientCtaCtePortal } from './components/portal/ClientCtaCtePortal';
import { ClientLoyaltyPortal } from './components/portal/ClientLoyaltyPortal';
import { EcommerceView } from './components/ecommerce/EcommerceView';
import { MercadoLibreView } from './components/ecommerce/MercadoLibreView';
import { ProductionView } from './components/production/ProductionView';
import { ReturnsView } from './components/returns/ReturnsView';
import { ContabilidadView } from './components/accounting/ContabilidadView';
import { ContadorInternoView } from './components/accounting/ContadorInternoView';
import { C_SuiteAdvisorsView } from './components/finance/C_SuiteAdvisorsView';
import { MercadoPagoPaymentsView } from './components/cash/MercadoPagoPaymentsView';
import { CollectionMethodsView } from './components/cash/CollectionMethodsView';
import { TasksView } from './components/tasks/TasksView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    appMode,
    loggedClient,
    portalType,
    isAuthModalOpen,
    authModalInitialTab,
    openAuthModal,
    closeAuthModal,
    logoutClient,
    switchToWebsite,
    activeModule,
    activeToast,
    theme,
    store,
  } = useApp();

  // Render Portal if logged in as Client
  if (appMode === 'client_portal' && loggedClient) {
    if (portalType === 'ctacte') {
      return (
        <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
          <ClientCtaCtePortal
            client={loggedClient}
            onLogout={logoutClient}
            onReturnToWeb={switchToWebsite}
          />
          {activeToast && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 bg-slate-900 border-slate-700 text-white">
              {activeToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {activeToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {activeToast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>{activeToast.message}</span>
            </div>
          )}
        </div>
      );
    }

    if (portalType === 'loyalty') {
      return (
        <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
          <ClientLoyaltyPortal
            client={loggedClient}
            onLogout={logoutClient}
            onReturnToWeb={switchToWebsite}
          />
          {activeToast && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 bg-slate-900 border-slate-700 text-white">
              {activeToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {activeToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {activeToast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
              <span>{activeToast.message}</span>
            </div>
          )}
        </div>
      );
    }
  }

  // Render Public Website Mode
  if (appMode === 'website') {
    return (
      <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
        <HomeWebsiteView onOpenAuthModal={openAuthModal} />

        <AuthPortalModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialTab={authModalInitialTab}
        />

        {activeToast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 bg-slate-900 border-slate-700 text-white">
            {activeToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {activeToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {activeToast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{activeToast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // ERP Management Layout (Personal & Administración)
  const renderActiveModule = () => {
    switch (activeModule) {
      // Panel Principal
      case 'escritorio':
        return <EscritorioView />;
      case 'dashboard':
        return <MainDashboardView />;

      // Ventas
      case 'pos':
        return <POSView />;
      case 'sales_history':
      case 'receipts_vta':
      case 'orders_vta':
        return <SalesHistoryView />;
      case 'returns':
        return <ReturnsView />;
      case 'remitos':
        return <RemitosView />;
      case 'quotes':
        return <QuotesView />;
      case 'clients_ctacte':
      case 'birthdays':
        return <ClientsView />;
      case 'loyalty_club':
      case 'raffles':
        return <LoyaltyView />;
      case 'coupons_offers':
      case 'promotions':
      case 'combos':
        return <CombosView />;
      case 'ecommerce_catalog':
        return <EcommerceView />;
      case 'mercadolibre':
        return <MercadoLibreView />;
      case 'produccion':
        return <ProductionView />;

      // Distribuidora
      case 'wholesale_orders':
        return <WholesaleOrdersView />;
      case 'wholesale_shipping':
        return <WholesaleShippingView />;
      case 'visual_catalog':
        return <VisualCatalogView />;
      case 'wholesale_portal':
        return <WholesalePortalView />;
      case 'wholesale_store':
      case 'wholesale_distrib':
        return <EcommerceView />;

      // Compras
      case 'purchase_orders':
        return <PurchaseOrdersView />;
      case 'purchase_receipts':
        return <PurchaseReceiptsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'purchases_ai':
      case 'purchases_automation':
        return <PurchasesAIManagementView />;

      // Productos
      case 'inventory':
        return <InventoryView />;
      case 'missing_stock':
        return <MissingStockView />;
      case 'stock_adjust':
        return <StockAdjustView />;
      case 'import_products':
      case 'import_stock':
        return <InventoryView />;
      case 'brands_rubros':
        return <BrandsRubrosView />;
      case 'mass_modification':
        return <MassModificationView />;
      case 'price_lists':
        return <PriceListsView />;
      case 'price_tags':
        return <PriceTagsView />;
      case 'warehouses_branches':
      case 'stock_transfers':
      case 'branch_orders':
        return <BranchesManagementView />;
      case 'mass_price_update':
        return <PriceUpdateWizard />;

      // Contabilidad
      case 'contabilidad':
        return <ContabilidadView />;

      // Administración
      case 'finances':
        return <FinancesView />;
      case 'internal_accountant':
        return <ContadorInternoView />;
      case 'c_suite_advisors':
        return <C_SuiteAdvisorsView />;
      case 'financial_intelligence':
      case 'finance_banks':
        return <FinancialIntelligenceView />;
      case 'cash_register':
      case 'payment_receipts':
        return <CashRegisterView />;
      case 'collection_methods':
        return <CollectionMethodsView />;
      case 'mercadopago_payments':
      case 'digital_wallets':
        return <MercadoPagoPaymentsView />;
      case 'money_boxes':
        return <MoneyBoxesView />;
      case 'movements_query':
        return <MovementsQueryView />;
      case 'balances_debts':
        return <BalancesDebtsView />;
      case 'fixed_expenses':
        return <FixedExpensesView />;
      case 'installments':
        return <InternalInstallmentsView />;
      case 'loans_planning':
        return <LoansPlanningView />;
      case 'reports_vat':
      case 'reports_citi':
      case 'fiscal_afip':
        return <ReportsView />;

      // Configuración & Extras
      case 'settings_backups':
      case 'integrations':
        return <SettingsView />;
      case 'admin_dashboard':
        return <AdminDashboard />;
      case 'user_role_manager':
        return <UserRoleManager />;
      case 'marketing_ai':
        return <MarketingAutonomousBotView />;
      case 'meta_ads':
      case 'whatsapp_bot':
      case 'agents_panel':
      case 'data_management':
      case 'backups_view':
      case 'internal_chat':
      case 'ai_assistant':
      case 'users_roles':
        return <SettingsView />;
      case 'admin_tasks':
        return <TasksView />;
      case 'employees_payroll':
        return <PersonalView />;
      case 'service_workshop':
        return <ServicioTecnicoView />;
      case 'remitos_editor':
        return <RemitoTemplateEditor />;
      case 'tickets_editor':
        return <TicketTemplateEditor />;

      default:
        return <POSView />;
    }
  };

  const menuLayout = store.settings.menuLayout || 'horizontal';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
      {/* Top Header with all Module Dropdowns - Always Dark */}
      <Header />

      {/* Main body area: Sidebar (if vertical) + Content Workspace */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {menuLayout === 'vertical' && <Sidebar />}

        <div className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${theme === 'light' ? 'bg-white' : 'bg-slate-950'}`}>
          {/* Multi-Tab Workspace Bar - Always Dark */}
          <OpenTabsBar />

          {/* Full-width Main Content Area - Unified white theme for modules with dark menu bar */}
          <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto relative ${theme === 'light' ? 'light-module-theme bg-white text-slate-900' : 'dark bg-slate-950 text-slate-100'}`}>
            {renderActiveModule()}
          </main>
        </div>
      </div>

      {/* Auth Portal Modal */}
      <AuthPortalModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialTab={authModalInitialTab}
      />

      {/* Toast Notification Container */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 bg-slate-900 border-slate-700 text-white">
          {activeToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {activeToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {activeToast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
          <span>{activeToast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
