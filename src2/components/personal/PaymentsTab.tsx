import React, { useState } from 'react';
import { EmployeePayment } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  Plus,
  Search,
  Printer,
  Trash2,
  FileText,
  Filter,
} from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { PaySlipPrintModal } from './PaySlipPrintModal';

export const PaymentsTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentToPrint, setPaymentToPrint] = useState<EmployeePayment | null>(null);

  const filteredPayments = store.employeePayments.filter((pay) => {
    if (selectedEmployeeId !== 'all' && pay.employeeId !== selectedEmployeeId) return false;
    if (selectedPeriod && pay.periodMonth !== selectedPeriod) return false;
    return true;
  });

  const totalGross = filteredPayments.reduce((sum, p) => sum + p.grossAmount, 0);
  const totalNet = filteredPayments.reduce((sum, p) => sum + p.netAmount, 0);

  const handleDeletePayment = (id: string, empName: string) => {
    if (window.confirm(`¿Eliminar el pago registrado a ${empName}?`)) {
      store.deleteEmployeePayment(id);
      showToast('Pago eliminado del historial', 'info');
    }
  };

  const formatPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'salary':
        return 'Sueldo';
      case 'biweekly':
        return 'Quincena';
      case 'sac':
        return 'Aguinaldo';
      case 'bonus':
        return 'Bono';
      case 'commission':
        return 'Comisión';
      case 'severance':
        return 'Liquidación';
      default:
        return 'Haberes';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Todos los empleados</option>
              {store.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              placeholder="Filtrar por período"
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {selectedPeriod && (
            <button
              onClick={() => setSelectedPeriod('')}
              className="text-xs text-slate-400 hover:text-white underline"
            >
              Limpiar período
            </button>
          )}
        </div>

        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pago
        </button>
      </div>

      {/* Totals Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total Bruto en Vista:</span>
          <span className="text-lg font-mono font-bold text-white">
            ${totalGross.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-400">Total Neto Liquidado:</span>
          <span className="text-lg font-mono font-black text-emerald-400">
            ${totalNet.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Empleado</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Período</th>
                <th className="py-3 px-3 text-right">Bruto</th>
                <th className="py-3 px-3 text-right">Neto</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold">No se registran pagos con los filtros aplicados</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Haz clic en "+ Nuevo Pago" para liquidar sueldos.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">{pay.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{pay.employeeName}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-200">
                        {formatPaymentTypeLabel(pay.paymentType)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">{pay.periodMonth}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300">
                      ${pay.grossAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      ${pay.netAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Pagado
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPaymentToPrint(pay)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-semibold transition-colors"
                          title="Imprimir Recibo de Sueldo"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Recibo
                        </button>
                        <button
                          onClick={() => handleDeletePayment(pay.id, pay.employeeName)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />

      <PaySlipPrintModal
        payment={paymentToPrint}
        onClose={() => setPaymentToPrint(null)}
      />
    </div>
  );
};
