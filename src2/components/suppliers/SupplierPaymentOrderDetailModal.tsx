import React from 'react';
import { SupplierPaymentOrder, Supplier } from '../../types';
import { X, Printer, CheckCircle2, FileText, DollarSign, ShieldAlert } from 'lucide-react';

interface SupplierPaymentOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SupplierPaymentOrder | null;
  supplier?: Supplier | null;
}

export const SupplierPaymentOrderDetailModal: React.FC<SupplierPaymentOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  supplier,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalRetentions = order.retentions ? order.retentions.reduce((acc, r) => acc + r.amount, 0) : 0;
  const totalMoneyPaid = order.paymentMethodsDetail && order.paymentMethodsDetail.length > 0
    ? order.paymentMethodsDetail.reduce((acc, m) => acc + m.amount, 0)
    : order.totalAmount - totalRetentions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span>ORDEN DE PAGO / RECIBO</span>
                <span className="font-mono text-blue-400">#{order.paymentOrderNumber}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Emitido el {new Date(order.date).toLocaleDateString('es-AR')} a las {new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
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
          {/* Supplier Info Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</span>
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-bold">Cuenta Corriente Proveedor</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-white">{order.supplierName}</h4>
              <p className="text-slate-400 mt-0.5">
                CUIT: {order.supplierTaxId || supplier?.taxId || '-'} {supplier?.address ? `• ${supplier.address}` : ''}
              </p>
            </div>
          </div>

          {/* Payment Methods Breakdown (Formas de pago) */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Medios de Pago Utilizados (Efectivo / Transferencia / Cheques)</span>
            </h5>
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Medio de Pago</th>
                    <th className="p-2.5">Origen (Caja / Banco)</th>
                    <th className="p-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {order.paymentMethodsDetail && order.paymentMethodsDetail.length > 0 ? (
                    order.paymentMethodsDetail.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2.5 font-bold uppercase text-white">
                          {p.method === 'cash' ? 'Efectivo' : p.method === 'bank_transfer' || p.method === 'transfer' ? 'Transferencia Bancaria' : p.method === 'check' ? 'Cheque / ECheq' : p.method}
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
                        {order.paymentMethod === 'cash' ? 'Efectivo' : order.paymentMethod}
                      </td>
                      <td className="p-2.5 text-slate-400 font-mono">
                        {order.destinationBoxId || '-'}
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

          {/* Retentions (Retenciones sufridas / aplicadas) */}
          {order.retentions && order.retentions.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Retenciones</span>
              </h5>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Tipo de Retención</th>
                      <th className="p-2.5">Nro Certificado</th>
                      <th className="p-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {order.retentions.map((ret, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2.5 font-bold text-white">{ret.type}</td>
                        <td className="p-2.5 font-mono text-slate-300">{ret.certificateNumber || '-'}</td>
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

          {/* Applied Purchases (Facturas de Proveedor Pagadas) */}
          {order.appliedToPurchases && order.appliedToPurchases.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-300 uppercase text-[11px] tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Facturas de Proveedor Canceladas / Abonadas</span>
              </h5>
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Factura Nro</th>
                      <th className="p-2.5 text-right">Monto Aplicado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {order.appliedToPurchases.map((app, idx) => (
                      <tr key={idx} className="hover:bg-slate-900">
                        <td className="p-2.5 font-mono font-bold text-white">{app.invoiceNumber}</td>
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
          {order.notes && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observaciones</span>
              <p className="text-slate-300 italic text-xs">{order.notes}</p>
            </div>
          )}

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-blue-300 uppercase block">Total Orden de Pago</span>
              <span className="text-[10px] text-slate-400">Reduce deuda en cuenta corriente de proveedor</span>
            </div>
            <span className="text-2xl font-black font-mono text-blue-400">
              ${order.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
            <span>Imprimir Orden</span>
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
