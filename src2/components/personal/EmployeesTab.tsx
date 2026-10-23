import React, { useState } from 'react';
import { Employee } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  DollarSign,
  ArrowDownCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import { EmployeeFormModal } from './EmployeeFormModal';
import { PaymentModal } from './PaymentModal';
import { AdvanceModal } from './AdvanceModal';

export const EmployeesTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Quick action modals
  const [paymentEmployeeId, setPaymentEmployeeId] = useState<string | null>(null);
  const [advanceEmployeeId, setAdvanceEmployeeId] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const filteredEmployees = store.employees.filter((emp) => {
    if (!showInactive && !emp.active) return false;
    if (showInactive && emp.active) return false;

    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      (emp.alias && emp.alias.toLowerCase().includes(term)) ||
      (emp.dni && emp.dni.toLowerCase().includes(term)) ||
      (emp.position && emp.position.toLowerCase().includes(term))
    );
  });

  const calculateSeniority = (hireDate: string) => {
    if (!hireDate) return '-';
    const hire = new Date(hireDate);
    const now = new Date();
    const years = now.getFullYear() - hire.getFullYear();
    const months = now.getMonth() - hire.getMonth();
    const totalMonths = years * 12 + months;

    if (totalMonths < 1) return 'Reciente';
    if (totalMonths < 12) return `${totalMonths} m`;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y} a ${m} m` : `${y} a`;
  };

  const getMonthlyAdvances = (empId: string) => {
    return store.employeeAdvances
      .filter((a) => a.employeeId === empId && a.date.startsWith(currentMonth))
      .reduce((sum, a) => sum + a.amount, 0);
  };

  const getMonthlyPaid = (empId: string) => {
    return store.employeePayments
      .filter((p) => p.employeeId === empId && p.periodMonth === currentMonth)
      .reduce((sum, p) => sum + p.netAmount, 0);
  };

  const handleEdit = (emp: Employee) => {
    setEmployeeToEdit(emp);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (emp: Employee) => {
    if (emp.active) {
      if (window.confirm(`¿Dar de baja a ${emp.name}?`)) {
        store.deleteEmployee(emp.id);
        showToast(`${emp.name} ha sido dado de baja`, 'info');
      }
    } else {
      store.saveEmployee({ ...emp, active: true });
      showToast(`${emp.name} reactivado con éxito`, 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, alias, DNI o cargo..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              showInactive
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
            {showInactive ? 'Ver Activos' : 'Ver dados de baja'}
          </button>

          <button
            onClick={() => {
              setEmployeeToEdit(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nuevo Empleado
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-3">Alias</th>
                <th className="py-3 px-3">DNI</th>
                <th className="py-3 px-3">Cargo</th>
                <th className="py-3 px-3">Ingreso</th>
                <th className="py-3 px-3">Antig.</th>
                <th className="py-3 px-3 text-right">Sueldo Base</th>
                <th className="py-3 px-3 text-right">Adelantos Mes</th>
                <th className="py-3 px-3 text-right">Pagado Mes</th>
                <th className="py-3 px-3 text-right">Saldo a Pagar</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-semibold">No se encontraron empleados</p>
                    <p className="text-xs text-slate-600 mt-1">
                      {showInactive
                        ? 'No hay empleados dados de baja'
                        : 'Haz clic en "Nuevo Empleado" para registrar el primero'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const advances = getMonthlyAdvances(emp.id);
                  const paid = getMonthlyPaid(emp.id);
                  const balance = Math.max(0, emp.baseSalary - advances - paid);

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <span>{emp.name}</span>
                          {emp.email && (
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {emp.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{emp.alias || '-'}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{emp.dni || '-'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200">
                          {emp.position || 'Empleado'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{emp.hireDate || '-'}</td>
                      <td className="py-3 px-3 text-slate-400">{calculateSeniority(emp.hireDate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ${emp.baseSalary.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-amber-400">
                        {advances > 0 ? `$${advances.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-400">
                        {paid > 0 ? `$${paid.toLocaleString('es-AR')}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            balance > 0 && emp.baseSalary > 0
                              ? 'text-blue-400'
                              : 'text-slate-500'
                          }
                        >
                          ${balance.toLocaleString('es-AR')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {emp.active ? 'Activo' : 'Baja'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {emp.active && (
                            <>
                              <button
                                title="Entregar Adelanto"
                                onClick={() => setAdvanceEmployeeId(emp.id)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors"
                              >
                                <ArrowDownCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Pagar Sueldo"
                                onClick={() => setPaymentEmployeeId(emp.id)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            title="Editar Empleado"
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title={emp.active ? 'Dar de baja' : 'Reactivar'}
                            onClick={() => handleToggleStatus(emp)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              emp.active
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {emp.active ? <Trash2 className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        employeeToEdit={employeeToEdit}
      />

      <PaymentModal
        isOpen={!!paymentEmployeeId}
        initialEmployeeId={paymentEmployeeId || undefined}
        onClose={() => setPaymentEmployeeId(null)}
      />

      <AdvanceModal
        isOpen={!!advanceEmployeeId}
        initialEmployeeId={advanceEmployeeId || undefined}
        onClose={() => setAdvanceEmployeeId(null)}
      />
    </div>
  );
};
