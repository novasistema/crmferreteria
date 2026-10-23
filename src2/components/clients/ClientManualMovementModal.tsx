import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { PlusCircle, Calendar, X, CheckCircle2 } from 'lucide-react';

interface ClientManualMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSuccess?: () => void;
}

export const ClientManualMovementModal: React.FC<ClientManualMovementModalProps> = ({
  isOpen,
  onClose,
  client,
  onSuccess,
}) => {
  const { store, currentUser, showToast } = useApp();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'adjustment_debit' | 'adjustment_credit'>('adjustment_debit');
  const [concept, setConcept] = useState('Ajuste de saldo en cuenta corriente');
  const [documentNumber, setDocumentNumber] = useState('');
  const [amount, setAmount] = useState<number>(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Por favor ingrese un importe mayor a cero.', 'error');
      return;
    }

    const mov = store.addManualClientAccountMovement({
      clientId: client.id,
      type,
      amount,
      concept: concept.trim(),
      documentNumber: documentNumber.trim(),
      date: new Date(date).toISOString(),
      user: currentUser,
    });

    if (mov) {
      showToast(
        `Movimiento registrado: ${type === 'adjustment_debit' ? 'Débito' : 'Crédito'} de $${amount.toLocaleString('es-AR')}`,
        'success'
      );
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">Nuevo Movimiento de Cuenta</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-white font-bold">{client.name}</p>
            <p className="text-slate-400 font-mono text-[11px]">CUIT/DNI: {client.taxId}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Fecha</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Tipo de Movimiento</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              >
                <option value="adjustment_debit">Débito (Aumenta Deuda)</option>
                <option value="adjustment_credit">Crédito (Disminuye Deuda / A Favor)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-bold block mb-1">Concepto *</label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Nota de Débito Interna, Saldo anterior, etc."
              className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Nro Comprobante / Doc</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ej: ND-0001-00045"
                className="w-full bg-slate-950 text-white rounded-lg p-2.5 border border-slate-700 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Importe ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-950 text-emerald-400 font-black text-right rounded-lg p-2.5 border border-slate-700 font-mono text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Movimiento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
