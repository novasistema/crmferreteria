import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Purchase, Supplier, Warehouse } from '../../types';
import { NewPurchaseInvoiceModal } from './NewPurchaseInvoiceModal';
import { AIInvoiceImportModal } from './AIInvoiceImportModal';
import { ExtractedInvoiceData } from '../../lib/geminiInvoiceService';
import {
  Sparkles,
  Plus,
  Search,
  FileText,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  HelpCircle,
  X,
  RotateCw,
  Download,
  Receipt,
  ReceiptText,
} from 'lucide-react';

export const PurchasesAIManagementView: React.FC = () => {
  const { store } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  // Modals
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isAIImportModalOpen, setIsAIImportModalOpen] = useState(false);
  const [aiExtractedData, setAiExtractedData] = useState<ExtractedInvoiceData | null>(null);

  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<Purchase | null>(null);
  const [payingPurchase, setPayingPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'check'>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const purchases = store.purchases || [];

  const filteredPurchases = useMemo(() => {
    return purchases.filter((pur) => {
      if (filterStatus === 'pending' && pur.paymentStatus === 'paid') return false;
      if (filterStatus === 'paid' && pur.paymentStatus !== 'paid') return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (pur.fullInvoiceNumber && pur.fullInvoiceNumber.toLowerCase().includes(q)) ||
        (pur.code && pur.code.toLowerCase().includes(q)) ||
        (pur.supplierName && pur.supplierName.toLowerCase().includes(q)) ||
        (pur.supplierTaxId && pur.supplierTaxId.includes(q))
      );
    });
  }, [purchases, filterStatus, searchTerm]);

  // Financial Metrics
  const totalPurchasesSum = useMemo(
    () => purchases.reduce((acc, p) => acc + (p.total || 0), 0),
    [purchases]
  );
  const totalVatSum = useMemo(
    () => purchases.reduce((acc, p) => acc + (p.vatAmount || 0), 0),
    [purchases]
  );
  const totalExtraDiscountsSum = useMemo(
    () => purchases.reduce((acc, p) => acc + (p.extraDiscountAmount || 0), 0),
    [purchases]
  );
  const totalPendingDebt = useMemo(
    () =>
      purchases
        .filter((p) => p.paymentStatus !== 'paid')
        .reduce((acc, p) => acc + (p.balanceDue !== undefined ? p.balanceDue : p.total), 0),
    [purchases]
  );

  const handleSavePurchase = (purchase: Purchase) => {
    store.savePurchase(purchase);
  };

  const handleDeletePurchase = (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este comprobante de compra?')) {
      store.deletePurchase(id);
    }
  };

  const handleAIImportComplete = (extracted: ExtractedInvoiceData) => {
    setAiExtractedData(extracted);
    setIsNewInvoiceModalOpen(true);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPurchase) return;

    if (paymentAmount <= 0) {
      alert('El monto a pagar debe ser mayor a 0');
      return;
    }

    store.recordPurchasePayment(payingPurchase.id, {
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      method: paymentMethod,
      notes: paymentNotes,
    });

    setPayingPurchase(null);
    setPaymentAmount(0);
    setPaymentNotes('');
  };

  const handleExportCSV = () => {
    const headers = ['Fecha', 'Comprobante', 'Proveedor', 'CUIT', 'Deposito', 'Items', 'Subtotal', 'IVA', 'Total', 'Estado'];
    const rows = filteredPurchases.map((p) => [
      p.date,
      `"${p.invoiceType} ${p.fullInvoiceNumber || p.code}"`,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      p.supplierTaxId,
      `"${(p.warehouseName || 'Depósito Central').replace(/"/g, '""')}"`,
      p.items?.length || 0,
      p.subtotal,
      p.vatAmount,
      p.total,
      p.paymentStatus || 'pending',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `facturas_compra_${new Date().toISOString().split('T')[0]}.csv`);
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
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Compras & Recepción con IA
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  {purchases.length} comprobantes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Alta manual o por OCR inteligente con cálculo de base imponible, IVA y descuento comercial extra
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
              <span>Ingreso con IA (OCR)</span>
            </button>

            <button
              onClick={() => {
                setAiExtractedData(null);
                setIsNewInvoiceModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Factura</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Facturado
            </span>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              ${totalPurchasesSum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
              {purchases.length} comprobantes cargados
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              IVA Fiscal Liquidado
            </span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              ${totalVatSum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 block">
              Crédito fiscal acumulado
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Desc. Extra Proveedor
              </span>
              <span
                title="Descuentos comerciales especiales que no repercuten en el IVA"
                className="text-amber-500 cursor-help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              ${totalExtraDiscountsSum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 block">
              Ahorro comercial bonificado
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Saldo Pendiente (Deuda)
            </span>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              ${totalPendingDebt.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 block">
              Pendiente de cancelación
            </span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Filter Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas ({purchases.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pendientes de Pago
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === 'paid'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pagadas
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número de factura, proveedor, CUIT o código..."
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
        {filteredPurchases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-500 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              No hay facturas de compra registradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              Cargá tu primera factura de compra manualmente o utilizá el lector con Inteligencia Artificial.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAIImportModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ingreso con IA</span>
              </button>
              <button
                onClick={() => {
                  setAiExtractedData(null);
                  setIsNewInvoiceModalOpen(true);
                }}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              >
                + Cargar Manualmente
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">FECHA</th>
                  <th className="py-3 px-3.5">COMPROBANTE</th>
                  <th className="py-3 px-3.5">PROVEEDOR</th>
                  <th className="py-3 px-3.5">DEPÓSITO</th>
                  <th className="py-3 px-2 text-center">ÍTEMS</th>
                  <th className="py-3 px-3 text-right">SUBTOTAL</th>
                  <th className="py-3 px-3 text-right">IVA FISCAL</th>
                  <th className="py-3 px-3 text-right">DESC. EXTRA</th>
                  <th className="py-3 px-3 text-right">TOTAL FACTURA</th>
                  <th className="py-3 px-3 text-center">ESTADO</th>
                  <th className="py-3 px-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredPurchases.map((pur) => {
                  const isPaid = pur.paymentStatus === 'paid';

                  return (
                    <tr key={pur.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Fecha */}
                      <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-300">{pur.date}</td>

                      {/* Comprobante */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">
                          {pur.invoiceType} {pur.fullInvoiceNumber || pur.code}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{pur.code}</div>
                      </td>

                      {/* Proveedor */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{pur.supplierName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          CUIT: {pur.supplierTaxId}
                        </div>
                      </td>

                      {/* Depósito */}
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                        {pur.warehouseName || 'Casa Central'}
                      </td>

                      {/* Ítems */}
                      <td className="py-3 px-2 text-center font-bold text-slate-700 dark:text-slate-300">
                        {pur.items?.length || 0}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        ${pur.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* IVA */}
                      <td className="py-3 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                        ${pur.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Desc. Extra */}
                      <td className="py-3 px-3 text-right">
                        {pur.extraDiscountPercent ? (
                          <div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {pur.extraDiscountPercent}%
                            </span>
                            <span className="text-[10px] text-amber-500 block">
                              (-${(pur.extraDiscountAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">-</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ${pur.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : pur.paymentStatus === 'partial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isPaid ? 'PAGADA' : pur.paymentStatus === 'partial' ? 'PARCIAL' : 'PENDIENTE'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {!isPaid && (
                            <button
                              onClick={() => setPayingPurchase(pur)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-bold text-[11px] border border-emerald-300 dark:border-emerald-700"
                              title="Registrar Pago de Factura"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pagar</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedPurchaseDetail(pur)}
                            className="p-1.5 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Ver Detalle de la Factura"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeletePurchase(pur.id)}
                            className="p-1.5 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 rounded-lg transition-all cursor-pointer"
                            title="Eliminar Comprobante"
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
                Mostrando {filteredPurchases.length} de {purchases.length} facturas
              </span>
              <span className="font-semibold">
                Gestión AFIP / ARCA Ferretería Bruzzone
              </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden text-slate-900 dark:text-slate-100 text-xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Detalle de Factura: {selectedPurchaseDetail.invoiceType} {selectedPurchaseDetail.fullInvoiceNumber || selectedPurchaseDetail.code}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Proveedor: {selectedPurchaseDetail.supplierName} (CUIT: {selectedPurchaseDetail.supplierTaxId})
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetail(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Fecha Emisión</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPurchaseDetail.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Vencimiento</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPurchaseDetail.dueDate || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Depósito Ingresado</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPurchaseDetail.warehouseName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Condición de Pago</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 capitalize">
                    {selectedPurchaseDetail.paymentMethod === 'current_account' ? 'Cuenta Corriente' : 'Contado'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">CÓDIGO</th>
                      <th className="py-2.5 px-3">DESCRIPCIÓN</th>
                      <th className="py-2.5 px-3 text-center">CANT.</th>
                      <th className="py-2.5 px-3 text-right">PRECIO UNIT.</th>
                      <th className="py-2.5 px-2 text-center">DTO. 1</th>
                      <th className="py-2.5 px-2 text-center">DTO. 2</th>
                      <th className="py-2.5 px-2 text-center">DTO. 3</th>
                      <th className="py-2.5 px-2 text-center">IVA</th>
                      <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {selectedPurchaseDetail.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">{it.productCode}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-200">{it.productName}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-slate-100">{it.quantity}</td>
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
                  <div className="text-slate-500 dark:text-slate-400">
                    Subtotal Neto Gravado:{' '}
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                      ${selectedPurchaseDetail.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    IVA Fiscal Liquidado:{' '}
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      ${selectedPurchaseDetail.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedPurchaseDetail.extraDiscountPercent ? (
                    <div className="text-amber-600 dark:text-amber-400 font-semibold">
                      Desc. Extra Proveedor (No repercute en IVA):{' '}
                      <span className="font-mono font-bold">
                        {selectedPurchaseDetail.extraDiscountPercent}% (-${(selectedPurchaseDetail.extraDiscountAmount || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })})
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold block">Total Comprobante</span>
                  <span className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${selectedPurchaseDetail.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

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
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md text-xs transition-all"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pagar Factura Ahora</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPurchaseDetail(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Purchase Modal */}
      {payingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-slate-900 dark:text-slate-100 text-xs">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Registrar Pago de Factura
              </h3>
              <button
                onClick={() => setPayingPurchase(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Factura: <span className="font-bold text-slate-800 dark:text-slate-200">{payingPurchase.fullInvoiceNumber || payingPurchase.code}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Proveedor: <span className="font-bold text-slate-800 dark:text-slate-200">{payingPurchase.supplierName}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Saldo Pendiente:{' '}
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                    ${(payingPurchase.balanceDue !== undefined ? payingPurchase.balanceDue : payingPurchase.total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Monto a Pagar ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  defaultValue={payingPurchase.balanceDue !== undefined ? payingPurchase.balanceDue : payingPurchase.total}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="cash">Efectivo / Caja Principal</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="check">Cheque Propio / Terceros</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Observaciones / Nro Comprobante Pago
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej: Transferencia Banco Galicia Ref #889392"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingPurchase(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-semibold cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md text-xs cursor-pointer"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
