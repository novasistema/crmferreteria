import React from 'react';
import { EmployeePayment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

interface PaySlipPrintModalProps {
  payment: EmployeePayment | null;
  onClose: () => void;
}

export const PaySlipPrintModal: React.FC<PaySlipPrintModalProps> = ({ payment, onClose }) => {
  const { store } = useApp();

  if (!payment) return null;

  const emp = store.employees.find((e) => e.id === payment.employeeId);
  const company = store.settings;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Recibo de Sueldo y Liquidación</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable styling) */}
        <div className="p-8 bg-white text-slate-900 font-sans print:p-0">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {company.name || 'BRUZZONE AUTOMOTORES Y SERVICIOS'}
              </h2>
              <p className="text-xs text-slate-600 font-medium">CUIT: {company.cuit || '30-12345678-9'}</p>
              <p className="text-xs text-slate-600">{company.address || 'Bv. Duffy 29, Alejandro Roca'}</p>
              <p className="text-xs text-slate-600">{company.phone || 'Tel: 358-4980503'}</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 text-xs font-black uppercase tracking-wider rounded mb-1">
                Recibo de Haberes
              </div>
              <p className="text-xs font-mono font-bold text-slate-800">{payment.receiptNumber}</p>
              <p className="text-xs text-slate-600">Fecha de Pago: {formattedDate}</p>
              <p className="text-xs font-bold text-slate-800">Período: {payment.periodMonth}</p>
            </div>
          </div>

          {/* Employee info box */}
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs mb-4">
            <div>
              <p className="text-slate-500 font-medium">Empleado:</p>
              <p className="font-bold text-slate-900 text-sm">{payment.employeeName}</p>
              <p className="text-slate-700">DNI / CUIL: {emp?.dni || emp?.cuil || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Cargo / Función:</p>
              <p className="font-bold text-slate-900">{emp?.position || 'Personal'}</p>
              <p className="text-slate-700">Fecha de Ingreso: {emp?.hireDate || '-'}</p>
            </div>
          </div>

          {/* Details table */}
          <table className="w-full text-xs mb-6 border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-600 font-semibold bg-slate-50">
                <th className="py-2 px-3 text-left">Concepto</th>
                <th className="py-2 px-3 text-right">Haberes con Aporte</th>
                <th className="py-2 px-3 text-right">Deducciones / Anticipos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-3">
                  <span className="font-bold text-slate-800">
                    {payment.paymentType === 'salary'
                      ? 'Sueldo Básico / Haberes del Mes'
                      : payment.paymentType === 'sac'
                      ? 'Sueldo Anual Complementario (SAC / Aguinaldo)'
                      : payment.paymentType === 'biweekly'
                      ? 'Anticipo Quincenal de Haberes'
                      : payment.paymentType === 'bonus'
                      ? 'Gratificación Especial / Bono'
                      : payment.paymentType === 'commission'
                      ? 'Comisión por Ventas'
                      : 'Liquidación Final de Haberes'}
                  </span>
                  {payment.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">{payment.notes}</p>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                  ${payment.grossAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400">-</td>
              </tr>

              {payment.deductions > 0 && (
                <tr>
                  <td className="py-2 px-3 text-slate-700">Retenciones y deducciones legales / faltas</td>
                  <td className="py-2 px-3 text-right text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-semibold text-red-600">
                    -${payment.deductions.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}

              {payment.advancesDeducted > 0 && (
                <tr>
                  <td className="py-2 px-3 text-slate-700">Adelantos de haberes tomados en el período</td>
                  <td className="py-2 px-3 text-right text-slate-400">-</td>
                  <td className="py-2 px-3 text-right font-semibold text-red-600">
                    -${payment.advancesDeducted.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold bg-slate-100 text-sm">
                <td className="py-3 px-3 text-slate-900 uppercase">Neto a Cobrar</td>
                <td colSpan={2} className="py-3 px-3 text-right text-emerald-700 font-black text-base">
                  ${payment.netAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Payment method note */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-slate-600 mb-8">
            <p>
              <strong className="text-slate-800">Forma de pago:</strong>{' '}
              {payment.paymentMethod === 'transfer'
                ? `Transferencia bancaria a cuenta: ${payment.bankAccountOrBoxId || 'Declarada'}`
                : payment.paymentMethod === 'cash'
                ? 'Efectivo en mano'
                : 'Cheque'}
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-dashed border-slate-300 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5 h-10"></div>
              <p className="font-bold text-slate-900">Firma Empleador / Responsable</p>
              <p className="text-[10px] text-slate-500">{company.name || 'Nova Systems'}</p>
            </div>
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1.5 h-10"></div>
              <p className="font-bold text-slate-900">Firma Empleado en Conformidad</p>
              <p className="text-[10px] text-slate-500">{payment.employeeName}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
