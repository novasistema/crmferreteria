import React, { useState, useEffect } from 'react';
import { EmployeePayment } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, DollarSign, Wallet, Calendar, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployeeId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  initialEmployeeId,
}) => {
  const { store, user, showToast } = useApp();

  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [paymentType, setPaymentType] = useState<
    'salary' | 'biweekly' | 'sac' | 'bonus' | 'commission' | 'severance'
  >('salary');
  const [periodMonth, setPeriodMonth] = useState(
    new Date().toISOString().slice(0, 7) // "YYYY-MM"
  );
  const [grossAmount, setGrossAmount] = useState<number | ''>('');
  const [deductions, setDeductions] = useState<number | ''>(0);
  const [advancesDeducted, setAdvancesDeducted] = useState<number | ''>(0);
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'cash' | 'check'>('transfer');
  const [bankAccountOrBoxId, setBankAccountOrBoxId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialEmployeeId) {
      setEmployeeId(initialEmployeeId);
      const emp = store.employees.find((e) => e.id === initialEmployeeId);
      if (emp) {
        setGrossAmount(emp.baseSalary || '');
        if (emp.bankName || emp.cbu) {
          setBankAccountOrBoxId(`${emp.bankName || ''} - ${emp.cbu || emp.accountNumber || ''}`);
        }
      }
    }
  }, [initialEmployeeId, isOpen]);

  if (!isOpen) return null;

  const activeEmployees = store.employees.filter((e) => e.active);

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    const emp = store.employees.find((e) => e.id === id);
    if (emp) {
      setGrossAmount(emp.baseSalary || 0);
      if (emp.bankName || emp.cbu) {
        setBankAccountOrBoxId(`${emp.bankName || ''} ${emp.cbu || emp.accountNumber || ''}`.trim());
      }
      // Calculate pending advances for this employee this month
      const currentMonthAdvances = store.employeeAdvances
        .filter((a) => a.employeeId === id && a.date.startsWith(periodMonth))
        .reduce((sum, a) => sum + a.amount, 0);
      setAdvancesDeducted(currentMonthAdvances);
    }
  };

  const gross = Number(grossAmount) || 0;
  const ded = Number(deductions) || 0;
  const adv = Number(advancesDeducted) || 0;
  const netAmount = Math.max(0, gross - ded - adv);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      showToast('Selecciona un empleado', 'error');
      return;
    }

    if (gross <= 0 && netAmount <= 0) {
      showToast('Ingresa un monto válido para el pago', 'error');
      return;
    }

    const emp = store.employees.find((e) => e.id === employeeId);
    if (!emp) return;

    store.registerEmployeePayment(
      {
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        employeeId: emp.id,
        employeeName: emp.name,
        paymentType,
        periodMonth,
        grossAmount: gross,
        deductions: ded,
        advancesDeducted: adv,
        netAmount,
        paymentMethod,
        bankAccountOrBoxId: bankAccountOrBoxId.trim(),
        status: 'paid',
        receiptNumber: `REC-SUELDO-${periodMonth.replace('-', '')}-${String(
          store.employeePayments.length + 1
        ).padStart(2, '0')}`,
        notes: notes.trim(),
      },
      user || { id: 'admin', name: 'Administrador', role: 'admin', email: '' }
    );

    showToast(`Pago registrado para ${emp.name} ($${netAmount.toLocaleString('es-AR')})`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg text-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Nuevo Pago de Sueldo / Haberes</h3>
              <p className="text-xs text-slate-400">Liquidación y emisión de comprobante</p>
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
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Seleccionar empleado...</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - Sueldo Base: ${emp.baseSalary.toLocaleString('es-AR')} ({emp.position})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Pago
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="salary">Sueldo Mensual</option>
                <option value="biweekly">Quincena / Anticipo</option>
                <option value="sac">Aguinaldo (SAC)</option>
                <option value="bonus">Bono / Gratificación</option>
                <option value="commission">Comisión por Ventas</option>
                <option value="severance">Liquidación Final</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mes del Período *
              </label>
              <input
                type="month"
                required
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Monto Bruto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={grossAmount}
                onChange={(e) =>
                  setGrossAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="0.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Deducciones / Retenciones
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={deductions}
                  onChange={(e) =>
                    setDeductions(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Adelantos Descontados
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={advancesDeducted}
                  onChange={(e) =>
                    setAdvancesDeducted(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Net Amount Box */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Neto a Pagar
              </span>
              <span className="text-xs text-slate-400">Total liquidado a percibir</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              ${netAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="transfer">Transferencia Bancaria</option>
                <option value="cash">Efectivo (Caja)</option>
                <option value="check">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {paymentMethod === 'cash' ? 'Caja de Salida' : 'Cuenta / CBU Destino'}
              </label>
              <input
                type="text"
                value={bankAccountOrBoxId}
                onChange={(e) => setBankAccountOrBoxId(e.target.value)}
                placeholder={paymentMethod === 'cash' ? 'Caja Principal' : 'CBU o Banco'}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notas / Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalle o conceptos adicionales de la liquidación..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-colors"
            >
              Registrar Pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
