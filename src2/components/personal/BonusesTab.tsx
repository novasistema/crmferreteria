import React, { useState } from 'react';
import { EmployeeSpecialDate } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Gift,
  Plus,
  Calendar,
  DollarSign,
  Trash2,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Users,
} from 'lucide-react';
import { SpecialDateModal } from './SpecialDateModal';

export const BonusesTab: React.FC = () => {
  const { store, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeEmployees = store.employees.filter((e) => e.active);

  const monthNames = [
    '',
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const currentMonthNum = new Date().getMonth() + 1; // 1-12

  // SAC Aguinaldo estimation: 50% of base salary
  const calculateTotalSemesterSAC = () => {
    return activeEmployees.reduce((sum, e) => sum + (e.baseSalary || 0) * 0.5, 0);
  };

  const handleDeleteSpecialDate = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar la fecha / bono "${name}"?`)) {
      store.deleteEmployeeSpecialDate(id);
      showToast('Fecha especial eliminada', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-400" />
            Fechas Especiales, Bonos y Aguinaldo
          </h3>
          <p className="text-xs text-slate-400">
            Control de SAC (Sueldo Anual Complementario), premios por metas y efemérides
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nueva Fecha / Bono
        </button>
      </div>

      {/* Section: Recordatorios Automáticos - Aguinaldo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Recordatorios Automáticos - Aguinaldo (SAC)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1er Aguinaldo */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h5 className="font-bold text-white text-base">1er Aguinaldo</h5>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    currentMonthNum > 6
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}
                >
                  {currentMonthNum > 6 ? 'Cumplido' : 'Próximo'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fecha límite legal: <strong className="text-slate-200">30 de Junio</strong>
              </p>
              <p className="text-xs text-slate-500 mt-1">Período devengado: Enero a Junio</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Cálculo: 50% mayor sueldo semestral</span>
              <span className="font-mono font-bold text-amber-400">Semestre 1</span>
            </div>
          </div>

          {/* 2do Aguinaldo */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h5 className="font-bold text-white text-base">2do Aguinaldo</h5>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    currentMonthNum === 12
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {currentMonthNum === 12 ? 'Mes en curso' : 'Próximo (Diciembre)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fecha límite legal: <strong className="text-slate-200">18 de Diciembre</strong>
              </p>
              <p className="text-xs text-slate-500 mt-1">Período devengado: Julio a Diciembre</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Cálculo: 50% mayor sueldo semestral</span>
              <span className="font-mono font-bold text-pink-400">Semestre 2</span>
            </div>
          </div>
        </div>

        {/* Estimation Table */}
        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Estimación de Aguinaldo por Colaborador (50% Sueldo Base)
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Total estimado por semestre: ${calculateTotalSemesterSAC().toLocaleString('es-AR')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {activeEmployees.map((emp) => {
              const sac = (emp.baseSalary || 0) * 0.5;
              return (
                <div
                  key={emp.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-200 block truncate">{emp.name}</span>
                    <span className="text-[10px] text-slate-400">{emp.position}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-400">
                      ${sac.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section: Fechas Especiales Personalizadas */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Calendar className="w-4 h-4 text-pink-400" />
          Fechas Especiales y Bonos Configurados
        </h4>

        {store.employeeSpecialDates.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p className="text-xs font-semibold text-slate-400">No hay fechas personalizadas configuradas</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Crea recordatorios de bonos por objetivos, aniversarios o gratificaciones con el botón superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {store.employeeSpecialDates.map((sd) => (
              <div
                key={sd.id}
                className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h5 className="font-bold text-white text-sm leading-snug">{sd.name}</h5>
                    <button
                      onClick={() => handleDeleteSpecialDate(sd.id, sd.name)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-pink-400" />
                      <span>
                        Mes: <strong>{monthNames[sd.month]}</strong> {sd.day ? `(Día ${sd.day})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sd.employeeName ? (
                        <>
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>{sd.employeeName}</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Todos los empleados</span>
                        </>
                      )}
                    </div>

                    {sd.notes && <p className="text-[11px] text-slate-500 italic mt-1">{sd.notes}</p>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    {sd.recurring ? 'Anual recurrente' : 'Una sola vez'}
                  </span>
                  {sd.amount && sd.amount > 0 ? (
                    <span className="font-mono font-bold text-pink-400">
                      ${sd.amount.toLocaleString('es-AR')}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[10px]">Sin monto fijo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <SpecialDateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
