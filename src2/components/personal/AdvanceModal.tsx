import React, { useState } from 'react';
import { EmployeeAdvance } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, ArrowDownCircle, DollarSign, Wallet } from 'lucide-react';

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployeeId?: string;
}

export const AdvanceModal: React.FC<AdvanceModalProps> = ({
  isOpen,
  onClose,
  initialEmployeeId,
}) => {
  const { store, user, showToast } = useApp();

  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [boxId, setBoxId] = useState('1');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const activeEmployees = store.employees.filter((e) => e.active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      showToast('Selecciona un empleado', 'error');
      return;
    }

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      showToast('Ingresa un monto válido para el adelanto', 'error');
      return;
    }

    const emp = store.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    store.registerEmployeeAdvance(
      {
        id: `adv-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        employeeId: emp.id,
        employeeName: emp.name,
        amount: numAmount,
        paymentMethod,
        boxId: paymentMethod === 'cash' ? boxId : undefined,
        reason: reason.trim() || '-',
        status: 'paid',
        receiptNumber: `ADE-0001-${String(store.employeeAdvances.length + 1).padStart(8, '0')}`,
      },
      user || { id: 'admin', name: 'Administrador', role: 'admin', email: '' }
    );

    showToast(
      `Adelanto de $${numAmount.toLocaleString('es-AR')} entregado a ${emp.name}`,
      'success'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nuevo Adelanto de Sueldo</h3>
              <p className="text-xs text-slate-400">Entrega de fondos a cuenta de haberes</p>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
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
              Monto del Adelanto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="100"
                step="100"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia Bancaria</option>
              </select>
            </div>

            {paymentMethod === 'cash' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Caja de Salida
                </label>
                <select
                  value={boxId}
                  onChange={(e) => setBoxId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {store.cashRegisters.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Medio
                </label>
                <input
                  type="text"
                  disabled
                  value="Cuenta de la empresa"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motivo o Concepto
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Adelanto a cuenta, gastos médicos, etc."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-900/30 transition-colors"
            >
              Entregar Adelanto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
