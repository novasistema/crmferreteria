import React, { useState } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Truck, 
  Package, 
  Users, 
  PackageSearch, 
  Sparkles, 
  DollarSign, 
  TrendingUp, 
  QrCode, 
  Store, 
  BadgePercent, 
  Cake, 
  RotateCw, 
  Wallet, 
  Wrench, 
  FileText, 
  Building2,
  FileSpreadsheet,
  SlidersHorizontal,
  CheckCircle2,
  ArrowRight,
  Pin,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ModuleKey, ProductionOrder, SalesOrder, Customer, RawMaterial, Product, CompanyConfig } from '../types';
import { DataDashboardWithBars } from './DataDashboardWithBars';
import { CumpleanosModal } from './CumpleanosModal';
import { ServicioTecnicoModal } from './ServicioTecnicoModal';
import { MercadoPagoModal } from './MercadoPagoModal';

interface DesktopModuleProps {
  setActiveModule: (module: ModuleKey) => void;
  productionOrders: ProductionOrder[];
  salesOrders: SalesOrder[];
  customers: Customer[];
  rawMaterials: RawMaterial[];
  products: Product[];
  config?: CompanyConfig | null;
  onOpenNewProductionModal: () => void;
  onOpenNewSalesModal: () => void;
  onExportPriceListExcel: () => void;
  onNavigateToCustomer?: (customer: Customer) => void;
  onOpenMobileSellerApp?: () => void;
}

interface NovaShortcut {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  action: () => void;
  pinned: boolean;
}

