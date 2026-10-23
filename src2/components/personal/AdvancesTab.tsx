import React, { useState } from 'react';
import { EmployeeAdvance } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  ArrowDownCircle,
  Plus,
  Printer,
  Trash2,
  Filter,
} from 'lucide-react';
import { AdvanceModal } from './AdvanceModal';
import { AdvancePrintModal } from './AdvancePrintModal';

export const AdvancesTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advanceToPrint, setAdvanceToPrint] = useState<EmployeeAdvance | null>(null);

  const filteredAdvances = store.employeeAdvances.filter((adv) => {
    if (selectedEmployeeId !== 'all' && adv.employeeId !== selectedEmployeeId) return false;
    return true;
  });

  const totalAdvances = filteredAdvances.reduce((sum, a) => sum + a.amount, 0);

  const handleDeleteAdvance = (id: string, empName: string) => {
    if (window.confirm(`¿Eliminar el adelanto a ${empName}?`)) {
      store.deleteEmployeeAdvance(id);
      showToast('Adelanto eliminado', 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">Todos los empleados</option>
            {store.employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Adelanto
        </button>
      </div>

      {/* Total Card */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 block">
            Total Adelantos Entregados en Vista:
          </span>
          <span className="text-xs text-slate-500">
            {filteredAdvances.length} {filteredAdvances.length === 1 ? 'adelanto' : 'adelantos'} registrados
          </span>
        </div>
        <span className="text-xl font-mono font-black text-amber-400">
          ${totalAdvances.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Advances Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Empleado</th>
                <th className="py-3 px-3 text-right">Monto</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold">No se encontraron adelantos de sueldo</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Haz clic en "+ Nuevo Adelanto" para registrar una entrega de dinero a cuenta.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">{adv.date}</td>
                    <td className="py-3 px-4 font-bold text-white">{adv.employeeName}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                      ${adv.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{adv.reason || '-'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Pagado
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setAdvanceToPrint(adv)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px] font-semibold transition-colors"
                          title="Imprimir Comprobante de Adelanto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Recibo
                        </button>
                        <button
                          onClick={() => handleDeleteAdvance(adv.id, adv.employeeName)}
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
      <AdvanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <AdvancePrintModal
        advance={advanceToPrint}
        onClose={() => setAdvanceToPrint(null)}
      />
    </div>
  );
};
