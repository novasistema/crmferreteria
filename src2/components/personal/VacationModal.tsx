import React, { useState } from 'react';
import { EmployeeVacation } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Palmtree, Calendar, Info } from 'lucide-react';

interface VacationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VacationModal: React.FC<VacationModalProps> = ({ isOpen, onClose }) => {
  const { store, showToast } = useApp();

  const [employeeId, setEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const activeEmployees = store.employees.filter((e) => e.active);

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = e.getTime() - s.getTime();
    if (diffTime < 0) return 0;
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const daysCount = calculateDays(startDate, endDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      showToast('Selecciona un empleado', 'error');
      return;
    }

    if (daysCount <= 0) {
      showToast('La fecha de fin debe ser posterior o igual a la fecha de inicio', 'error');
      return;
    }

    const emp = store.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    store.registerEmployeeVacation({
      id: `vac-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      year: Number(year) || new Date().getFullYear(),
      startDate,
      endDate,
      daysCount,
      notes: notes.trim(),
      status: 'scheduled',
    });

    showToast(`Vacaciones de ${emp.name} programadas (${daysCount} días)`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Palmtree className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Vacaciones</h3>
              <p className="text-xs text-slate-400">Programación de días de descanso</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Empleado *
            </label>
            <select
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="">Seleccionar empleado...</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Año Correspondiente
            </label>
            <input
              type="number"
              min="2020"
              max="2035"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {daysCount > 0 && (
            <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-lg flex items-center justify-between text-xs text-teal-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-4 h-4 text-teal-400" />
                Días corridos solicitados:
              </span>
              <span className="font-bold text-sm bg-teal-500/20 px-2 py-0.5 rounded text-teal-200">
                {daysCount} {daysCount === 1 ? 'día' : 'días'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas / Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Primer tramo de 7 días acordado..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-900/30 transition-colors"
            >
              Guardar Vacaciones
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
