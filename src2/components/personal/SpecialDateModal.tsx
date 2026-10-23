import React, { useState } from 'react';
import { EmployeeSpecialDate } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Gift, Calendar, DollarSign } from 'lucide-react';

interface SpecialDateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecialDateModal: React.FC<SpecialDateModalProps> = ({ isOpen, onClose }) => {
  const { store, showToast } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<
    'aguinaldo' | 'performance_bonus' | 'birthday' | 'holiday_bonus' | 'other'
  >('performance_bonus');
  const [employeeId, setEmployeeId] = useState<'all' | string>('all');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [day, setDay] = useState<number | ''>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [recurring, setRecurring] = useState(true);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Ingresa un nombre para la fecha o bono', 'error');
      return;
    }

    const selectedEmp = employeeId === 'all' ? null : store.employees.find((e) => e.id === employeeId);

    store.saveEmployeeSpecialDate({
      id: `sd-${Date.now()}`,
      name: name.trim(),
      type,
      employeeId: employeeId === 'all' ? undefined : employeeId,
      employeeName: selectedEmp ? selectedEmp.name : undefined,
      month: Number(month),
      day: day ? Number(day) : undefined,
      amount: amount ? Number(amount) : undefined,
      recurring,
      notes: notes.trim(),
    });

    showToast(`Fecha / Bono "${name}" guardado con éxito`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nueva Fecha Especial / Bono</h3>
              <p className="text-xs text-slate-400">Recordatorios anuales, aniversarios y bonos</p>
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
              Nombre *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Bono Fin de Año / Aniversario Empresa"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              <option value="performance_bonus">Bono por Desempeño / Objetivos</option>
              <option value="aguinaldo">Aguinaldo (SAC)</option>
              <option value="holiday_bonus">Bono Festivo / Fin de Año</option>
              <option value="birthday">Cumpleaños</option>
              <option value="other">Otro Evento Especial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Empleado (Opcional)
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              <option value="all">Todos los empleados</option>
              {store.employees
                .filter((e) => e.active)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.position})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mes *
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Día (Opcional)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Ej: 15"
                value={day}
                onChange={(e) => setDay(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Monto Estimado / Sugerido (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <input
              type="checkbox"
              id="recurringCheck"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-4 h-4 text-pink-600 bg-slate-900 border-slate-700 rounded focus:ring-pink-500 cursor-pointer"
            />
            <label htmlFor="recurringCheck" className="text-xs font-medium text-slate-300 cursor-pointer">
              Evento anual recurrente (se repite todos los años)
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instrucciones o detalles del cálculo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
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
              className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm shadow-lg shadow-pink-900/30 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
