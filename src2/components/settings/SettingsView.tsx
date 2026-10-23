import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanyTab } from './CompanyTab';
import { AfipTab } from './AfipTab';
import { PrintTab } from './PrintTab';
import { CurrencyTab } from './CurrencyTab';
import { ShippingTab } from './ShippingTab';
import { TemplatesTab } from './TemplatesTab';
import { UsersTab } from './UsersTab';
import { IntegrationsTab } from './IntegrationsTab';
import { WhatsAppCatalogSyncTab } from './WhatsAppCatalogSyncTab';
import { ModulesControlTab } from './ModulesControlTab';
import {
  Settings,
  Building2,
  Zap,
  Printer,
  DollarSign,
  Truck,
  MessageSquare,
  Users,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Package,
  Layers,
  Receipt,
  Plug,
  ShieldCheck,
} from 'lucide-react';

export type SettingsTabType =
  | 'company'
  | 'afip'
  | 'print'
  | 'currency'
  | 'shipping'
  | 'templates'
  | 'users'
  | 'integrations'
  | 'whatsapp_catalog'
  | 'modules_control'
  | 'backup';

export const SettingsView: React.FC = () => {
  const { store, showToast, activeModule } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTabType>('company');
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  useEffect(() => {
    if (activeModule === 'backups_view' || activeModule === 'data_management') {
      setActiveTab('backup');
    } else if (activeModule === 'users_roles' || activeModule === 'employees_payroll') {
      setActiveTab('users');
    } else if (activeModule === 'whatsapp_bot' || activeModule === 'whatsapp_catalog') {
      setActiveTab('whatsapp_catalog');
    } else if (
      activeModule === 'integrations' ||
      activeModule === 'marketing_ai' ||
      activeModule === 'meta_ads' ||
      activeModule === 'agents_panel' ||
      activeModule === 'internal_chat' ||
      activeModule === 'ai_assistant'
    ) {
      setActiveTab('integrations');
    } else if (activeModule === 'fiscal_afip') {
      setActiveTab('afip');
    } else if (activeModule === 'settings_backups') {
      setActiveTab('company');
    }
  }, [activeModule]);

  const handleExportBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      company: store.settings,
      currencyConfig: store.currencyConfig,
      shippingCarriers: store.shippingCarriers,
      messageTemplates: store.messageTemplates,
      printConfigs: store.printConfigs,
      warehouses: store.warehouses,
      products: store.products,
      clients: store.clients,
      suppliers: store.suppliers,
      priceLists: store.priceLists,
      cashRegisters: store.cashRegisters,
      fixedExpenses: store.fixedExpenses,
      salesCount: store.sales.length,
      purchasesCount: store.purchases.length,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup JSON descargado correctamente', 'success');
  };

  const handleRestoreDefaultBackup = () => {
    store.restoreBackupData();
    setShowRestoreModal(false);
    showToast('Base de datos y configuración restauradas con éxito', 'success');
  };

  const tabs: { id: SettingsTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'afip', label: 'ARCA / AFIP', icon: Zap },
    { id: 'print', label: 'Impresión', icon: Printer },
    { id: 'currency', label: 'Moneda', icon: DollarSign },
    { id: 'shipping', label: 'Transporte', icon: Truck },
    { id: 'templates', label: 'Plantillas', icon: MessageSquare },
    { id: 'users', label: 'Usuarios & Roles', icon: Users },
    { id: 'integrations', label: 'Integraciones & IA', icon: Plug },
    { id: 'whatsapp_catalog', label: 'WhatsApp Catalog Sync', icon: MessageSquare },
    { id: 'modules_control', label: 'Control de Módulos (Creador)', icon: ShieldCheck },
    { id: 'backup', label: 'Copia de Seguridad', icon: Database },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">
              Configuración del Sistema
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Administrá los datos de tu empresa, facturación ARCA, plantillas de impresión, moneda, envíos e integraciones.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            PV #{store.settings.fiscalPointOfSale || 5} • {store.settings.tradeName || 'FERRETERIA BELLEZZE'}
          </span>
        </div>
      </div>

      {/* Tabs Navigation Pills */}
      <div className="px-4 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 flex space-x-1.5 overflow-x-auto shrink-0 custom-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        {activeTab === 'company' && <CompanyTab />}
        {activeTab === 'afip' && <AfipTab />}
        {activeTab === 'print' && <PrintTab />}
        {activeTab === 'currency' && <CurrencyTab />}
        {activeTab === 'shipping' && <ShippingTab />}
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'whatsapp_catalog' && <WhatsAppCatalogSyncTab />}
        {activeTab === 'modules_control' && <ModulesControlTab />}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="max-w-5xl space-y-6 pb-12">
            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-xs">
                <Package className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {store.products.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Productos</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-xs">
                <Users className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {store.clients.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Clientes</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-xs">
                <Truck className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {store.suppliers.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Proveedores</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-xs">
                <Layers className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {store.warehouses.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Depósitos</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-xs">
                <DollarSign className="w-5 h-5 text-cyan-500 mx-auto mb-1.5" />
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {store.cashRegisters.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Cajas</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-center shadow-xs">
                <Receipt className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
                <span className="text-lg font-black text-slate-900 dark:text-white block">
                  {store.fixedExpenses.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Gastos Fijos</span>
              </div>
            </div>

            {/* Backup Actions Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Gestión de Copias de Seguridad & Restauración</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Export Backup Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
                      <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Descargar Backup JSON Completo</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Genera un archivo JSON con todo el catálogo de productos, clientes, listas de precios, transportes y configuraciones.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Copia de Seguridad</span>
                  </button>
                </div>

                {/* Import Backup Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
                      <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Importar Respaldo (JSON o SQL)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Carga un archivo JSON o un respaldo PostgreSQL (.sql) de tu sistema anterior para migrar tus datos.
                    </p>
                  </div>
                  <label className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Seleccionar Archivo (.JSON / .SQL)</span>
                    <input
                      type="file"
                      accept=".json,.sql,text/plain"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const content = event.target?.result as string;
                            if (file.name.endsWith('.sql')) {
                              store.importSqlBackupData(content);
                              showToast('Archivo SQL de PostgreSQL importado correctamente', 'success');
                            } else {
                              try {
                                const json = JSON.parse(content);
                                store.importBackupData(json);
                                showToast('Copia de seguridad importada con éxito', 'success');
                              } catch (err) {
                                showToast('Error al parsear el archivo de respaldo', 'error');
                              }
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Restore Backup Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2 text-xs">
                      <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Restaurar Datos Oficiales Iniciales</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Recarga el padrón oficial de productos, marcas (Wokin, Bremen, Aliafor, Fana Química, etc.), cajas y depósitos.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRestoreModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Restaurar Copia del Sistema</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Restoration */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-center text-slate-900 dark:text-white">
              ¿Restaurar Base de Datos Inicial?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
              Esta acción recargará la configuración y el padrón de productos, depósitos, listas de precios y cajas. Los cambios locales se sincronizarán con los datos originales.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestoreDefaultBackup}
                className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md transition-colors"
              >
                Confirmar y Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
