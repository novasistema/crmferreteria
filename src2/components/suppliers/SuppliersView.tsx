import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, Purchase, SupplierPaymentOrder } from '../../types';
import { SupplierFormModal } from './SupplierFormModal';
import { SupplierDetailLedgerModal } from './SupplierDetailLedgerModal';
import { SupplierPaymentOrderModal } from './SupplierPaymentOrderModal';
import { SupplierManualMovementModal } from './SupplierManualMovementModal';
import { NewPurchaseInvoiceModal } from '../purchases/NewPurchaseInvoiceModal';
import { AIInvoiceImportModal } from '../purchases/AIInvoiceImportModal';
import { ExtractedInvoiceData } from '../../lib/geminiInvoiceService';
import {
  Building,
  Plus,
  Search,
  DollarSign,
  FileText,
  CreditCard,
  History,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Sparkles,
  Phone,
  Mail,
  ArrowRight,
  TrendingDown,
  RotateCw,
  Download,
  X,
  Users,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { store } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debtors' | 'up_to_date'>('all');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [ledgerSupplierId, setLedgerSupplierId] = useState<string | null>(null);
  const [paymentOrderSupplier, setPaymentOrderSupplier] = useState<Supplier | null>(null);
  const [manualAdjustmentSupplier, setManualAdjustmentSupplier] = useState<Supplier | null>(null);

  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isAIImportModalOpen, setIsAIImportModalOpen] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState<ExtractedInvoiceData | null>(null);

  const activeSuppliers = (store.suppliers || []).filter((s) => s.active !== false);

  const filteredSuppliers = activeSuppliers.filter((s) => {
    if (filterType === 'debtors' && (s.currentBalance || 0) <= 0) return false;
    if (filterType === 'up_to_date' && (s.currentBalance || 0) > 0) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.businessName && s.businessName.toLowerCase().includes(q)) ||
      s.cuit.includes(q) ||
      (s.code && s.code.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  const totalSupplierDebt = activeSuppliers.reduce(
    (acc, s) => acc + ((s.currentBalance || 0) > 0 ? s.currentBalance || 0 : 0),
    0
  );

  const countDebtors = activeSuppliers.filter((s) => (s.currentBalance || 0) > 0).length;
  const countUpToDate = activeSuppliers.filter((s) => (s.currentBalance || 0) <= 0).length;

  const currentLedgerSupplier = activeSuppliers.find((s) => s.id === ledgerSupplierId);

  const handleSaveSupplier = (supplierData: Partial<Supplier>) => {
    if (supplierToEdit) {
      store.updateSupplier(supplierToEdit.id, supplierData);
    } else {
      store.addSupplier(supplierData);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      store.deleteSupplier(id);
    }
  };

  const handleSavePurchase = (purchase: Purchase) => {
    store.savePurchase(purchase);
  };

  const handleSavePaymentOrder = (order: SupplierPaymentOrder) => {
    store.saveSupplierPaymentOrder(order);
  };

  const handleSaveManualAdjustment = (data: {
    type: 'purchase_debt' | 'payment_credit' | 'credit_note' | 'debit_adjustment';
    amount: number;
    concept: string;
    voucherNumber: string;
    notes?: string;
  }) => {
    if (!manualAdjustmentSupplier) return;
    store.saveSupplierManualMovement(
      manualAdjustmentSupplier.id,
      data.type,
      data.amount,
      data.concept,
      data.voucherNumber,
      data.notes
    );
  };

  const handleAIImportComplete = (extracted: ExtractedInvoiceData) => {
    setAiExtractedData(extracted);
    setIsNewInvoiceModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Nombre', 'RazonSocial', 'CUIT', 'CondicionIVA', 'Telefono', 'Banco', 'SaldoDeuda'];
    const rows = filteredSuppliers.map((s) => [
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.businessName || '').replace(/"/g, '""')}"`,
      s.cuit,
      s.taxCondition,
      s.phone || '',
      `"${(s.bankName || '').replace(/"/g, '""')}"`,
      s.currentBalance || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `proveedores_${new Date().toISOString().split('T')[0]}.csv`);
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
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Proveedores & Cuentas Corrientes
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  {activeSuppliers.length} proveedores
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestión de proveedores, órdenes de pago, estados de cuenta corriente e historial comercial
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
              <span>Ingreso IA</span>
            </button>

            <button
              onClick={() => {
                setAiExtractedData(null);
                setIsNewInvoiceModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cargar Factura</span>
            </button>

            <button
              onClick={() => {
                setSupplierToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proveedor</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Proveedores
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {activeSuppliers.length}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              Registrados y activos
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Deuda Total a Proveedores
            </span>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              ${totalSupplierDebt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 block">
              Saldo acumulado a abonar
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Con Saldo Pendiente
            </span>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {countDebtors}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
              Proveedores con cuenta deudora
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Proveedores al Día ($0)
            </span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {countUpToDate}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              Cuentas corrientes sin deuda
            </span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos ({activeSuppliers.length})
          </button>
          <button
            onClick={() => setFilterType('debtors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'debtors'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Con Saldo Pendiente ({countDebtors})
          </button>
          <button
            onClick={() => setFilterType('up_to_date')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterType === 'up_to_date'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Al Día ($0) ({countUpToDate})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre comercial, razón social, CUIT o teléfono..."
            className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
      </div>

      {/* 4. Table Body Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredSuppliers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-500 mb-4">
              <Building className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No se encontraron proveedores
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {searchTerm
                ? 'No hay proveedores que coincidan con los criterios de búsqueda.'
                : 'Comenzá agregando un proveedor o importando facturas electrónicas de compra.'}
            </p>
            <button
              onClick={() => {
                setSupplierToEdit(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              + Agregar Primer Proveedor
            </button>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">CÓDIGO</th>
                  <th className="py-3 px-4">PROVEEDOR / RAZÓN SOCIAL</th>
                  <th className="py-3 px-4">CUIT / CONDICIÓN IVA</th>
                  <th className="py-3 px-4">CONTACTO & TELÉFONO</th>
                  <th className="py-3 px-4">BANCO / CBU</th>
                  <th className="py-3 px-4 text-right">SALDO DEUDA</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredSuppliers.map((supplier) => {
                  const balance = supplier.currentBalance || 0;
                  const hasDebt = balance > 0;

                  return (
                    <tr
                      key={supplier.id}
                      onClick={() => setLedgerSupplierId(supplier.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    >
                      {/* Código */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {supplier.code}
                      </td>

                      {/* Proveedor & Razón Social */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{supplier.name}</div>
                        {supplier.businessName && supplier.businessName !== supplier.name && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{supplier.businessName}</div>
                        )}
                        {supplier.address && (
                          <div className="text-[10px] text-slate-400">{supplier.address}</div>
                        )}
                      </td>

                      {/* CUIT & Condición IVA */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">{supplier.cuit}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{supplier.taxCondition}</div>
                      </td>

                      {/* Contacto & Tel */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {supplier.contactPerson || 'Sin contacto'}
                        </div>
                        {supplier.phone && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Banco / CBU */}
                      <td className="py-3 px-4">
                        <div className="text-slate-700 dark:text-slate-300">{supplier.bankName || 'No informado'}</div>
                        {supplier.alias && (
                          <div className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                            Alias: {supplier.alias}
                          </div>
                        )}
                      </td>

                      {/* Saldo Deuda */}
                      <td className="py-3 px-4 text-right">
                        <div
                          className={`font-mono font-bold text-sm ${
                            hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {hasDebt ? 'Saldo a Pagar' : 'Al Día'}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <div
                          className="flex items-center justify-center space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Ver Mayor Cta Cte */}
                          <button
                            onClick={() => setLedgerSupplierId(supplier.id)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Ver Cuenta Corriente (Mayor)"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Emitir Pago */}
                          <button
                            onClick={() => setPaymentOrderSupplier(supplier)}
                            className="p-1.5 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Emitir Orden de Pago"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setSupplierToEdit(supplier);
                              setIsFormModalOpen(true);
                            }}
                            className="p-1.5 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Editar Proveedor"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="p-1.5 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Eliminar Proveedor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Table Footer */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Mostrando {filteredSuppliers.length} de {activeSuppliers.length} proveedores
              </span>
              <span className="font-semibold">
                Gestión de Proveedores Ferretería Bruzzone
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Supplier Form Modal */}
      <SupplierFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSupplier}
        supplierToEdit={supplierToEdit}
      />

      {/* Supplier Ledger Modal */}
      {currentLedgerSupplier && (
        <SupplierDetailLedgerModal
          isOpen={!!ledgerSupplierId}
          onClose={() => setLedgerSupplierId(null)}
          supplier={currentLedgerSupplier}
          movements={store.supplierAccountMovements}
          purchases={store.purchases}
          paymentOrders={store.supplierPaymentOrders}
          onOpenNewInvoice={() => {
            setIsNewInvoiceModalOpen(true);
          }}
          onOpenPaymentOrder={() => {
            setPaymentOrderSupplier(currentLedgerSupplier);
          }}
          onOpenManualAdjustment={() => {
            setManualAdjustmentSupplier(currentLedgerSupplier);
          }}
        />
      )}

      {/* Supplier Payment Order Modal */}
      {paymentOrderSupplier && (
        <SupplierPaymentOrderModal
          isOpen={!!paymentOrderSupplier}
          onClose={() => setPaymentOrderSupplier(null)}
          supplier={paymentOrderSupplier}
          pendingPurchases={store.purchases}
          cashRegisters={store.cashRegisters}
          moneyBoxes={store.moneyBoxes || []}
          nextOpNumber={`OP-0001-${String((store.supplierPaymentOrders?.length || 0) + 1).padStart(8, '0')}`}
          onSavePaymentOrder={handleSavePaymentOrder}
        />
      )}

      {/* Supplier Manual Adjustment Modal */}
      {manualAdjustmentSupplier && (
        <SupplierManualMovementModal
          isOpen={!!manualAdjustmentSupplier}
          onClose={() => setManualAdjustmentSupplier(null)}
          supplier={manualAdjustmentSupplier}
          onSaveMovement={handleSaveManualAdjustment}
        />
      )}

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
        onImportComplete={handleAIImportComplete}
      />
    </div>
  );
};
