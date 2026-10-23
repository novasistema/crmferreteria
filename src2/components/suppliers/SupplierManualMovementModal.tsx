import React, { useState } from 'react';
import { X, Check, ArrowUpRight, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { Supplier } from '../../types';

interface SupplierManualMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
  onSaveMovement: (data: {
    type: 'purchase_debt' | 'payment_credit' | 'credit_note' | 'debit_adjustment';
    amount: number;
    concept: string;
    voucherNumber: string;
    notes?: string;
  }) => void;
}

export const SupplierManualMovementModal: React.FC<SupplierManualMovementModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSaveMovement,
}) => {
  const [movementType, setMovementType] = useState<
    'debit_adjustment' | 'credit_note' | 'purchase_debt' | 'payment_credit'
  >('credit_note');
  const [amount, setAmount] = useState<number>(0);
  const [concept, setConcept] = useState<string>('Nota de Crédito / Descuento Financiero');
  const [voucherNumber, setVoucherNumber] = useState<string>('AJU-0001');
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('El importe debe ser mayor a $0.');
      return;
    }

    onSaveMovement({
      type: movementType,
      amount,
      concept,
      voucherNumber,
      notes,
    });
    onClose();
  };

  const isDebtIncrease = movementType === 'purchase_debt' || movementType === 'debit_adjustment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Ajuste Manual de Saldo</h3>
            <p className="text-xs text-slate-400">Proveedor: {supplier.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Tipo de Ajuste
            </label>
            <select
              value={movementType}
              onChange={(e) => {
                const t = e.target.value as any;
                setMovementType(t);
                if (t === 'credit_note') setConcept('Nota de Crédito por Bonificación');
                else if (t === 'debit_adjustment') setConcept('Ajuste de Saldo Deudor');
                else if (t === 'payment_credit') setConcept('Pago Directo Registrado');
              }}
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold outline-none"
            >
              <option value="credit_note">Nota de Crédito (Disminuye nuestra deuda)</option>
              <option value="payment_credit">Crédito a Favor (Disminuye nuestra deuda)</option>
              <option value="debit_adjustment">Ajuste Débito (Aumenta nuestra deuda)</option>
              <option value="purchase_debt">Cargo / Saldo Inicial Deudor</option>
            </select>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
            {isDebtIncrease ? (
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="font-bold text-slate-200 block text-xs">
                {isDebtIncrease ? 'Aumentará la deuda con el proveedor' : 'Disminuirá la deuda con el proveedor'}
              </span>
              <span className="text-[10px] text-slate-400">
                Saldo actual: ${supplier.currentBalance.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Importe del Ajuste ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full h-10 px-3 font-mono font-black text-lg bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Concepto / Motivo *
            </label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="ej: Bonificación por volumen o Nota de Crédito A-0001-00000045"
              className="w-full h-9 px-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              N° de Comprobante / Referencia
            </label>
            <input
              type="text"
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value)}
              placeholder="NC-0001-000001"
              className="w-full h-9 px-3 font-mono bg-slate-800 border border-slate-700 rounded-xl text-white outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Ajuste</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
