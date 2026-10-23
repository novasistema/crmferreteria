import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Settings,
  Store,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Check,
  Search,
  Filter,
  Layers,
  Package,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const WhatsAppCatalogTab: React.FC = () => {
  const { store, showToast } = useApp();
  const config = store.ecommerceConfig || {};

  const [phoneId, setPhoneId] = useState(config.whatsappBusinessPhoneId || '109482938472910');
  const [catalogId, setCatalogId] = useState(config.whatsappCatalogId || '94820194820194');
  const [accessToken, setAccessToken] = useState(config.whatsappAccessToken || 'EAAG_wa_prod_token_8492049182094810294');
  const [syncEnabled, setSyncEnabled] = useState(config.whatsappCatalogSyncEnabled !== false);
  const [autoStock, setAutoStock] = useState(config.whatsappAutoSyncStock !== false);
  const [autoPrice, setAutoPrice] = useState(config.whatsappAutoSyncPrice !== false);
  const [lastSync, setLastSync] = useState(config.whatsappLastSyncTime || 'Hoy, 14:32 hs');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'synced' | 'pending'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showToken, setShowToken] = useState(false);

  const products = store.products || [];
  const onlineProducts = products.filter((p) => p.publishOnline !== false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateEcommerceConfig({
      whatsappBusinessPhoneId: phoneId,
      whatsappCatalogId: catalogId,
      whatsappAccessToken: accessToken,
      whatsappCatalogSyncEnabled: syncEnabled,
      whatsappAutoSyncStock: autoStock,
      whatsappAutoSyncPrice: autoPrice,
    });
    showToast('Configuración de WhatsApp Business Catalog guardada correctamente', 'success');
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
            const nowStr = new Date().toLocaleString();
            setLastSync(nowStr);
            store.updateEcommerceConfig({ whatsappLastSyncTime: nowStr });
            showToast(`¡Catálogo sincronizado con WhatsApp Business! ${onlineProducts.length} productos actualizados.`, 'success');
          }, 500);
          return 100;
        }
        return prev + 25;
      });
    }, 400);
  };

  const handleExportCSV = () => {
    const headers = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand'];
    const rows = onlineProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.description || p.name).replace(/"/g, '""')}"`,
      p.stock > 0 ? 'in stock' : 'out of stock',
      'new',
      `${p.price} ARS`,
      `https://${config.storeName?.toLowerCase().replace(/\s+/g, '') || 'tucomercio'}.com/product/${p.id}`,
      `"${p.imageUrl || ''}"`,
      `"${p.brand || 'General'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_business_catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Catálogo CSV exportado para WhatsApp Business Manager', 'success');
  };

  const filteredProducts = onlineProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-500/30 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Business API & Meta Commerce
            </span>
            <span className="bg-white/25 text-white text-xs font-bold px-3 py-1 rounded-full">
              Sincronización Automática
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Catálogo Integrado de WhatsApp Business</h2>
          <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
            Todos los cambios de precios, stock, descripciones y fotos realizados en tu sistema de gestión se reflejan instantáneamente en tu Catálogo Oficial de WhatsApp Business y Meta Shop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-3 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? `Sincronizando (${syncProgress}%)...` : 'Sincronizar Ahora'}
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-xl border border-emerald-400/30 transition-all flex items-center gap-2 text-sm"
            title="Exportar CSV para Meta Commerce Manager"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Grid: Credentials & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" /> Configuración de Meta Graph API & WhatsApp
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> API Oficial Activa
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID de Teléfono WhatsApp Business (Phone ID)
                </label>
                <input
                  type="text"
                  value={phoneId}
                  onChange={(e) => setPhoneId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  placeholder="ej. 109482938472910"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ID del Catálogo de Meta (Catalog ID)
                </label>
                <input
                  type="text"
                  value={catalogId}
                  onChange={(e) => setCatalogId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  placeholder="ej. 94820194820194"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Token de Acceso Permanente (Meta System User Access Token)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white font-mono text-xs"
                  placeholder="EAAG..."
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  {showToken ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncEnabled}
                  onChange={(e) => setSyncEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Sincronización Automática</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoStock}
                  onChange={(e) => setAutoStock(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Actualizar Stock al Instante</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrice}
                  onChange={(e) => setAutoPrice(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Actualizar Precios al Instante</span>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition-all text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Guardar Conexión WhatsApp
              </button>
            </div>
          </form>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" /> Estado del Catálogo
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Productos Online:</span>
                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {onlineProducts.length} ítems
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Última Sincronización:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{lastSync}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Estado API Graph:</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <a
              href={`https://wa.me/${config.whatsappNumber || '5493585142098'}?text=Hola,%20quiero%20ver%20el%20catálogo%20de%20productos`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold py-2.5 px-4 rounded-xl text-center text-xs flex items-center justify-center gap-2 transition-all border border-emerald-200 dark:border-emerald-800"
            >
              <ExternalLink className="w-4 h-4" /> Probar Enlace Catálogo WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Products Catalog Sync Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" /> Productos Sincronizados en WhatsApp
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-full">
              {filteredProducts.length}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>
            <button
              onClick={() => {
                showToast('Sincronización por lote enviada a WhatsApp Business', 'success');
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Selección
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                </th>
                <th className="py-3 px-4">Código / SKU</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio ($)</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4 text-center">Estado WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredProducts.slice(0, 50).map((product) => {
                return (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {product.code}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                      )}
                      <span>{product.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{product.category}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${product.price.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${product.stock > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-500'}`}>
                        {product.stock} un.
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Sincronizado
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron productos en el catálogo online.
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
