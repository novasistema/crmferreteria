import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleReturn, SupplierReturn } from '../../types';
import {
  RotateCcw,
  ShoppingCart,
  Package,
  Search,
  Calendar,
  Filter,
  Eye,
  Printer,
  TrendingDown,
  Building2,
  FileText,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { NewSaleReturnModal } from './NewSaleReturnModal';
import { NewSupplierReturnModal } from './NewSupplierReturnModal';
import { ReturnDetailModal } from './ReturnDetailModal';

export const ReturnsView: React.FC = () => {
  const { store } = useApp();

  const [activeTab, setActiveTab] = useState<'sales' | 'suppliers'>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');

  // Modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | SupplierReturn | null>(null);
  const [modalType, setModalType] = useState<'sale' | 'supplier'>('sale');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filtered Sale Returns
  const filteredSaleReturns = useMemo(() => {
    return (store.saleReturns || []).filter((r) => {
      const matchesSearch =
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.saleCode && r.saleCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.reason && r.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = !dateFilter || r.date.startsWith(dateFilter);
      const matchesWarehouse =
        selectedWarehouseId === 'all' || r.warehouseId === selectedWarehouseId;

      return matchesSearch && matchesDate && matchesWarehouse;
    });
  }, [store.saleReturns, searchTerm, dateFilter, selectedWarehouseId]);

  // Filtered Supplier Returns
  const filteredSupplierReturns = useMemo(() => {
    return (store.supplierReturns || []).filter((r) => {
      const matchesSearch =
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.purchaseCode && r.purchaseCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.reason && r.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDate = !dateFilter || r.date.startsWith(dateFilter);
      const matchesWarehouse =
        selectedWarehouseId === 'all' || r.warehouseId === selectedWarehouseId;

      return matchesSearch && matchesDate && matchesWarehouse;
    });
  }, [store.supplierReturns, searchTerm, dateFilter, selectedWarehouseId]);

  // Total Calculations for KPI cards
  const totalSalesRefundAmount = (store.saleReturns || []).reduce((acc, r) => acc + r.total, 0);
  const totalSupplierRefundAmount = (store.supplierReturns || []).reduce(
    (acc, r) => acc + r.total,
    0
  );

  const handleOpenDetail = (item: SaleReturn | SupplierReturn, type: 'sale' | 'supplier') => {
    setSelectedReturn(item);
    setModalType(type);
    setIsDetailModalOpen(true);
  };

  const getMethodBadge = (item: SaleReturn) => {
    switch (item.refundMethod) {
      case 'credit_note':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Nota de Crédito
          </span>
        );
      case 'cash':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Efectivo
          </span>
        );
      case 'current_account':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Cta. Cte.
          </span>
        );
      case 'exchange_voucher':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Vale de Cambio
          </span>
        );
      default:
        return null;
    }
  };

  const getSupplierMethodBadge = (item: SupplierReturn) => {
    switch (item.creditMethod) {
      case 'supplier_current_account':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Desc. Cta. Cte.
          </span>
        );
      case 'supplier_credit_note':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            NC Proveedor
          </span>
        );
      case 'cash_refund':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Reintegro Dinero
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Devoluciones
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de devoluciones de ventas y compras
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Dev. de Venta
          </button>
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            + Dev. a Proveedor
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card 1: Devoluciones de Ventas */}
        <div
          onClick={() => setActiveTab('sales')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Devoluciones de ventas
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {store.saleReturns?.length || 0}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Total reintegrado:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                ${totalSalesRefundAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </p>
          </div>
        </div>

        {/* Card 2: Devoluciones a Proveedores */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Devoluciones a proveedores
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
              {store.supplierReturns?.length || 0}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Total compensado:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                ${totalSupplierRefundAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-8">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sales'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Devoluciones de ventas ({store.saleReturns?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Devoluciones a proveedores ({store.supplierReturns?.length || 0})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'sales'
                ? 'Buscar por comprobante, cliente o motivo...'
                : 'Buscar por comprobante, proveedor o motivo...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Depósito:</span>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los depósitos</option>
              {store.warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-rose-500 hover:underline font-bold"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {activeTab === 'sales' ? (
        filteredSaleReturns.length === 0 ? (
          /* Empty state matching user request */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No hay devoluciones de ventas registradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
              Cuando un cliente devuelva un artículo o cambie un producto por falla o arrepentimiento,
              registralo acá para reingresar el stock y generar el reintegro.
            </p>
            <button
              onClick={() => setIsSaleModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar primera devolución
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Comprobante Dev.</th>
                    <th className="p-3.5">Venta Ref.</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5 text-center">Ítems</th>
                    <th className="p-3.5 text-right">Total Reintegrado</th>
                    <th className="p-3.5 text-center">Método</th>
                    <th className="p-3.5">Motivo</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSaleReturns.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {item.code}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">
                        {item.saleCode || '—'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {item.clientName}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                        {item.items.reduce((acc, it) => acc + it.quantity, 0)} u
                      </td>
                      <td className="p-3.5 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        ${item.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5 text-center">{getMethodBadge(item)}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {item.reason}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Completada
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(item, 'sale')}
                            title="Ver Comprobante"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : filteredSupplierReturns.length === 0 ? (
        /* Empty state for supplier returns */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No hay devoluciones a proveedores registradas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Registrá devoluciones de mercadería defectuosa o sobrante hacia tus proveedores para
            descontar stock y registrar notas de crédito.
          </p>
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar devolución a proveedor
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Comprobante Dev.</th>
                  <th className="p-3.5">Compra Ref.</th>
                  <th className="p-3.5">Proveedor</th>
                  <th className="p-3.5 text-center">Ítems</th>
                  <th className="p-3.5 text-right">Total Devolución</th>
                  <th className="p-3.5 text-center">Compensación</th>
                  <th className="p-3.5">Motivo</th>
                  <th className="p-3.5 text-center">Estado</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSupplierReturns.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('es-AR')}
                    </td>
                    <td className="p-3.5 font-bold font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono">
                      {item.purchaseCode || '—'}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {item.supplierName}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      {item.items.reduce((acc, it) => acc + it.quantity, 0)} u
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      ${item.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">{getSupplierMethodBadge(item)}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {item.reason}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        Completada
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(item, 'supplier')}
                          title="Ver Comprobante"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewSaleReturnModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={(newRet) => {
          setSelectedReturn(newRet);
          setModalType('sale');
          setIsDetailModalOpen(true);
        }}
      />

      <NewSupplierReturnModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={(newRet) => {
          setSelectedReturn(newRet);
          setModalType('supplier');
          setIsDetailModalOpen(true);
        }}
      />

      <ReturnDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedReturn(null);
        }}
        returnItem={selectedReturn}
        type={modalType}
      />
    </div>
  );
};
