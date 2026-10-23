import React, { useState } from 'react';
import { Employee, EmployeeAbsence } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Plus,
  AlertCircle,
  Calendar,
  Trash2,
  CheckCircle2,
  Edit2,
  CalendarDays,
} from 'lucide-react';
import { AbsenceModal } from './AbsenceModal';
import { EmployeeFormModal } from './EmployeeFormModal';

export const AttendanceTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const activeEmployees = store.employees.filter((e) => e.active);

  const handleDeleteAbsence = (id: string, empName: string) => {
    if (window.confirm(`¿Eliminar el registro de falta de ${empName}?`)) {
      store.deleteEmployeeAbsence(id);
      showToast('Falta eliminada', 'info');
    }
  };

  const renderScheduleBadge = (status?: 'full' | 'half' | 'off') => {
    switch (status) {
      case 'full':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Día Completo
          </span>
        );
      case 'half':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Medio Día
          </span>
        );
      case 'off':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Franco
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Registro de Faltas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Registro de Faltas
            </h3>
            <p className="text-xs text-slate-400">
              Historial de inasistencias justificadas e injustificadas
            </p>
          </div>
          <button
            onClick={() => setIsAbsenceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Registrar Falta
          </button>
        </div>

        {store.employeeAbsences.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No hay faltas registradas</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Las inasistencias reportadas aparecerán en esta lista y podrán descontarse
              automáticamente de los haberes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 font-semibold border-b border-slate-700/80">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Empleado</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Descuenta Sueldo</th>
                  <th className="py-2.5 px-3">Motivo</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {store.employeeAbsences.map((abs) => (
                  <tr key={abs.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{abs.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{abs.employeeName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          abs.type === 'unjustified'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : abs.type === 'sick'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {abs.type === 'unjustified'
                          ? 'Injustificada'
                          : abs.type === 'justified'
                          ? 'Justificada'
                          : abs.type === 'sick'
                          ? 'Médica'
                          : 'Otro'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {abs.deductsSalary ? (
                        <span className="text-red-400 font-semibold">Sí (Descontar)</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">No (Paga normal)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{abs.reason}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteAbsence(abs.id, abs.employeeName)}
                        className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Eliminar falta"
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

      {/* Section 2: Horarios Semanales */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            Horarios Semanales
          </h3>
          <p className="text-xs text-slate-400">
            Disposición de jornadas y turnos habituales de cada colaborador
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700/80">
                <th className="py-3 px-4">Empleado</th>
                <th className="py-3 px-3">Cargo</th>
                <th className="py-3 px-2 text-center">Lunes</th>
                <th className="py-3 px-2 text-center">Martes</th>
                <th className="py-3 px-2 text-center">Miércoles</th>
                <th className="py-3 px-2 text-center">Jueves</th>
                <th className="py-3 px-2 text-center">Viernes</th>
                <th className="py-3 px-2 text-center">Sábado</th>
                <th className="py-3 px-3 text-center">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {activeEmployees.map((emp) => {
                const s = emp.weeklySchedule || {
                  monday: 'full',
                  tuesday: 'full',
                  wednesday: 'full',
                  thursday: 'full',
                  friday: 'full',
                  saturday: 'half',
                };

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{emp.name}</td>
                    <td className="py-3 px-3 text-slate-400">{emp.position}</td>
                    <td className="py-3 px-2 text-center">{renderScheduleBadge(s.monday)}</td>
                    <td className="py-3 px-2 text-center">{renderScheduleBadge(s.tuesday)}</td>
                    <td className="py-3 px-2 text-center">{renderScheduleBadge(s.wednesday)}</td>
                    <td className="py-3 px-2 text-center">{renderScheduleBadge(s.thursday)}</td>
                    <td className="py-3 px-2 text-center">{renderScheduleBadge(s.friday)}</td>
                    <td className="py-3 px-2 text-center">{renderScheduleBadge(s.saturday)}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setEmployeeToEdit(emp)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Modificar horario"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AbsenceModal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
      />

      <EmployeeFormModal
        isOpen={!!employeeToEdit}
        employeeToEdit={employeeToEdit}
        onClose={() => setEmployeeToEdit(null)}
      />
    </div>
  );
};
