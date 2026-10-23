import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder, Supplier, PendingPurchaseItem } from '../../types';
import {
  RotateCw,
  Plus,
  Search,
  ShoppingCart,
  Building2,
  FileText,
  Trash2,
  Check,
  Eye,
  Edit2,
  Send,
  Copy,
  Package,
  ChevronDown,
  AlertCircle,
  Sparkles,
  Download,
  ReceiptText,
  Clock,
  CheckCircle2,
  X,
  Boxes,
  Truck,
} from 'lucide-react';
import { NewPurchaseOrderModal } from './NewPurchaseOrderModal';
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal';
import { SendPurchaseOrderModal } from './SendPurchaseOrderModal';
import { AddPendingItemModal } from './AddPendingItemModal';

export const PurchaseOrdersView: React.FC = () => {
  const { store, showToast } = useApp();

  // Filter States for Orders Table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | '30' | '90' | 'this_year'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  // Sorting
  const [sortField, setSortField] = useState<'code' | 'supplier' | 'date' | 'delivery' | 'total' | 'status'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [sendingOrder, setSendingOrder] = useState<PurchaseOrder | null>(null);
  const [isAddPendingModalOpen, setIsAddPendingModalOpen] = useState(false);

  // Group Pending Items by Target Supplier
  const pendingItems = store.pendingPurchaseItems || [];

  const groupedPendingItems = useMemo(() => {
    const map = new Map<string, { supplierId: string; supplierName: string; items: PendingPurchaseItem[] }>();

    pendingItems.forEach((item) => {
      const supId = item.targetSupplierId || 'sin-proveedor';
      const supName = item.targetSupplierName || 'PROVEEDOR GENERAL';

      if (!map.has(supId)) {
        map.set(supId, {
          supplierId: supId,
          supplierName: supName,
          items: [],
        });
      }
      map.get(supId)!.items.push(item);
    });

    return Array.from(map.values());
  }, [pendingItems]);

  // Counts & Stats
  const stats = useMemo(() => {
    const orders = store.purchaseOrders || [];
    const totalCount = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const pendingList = orders.filter((o) => o.status === 'draft' || o.status === 'pending');
    const pendingCount = pendingList.length;
    const pendingAmount = pendingList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const inProgressList = orders.filter((o) => o.status === 'in_progress');
    const inProgressCount = inProgressList.length;
    const inProgressAmount = inProgressList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const completedList = orders.filter((o) => o.status === 'completed' || o.status === 'received');
    const completedCount = completedList.length;
    const completedAmount = completedList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const pendingItemsCount = pendingItems.length;
    const pendingItemsEstimatedCost = pendingItems.reduce(
      (acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      0
    );

    return {
      totalCount,
      totalAmount,
      pendingCount,
      pendingAmount,
      inProgressCount,
      inProgressAmount,
      completedCount,
      completedAmount,
      pendingItemsCount,
      pendingItemsEstimatedCost,
    };
  }, [store.purchaseOrders, pendingItems]);

  // Filter Orders List
  const filteredOrders = useMemo(() => {
    return (store.purchaseOrders || []).filter((order) => {
      // Tab filter
      if (activeTab === 'pending' && order.status !== 'draft' && order.status !== 'pending') return false;
      if (activeTab === 'in_progress' && order.status !== 'in_progress') return false;
      if (activeTab === 'completed' && order.status !== 'completed' && order.status !== 'received') return false;

      // Supplier dropdown filter
      if (selectedSupplierFilter !== 'all' && order.supplierId !== selectedSupplierFilter) {
        return false;
      }

      // Time filter
      if (selectedTimeFilter !== 'all') {
        const orderDate = new Date(order.date).getTime();
        const now = Date.now();
        if (selectedTimeFilter === '30' && now - orderDate > 30 * 86400000) return false;
        if (selectedTimeFilter === '90' && now - orderDate > 90 * 86400000) return false;
        if (selectedTimeFilter === 'this_year') {
          const currentYear = new Date().getFullYear();
          if (new Date(order.date).getFullYear() !== currentYear) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCode = order.code.toLowerCase().includes(term);
        const matchSupplier = order.supplierName.toLowerCase().includes(term);
        const matchItems = order.items?.some(
          (i) =>
            i.productName.toLowerCase().includes(term) ||
            i.productCode.toLowerCase().includes(term) ||
            i.supplierProductCode?.toLowerCase().includes(term)
        );
        if (!matchCode && !matchSupplier && !matchItems) return false;
      }

      return true;
    });
  }, [store.purchaseOrders, searchTerm, selectedSupplierFilter, selectedTimeFilter, activeTab]);

  // Sort Orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let comp = 0;
      if (sortField === 'code') comp = a.code.localeCompare(b.code);
      else if (sortField === 'supplier') comp = a.supplierName.localeCompare(b.supplierName);
      else if (sortField === 'date') comp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'delivery') {
        const d1 = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : 0;
        const d2 = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : 0;
        comp = d1 - d2;
      } else if (sortField === 'total') comp = (a.total || 0) - (b.total || 0);
      else if (sortField === 'status') comp = a.status.localeCompare(b.status);

      return sortAsc ? comp : -comp;
    });
  }, [filteredOrders, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const formatDate = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const parts = dStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const formatCurrency = (val: number) => {
    return `$${(val || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Borrador
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
            Pendiente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60">
            En Curso
          </span>
        );
      case 'completed':
      case 'received':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
            Completado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  // Actions on Pending Items
  const handleCreateAllOrdersFromPending = () => {
    if (pendingItems.length === 0) {
      showToast('No hay productos pendientes de pedir', 'info');
      return;
    }

    const created = store.createPurchaseOrdersFromPending();
    showToast(
      `Se ${created.length === 1 ? 'generó 1 nuevo pedido' : `generaron ${created.length} nuevos pedidos`} de compra`,
      'success'
    );
  };

  const handleCreateSingleSupplierOrder = (supplierId: string, supplierName: string) => {
    const created = store.createPurchaseOrdersFromPending(supplierId);
    if (created.length > 0) {
      showToast(`Pedido de compra creado para ${supplierName} (${created[0].code})`, 'success');
    }
  };

  const handleClearPending = () => {
    if (window.confirm('¿Estás seguro de vaciar todos los productos pendientes de pedir?')) {
      store.clearPendingPurchaseItems();
      showToast('Lista de pendientes de pedir vaciada', 'info');
    }
  };

  const handleUpdateItemSupplier = (itemId: string, newSupplierId: string) => {
    const targetSup = store.suppliers.find((s) => s.id === newSupplierId);
    if (targetSup) {
      store.updatePendingPurchaseItem(itemId, {
        targetSupplierId: targetSup.id,
        targetSupplierName: targetSup.name,
      });
      showToast(`Proveedor actualizado a ${targetSup.name}`, 'info');
    }
  };

  // Actions on Orders
  const handleDuplicate = (order: PurchaseOrder) => {
    const duplicated = store.duplicatePurchaseOrder(order.id);
    if (duplicated) {
      showToast(`Pedido duplicado como nuevo borrador (${duplicated.code})`, 'success');
    }
  };

  const handleDelete = (order: PurchaseOrder) => {
    if (window.confirm(`¿Estás seguro de eliminar el pedido ${order.code}?`)) {
      store.deletePurchaseOrder(order.id);
      showToast(`Pedido ${order.code} eliminado correctamente`, 'info');
    }
  };

  const handleQuickReceive = (order: PurchaseOrder) => {
    if (order.status === 'completed' || order.status === 'received') {
      showToast(`El pedido ${order.code} ya fue recibido`, 'info');
      return;
    }

    const whId = order.warehouseId || (store.warehouses[0]?.id || '1');
    const invoiceNum = prompt(`Ingrese número de factura/remito del proveedor para recibir el pedido ${order.code}:`, '0001-00012345');
    if (invoiceNum === null) return;

    store.receivePurchaseOrder(order.id, whId, invoiceNum, 'user-admin', 'Administrador');
    showToast(`Pedido ${order.code} recibido exitosamente y stock ingresado`, 'success');
  };

  const handleExportCSV = () => {
    const headers = ['NroPedido', 'Fecha', 'FechaEntrega', 'Proveedor', 'Items', 'Total', 'Estado'];
    const rows = filteredOrders.map((o) => [
      o.code,
      o.date,
      o.expectedDeliveryDate || '',
      `"${o.supplierName.replace(/"/g, '""')}"`,
      o.items ? o.items.length : 0,
      o.total,
      o.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pedidos_compra_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Top Header Matching Comprobantes Visual Standard */}
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ReceiptText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pedidos de Compra
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  {stats.totalCount} {stats.totalCount === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Armá y gestioná pedidos a proveedores, productos pendientes de pedir y recepción de mercadería
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => store.notify()}
              title="Refrescar lista"
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => setIsAddPendingModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>+ Agregar a Pedir</span>
            </button>

            <button
              onClick={() => {
                setEditingOrder(null);
                setIsNewOrderModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Pedido</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Metric Cards (Matching Comprobantes de Compra) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {/* Total Orders */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Pedidos
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {formatCurrency(stats.totalAmount)}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {stats.totalCount} órdenes emitidas
            </span>
          </div>

          {/* In Progress */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Pedidos En Curso
            </span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              {formatCurrency(stats.inProgressAmount)}
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 block">
              {stats.inProgressCount} en trámite con proveedores
            </span>
          </div>

          {/* Pending Items Waitlist */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Pendientes de Pedir
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {stats.pendingItemsCount} <span className="text-xs font-normal">productos</span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
              Est. {formatCurrency(stats.pendingItemsEstimatedCost)}
            </span>
          </div>

          {/* Completed Orders */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Completados / Recibidos
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(stats.completedAmount)}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {stats.completedCount} pedidos recepcionados
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter and Toolbar Bar (Matching Comprobantes Standard) */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({stats.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pendientes ({stats.pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'in_progress'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span>En Curso ({stats.inProgressCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Completados ({stats.completedCount})</span>
          </button>
        </div>

        {/* Search and Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar pedido, proveedor, artículo o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-64 md:w-80"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Supplier dropdown */}
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[200px]"
          >
            <option value="all">Proveedor: Todos</option>
            {store.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Time range */}
          <select
            value={selectedTimeFilter}
            onChange={(e) => setSelectedTimeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Período: Todo</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="this_year">Este año</option>
          </select>
        </div>
      </div>

      {/* 4. Main Scrollable Body Area (Full Width & Spacious) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* A. Pending Items Section (Card with Accent) */}
        {pendingItems.length > 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-4 md:p-5 shadow-xs transition-all">
            {/* Header of Pending Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Productos Pendientes de Pedir
                    <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                      {pendingItems.length} {pendingItems.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Artículos solicitados para reposición agrupados por proveedor para generar órdenes automáticas
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAddPendingModalOpen(true)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Producto</span>
                </button>

                <button
                  onClick={handleCreateAllOrdersFromPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Crear Pedidos (1 por proveedor)</span>
                </button>

                <button
                  onClick={handleClearPending}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-rose-300 transition-colors cursor-pointer"
                >
                  Vaciar
                </button>
              </div>
            </div>

            {/* Groups of Pending Items by Supplier */}
            <div className="space-y-4">
              {groupedPendingItems.map((group) => (
                <div
                  key={group.supplierId}
                  className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl overflow-hidden shadow-2xs"
                >
                  {/* Group Header */}
                  <div className="px-4 py-2.5 bg-white dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold tracking-wide text-slate-900 dark:text-white uppercase">
                        {group.supplierName}
                      </span>
                      <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px] font-semibold px-2 py-0.5 rounded-md">
                        {group.items.length} productos
                      </span>
                    </div>

                    <button
                      onClick={() => handleCreateSingleSupplierOrder(group.supplierId, group.supplierName)}
                      className="border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-xs font-bold text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Crear Pedido para este Proveedor</span>
                    </button>
                  </div>

                  {/* Group Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-4">SKU</th>
                          <th className="py-2.5 px-4">Cód. Proveedor</th>
                          <th className="py-2.5 px-4">Producto</th>
                          <th className="py-2.5 px-4">Proveedor Original</th>
                          <th className="py-2.5 px-4">Pedir a</th>
                          <th className="py-2.5 px-4 text-center">Cantidad</th>
                          <th className="py-2.5 px-4 text-right">Costo Unit.</th>
                          <th className="py-2.5 px-4 text-right">Subtotal</th>
                          <th className="py-2.5 px-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {group.items.map((item) => (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="py-2.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                              {item.sku || '-'}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                              {item.supplierProductCode || '-'}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white uppercase">
                              {item.productName}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 uppercase">
                              {item.originalSupplierName || '-'}
                            </td>
                            <td className="py-2.5 px-4">
                              <select
                                value={item.targetSupplierId}
                                onChange={(e) => handleUpdateItemSupplier(item.id, e.target.value)}
                                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                              >
                                {store.suppliers.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    store.updatePendingPurchaseItem(item.id, { quantity: val });
                                  }
                                }}
                                className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-right text-slate-900 dark:text-slate-200">
                              {formatCurrency(item.unitCost)}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-bold text-right text-blue-600 dark:text-blue-400">
                              {formatCurrency((item.quantity || 0) * (item.unitCost || 0))}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  store.removePendingPurchaseItem(item.id);
                                  showToast(`"${item.productName}" quitado de pendientes`, 'info');
                                }}
                                title="Eliminar de pendientes de pedir"
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* B. Orders Table Section (Full Width Table Card Matching Comprobantes) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Listado de Pedidos de Compra
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({sortedOrders.length} {sortedOrders.length === 1 ? 'orden' : 'órdenes'})
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Total filtrado: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(sortedOrders.reduce((sum, o) => sum + (o.total || 0), 0))}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('code')}
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="flex items-center space-x-1">
                      <span>N° PEDIDO</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('supplier')}
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="flex items-center space-x-1">
                      <span>PROVEEDOR</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="flex items-center space-x-1">
                      <span>FECHA EMISIÓN</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('delivery')}
                    className="py-3 px-4 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="flex items-center space-x-1">
                      <span>ENTREGA ESTIMADA</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>

                  <th className="py-3 px-4">ARTÍCULOS</th>

                  <th
                    onClick={() => handleSort('total')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>TOTAL ESTIMADO</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 text-center cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>ESTADO</span>
                      <span className="text-[10px] text-slate-400">⇅</span>
                    </div>
                  </th>

                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        No se encontraron pedidos de compra
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Probá ajustando los filtros de búsqueda o hacé clic en "+ Nuevo Pedido"
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order) => {
                    const itemsCount = order.items ? order.items.length : 0;
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        {/* N° Pedido */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                            {order.code}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ID: {order.id.slice(0, 10)}
                          </span>
                        </td>

                        {/* Proveedor */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white uppercase">
                            {order.supplierName}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {order.supplierTaxId ? `CUIT: ${order.supplierTaxId}` : 'Proveedor Registrado'}
                          </span>
                        </td>

                        {/* Fecha Emisión */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {formatDate(order.date)}
                        </td>

                        {/* Entrega Estimada */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '-'}
                        </td>

                        {/* Artículos */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setViewingOrder(order)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer text-xs"
                          >
                            <Boxes className="w-3.5 h-3.5 text-slate-500" />
                            <span>{itemsCount} {itemsCount === 1 ? 'artículo' : 'artículos'}</span>
                          </button>
                        </td>

                        {/* Total Estimado */}
                        <td className="py-3.5 px-4 font-mono font-bold text-right text-slate-900 dark:text-white text-sm">
                          {formatCurrency(order.total)}
                        </td>

                        {/* Estado */}
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center space-x-1 text-slate-400">
                            {/* Ver Detalle */}
                            <button
                              onClick={() => setViewingOrder(order)}
                              title="Ver detalle del pedido"
                              className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => {
                                setEditingOrder(order);
                                setIsNewOrderModalOpen(true);
                              }}
                              title="Editar pedido"
                              className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Enviar WhatsApp / Email */}
                            <button
                              onClick={() => setSendingOrder(order)}
                              title="Enviar a proveedor"
                              className="p-1.5 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            {/* Recibir Mercadería si no está completado */}
                            {order.status !== 'completed' && order.status !== 'received' && (
                              <button
                                onClick={() => handleQuickReceive(order)}
                                title="Recibir mercadería e ingresar stock"
                                className="p-1.5 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                              </button>
                            )}

                            {/* Duplicar */}
                            <button
                              onClick={() => handleDuplicate(order)}
                              title="Duplicar pedido"
                              className="p-1.5 rounded-lg hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {/* Eliminar */}
                            <button
                              onClick={() => handleDelete(order)}
                              title="Eliminar pedido"
                              className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Mostrando {sortedOrders.length} de {stats.totalCount} pedidos registrados
            </span>
            <span className="font-semibold">
              Sistema de Pedidos Ferretería Bruzzone
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* 1. New / Edit Order Modal */}
      <NewPurchaseOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false);
          setEditingOrder(null);
        }}
        initialOrder={editingOrder}
      />

      {/* 2. Order Detail Modal */}
      <PurchaseOrderDetailModal
        isOpen={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onEdit={(ord) => {
          setViewingOrder(null);
          setEditingOrder(ord);
          setIsNewOrderModalOpen(true);
        }}
        onStatusChange={(orderId, newStatus) => {
          if (viewingOrder && viewingOrder.id === orderId) {
            setViewingOrder({ ...viewingOrder, status: newStatus });
          }
        }}
      />

      {/* 3. Send Order to Supplier Modal */}
      <SendPurchaseOrderModal
        isOpen={!!sendingOrder}
        order={sendingOrder}
        onClose={() => setSendingOrder(null)}
        onStatusUpdated={(newStatus) => {
          if (sendingOrder) {
            setSendingOrder({ ...sendingOrder, status: newStatus });
          }
        }}
      />

      {/* 4. Add Product to Pending Items Modal */}
      <AddPendingItemModal
        isOpen={isAddPendingModalOpen}
        onClose={() => setIsAddPendingModalOpen(false)}
      />
    </div>
  );
};
