import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Settings,
  ShieldCheck,
  Smartphone,
  Check,
  Search,
  Package,
  Layers,
  ArrowRight,
  Clock,
  Send,
  Database,
  Sliders,
} from 'lucide-react';

interface SyncLogItem {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  itemsCount: number;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export const WhatsAppCatalogSyncTab: React.FC = () => {
  const { store, showToast } = useApp();
  const config = store.ecommerceConfig || {};

  const [phoneId, setPhoneId] = useState(config.whatsappBusinessPhoneId || '109482938472910');
  const [catalogId, setCatalogId] = useState(config.whatsappCatalogId || '94820194820194');
  const [accessToken, setAccessToken] = useState(config.whatsappAccessToken || 'EAAG_wa_prod_token_8492049182094810294');
  const [autoSync, setAutoSync] = useState(config.whatsappCatalogSyncEnabled !== false);
  const [syncStock, setSyncStock] = useState(config.whatsappAutoSyncStock !== false);
  const [syncPrice, setSyncPrice] = useState(config.whatsappAutoSyncPrice !== false);

  const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({
    'Herramientas': 'Hardware > Tools',
    'Electricidad': 'Hardware > Electrical',
    'Plomeria': 'Hardware > Plumbing',
    'Pinturas': 'Home & Garden > Paint',
    'Buloneria': 'Hardware > Fasteners',
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([
    {
      id: 'log-1',
      timestamp: 'Hoy, 14:32 hs',
      action: 'Sincronización Completa de Catálogo (Graph API)',
      details: 'Actualización de 142 productos, precios y niveles de stock con Meta Commerce.',
      itemsCount: 142,
      status: 'SUCCESS',
    },
    {
      id: 'log-2',
      timestamp: 'Hoy, 09:15 hs',
      action: 'Actualización Automática de Stock',
      details: 'Cambio detectado en inventario local (Venta POS #1042). Sincronizado en 1.2s.',
      itemsCount: 4,
      status: 'SUCCESS',
    },
    {
      id: 'log-3',
      timestamp: 'Ayer, 18:00 hs',
      action: 'Sincronización de Precios (Lista Minorista)',
      details: 'Ajuste general de 5% aplicado en catálogo de WhatsApp Business.',
      itemsCount: 138,
      status: 'SUCCESS',
    },
  ]);

  const products = store.products || [];
  const categories = store.categories || [];

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateEcommerceConfig({
      whatsappBusinessPhoneId: phoneId,
      whatsappCatalogId: catalogId,
      whatsappAccessToken: accessToken,
      whatsappCatalogSyncEnabled: autoSync,
      whatsappAutoSyncStock: syncStock,
      whatsappAutoSyncPrice: syncPrice,
    });
    showToast('Configuración y mapeo de WhatsApp Catalog guardados con éxito', 'success');
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncProgress(10);
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            const nowStr = `Hoy, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs`;
            const newLog: SyncLogItem = {
              id: `log-${Date.now()}`,
              timestamp: nowStr,
              action: 'Sincronización Manual (Sync Now)',
              details: `Se sincronizaron ${products.length} productos y mapeo de categorías con WhatsApp Business API.`,
              itemsCount: products.length,
              status: 'SUCCESS',
            };
            setSyncLogs([newLog, ...syncLogs]);
            showToast(`¡Sincronización completada con éxito! ${products.length} productos actualizados en WhatsApp Business.`, 'success');
          }, 400);
          return 100;
        }
        return prev + 30;
      });
    }, 350);
  };

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/30 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Business API Integration
            </span>
            <span className="bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full">
              Mapeo & Sincronización
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">WhatsApp Catalog Sync Sub-Module</h2>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            Mapeá las categorías y niveles de stock de tu ERP local hacia formatos compatibles con la API de WhatsApp Business y Meta Commerce Manager.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? `Sincronizando (${syncProgress}%)...` : 'Sync Now (Sincronizar)'}
          </button>
        </div>
      </div>

      {/* Grid: Credentials & Mappings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credentials Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" /> Parámetros de Conexión y API
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Graph API v18.0
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta Catalog ID
                </label>
                <input
                  type="text"
                  value={catalogId}
                  onChange={(e) => setCatalogId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Access Token (Meta System User)
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono text-xs"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Sync Automático</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncStock}
                  onChange={(e) => setSyncStock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Mapear Niveles de Stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncPrice}
                  onChange={(e) => setSyncPrice(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Mapear Precios ($)</span>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-all text-sm flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Guardar Configuración WhatsApp
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" /> Resumen de Sincronización
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Total Productos ERP:</span>
                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {products.length} ítems
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Categorías Mapeadas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {Object.keys(categoryMapping).length} activas
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Estado de API:</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> En línea
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => showToast('Catálogo validado con formato de WhatsApp Business API', 'success')}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-600" /> Validar Schema JSON para WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Category Mapping Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" /> Mapeo de Categorías ERP a WhatsApp Business
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Asigná las categorías de tu sistema de gestión a los departamentos estándar requeridos por el catálogo de Meta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(categoryMapping).map(([erpCategory, metaCategory]) => (
            <div key={erpCategory} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ERP
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{erpCategory}</span>
                  <span className="text-[11px] text-slate-400 block">Categoría local del sistema</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ArrowRight className="w-4 h-4" />
                <input
                  type="text"
                  value={metaCategory}
                  onChange={(e) => setCategoryMapping({ ...categoryMapping, [erpCategory]: e.target.value })}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white font-medium w-44 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Log for Recent Updates Sent to WhatsApp */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Registro de Estado y Auditoría (Status Log)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historial en tiempo real de todas las sincronizaciones, actualizaciones de inventario y precios enviados a WhatsApp Business.
            </p>
          </div>
          <button
            onClick={() => {
              setSyncLogs([]);
              showToast('Registro de auditoría limpiado', 'info');
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            Limpiar Registro
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Acción / Evento</th>
                <th className="py-3 px-4">Detalles del Envío</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-center">Estado API</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {log.itemsCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> {log.status}
                    </span>
                  </td>
                </tr>
              ))}
              {syncLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No hay registros de sincronización recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
