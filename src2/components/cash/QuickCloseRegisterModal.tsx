import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Banknote,
  CreditCard,
  Send,
  FileText,
  Wallet,
  DollarSign,
  AlertTriangle,
  Landmark,
  ArrowRight,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';

const BILL_DENOMINATIONS = [
  { value: 20000, label: '$20.000' },
  { value: 10000, label: '$10.000' },
  { value: 5000, label: '$5.000' },
  { value: 2000, label: '$2.000' },
  { value: 1000, label: '$1.000' },
  { value: 500, label: '$500' },
  { value: 200, label: '$200' },
  { value: 100, label: '$100' },
  { value: 50, label: '$50' },
  { value: 20, label: '$20' },
  { value: 10, label: '$10' },
];

export const QuickCloseRegisterModal: React.FC = () => {
  const { store, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'preview' | 'confirm'>('preview');
  const [closingBalance, setClosingBalance] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [autoReopen, setAutoReopen] = useState<boolean>(true);
  const [billCounts, setBillCounts] = useState<Record<number, string>>({});

  const activeSession = store.cashSessions.find((s) => s.status === 'open');
  const sessionRegister = activeSession ? store.cashRegisters.find((r) => r.id === activeSession.registerId) : null;
  const sessionBranch = sessionRegister ? store.warehouses.find((w) => w.id === sessionRegister.branchId) : null;
  const destinationMoneyBox = sessionBranch ? store.moneyBoxes.find((mb) => mb.branchId === sessionBranch.id) : store.moneyBoxes[0];

  // Compute breakdown by payment method for today's sales (excluding current account from cash inflows)
  const { methods: summaryByMethod, ctaCteTotal } = useMemo(() => {
    const methods: Record<string, { name: string; total: number; count: number; code: string }> = {
      cash: { name: 'Efectivo', total: 0, count: 0, code: 'cash' },
      debit_card: { name: 'Tarjeta Débito', total: 0, count: 0, code: 'debit_card' },
      credit_card: { name: 'Tarjeta Crédito', total: 0, count: 0, code: 'credit_card' },
      bank_transfer: { name: 'Transferencia Bancaria', total: 0, count: 0, code: 'bank_transfer' },
      mercadopago_qr: { name: 'MercadoPago QR', total: 0, count: 0, code: 'mercadopago_qr' },
      check: { name: 'Cheques / E-Cheqs', total: 0, count: 0, code: 'check' },
    };

    let ctaCteTotal = 0;

    store.sales.forEach((sale) => {
      sale.payments.forEach((p) => {
        if (p.method === 'current_account') {
          ctaCteTotal += p.amount;
        } else if (methods[p.method]) {
          methods[p.method].total += p.amount;
          methods[p.method].count += 1;
        }
      });
    });

    return {
      methods: Object.values(methods),
      ctaCteTotal,
    };
  }, [store.sales]);

  const openingBalance = activeSession?.openingCash || 0;
  const cashSalesTotal = summaryByMethod.find((m) => m.code === 'cash')?.total || 0;
  const expectedCash = openingBalance + cashSalesTotal;

  // Handle bill denomination changes
  const handleBillCountChange = (denomValue: number, countStr: string) => {
    const updated = { ...billCounts, [denomValue]: countStr };
    setBillCounts(updated);
    const sum = BILL_DENOMINATIONS.reduce((acc, d) => {
      const count = parseInt(updated[d.value] || '0') || 0;
      return acc + count * d.value;
    }, 0);
    setClosingBalance(sum.toFixed(2));
  };

  const realCash = parseFloat(closingBalance || '0');
  const difference = realCash - expectedCash;

  const handleCloseSession = () => {
    if (!activeSession) return;

    // Close session in store
    store.closeCashSession(activeSession.id, realCash, closeNotes);

    if (autoReopen) {
      // Reopen automatically with new opening balance
      store.openCashSession(activeSession.cashRegisterId, realCash);
      showToast('Caja cerrada y reabierta automáticamente con el saldo final', 'success');
    } else {
      showToast('Caja cerrada correctamente y fondos distribuidos', 'success');
    }

    setIsOpen(false);
    setStep('preview');
    setClosingBalance('');
    setBillCounts({});
    setCloseNotes('');
  };

  if (!activeSession) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setStep('preview');
        }}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors text-xs font-semibold"
        title="Cierre de Caja del Día"
      >
        <Lock className="w-4 h-4 text-amber-400" />
        <span className="hidden xl:inline">Cierre Caja</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-white">Cierre de Caja del Día</h3>
                    {sessionBranch && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                        {sessionBranch.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Arqueo de billetes y depósito automático a: <strong className="text-amber-400 font-bold">{destinationMoneyBox?.name || 'Caja Fuerte'}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 'preview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Totals and Methods Breakdown */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Apertura</span>
                        <span className="text-sm font-black text-white font-mono mt-0.5 block">
                          ${openingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-center">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block">Ingresos</span>
                        <span className="text-sm font-black text-emerald-400 font-mono mt-0.5 block">
                          +${cashSalesTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Esperado</span>
                        <span className="text-sm font-black text-blue-400 font-mono mt-0.5 block">
                          ${expectedCash.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Desglose por Forma de Cobro (Dinero Ingresado)
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {summaryByMethod.map((pm) => (
                          <div
                            key={pm.code}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                          >
                            <span className="text-slate-300 font-medium">{pm.name}</span>
                            <span className="font-mono font-bold text-white">
                              ${pm.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>

                      {ctaCteTotal > 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs flex items-center justify-between">
                          <div>
                            <span className="text-amber-300 font-semibold block">Ventas en Cuenta Corriente</span>
                            <span className="text-[10px] text-slate-400">No ingresa efectivo a caja</span>
                          </div>
                          <span className="font-mono font-bold text-amber-400">
                            ${ctaCteTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Bill Denominations Counter */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                      Arqueo de Efectivo Físico
                    </span>

                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {BILL_DENOMINATIONS.map((d) => (
                        <div key={d.value} className="flex items-center space-x-1 text-xs">
                          <span className="text-slate-400 w-14 text-right font-mono">{d.label}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={billCounts[d.value] || ''}
                            onChange={(e) => handleBillCountChange(d.value, e.target.value)}
                            className="w-full bg-slate-950 text-white rounded p-1.5 text-center border border-slate-700 font-mono font-bold"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-semibold">Efectivo Real (Arqueo):</span>
                        <input
                          type="number"
                          step="0.01"
                          value={closingBalance}
                          onChange={(e) => setClosingBalance(e.target.value)}
                          placeholder="0.00"
                          className="w-32 bg-slate-900 text-white font-mono font-black text-right p-1.5 rounded-lg border border-slate-700 text-sm focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Diferencia de Caja:</span>
                        <span
                          className={`font-mono font-bold ${
                            Math.abs(difference) < 1
                              ? 'text-emerald-400'
                              : difference > 0
                              ? 'text-blue-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {difference >= 0 ? `+$${difference.toFixed(2)}` : `-$${Math.abs(difference).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    disabled={!closingBalance}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-600/30 disabled:opacity-50"
                  >
                    Proceder al Cierre →
                  </button>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Efectivo Recontado:</span>
                    <strong className="text-lg font-black text-white font-mono">${realCash.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Efectivo Teórico del Sistema:</span>
                    <span className="font-mono font-bold text-blue-400">${expectedCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Diferencia:</span>
                    <span
                      className={`font-mono font-black ${
                        Math.abs(difference) < 1
                          ? 'text-emerald-400'
                          : difference > 0
                          ? 'text-blue-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {difference >= 0 ? `+$${difference.toFixed(2)}` : `-$${Math.abs(difference).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Observaciones o Notas de Cierre (Opcional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Se retiró efectivo para pago de flete..."
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <input
                    type="checkbox"
                    id="autoReopen"
                    checked={autoReopen}
                    onChange={(e) => setAutoReopen(e.target.checked)}
                    className="rounded border-slate-700 text-amber-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="autoReopen" className="text-xs text-slate-300 cursor-pointer font-semibold">
                    Reabrir caja automáticamente para el siguiente turno con el saldo final
                  </label>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setStep('preview')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={handleCloseSession}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30"
                  >
                    {autoReopen ? 'Cerrar, Distribuir y Reabrir' : 'Cerrar Caja Definitivamente'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
