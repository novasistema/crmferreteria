import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Package,
  FileText,
  CheckCircle2,
  Truck,
  AlertCircle,
  Printer,
  Eye,
  Trash2,
  Clock,
  Filter,
  Layers,
  Phone,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { TechnicalServiceOrder, TechnicalServiceStatus } from '../../types';
import { NewServiceOrderModal } from './NewServiceOrderModal';
import { ServiceOrderDetailModal } from './ServiceOrderDetailModal';
import { ServiceTicketPrintModal } from './ServiceTicketPrintModal';

type FilterTab = 'all' | 'active' | 'ready' | 'delivered';

export const ServicioTecnicoView: React.FC = () => {
  const { store, triggerRefresh, showToast } = useAppContext();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<TechnicalServiceOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [printOrder, setPrintOrder] = useState<TechnicalServiceOrder | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const orders = store.serviceOrders || [];

  // KPI Calculations
  const kpis = useMemo(() => {
    let received = 0;
    let diagnosis = 0;
    let budgeted = 0;
    let inProgress = 0;
    let ready = 0;
    let delivered = 0;
    let cancelled = 0;

    orders.forEach((o) => {
      switch (o.status) {
        case 'received':
          received++;
          break;
        case 'diagnosis':
        case 'in_diagnosis':
          diagnosis++;
          break;
        case 'budgeted':
        case 'budget_ready':
          budgeted++;
          break;
        case 'in_progress':
        case 'in_repair':
        case 'approved':
          inProgress++;
          break;
        case 'ready':
        case 'ready_for_pickup':
          ready++;
          break;
        case 'delivered':
          delivered++;
          break;
        case 'cancelled':
          cancelled++;
          break;
        default:
          received++;
          break;
      }
    });

    return {
      received,
      diagnosis,
      budgeted,
      inProgress,
      ready,
      delivered,
      cancelled,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (activeTab === 'active') {
        if (o.status === 'delivered' || o.status === 'cancelled') return false;
      } else if (activeTab === 'ready') {
        if (o.status !== 'ready' && o.status !== 'ready_for_pickup') return false;
      } else if (activeTab === 'delivered') {
        if (o.status !== 'delivered') return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesOrder = o.orderNumber?.toLowerCase().includes(query);
        const matchesClient = o.clientName?.toLowerCase().includes(query);
        const matchesPhone = o.clientPhone?.toLowerCase().includes(query);
        const matchesItem = (o.itemDescription || o.equipmentType || '').toLowerCase().includes(query);
        const matchesCode = o.withdrawCode?.toLowerCase().includes(query);
        const matchesBrand = o.brand?.toLowerCase().includes(query);
        const matchesFault = o.reportedFault?.toLowerCase().includes(query);

        if (
          !matchesOrder &&
          !matchesClient &&
          !matchesPhone &&
          !matchesItem &&
          !matchesCode &&
          !matchesBrand &&
          !matchesFault
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchTerm]);

  const formatShortDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: TechnicalServiceStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Recibido
          </span>
        );
      case 'diagnosis':
      case 'in_diagnosis':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Diagnóstico
          </span>
        );
      case 'budgeted':
      case 'budget_ready':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Presupuestado
          </span>
        );
      case 'in_progress':
      case 'in_repair':
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            En Proceso
          </span>
        );
      case 'ready':
      case 'ready_for_pickup':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Listo p/ Retirar
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const handleRowClick = (order: TechnicalServiceOrder) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handlePrintClick = (e: React.MouseEvent, order: TechnicalServiceOrder) => {
    e.stopPropagation();
    setPrintOrder(order);
    setIsPrintModalOpen(true);
  };

  return (
    <div id="module-servicio-tecnico" className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Wrench className="w-7 h-7 text-orange-500 shrink-0" />
            Servicio Técnico
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ingresos a reparación, afilado, mantenimiento — con seguimiento de estado y código de retiro
          </p>
        </div>

        <button
          id="btn-new-service-order"
          type="button"
          onClick={() => setIsNewOrderModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ingreso
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Recibidos */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Package className="w-4 h-4 text-blue-500" />
            <span>Recibidos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.received}
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Search className="w-4 h-4 text-amber-500" />
            <span>Diagnóstico</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.diagnosis}
          </div>
        </div>

        {/* Presupuestado */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <FileText className="w-4 h-4 text-purple-500" />
            <span>Presupuestado</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.budgeted}
          </div>
        </div>

        {/* En Proceso */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Wrench className="w-4 h-4 text-orange-500" />
            <span>En Proceso</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.inProgress}
          </div>
        </div>

        {/* Listos */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Listos</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.ready}
          </div>
        </div>

        {/* Entregados */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Truck className="w-4 h-4 text-indigo-500" />
            <span>Entregados</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.delivered}
          </div>
        </div>

        {/* Cancelados */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>Cancelados</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {kpis.cancelled}
          </div>
        </div>
      </div>

      {/* Main Content Card with Search & Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-service-orders"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° orden, cliente, artículo, código de retiro..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Activas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ready'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Listas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('delivered')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'delivered'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Entregadas
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">N° Orden</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Artículo</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Ingreso</th>
                <th className="py-3 px-4">Costo</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* N° Orden */}
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {order.orderNumber}
                    </td>

                    {/* Cliente */}
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="font-bold uppercase">{order.clientName}</div>
                      {order.clientPhone && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {order.clientPhone}
                        </div>
                      )}
                    </td>

                    {/* Artículo */}
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 uppercase">
                      {order.itemDescription || order.equipmentType}
                    </td>

                    {/* Tipo */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {order.serviceType || 'Reparación'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Ingreso */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(order.date)}
                    </td>

                    {/* Costo */}
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      ${(order.finalCost ?? order.totalFinal ?? 0).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(e) => handlePrintClick(e, order)}
                          title="Imprimir Comprobante"
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold">No se encontraron órdenes de servicio técnico</p>
                    <p className="text-xs mt-1 text-slate-400">
                      {searchTerm ? 'Probá con otro término de búsqueda' : 'Registrá el primer ingreso desde el botón "+ Nuevo Ingreso"'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <NewServiceOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={(newOrder) => {
          setSelectedOrder(newOrder);
          setIsDetailModalOpen(true);
        }}
      />

      <ServiceOrderDetailModal
        order={selectedOrder}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onPrintTicket={(order) => {
          setPrintOrder(order);
          setIsPrintModalOpen(true);
        }}
      />

      <ServiceTicketPrintModal
        order={printOrder}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
