import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Globe,
  Package,
  CheckCircle2,
  ShoppingBag,
  Settings,
  Store,
  BarChart3,
  ExternalLink,
  Copy,
  Check,
  DollarSign,
  Calendar,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { CatalogTab } from './CatalogTab';
import { ActiveProductsTab } from './ActiveProductsTab';
import { OrdersTab } from './OrdersTab';
import { ConfigTab } from './ConfigTab';
import { WholesaleTab } from './WholesaleTab';
import { StatsTab } from './StatsTab';
import { WhatsAppCatalogTab } from './WhatsAppCatalogTab';
import { StorePreviewModal } from './StorePreviewModal';

type EcommerceSubTab =
  | 'catalog'
  | 'whatsapp_catalog'
  | 'active_products'
  | 'orders'
  | 'config'
  | 'wholesale'
  | 'stats';

export const EcommerceView: React.FC = () => {
  const { store, activeModule } = useApp();
  const [activeTab, setActiveTab] = useState<EcommerceSubTab>('catalog');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showStorePreview, setShowStorePreview] = useState(false);

  // Sync initial tab based on activeModule
  React.useEffect(() => {
    if (activeModule === 'wholesale_orders' || activeModule === 'mercadolibre') {
      setActiveTab('orders');
    } else if (
      activeModule === 'wholesale_portal' ||
      activeModule === 'wholesale_store' ||
      activeModule === 'wholesale_shipping' ||
      activeModule === 'wholesale_distrib'
    ) {
      setActiveTab('wholesale');
    } else if (activeModule === 'visual_catalog') {
      setActiveTab('catalog');
    }
  }, [activeModule]);

  const config = store.ecommerceConfig || {};
  const products = store.products || [];
  const orders = store.ecommerceOrders || [];
  const onlineProductsCount = products.filter((p) => p.publishOnline !== false).length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'Pendiente').length;
  
  // Today's orders count
  const todayStr = new Date().toLocaleDateString('es-AR');
  const todayOrdersCount = orders.filter((o) => o.date === todayStr).length;

  // Total online sales
  const totalSalesAmount = orders
    .filter((o) => o.status !== 'Cancelado')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const storeUrl = 'https://ferreteriabruzzone.com.ar/tienda';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-28 animate-in fade-in duration-200">
        {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              E-Commerce
            </h1>
            <p className="text-xs text-slate-400">
              Gestión de tienda online, catálogo y pedidos
            </p>
          </div>
        </div>

        {/* Right action & status bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Link pill */}
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-mono text-slate-300 font-semibold">{storeUrl}</span>
            <button
              onClick={handleCopyLink}
              className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
              title="Copiar Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tienda Activa</span>
          </div>

          {/* Ver Tienda */}
          <button
            onClick={() => setShowStorePreview(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver Tienda</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-100">{onlineProductsCount}</span>
            <p className="text-[11px] font-semibold text-slate-400">Productos Online</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-100">{pendingOrdersCount}</span>
            <p className="text-[11px] font-semibold text-slate-400">Pedidos Pendientes</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-slate-100">{todayOrdersCount}</span>
            <p className="text-[11px] font-semibold text-slate-400">Pedidos Hoy</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              ${totalSalesAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] font-semibold text-slate-400">Ventas Online</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'catalog', label: 'Catálogo', icon: Package },
          { id: 'whatsapp_catalog', label: 'Catálogo WhatsApp', icon: MessageSquare },
          { id: 'active_products', label: 'Productos Activos', icon: CheckCircle2 },
          { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
          { id: 'config', label: 'Configuración', icon: Settings },
          { id: 'wholesale', label: 'Distribuidora', icon: Store },
          { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EcommerceSubTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'catalog' && <CatalogTab />}
        {activeTab === 'whatsapp_catalog' && <WhatsAppCatalogTab />}
        {activeTab === 'active_products' && <ActiveProductsTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'config' && <ConfigTab />}
        {activeTab === 'wholesale' && <WholesaleTab />}
        {activeTab === 'stats' && <StatsTab />}
      </div>

      {/* Public Store Preview Modal */}
      {showStorePreview && (
        <StorePreviewModal onClose={() => setShowStorePreview(false)} />
      )}
      </div>
    </div>
  );
};
