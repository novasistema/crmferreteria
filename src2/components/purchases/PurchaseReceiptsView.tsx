import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Purchase, SupplierPaymentOrder } from '../../types';
import { NewPurchaseInvoiceModal } from './NewPurchaseInvoiceModal';
import { AIInvoiceImportModal } from './AIInvoiceImportModal';
import { PurchasePaymentModal } from './PurchasePaymentModal';
import { ExtractedInvoiceData } from '../../lib/geminiInvoiceService';
import {
  FileText,
  Search,
  Plus,
  Sparkles,
  CreditCard,
  Eye,
  Trash2,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Package,
  X,
  RotateCw,
  TrendingUp,
  Receipt,
  Check,
  ChevronDown,
} from 'lucide-react';

export const PurchaseReceiptsView: React.FC = () => {
  const { store } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'pending' | 'partial' | 'paid'>('all');
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '7days' | 'this_month' | 'last_month'>('all');

  // Modals state
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isAIImportModalOpen, setIsAIImportModalOpen] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<Purchase | null>(null);
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [itemPreviewId, setItemPreviewId] = useState<string | null>(null);

  const purchases = store.purchases || [];

  // Filter logic
  const filteredPurchases = useMemo(() => {
    return purchases.filter((purchase) => {
      // 1. Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesInvoice = (purchase.fullInvoiceNumber || '').toLowerCase().includes(query) ||
          (purchase.invoiceNumber || '').toLowerCase().includes(query) ||
          (purchase.code || '').toLowerCase().includes(query);
        const matchesSupplier = (purchase.supplierName || '').toLowerCase().includes(query) ||
          (purchase.supplierTaxId || '').toLowerCase().includes(query);
        const matchesNotes = (purchase.notes || '').toLowerCase().includes(query);
        const matchesItem = (purchase.items || []).some(
          (it) => it.productName.toLowerCase().includes(query) || it.productCode.toLowerCase().includes(query)
        );

        if (!matchesInvoice && !matchesSupplier && !matchesNotes && !matchesItem) {
          return false;
        }
      }

      // 2. Status Tab
      if (selectedStatusTab === 'pending') {
        if (purchase.paymentStatus !== 'pending') return false;
      } else if (selectedStatusTab === 'partial') {
        if (purchase.paymentStatus !== 'partial') return false;
      } else if (selectedStatusTab === 'paid') {
        if (purchase.paymentStatus !== 'paid') return false;
      }

      // 3. Invoice Type
      if (selectedInvoiceType !== 'all') {
        if (purchase.invoiceType !== selectedInvoiceType) return false;
      }

      // 4. Supplier
      if (selectedSupplierId !== 'all') {
        if (purchase.supplierId !== selectedSupplierId) return false;
      }

      // 5. Time Range
      if (selectedTimeRange !== 'all') {
        const purDate = new Date(purchase.date);
        const now = new Date();
        if (selectedTimeRange === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (purDate < sevenDaysAgo) return false;
        } else if (selectedTimeRange === 'this_month') {
          if (purDate.getFullYear() !== now.getFullYear() || purDate.getMonth() !== now.getMonth()) {
            return false;
          }
        } else if (selectedTimeRange === 'last_month') {
          const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (purDate.getFullYear() !== prevYear || purDate.getMonth() !== prevMonth) {
            return false;
          }
        }
      }

      return true;
    });
  }, [purchases, searchTerm, selectedStatusTab, selectedInvoiceType, selectedSupplierId, selectedTimeRange]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalPurchased = purchases.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
    const totalVat = purchases.reduce((acc, p) => acc + (Number(p.vatAmount) || 0), 0);
    const totalPaid = purchases.reduce((acc, p) => acc + (Number(p.paidAmount) || (p.paymentStatus === 'paid' ? p.total : 0)), 0);
    const totalPending = purchases.reduce(
      (acc, p) => acc + (p.paymentStatus !== 'paid' ? Number(p.balanceDue !== undefined ? p.balanceDue : p.total) : 0),
      0
    );

    const pendingCount = purchases.filter((p) => p.paymentStatus === 'pending').length;
    const partialCount = purchases.filter((p) => p.paymentStatus === 'partial').length;
    const paidCount = purchases.filter((p) => p.paymentStatus === 'paid').length;

    return {
      totalPurchased,
      totalVat,
      totalPaid,
      totalPending,
      pendingCount,
      partialCount,
      paidCount,
      totalCount: purchases.length,
    };
  }, [purchases]);

  const handleSavePurchase = (purchase: Purchase) => {
    store.savePurchase(purchase);
    setIsNewInvoiceModalOpen(false);
    setAiExtractedData(null);
  };

  const handleDeletePurchase = (id: string, fullNumber: string) => {
    if (
      window.confirm(
        `¿Está seguro de que desea anular/eliminar el comprobante "${fullNumber}"?\nEsto revertirá el stock ingresado y las deudas en la cuenta corriente del proveedor.`
      )
    ) {
      store.deletePurchase(id);
    }
  };

  const handleAIImportComplete = (extracted: ExtractedInvoiceData) => {
    setAiExtractedData(extracted);
    setIsAIImportModalOpen(false);
    setIsNewInvoiceModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredPurchases.length === 0) {
      alert('No hay comprobantes para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'Fecha',
      'Tipo Comprobante',
      'Numero',
      'Codigo Interno',
      'Proveedor',
      'CUIT',
      'Subtotal',
      'IVA',
      'Total',
      'Estado de Pago',
      'Saldo Pendiente',
      'Deposito',
    ];

    const rows = filteredPurchases.map((p) => [
      p.date,
      p.invoiceType,
      p.fullInvoiceNumber || p.invoiceNumber,
      p.code,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      p.supplierTaxId,
      p.subtotal,
      p.vatAmount,
      p.total,
      p.paymentStatus,
      p.balanceDue || 0,
      p.warehouseName || 'Casa Central',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Comprobantes_Compras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct suppliers for filter
  const availableSuppliers = useMemo(() => {
    const list = store.suppliers || [];
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [store.suppliers]);

  // Invoice type color badge
  const getInvoiceTypeBadge = (type: string) => {
    switch (type) {
      case 'Factura A':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700/50';
      case 'Factura B':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50';
      case 'Factura C':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50';
      case 'Remito':
      case 'Remito R':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/50';
      case 'Nota de Crédito A':
      case 'Nota de Crédito B':
      case 'Nota de Crédito':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Comprobantes de Compra
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  {purchases.length} {purchases.length === 1 ? 'comprobante' : 'comprobantes'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Historial completo de compras realizadas, facturas de proveedores, remitos y notas de crédito
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
              onClick={() => setIsAIImportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Cargar con IA (OCR)</span>
            </button>

            <button
              onClick={() => {
                setAiExtractedData(null);
                setIsNewInvoiceModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Factura / Compra</span>
            </button>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {/* Total Purchased */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Comprado
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              ${stats.totalPurchased.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {stats.totalCount} operaciones registradas
            </span>
          </div>

          {/* Tax / IVA */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              IVA Crédito Fiscal
            </span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              ${stats.totalVat.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Total deducible de impuestos
            </span>
          </div>

          {/* Paid */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Abonado
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              ${stats.totalPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {stats.paidCount} facturas canceladas
            </span>
          </div>

          {/* Pending Debt */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Saldo Pendiente (Deuda)
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              ${stats.totalPending.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
              {stats.pendingCount + stats.partialCount} con saldo a pagar
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 md:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Status Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedStatusTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedStatusTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({stats.totalCount})
          </button>
          <button
            onClick={() => setSelectedStatusTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              selectedStatusTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendientes ({stats.pendingCount})</span>
          </button>
          <button
            onClick={() => setSelectedStatusTab('partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedStatusTab === 'partial'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            Parciales ({stats.partialCount})
          </button>
          <button
            onClick={() => setSelectedStatusTab('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              selectedStatusTab === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pagadas ({stats.paidCount})</span>
          </button>
        </div>

        {/* Search Input & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 grow md:grow-0">
          <div className="relative min-w-[240px] grow md:grow-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar factura, proveedor, CUIT, artículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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

          {/* Filter by Tipo */}
          <select
            value={selectedInvoiceType}
            onChange={(e) => setSelectedInvoiceType(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tipo: Todos</option>
            <option value="Factura A">Factura A</option>
            <option value="Factura B">Factura B</option>
            <option value="Factura C">Factura C</option>
            <option value="Remito">Remito</option>
            <option value="Nota de Crédito A">Nota de Crédito</option>
            <option value="Nota de Débito A">Nota de Débito A</option>
          </select>

          {/* Filter by Supplier */}
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 max-w-[180px] truncate cursor-pointer"
          >
            <option value="all">Proveedor: Todos</option>
            {availableSuppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Filter by Period */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Período: Todo</option>
            <option value="7days">Últimos 7 días</option>
            <option value="this_month">Este Mes</option>
            <option value="last_month">Mes Anterior</option>
          </select>
        </div>
      </div>

      {/* Main Content / Purchases Table */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {filteredPurchases.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No se encontraron comprobantes de compra
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-4">
              {searchTerm || selectedStatusTab !== 'all' || selectedInvoiceType !== 'all' || selectedSupplierId !== 'all'
                ? 'Intenta restablecer o modificar los criterios de búsqueda y filtros seleccionados.'
                : 'Aún no has registrado compras en el sistema. Puedes cargar una factura manualmente o escanearla con IA.'}
            </p>
            <div className="flex items-center gap-3">
              {(searchTerm || selectedStatusTab !== 'all' || selectedInvoiceType !== 'all' || selectedSupplierId !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatusTab('all');
                    setSelectedInvoiceType('all');
                    setSelectedSupplierId('all');
                    setSelectedTimeRange('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
              <button
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Factura</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Fecha / Vto</th>
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Depósito</th>
                    <th className="py-3 px-4 text-center">Artículos</th>
                    <th className="py-3 px-4 text-right">Neto Gravado</th>
                    <th className="py-3 px-4 text-right">IVA</th>
                    <th className="py-3 px-4 text-right">Total Factura</th>
                    <th className="py-3 px-4 text-center">Estado de Pago</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                  {filteredPurchases.map((purchase) => {
                    const isPaid = purchase.paymentStatus === 'paid';
                    const isPartial = purchase.paymentStatus === 'partial';
                    const balance = purchase.balanceDue !== undefined ? purchase.balanceDue : (isPaid ? 0 : purchase.total);
                    const paid = purchase.paidAmount || (isPaid ? purchase.total : 0);
                    const percentPaid = purchase.total > 0 ? Math.min(100, Math.round((paid / purchase.total) * 100)) : 0;
                    const itemsCount = (purchase.items || []).length;
                    const isExpanded = itemPreviewId === purchase.id;

                    return (
                      <React.Fragment key={purchase.id}>
                        <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                          {/* Fecha */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{purchase.date}</div>
                            {purchase.dueDate && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <span>Vto: {purchase.dueDate}</span>
                              </div>
                            )}
                          </td>

                          {/* Comprobante */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getInvoiceTypeBadge(
                                  purchase.invoiceType
                                )}`}
                              >
                                {purchase.invoiceType}
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {purchase.fullInvoiceNumber || purchase.invoiceNumber || '-'}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              ID: {purchase.code}
                            </div>
                          </td>

                          {/* Proveedor */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                              {purchase.supplierName}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>CUIT: {purchase.supplierTaxId || '-'}</span>
                              <span>•</span>
                              <span>{purchase.supplierTaxCondition || 'RI'}</span>
                            </div>
                          </td>

                          {/* Depósito */}
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {purchase.warehouseName || 'Casa Central'}
                          </td>

                          {/* Artículos */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => setItemPreviewId(isExpanded ? null : purchase.id)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Ver artículos comprados"
                            >
                              <Package className="w-3.5 h-3.5 text-blue-500" />
                              <span>{itemsCount} {itemsCount === 1 ? 'ítem' : 'ítems'}</span>
                              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>

                          {/* Neto Gravado */}
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            ${(Number(purchase.subtotal) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* IVA Fiscal */}
                          <td className="py-3 px-4 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                            ${(Number(purchase.vatAmount) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Total Factura */}
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap text-sm">
                            ${(Number(purchase.total) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>

                          {/* Estado de Pago */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isPaid ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>PAGADA</span>
                              </span>
                            ) : isPartial ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  PARCIAL ({percentPaid}%)
                                </span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                  Saldo: ${balance.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                                  <Clock className="w-3 h-3" />
                                  <span>PENDIENTE</span>
                                </span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                                  Debe: ${balance.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              {/* View Detail */}
                              <button
                                type="button"
                                onClick={() => setSelectedPurchaseDetail(purchase)}
                                title="Ver Detalle Completo"
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Pay action if not fully paid */}
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => setPayingPurchase(purchase)}
                                  title="Registrar Pago a Proveedor"
                                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeletePurchase(purchase.id, purchase.fullInvoiceNumber || purchase.code)}
                                title="Eliminar / Anular Comprobante"
                                className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Items Preview */}
                        {isExpanded && (
                          <tr className="bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={10} className="px-6 py-4">
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-inner">
                                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Detalle de artículos incluidos ({purchase.items.length})
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    Factura {purchase.fullInvoiceNumber || purchase.code}
                                  </span>
                                </div>
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                      <th className="py-2 px-3">Código</th>
                                      <th className="py-2 px-3">Descripción</th>
                                      <th className="py-2 px-3 text-center">Cant.</th>
                                      <th className="py-2 px-3 text-right">Costo Unit.</th>
                                      <th className="py-2 px-3 text-center">IVA</th>
                                      <th className="py-2 px-3 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {purchase.items.map((it, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{it.productCode}</td>
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{it.productName}</td>
                                        <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-white">{it.quantity}</td>
                                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                          ${it.unitCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono text-slate-500 dark:text-slate-400">{it.vatRate}%</td>
                                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                          ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Table Summary */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
              <div>
                Mostrando <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPurchases.length}</span> de{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">{purchases.length}</span> compras realizadas
              </div>

              <div className="flex items-center gap-4">
                <div>
                  Total Filtrado:{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    $
                    {filteredPurchases
                      .reduce((acc, p) => acc + (Number(p.total) || 0), 0)
                      .toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Purchase Invoice Modal */}
      <NewPurchaseInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        onClose={() => {
          setIsNewInvoiceModalOpen(false);
          setAiExtractedData(null);
        }}
        products={store.products}
        suppliers={store.suppliers}
        warehouses={store.warehouses}
        onSavePurchase={handleSavePurchase}
        onOpenAIImport={() => {
          setIsNewInvoiceModalOpen(false);
          setIsAIImportModalOpen(true);
        }}
        preloadedData={aiExtractedData}
      />

      {/* AI Invoice Import Modal */}
      <AIInvoiceImportModal
        isOpen={isAIImportModalOpen}
        onClose={() => setIsAIImportModalOpen(false)}
        suppliers={store.suppliers}
        warehouses={store.warehouses}
        onImportComplete={handleAIImportComplete}
      />

      {/* Purchase Detail Modal */}
      {selectedPurchaseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 text-xs">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>
                    Detalle de Factura: {selectedPurchaseDetail.invoiceType} {selectedPurchaseDetail.fullInvoiceNumber || selectedPurchaseDetail.code}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Proveedor: {selectedPurchaseDetail.supplierName} (CUIT: {selectedPurchaseDetail.supplierTaxId})
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetail(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Fecha Emisión</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPurchaseDetail.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Vencimiento</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPurchaseDetail.dueDate || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Depósito Ingresado</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPurchaseDetail.warehouseName || 'Casa Central'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-semibold">Condición de Pago</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">
                    {selectedPurchaseDetail.paymentMethod === 'current_account' ? 'Cuenta Corriente' : 'Contado'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Descripción</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-2 text-center">Dto.1</th>
                      <th className="py-2.5 px-2 text-center">Dto.2</th>
                      <th className="py-2.5 px-2 text-center">Dto.3</th>
                      <th className="py-2.5 px-2 text-center">IVA</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedPurchaseDetail.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{it.productCode}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{it.productName}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          ${it.unitCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-500">{it.discount1 || 0}%</td>
                        <td className="py-2.5 px-2 text-center text-slate-500">{it.discount2 || 0}%</td>
                        <td className="py-2.5 px-2 text-center text-slate-500">{it.discount3 || 0}%</td>
                        <td className="py-2.5 px-2 text-center font-semibold text-slate-700 dark:text-slate-300">{it.vatRate}%</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-slate-600 dark:text-slate-400">
                    Subtotal Neto Gravado:{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${selectedPurchaseDetail.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    IVA Fiscal Liquidado:{' '}
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      ${selectedPurchaseDetail.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedPurchaseDetail.perceptionIIBB ? (
                    <div className="text-slate-600 dark:text-slate-400">
                      Percepción IIBB:{' '}
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        ${selectedPurchaseDetail.perceptionIIBB.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : null}
                  {selectedPurchaseDetail.extraDiscountPercent ? (
                    <div className="text-amber-600 dark:text-amber-400 font-semibold">
                      Desc. Extra Proveedor (No repercute en IVA):{' '}
                      <span className="font-mono font-bold">
                        {selectedPurchaseDetail.extraDiscountPercent}% (-$
                        {(selectedPurchaseDetail.extraDiscountAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                      </span>
                    </div>
                  ) : null}
                  {selectedPurchaseDetail.notes && (
                    <div className="text-[11px] text-slate-500 italic mt-2">
                      Observaciones: {selectedPurchaseDetail.notes}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Total Factura</span>
                  <span className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                    ${selectedPurchaseDetail.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                {selectedPurchaseDetail.paymentStatus !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      const pur = selectedPurchaseDetail;
                      setSelectedPurchaseDetail(null);
                      setPayingPurchase(pur);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 text-xs transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Registrar Pago a Proveedor</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchaseDetail(null)}
                className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Purchase Payment Modal */}
      {payingPurchase && (
        <PurchasePaymentModal
          isOpen={!!payingPurchase}
          onClose={() => setPayingPurchase(null)}
          purchase={payingPurchase}
          supplier={
            store.suppliers.find((s) => s.id === payingPurchase.supplierId) || ({
              id: payingPurchase.supplierId,
              name: payingPurchase.supplierName,
              cuit: payingPurchase.supplierTaxId,
              taxCondition: payingPurchase.supplierTaxCondition || 'Responsable Inscripto',
              currentBalance: payingPurchase.total,
            } as any)
          }
          cashRegisters={store.cashRegisters || []}
          moneyBoxes={store.moneyBoxes || []}
          onSavePayment={(order: SupplierPaymentOrder) => {
            store.saveSupplierPaymentOrder(order);
            setPayingPurchase(null);
          }}
        />
      )}
    </div>
  );
};
