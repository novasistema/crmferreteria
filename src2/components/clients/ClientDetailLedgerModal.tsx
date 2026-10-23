import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, ClientAccountMovement, ClientReceipt, Sale } from '../../types';
import { ClientReceiptModal } from './ClientReceiptModal';
import { ClientManualMovementModal } from './ClientManualMovementModal';
import { AccountStatementPrintModal } from './AccountStatementPrintModal';
import { ClientReceiptDetailModal } from './ClientReceiptDetailModal';
import {
  FileText,
  Printer,
  DollarSign,
  PlusCircle,
  X,
  Receipt,
  ShoppingCart,
  Calendar,
  Eye,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface ClientDetailLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export const ClientDetailLedgerModal: React.FC<ClientDetailLedgerModalProps> = ({
  isOpen,
  onClose,
  clientId,
}) => {
  const { store, setPreviewClientPortal } = useApp();

  const [activeTab, setActiveTab] = useState<'movements' | 'receipts' | 'invoices'>('movements');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isManualMovementModalOpen, setIsManualMovementModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState<ClientReceipt | null>(null);

  const client = useMemo(() => {
    return store.clients.find((c) => c.id === clientId);
  }, [store.clients, clientId]);

  // Movements
  const movements = useMemo(() => {
    return store.clientAccountMovements
      .filter((m) => m.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.clientAccountMovements, clientId]);

  // Receipts
  const receipts = useMemo(() => {
    return store.clientReceipts
      .filter((r) => r.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.clientReceipts, clientId]);

  // Invoices / Sales
  const invoices = useMemo(() => {
    return store.sales
      .filter((s) => s.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.sales, clientId]);

  // Total Debe / Haber
  const totalDebe = useMemo(() => {
    return movements
      .filter((m) => m.type === 'sale_debt' || m.type === 'adjustment_debit')
      .reduce((acc, m) => acc + m.amount, 0);
  }, [movements]);

  const totalHaber = useMemo(() => {
    return movements
      .filter((m) => m.type === 'payment_credit' || m.type === 'return_credit' || m.type === 'adjustment_credit')
      .reduce((acc, m) => acc + m.amount, 0);
  }, [movements]);

  // Keyboard shortcut to close (Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !client) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-6xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Top Header matching Image 3 */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {client.name}
              </h2>
              {client.hasCurrentAccount && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase">
                  Cuenta Corriente Habilitada
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="font-mono text-slate-300 font-semibold">CUIT/DNI: {client.taxId}</span>
              <span>•</span>
              <span>{client.taxCondition}</span>
              {client.phone && (
                <>
                  <span>•</span>
                  <span>Tel: {client.phone}</span>
                </>
              )}
              {client.address && (
                <>
                  <span>•</span>
                  <span>{client.address}, {client.city}</span>
                </>
              )}
            </div>
          </div>

          {/* Top Actions & Account Balance Box */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">$ Cuenta Corriente</span>
              <span className={`text-xl font-black font-mono ${client.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${client.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Action Buttons matching Image 3 */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Imprimir Resumen de Cuenta"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Imprimir Estado de Cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Recibo de Cobro</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualMovementModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Movimiento</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-200 hover:text-rose-400 border border-slate-700 hover:border-rose-500/50 flex items-center space-x-1.5 transition-all cursor-pointer font-bold text-xs shadow-sm"
                title="Cerrar y volver a Clientes (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 Summary Cards matching Image 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Debe
              </span>
              <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-0.5 block">
                ${totalDebe.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Haber
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">
                ${totalHaber.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Saldo
              </span>
              <span className={`text-xl sm:text-2xl font-black font-mono mt-0.5 block ${client.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${client.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-base font-mono">
              $
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pt-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'movements'
                  ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Movimientos ({movements.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'receipts'
                  ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Recibos de Cobro ({receipts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === 'invoices'
                  ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Facturas / Comprobantes ({invoices.length})</span>
            </button>
          </div>

          <button
            onClick={() => setPreviewClientPortal(client.taxId)}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver Portal de Cliente</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* TAB 1: MOVEMENTS TABLE matching Image 3 */}
          {activeTab === 'movements' && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Documento</th>
                    <th className="p-3 text-right">Debe</th>
                    <th className="p-3 text-right">Haber</th>
                    <th className="p-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No hay movimientos registrados para este cliente.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => {
                      const isDebe = m.type === 'sale_debt' || m.type === 'adjustment_debit';
                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 text-slate-300 font-mono">
                            {new Date(m.date).toLocaleDateString('es-AR')} {new Date(m.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-white block">{m.concept}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">
                            {m.referenceId || m.receiptNumber || '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-rose-400">
                            {isDebe ? `$${m.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {!isDebe ? `$${m.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-white">
                            ${m.balanceAfter.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: RECEIPTS TABLE */}
          {activeTab === 'receipts' && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="p-3">Nro Recibo</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Medio de Pago / Caja</th>
                    <th className="p-3">Retenciones</th>
                    <th className="p-3 text-right">Total Cobrado</th>
                    <th className="p-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No hay recibos de cobranza emitidos para este cliente.
                      </td>
                    </tr>
                  ) : (
                    receipts.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedReceiptForView(r)}
                        className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        title="Haga clic para ver el detalle completo de este recibo"
                      >
                        <td className="p-3 font-mono font-bold text-amber-400 group-hover:underline flex items-center space-x-1.5">
                          <span>{r.receiptNumber}</span>
                          <span className="text-[10px] text-slate-500 font-normal px-1 bg-slate-800 rounded group-hover:text-amber-300">Ver detalle</span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono">
                          {new Date(r.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-3 text-slate-300">
                          <span className="capitalize">{r.paymentMethod}</span> ({r.destinationBoxId})
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {r.retainedTaxes && r.retainedTaxes > 0 ? `$${r.retainedTaxes.toLocaleString('es-AR')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                          ${r.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-slate-400 italic">
                          {r.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: INVOICES / SALES TABLE */}
          {activeTab === 'invoices' && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Tipo & Nro Comprobante</th>
                    <th className="p-3">Artículos</th>
                    <th className="p-3 text-center">Estado Pago</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No hay comprobantes o ventas registradas para este cliente.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-300 font-mono">
                          {new Date(inv.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-white uppercase">{inv.documentType}</span>
                          <span className="font-mono text-slate-400 block text-[11px]">{inv.code}</span>
                        </td>
                        <td className="p-3 text-slate-300">
                          {inv.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.paymentStatus === 'paid'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {inv.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente / Cta Cte'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-white">
                          ${inv.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer with explicit Salir button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs mt-auto">
          <span className="text-slate-400 text-xs hidden sm:inline">
            Presione <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono text-[11px]">Esc</kbd> o haga clic en <strong>Salir</strong> para volver a Clientes
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold border border-slate-700 flex items-center space-x-2 transition-all cursor-pointer ml-auto shadow-sm"
          >
            <X className="w-4 h-4" />
            <span>Salir / Volver a Clientes</span>
          </button>
        </div>

        {/* Sub-modals */}
        <ClientReceiptDetailModal
          isOpen={!!selectedReceiptForView}
          onClose={() => setSelectedReceiptForView(null)}
          receipt={selectedReceiptForView}
          client={client}
        />

        <ClientReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          client={client}
        />

        <ClientManualMovementModal
          isOpen={isManualMovementModalOpen}
          onClose={() => setIsManualMovementModalOpen(false)}
          client={client}
        />

        <AccountStatementPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          client={client}
          movements={movements}
        />
      </div>
    </div>
  );
};
