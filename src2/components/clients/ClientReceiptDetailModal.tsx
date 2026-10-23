import React from 'react';
import { ClientReceipt, Client } from '../../types';
import { X, Printer, CheckCircle2, Building2, Calendar, FileText, DollarSign, ShieldAlert } from 'lucide-react';

interface ClientReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ClientReceipt | null;
  client?: Client | null;
}

export const ClientReceiptDetailModal: React.FC<ClientReceiptDetailModalProps> = ({
  isOpen,
  onClose,
  receipt,
  client,
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalMoneyPaid = receipt.paymentMethodsDetail && receipt.paymentMethodsDetail.length > 0
    ? receipt.paymentMethodsDetail.reduce((acc, m) => acc + m.amount, 0)
    : receipt.totalAmount - (receipt.retainedTaxes || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span>RECIBO DE COBRO</span>
                <span className="font-mono text-amber-400">#{receipt.receiptNumber}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Emitido el {new Date(receipt.date).toLocaleDateString('es-AR')} a las {new Date(receipt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Printable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs custom-scrollbar">
          {/* Client Info Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente</span>
              <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-bold">Cuenta Corriente</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{receipt.clientName}</h4>
              {client && (
                <p className="text-slate-400 mt-0.5">
                  CUIT/DNI: {client.taxId || '-'} • {client.taxCondition || 'Consumidor Final'} {client.address ? `• ${client.address}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Payment Methods Breakdown (Formas de pago) */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Formas de Cobro / Medios de Pago</span>
            </h5>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Medio / Forma de Pago</th>
                    <th className="p-2.5">Destino (Caja / Banco)</th>
                    <th className="p-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {receipt.paymentMethodsDetail && receipt.paymentMethodsDetail.length > 0 ? (
                    receipt.paymentMethodsDetail.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2.5 font-bold uppercase text-white">
                          {p.method === 'cash' ? 'Efectivo' : p.method === 'bank_transfer' || p.method === 'transfer' ? 'Transferencia Bancaria' : p.method === 'debit_card' || p.method === 'credit_card' || p.method === 'card' ? 'Tarjeta' : p.method === 'check' ? 'Cheque' : p.method}
                        </td>
                        <td className="p-2.5 text-slate-400 font-mono">
                          {p.boxId}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-emerald-400">
                          ${p.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2.5 font-bold uppercase text-white">
                        {receipt.paymentMethod === 'cash' ? 'Efectivo' : receipt.paymentMethod}
                      </td>
                      <td className="p-2.5 text-slate-400 font-mono">
                        {receipt.destinationBoxId}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-400">
                        ${totalMoneyPaid.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Retained Taxes Detail (Retenciones) */}
          {receipt.retainedTaxesDetail && receipt.retainedTaxesDetail.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Certificados de Retención Aplicados</span>
              </h5>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Tipo de Retención</th>
                      <th className="p-2.5">Nro Certificado</th>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5 text-right">Monto Retenido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {receipt.retainedTaxesDetail.map((ret, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2.5 font-bold text-white">{ret.type}</td>
                        <td className="p-2.5 font-mono text-slate-300">{ret.certificateNumber || '-'}</td>
                        <td className="p-2.5 text-slate-400">{ret.date ? new Date(ret.date).toLocaleDateString('es-AR') : '-'}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-400">
                          ${ret.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applied Invoices (Comprobantes Aplicados) */}
          {receipt.appliedToSales && receipt.appliedToSales.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Comprobantes / Facturas Canceladas o Abonadas</span>
              </h5>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Comprobante</th>
                      <th className="p-2.5 text-right">Monto Aplicado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {receipt.appliedToSales.map((app, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2.5 font-mono font-bold text-white">{app.saleCode}</td>
                        <td className="p-2.5 text-right font-mono font-black text-blue-400">
                          ${app.amountApplied.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes / Observations */}
          {receipt.notes && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observaciones</span>
              <p className="text-slate-300 italic text-xs">{receipt.notes}</p>
            </div>
          )}

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase block">Total Cobrado (Efectivo/Valores + Retenciones)</span>
              <span className="text-[10px] text-slate-400">Impacta como crédito en cuenta corriente</span>
            </div>
            <span className="text-2xl font-black font-mono text-emerald-400">
              ${receipt.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center space-x-2 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Recibo</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
