import React, { useState } from 'react';
import { Employee, EmployeeVacation } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Palmtree,
  Plus,
  Calendar,
  CalendarCheck,
  Trash2,
  Clock,
  Info,
} from 'lucide-react';
import { VacationModal } from './VacationModal';

export const VacationsTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeEmployees = store.employees.filter((e) => e.active);
  const currentYear = new Date().getFullYear();

  // Argentine Labor Law (Ley 20.744 de Contrato de Trabajo)
  const calculateLegalVacationDays = (hireDate: string) => {
    if (!hireDate) return { years: 0, days: 14, label: 'Sin antig.' };
    const hire = new Date(hireDate);
    const now = new Date();
    let years = now.getFullYear() - hire.getFullYear();
    const m = now.getMonth() - hire.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) {
      years--;
    }
    years = Math.max(0, years);

    let days = 14;
    if (years >= 20) days = 35;
    else if (years >= 10) days = 28;
    else if (years >= 5) days = 21;
    else days = 14;

    const label = years === 0 ? 'Sin antig.' : `${years} ${years === 1 ? 'año' : 'años'}`;
    return { years, days, label };
  };

  const getUsedVacationDays = (empId: string) => {
    return store.employeeVacations
      .filter((v) => v.employeeId === empId && v.year === currentYear && v.status !== 'cancelled')
      .reduce((sum, v) => sum + v.daysCount, 0);
  };

  const handleDeleteVacation = (id: string, empName: string) => {
    if (window.confirm(`¿Eliminar el período de vacaciones de ${empName}?`)) {
      store.deleteEmployeeVacation(id);
      showToast('Período de vacaciones eliminado', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-teal-400" />
            Vacaciones y Descanso
          </h3>
          <p className="text-xs text-slate-400">
            Cálculo legal por antigüedad y control de días gozados (Ley 20.744)
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Registrar Vacaciones
        </button>
      </div>

      {/* Grid: Días Correspondientes por Antigüedad */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
          Días Correspondientes por Antigüedad (Año {currentYear})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {activeEmployees.map((emp) => {
            const { years, days, label } = calculateLegalVacationDays(emp.hireDate);
            const used = getUsedVacationDays(emp.id);
            const remaining = Math.max(0, days - used);

            return (
              <div
                key={emp.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h5 className="font-bold text-white text-sm leading-snug">{emp.name}</h5>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                      {label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{emp.position || 'Personal'}</p>

                  <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Corresponden:</span>
                      <span className="font-bold text-white">{days} días</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Usados:</span>
                      <span>{used} días</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                      <span>Restantes:</span>
                      <span>{remaining} días</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-600" />
                  Ingreso: {emp.hireDate || 'S/D'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Historial de Vacaciones Registradas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-teal-400" />
          Historial de Vacaciones
        </h4>

        {store.employeeVacations.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p className="text-xs font-semibold text-slate-400">No hay períodos de vacaciones programados</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Utiliza el botón "+ Registrar Vacaciones" para programar las fechas de descanso.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
                  <th className="py-2.5 px-3">Empleado</th>
                  <th className="py-2.5 px-3 text-center">Año</th>
                  <th className="py-2.5 px-3">Desde</th>
                  <th className="py-2.5 px-3">Hasta</th>
                  <th className="py-2.5 px-3 text-center">Días Corridos</th>
                  <th className="py-2.5 px-3">Observaciones</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {store.employeeVacations.map((vac) => (
                  <tr key={vac.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{vac.employeeName}</td>
                    <td className="py-2.5 px-3 text-center font-mono">{vac.year}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{vac.startDate}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{vac.endDate}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-teal-400">
                      {vac.daysCount} días
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{vac.notes || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        {vac.status === 'scheduled'
                          ? 'Programado'
                          : vac.status === 'taken'
                          ? 'Gozado'
                          : 'Cancelado'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteVacation(vac.id, vac.employeeName)}
                        className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Eliminar vacaciones"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <VacationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
