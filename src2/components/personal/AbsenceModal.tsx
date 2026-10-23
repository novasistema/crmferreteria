import React, { useState } from 'react';
import { EmployeeAbsence } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, AlertCircle, Calendar } from 'lucide-react';

interface AbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AbsenceModal: React.FC<AbsenceModalProps> = ({ isOpen, onClose }) => {
  const { store, showToast } = useApp();

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<'justified' | 'unjustified' | 'sick' | 'other'>('unjustified');
  const [deductsSalary, setDeductsSalary] = useState(true);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const activeEmployees = store.employees.filter((e) => e.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      showToast('Selecciona un empleado', 'error');
      return;
    }

    const emp = store.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    store.registerEmployeeAbsence({
      id: `abs-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      date,
      type,
      deductsSalary,
      reason: reason.trim() || 'Sin motivo especificado',
    });

    showToast(`Falta registrada para ${emp.name}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Registrar Falta</h3>
              <p className="text-xs text-slate-400">Control de inasistencias y justificaciones</p>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
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
              Fecha *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo de Inasistencia
            </label>
            <select
              value={type}
              onChange={(e) => {
                const val = e.target.value as any;
                setType(val);
                if (val === 'justified' || val === 'sick') {
                  setDeductsSalary(false);
                } else {
                  setDeductsSalary(true);
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="unjustified">Injustificada</option>
              <option value="justified">Justificada (con aviso)</option>
              <option value="sick">Certificado Médico / Enfermedad</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <input
              type="checkbox"
              id="deductSalary"
              checked={deductsSalary}
              onChange={(e) => setDeductsSalary(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="deductSalary" className="text-xs font-medium text-slate-300 cursor-pointer">
              Descontar día del sueldo al liquidar
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo o Detalle
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Trámite personal, aviso previo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-900/30 transition-colors"
            >
              Guardar Falta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