export const DesktopModule: React.FC<DesktopModuleProps> = ({
  setActiveModule,
  productionOrders,
  salesOrders,
  customers,
  rawMaterials,
  products,
  config,
  onOpenNewProductionModal,
  onOpenNewSalesModal,
  onExportPriceListExcel,
  onNavigateToCustomer,
  onOpenMobileSellerApp
}) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'bars_dashboard'>('shortcuts');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modals for special modules
  const [isCumpleanosOpen, setIsCumpleanosOpen] = useState(false);
  const [isServicioTecnicoOpen, setIsServicioTecnicoOpen] = useState(false);
  const [isMercadoPagoOpen, setIsMercadoPagoOpen] = useState(false);

  // Export 90 days report function
  const handleExport90DaysReport = () => {
    try {
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Filter sales in last 90 days
      const sales90d = salesOrders.filter(o => new Date(o.date) >= ninetyDaysAgo);
      const totalSalesAmount = sales90d.reduce((acc, o) => acc + o.total, 0);
      const totalPaidAmount = sales90d.reduce((acc, o) => acc + (o.paidAmount || 0), 0);

      // 1. Resumen
      const summaryData = [
        ['INFORME DE GESTIÓN INTEGRAL (90 DÍAS) - NOVA SYSTEMS ERP'],
        ['Empresa:', config?.companyName || 'Colorear Pinturas S.R.L.'],
        ['Período:', `${ninetyDaysAgo.toISOString().split('T')[0]} hasta ${now.toISOString().split('T')[0]}`],
        ['Fecha Emisión:', now.toLocaleString('es-AR')],
        [''],
        ['MÉTRICA', 'VALOR'],
        ['Total Órdenes Emitidas (90d)', sales90d.length],
        ['Monto Total Facturado', totalSalesAmount],
        ['Total Cobrado', totalPaidAmount],
        ['Saldo Pendiente de Cobro', totalSalesAmount - totalPaidAmount],
        ['Clientes en Cartera', customers.length],
        ['Clientes con Saldo Deudor', customers.filter(c => c.currentBalance > 0).length],
        ['Total Deuda en Cuentas Corrientes', customers.reduce((acc, c) => acc + c.currentBalance, 0)],
        ['Artículos en Catálogo', products.length]
      ];

      // 2. Ventas
      const salesData = [
        ['Fecha', 'Nro Orden', 'Comprobante', 'Cliente', 'CUIT', 'Condición', 'Total (ARS)', 'Estado Entrega', 'Estado Pago'],
        ...sales90d.map(o => [
          o.date.split('T')[0],
          o.orderNumber,
          o.invoiceNumber || 'S/N',
          o.customerName,
          o.customerTaxId,
          o.billingType === 'arca' ? 'Oficial ARCA' : 'Interno',
          o.total,
          o.deliveryStatus || 'Total',
          o.paymentStatus
        ])
      ];

      // 3. Cuentas Corrientes
      const customersData = [
        ['Cliente', 'CUIT', 'Categoría Fiscal', 'Saldo Actual (ARS)', 'Teléfono', 'Localidad'],
        ...customers.map(c => [
          c.businessName,
          c.taxId,
          c.taxCategory,
          c.currentBalance,
          c.phone || '',
          c.city
        ])
      ];

      // 4. Inventario Stock
      const stockData = [
        ['Código', 'Nombre Producto', 'Categoría', 'Presentación', 'Stock Actual', 'Precio Minorista', 'Precio Mayorista'],
        ...products.map(p => [
          p.code,
          p.name,
          p.category,
          p.presentation,
          p.stock,
          p.priceRetail || 0,
          p.priceWholesale || 0
        ])
      ];

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      const wsSales = XLSX.utils.aoa_to_sheet(salesData);
      const wsCust = XLSX.utils.aoa_to_sheet(customersData);
      const wsStock = XLSX.utils.aoa_to_sheet(stockData);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen 90 Días');
      XLSX.utils.book_append_sheet(wb, wsSales, 'Ventas');
      XLSX.utils.book_append_sheet(wb, wsCust, 'Cuentas Corrientes');
      XLSX.utils.book_append_sheet(wb, wsStock, 'Stock Valorizado');

      const fileName = `NovaSystems_Informe_90_Dias_${now.toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setExportNotice(`Informe de 90 días generado con éxito: ${fileName}`);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (e) {
      console.error(e);
      alert('Error al generar el informe Excel.');
    }
  };

  // Exactly the 18 modules required by user prompt
  const initialModules: NovaShortcut[] = [
    {
      id: 'panel_principal',
      name: 'Panel Principal',
      category: 'KPIs & Métricas',
      icon: BarChart3,
      action: () => setActiveModule('reports'),
      pinned: true
    },
    {
      id: 'ventas_pos',
      name: 'Ventas (POS)',
      category: 'Mostrador',
      icon: ShoppingCart,
      action: () => setActiveModule('sales'),
      pinned: true
    },
    {
      id: 'remitos',
      name: 'Remitos',
      category: 'Despacho & Salida',
      icon: Truck,
      action: () => setActiveModule('sales'),
      pinned: true
    },
    {
      id: 'inventario',
      name: 'Inventario',
      category: 'Stock & Catálogo',
      icon: Package,
      action: () => setActiveModule('inventory'),
      pinned: true
    },
    {
      id: 'clientes',
      name: 'Clientes',
      category: 'Cuentas Corrientes',
      icon: Users,
      action: () => setActiveModule('customers'),
      pinned: true
    },
    {
      id: 'proveedores',
      name: 'Proveedores',
      category: 'Insumos & Fábrica',
      icon: PackageSearch,
      action: () => setActiveModule('purchases'),
      pinned: true
    },
    {
      id: 'compras_ia',
      name: 'Compras & IA',
      category: 'Reposición Inteligente',
      icon: Sparkles,
      action: () => setActiveModule('supplier_orders'),
      pinned: true
    },
    {
      id: 'cajas_pagos',
      name: 'Cajas y Pagos',
      category: 'Tesorería',
      icon: DollarSign,
      action: () => setActiveModule('cashboxes'),
      pinned: true
    },
    {
      id: 'finanzas',
      name: 'Finanzas',
      category: 'Cobros vs Pagos',
      icon: TrendingUp,
      action: () => setActiveModule('finances'),
      pinned: true
    },
    {
      id: 'pagos_mp',
      name: 'Pagos MercadoPago',
      category: 'QR & Billeteras',
      icon: QrCode,
      action: () => setIsMercadoPagoOpen(true),
      pinned: true
    },
    {
      id: 'ecommerce',
      name: 'E-Commerce',
      category: 'Portal Clientes',
      icon: Store,
      action: () => setActiveModule('customer_portal'),
      pinned: true
    },
    {
      id: 'cupones_ofertas',
      name: 'Cupones y Ofertas',
      category: 'Fidelización',
      icon: BadgePercent,
      action: () => setActiveModule('loyalty'),
      pinned: true
    },
    {
      id: 'cumpleanos',
      name: 'Cumpleaños',
      category: 'Agenda de Festejos',
      icon: Cake,
      action: () => setIsCumpleanosOpen(true),
      pinned: true
    },
    {
      id: 'actualizar_precios',
      name: 'Actualizar Precios',
      category: 'Aumentos Masivos',
      icon: RotateCw,
      action: () => setActiveModule('prices'),
      pinned: true
    },
    {
      id: 'cajas_dinero',
      name: 'Cajas de Dinero',
      category: 'Arqueo & Cierres',
      icon: Wallet,
      action: () => setActiveModule('cashboxes'),
      pinned: true
    },
    {
      id: 'servicio_tecnico',
      name: 'Servicio Técnico',
      category: 'Tintometría & Color',
      icon: Wrench,
      action: () => setIsServicioTecnicoOpen(true),
      pinned: true
    },
    {
      id: 'pedidos_compra',
      name: 'Pedidos Compra',
      category: 'Órdenes Insumos',
      icon: FileText,
      action: () => setActiveModule('supplier_orders'),
      pinned: true
    },
    {
      id: 'transferencias_sucursal',
      name: 'Transferencias y Pedidos Sucursal',
      category: 'Logística & Envíos',
      icon: Building2,
      action: () => setActiveModule('logistics'),
      pinned: true
    }
  ];

  const [shortcuts, setShortcuts] = useState<NovaShortcut[]>(() => {
    try {
      const saved = localStorage.getItem('nova_desktop_shortcuts_v1');
      if (saved) {
        const parsedIds = JSON.parse(saved) as string[];
        return initialModules.map(m => ({
          ...m,
          pinned: parsedIds.includes(m.id)
        }));
      }
    } catch (e) {
      // fallback
    }
    return initialModules;
  });

  const togglePin = (id: string) => {
    setShortcuts(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
      const pinnedIds = updated.filter(s => s.pinned).map(s => s.id);
      localStorage.setItem('nova_desktop_shortcuts_v1', JSON.stringify(pinnedIds));
      return updated;
    });
  };

  const displayedShortcuts = isCustomizing ? shortcuts : shortcuts.filter(s => s.pinned);

  return (
    <div className="space-y-6">
      
      {/* Export notification toast */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header of "Escritorio" matching Nova Systems specifications */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Escritorio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accesos directos a tus módulos favoritos
          </p>
        </div>

        {/* Right action buttons: "Exportar informe 90 días" & "Personalizar" */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport90DaysReport}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shadow-2xs group"
            title="Descargar informe consolidado de los últimos 90 días en Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span>Exportar informe 90 días</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
              isCustomizing 
                ? 'bg-slate-900 text-white border border-slate-900' 
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-600" />
            <span>{isCustomizing ? 'Listo' : 'Personalizar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'shortcuts' ? 'bars_dashboard' : 'shortcuts')}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{activeTab === 'bars_dashboard' ? 'Ver Accesos' : 'Ver Gráficos'}</span>
          </button>
        </div>
      </div>

      {/* Customization banner */}
      {isCustomizing && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-amber-600" />
            <span>
              <strong>Modo Personalización:</strong> Haz clic en el ícono de la chincheta (pin) para mostrar u ocultar módulos en tu cuadrícula diaria de Nova Systems.
            </span>
          </div>
          <button
            onClick={() => {
              setShortcuts(initialModules);
              localStorage.removeItem('nova_desktop_shortcuts_v1');
            }}
            className="text-xs text-amber-800 hover:text-black underline font-bold"
          >
            Restablecer todos
          </button>
        </div>
      )}

      {/* Main View: Grid of 6 Columns or Bars Dashboard */}
      {activeTab === 'bars_dashboard' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700 uppercase">
              Dashboard de Datos con Barras en Tiempo Real
            </span>
            <button
              onClick={() => setActiveTab('shortcuts')}
              className="text-xs text-orange-600 hover:underline font-bold"
            >
              ← Volver a Cuadrícula de Escritorio
            </button>
          </div>

          <DataDashboardWithBars
            productionOrders={productionOrders}
            salesOrders={salesOrders}
            customers={customers}
            products={products}
            rawMaterials={rawMaterials}
            onNavigateToCustomer={onNavigateToCustomer}
            onNavigateModule={setActiveModule}
          />
        </div>
      ) : (
        /* Cuadrícula (Grid de 6 columnas en desktop) de tarjetas contenedoras cuadradas/rectangulares de acceso rápido */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {displayedShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isCustomizing) {
                    item.action();
                  }
                }}
                className={`bg-white border rounded-xl p-4 shadow-xs transition-all duration-200 flex flex-col items-center justify-center text-center group min-h-[130px] relative select-none ${
                  isCustomizing ? 'cursor-default' : 'cursor-pointer hover:border-orange-500 hover:shadow-md active:scale-98'
                } ${item.pinned ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'}`}
              >
                {/* Pin control in customization mode */}
                {isCustomizing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(item.id);
                    }}
                    className={`absolute top-2 right-2 p-1 rounded-md border ${
                      item.pinned 
                        ? 'bg-orange-600 text-white border-orange-600' 
                        : 'bg-white text-slate-400 border-slate-300 hover:text-slate-700'
                    }`}
                    title={item.pinned ? 'Quitar del escritorio' : 'Fijar en el escritorio'}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                )}

                {/* Ícono central con fondo suave naranja */}
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all shadow-2xs mb-2.5">
                  <Icon className="w-6 h-6 transition-transform group-hover:scale-105" />
                </div>

                {/* Título en fuente semipesada */}
                <h3 className="text-xs font-bold text-slate-800 group-hover:text-orange-600 transition-colors leading-tight line-clamp-2">
                  {item.name}
                </h3>

                {/* Categoría / subtítulo sutil */}
                <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                  {item.category}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Modals */}
      <CumpleanosModal
        isOpen={isCumpleanosOpen}
        onClose={() => setIsCumpleanosOpen(false)}
        customers={customers}
      />

      <ServicioTecnicoModal
        isOpen={isServicioTecnicoOpen}
        onClose={() => setIsServicioTecnicoOpen(false)}
        customers={customers}
      />

      <MercadoPagoModal
        isOpen={isMercadoPagoOpen}
        onClose={() => setIsMercadoPagoOpen(false)}
        customer={customers[0] || null}
      />

    </div>
  );
};
