import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import {
  ReceiptText,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calendar,
  DollarSign,
  User,
  Trash2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DirectInvoiceSaleModal } from './DirectInvoiceSaleModal';
import { SalePrintModal } from './SalePrintModal';

export const SalesHistoryView: React.FC = () => {
  const { store, currentUser, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDocType, setFilterDocType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [refundSale, setRefundSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState(true);
  const [deleteReason, setDeleteReason] = useState('');
  const [saleToInvoice, setSaleToInvoice] = useState<Sale | null>(null);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<Sale | null>(null);

  const filteredSales = store.sales.filter((s) => {
    if (filterDocType !== 'all' && s.documentType !== filterDocType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.code.toLowerCase().includes(q) ||
      s.clientName.toLowerCase().includes(q) ||
      s.clientTaxId.includes(q) ||
      s.sellerName.toLowerCase().includes(q) ||
      s.fiscalData.invoiceNumber.includes(q)
    );
  });

  const totalSalesAmount = filteredSales.reduce((acc, s) => (s.status === 'completed' ? acc + s.total : acc), 0);
  const totalCount = filteredSales.length;

  const handleExecuteRefund = () => {
    if (!refundSale) return;
    if (!refundReason.trim()) {
      showToast('Por favor ingrese el motivo de la devolución', 'error');
      return;
    }

    const success = store.processRefund(refundSale.id, refundReason, currentUser);
    if (success) {
      showToast(`Devolución de la venta ${refundSale.code} procesada y stock repuesto`, 'success');
      setRefundSale(null);
      setRefundReason('');
    } else {
      showToast('No se pudo procesar la devolución', 'error');
    }
  };

  const handleExecuteDeleteSale = () => {
    if (!saleToDelete) return;

    const success = store.deleteSale(saleToDelete.id, {
      restoreStock: restoreStockOnDelete,
      user: currentUser,
      reason: deleteReason || 'Eliminación manual desde Historial de Ventas',
    });

    if (success) {
      showToast(`Venta ${saleToDelete.code} eliminada exitosamente`, 'success');
      setSaleToDelete(null);
      setDeleteReason('');
    } else {
      showToast('No se pudo eliminar la venta', 'error');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Historial de Ventas & Comprobantes</h2>
            <p className="text-xs text-slate-400">
              Registro auditado de ventas mostrador, facturación electrónica y devoluciones
            </p>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Filtrado</span>
            <span className="text-sm font-black text-amber-400">${totalSalesAmount.toLocaleString('es-AR')}</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Operaciones</span>
            <span className="text-sm font-black text-white">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nro venta, cliente, CUIT, factura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={filterDocType}
          onChange={(e) => setFilterDocType(e.target.value)}
          className="bg-slate-800 text-xs font-semibold text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
        >
          <option value="all">Todos los Comprobantes</option>
          <option value="ticket">Ticket No Fiscal</option>
          <option value="factura_a">Factura A</option>
          <option value="factura_b">Factura B</option>
          <option value="remito">Remito</option>
          <option value="presupuesto">Presupuesto</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 text-xs font-semibold text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
        >
          <option value="all">Todos los Estados</option>
          <option value="completed">Completadas</option>
          <option value="refunded">Devueltas / Anuladas</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredSales.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <ReceiptText className="w-12 h-12 mb-2 stroke-1 text-slate-600" />
            <p className="text-sm font-semibold">No se encontraron ventas con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Fecha & Código</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Tipo Doc</th>
                  <th className="p-3">Medios de Pago</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Vendedor</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="font-bold text-white block">{sale.code}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(sale.date).toLocaleDateString('es-AR')} {new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-white block">{sale.clientName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sale.clientTaxCondition} • {sale.clientTaxId}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-800 text-amber-400 border border-slate-700">
                        {sale.documentType.replace('_', ' ')}
                      </span>
                      {sale.fiscalData.cae && (
                        <span className="block text-[9px] font-mono text-emerald-400 mt-0.5">
                          CAE: {sale.fiscalData.cae.slice(0, 8)}...
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="space-y-0.5">
                        {sale.payments.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-block mr-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium"
                          >
                            {p.method === 'cash'
                              ? 'Efectivo'
                              : p.method === 'debit_card'
                              ? 'Débito'
                              : p.method === 'credit_card'
                              ? `Crédito (${p.cardInstallments || 1}c)`
                              : p.method === 'bank_transfer'
                              ? 'Transferencia'
                              : p.method === 'mercadopago_qr'
                              ? 'MercadoPago'
                              : 'Cta. Corriente'}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3 text-right font-bold text-amber-400 text-sm">
                      ${sale.total.toLocaleString('es-AR')}
                    </td>

                    <td className="p-3 text-slate-400 text-[11px]">{sale.sellerName}</td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                        }`}
                      >
                        {sale.status === 'completed' ? 'Completada' : 'Devuelta / Anulada'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Ver e Imprimir Comprobante Oficial */}
                        <button
                          onClick={() => setSelectedSaleForPrint(sale)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-400 transition-colors"
                          title="Ver e Imprimir Comprobante Oficial"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Facturar con ARCA si aún no es fiscal o si es ticket común */}
                        {sale.status === 'completed' && !sale.fiscalData?.cae && (
                          <button
                            onClick={() => setSaleToInvoice(sale)}
                            className="p-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition-colors shadow-sm"
                            title="Emitir Factura Electrónica ARCA (Factura A/B/C con CAE)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {sale.status === 'completed' && (
                          <button
                            onClick={() => setRefundSale(sale)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950 text-amber-400 hover:text-amber-300 transition-colors"
                            title="Procesar Devolución / Nota de Crédito"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSaleToDelete(sale);
                            setRestoreStockOnDelete(true);
                            setDeleteReason('');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Borrar / Eliminar Venta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Sale Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-700/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
                <Trash2 className="w-5 h-5" />
                <span>Borrar Registro de Venta</span>
              </div>
              <button
                onClick={() => setSaleToDelete(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Comprobante:</span>
                <span className="text-white font-mono font-bold">{saleToDelete.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-white font-semibold">{saleToDelete.clientName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Operación:</span>
                <span className="text-amber-400 font-bold font-mono">
                  ${saleToDelete.total.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Artículos:</span>
                <span className="text-slate-300">
                  {saleToDelete.items.reduce((acc, it) => acc + it.quantity, 0)} unidades (
                  {saleToDelete.items.length} ítems)
                </span>
              </div>
            </div>

            {/* Checkbox Restituir Stock */}
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restoreStockOnDelete}
                  onChange={(e) => setRestoreStockOnDelete(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-950 border-slate-600 text-rose-500 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    Restituir stock automáticamente al inventario
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight">
                    Devuelve las unidades vendidas a la sucursal de origen ({saleToDelete.warehouseName || 'Central'}).
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Motivo de la eliminación (opcional):
              </label>
              <input
                type="text"
                placeholder="Ej: Error de digitación, prueba de mostrador, venta duplicada..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white rounded-lg p-2.5 border border-slate-700 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setSaleToDelete(null)}
                className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteDeleteSale}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Venta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-base">
                <RotateCcw className="w-5 h-5" />
                <span>Devolución de Venta</span>
              </div>
              <button onClick={() => setRefundSale(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-white font-bold">Venta: {refundSale.code}</p>
              <p className="text-slate-400">Cliente: {refundSale.clientName}</p>
              <p className="text-amber-400 font-bold">Monto: ${refundSale.total.toLocaleString('es-AR')}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Motivo de la devolución:
              </label>
              <textarea
                rows={3}
                placeholder="Ej: Producto fallado de fábrica, cambio por otra medida, error de compra..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white rounded-lg p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              * Al confirmar, se devolverá automáticamente el stock al depósito correspondiente y se emitirá el ajuste contable.
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setRefundSale(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteRefund}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg"
              >
                Confirmar Devolución
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facturación Electrónica Directa Modal */}
      {saleToInvoice && (
        <DirectInvoiceSaleModal
          isOpen={!!saleToInvoice}
          sale={saleToInvoice}
          onClose={() => setSaleToInvoice(null)}
          onSuccess={(updatedSale, shouldPrint) => {
            setSaleToInvoice(null);
            if (shouldPrint) {
              setSelectedSaleForPrint(updatedSale);
            }
          }}
        />
      )}

      {/* Visor e Impresión de Comprobante / Factura Oficial */}
      {selectedSaleForPrint && (
        <SalePrintModal
          isOpen={!!selectedSaleForPrint}
          sale={selectedSaleForPrint}
          onClose={() => setSelectedSaleForPrint(null)}
        />
      )}
    </div>
  );
};
