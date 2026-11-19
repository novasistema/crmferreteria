import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { NumInput } from './NumInput';

// Panel común para recibos de clientes y pagos a proveedores:
// se eligen las facturas a cancelar y se cargan una o más formas de pago; va mostrando cuánto resta pagar.

export interface PayableDoc {
  id: string;
  number: string;
  date: string;
  total: number;
  paid: number; // lo ya cobrado / pagado de ese comprobante
  label?: string;
}

export interface PaymentLine {
  id: string;
  method: string;
  amount: number;
  reference: string;
  cashboxId?: string;
}

export interface DocAllocation {
  id: string;
  applied: number; // lo que este recibo le aplica
  newPaid: number;
  status: 'parcial' | 'pagado';
}

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
export const pendingOf = (d: PayableDoc) => r2(Math.max(0, d.total - (d.paid || 0)));
const shortDate = (d: string) => (/^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10).split('-').reverse().join('/') : new Date(d).toLocaleDateString('es-AR'));
const money = (n: number) => `$ ${r2(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Reparte lo pagado entre las facturas elegidas, de la más vieja a la más nueva
export const allocatePayment = (docs: PayableDoc[], selectedIds: string[], paidTotal: number): DocAllocation[] => {
  let left = r2(paidTotal);
  return docs
    .filter(d => selectedIds.includes(d.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(d => {
      const applied = r2(Math.min(left, pendingOf(d)));
      left = r2(left - applied);
      const newPaid = r2((d.paid || 0) + applied);
      return { id: d.id, applied, newPaid, status: newPaid >= d.total - 0.01 ? ('pagado' as const) : ('parcial' as const) };
    })
    .filter(a => a.applied > 0);
};

export const newPaymentLine = (method: string, amount = 0): PaymentLine => ({
  id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  method,
  amount,
  reference: ''
});

export const linesSummary = (lines: PaymentLine[], labels: Record<string, string>) =>
  lines
    .filter(l => l.amount > 0)
    .map(l => `${labels[l.method] || l.method} ${money(l.amount)}${l.reference ? ` (${l.reference})` : ''}`)
    .join(' + ');

interface Props {
  docs: PayableDoc[]; // comprobantes con saldo pendiente
  accountBalance: number; // saldo total de la cuenta, para cuando no se elige ninguna factura
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  lines: PaymentLine[];
  onLinesChange: (lines: PaymentLine[]) => void;
  methods: { value: string; label: string }[];
  cashboxes?: { id: string; name: string }[]; // si se pasan, cada pago elige la caja o cuenta
  docsTitle: string; // "Facturas a cobrar" / "Facturas a pagar"
  accent?: 'emerald' | 'rose';
}

export const ReceiptPaymentsPanel: React.FC<Props> = ({
  docs,
  accountBalance,
  selectedIds,
  onSelectedIdsChange,
  lines,
  onLinesChange,
  methods,
  cashboxes,
  docsTitle
}) => {
  const selectedDocs = docs.filter(d => selectedIds.includes(d.id));
  const target = r2(selectedDocs.length ? selectedDocs.reduce((a, d) => a + pendingOf(d), 0) : Math.max(0, accountBalance));
  const paid = r2(lines.reduce((a, l) => a + (Number(l.amount) || 0), 0));
  const remaining = r2(target - paid);

  const updateLine = (id: string, patch: Partial<PaymentLine>) => onLinesChange(lines.map(l => (l.id === id ? { ...l, ...patch } : l)));
  const toggleDoc = (id: string) => {
    const next = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onSelectedIdsChange(next);
    // Con una sola forma de pago, el importe sigue a lo elegido
    if (lines.length === 1) {
      const t = r2(docs.filter(d => next.includes(d.id)).reduce((a, d) => a + pendingOf(d), 0));
      onLinesChange([{ ...lines[0], amount: next.length ? t : Math.max(0, accountBalance) }]);
    }
  };

  return (
    <div className="space-y-3">
      {docs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase">{docsTitle}</label>
            <span className="text-[11px] text-slate-500">Tocá las que cancela este pago</span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {docs.map(d => {
              const pend = pendingOf(d);
              return (
                <label key={d.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <span className="flex items-center gap-2 min-w-0">
                    <input type="checkbox" checked={selectedIds.includes(d.id)} onChange={() => toggleDoc(d.id)} className="rounded" />
                    <span className="min-w-0">
                      <span className="font-mono font-bold text-slate-800">{d.number}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">{shortDate(d.date)}{d.label ? ` · ${d.label}` : ''}</span>
                      {d.paid > 0 && <span className="block text-[10px] text-slate-500">Total {money(d.total)} · ya pagado {money(d.paid)}</span>}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="block text-[10px] text-slate-500">Saldo</span>
                    <span className="font-mono font-black text-slate-900">{money(pend)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Formas de pago</label>
        <div className="space-y-2">
          {lines.map((l, idx) => (
            <div key={l.id} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex gap-2">
                <select
                  value={l.method}
                  onChange={e => updateLine(l.id, { method: e.target.value })}
                  aria-label={`Forma de pago ${idx + 1}`}
                  className="flex-1 min-w-0 text-xs p-2 rounded-lg border border-slate-300 font-semibold"
                >
                  {methods.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <div className="relative w-40">
                  <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                  <NumInput
                    value={l.amount || ''}
                    onChange={e => updateLine(l.id, { amount: Number(e.target.value) || 0 })}
                    aria-label={`Importe ${idx + 1}`}
                    className="w-full text-sm pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
                {lines.length > 1 && (
                  <button type="button" onClick={() => onLinesChange(lines.filter(x => x.id !== l.id))} className="p-2 text-slate-400 hover:text-rose-600" aria-label="Quitar forma de pago">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={l.reference}
                  onChange={e => updateLine(l.id, { reference: e.target.value })}
                  placeholder="Banco, n.º de transferencia o de cheque"
                  className="flex-1 min-w-0 text-xs p-2 rounded-lg border border-slate-300"
                />
                {cashboxes && cashboxes.length > 0 && (
                  <select
                    value={l.cashboxId || cashboxes[0].id}
                    onChange={e => updateLine(l.id, { cashboxId: e.target.value })}
                    aria-label="Caja o cuenta"
                    className="w-40 text-xs p-2 rounded-lg border border-slate-300"
                  >
                    {cashboxes.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                )}
                {remaining > 0.009 && (
                  <button
                    type="button"
                    onClick={() => updateLine(l.id, { amount: r2((Number(l.amount) || 0) + remaining) })}
                    className="text-[11px] font-bold px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap"
                  >
                    Completar resto
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onLinesChange([...lines, newPaymentLine(methods.find(m => !lines.some(l => l.method === m.value))?.value || methods[0].value, remaining > 0 ? remaining : 0)])}
            className="w-full py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar otra forma de pago
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-500">{selectedDocs.length ? 'Facturas elegidas' : 'Saldo de la cuenta'}</div>
          <div className="font-mono font-black text-slate-900 text-sm">{money(target)}</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] font-bold uppercase text-slate-500">Este pago</div>
          <div className="font-mono font-black text-slate-900 text-sm">{money(paid)}</div>
        </div>
        <div className={`p-2 rounded-xl border ${remaining > 0.009 ? 'bg-amber-50 border-amber-300' : remaining < -0.009 ? 'bg-sky-50 border-sky-300' : 'bg-emerald-50 border-emerald-300'}`}>
          <div className="text-[10px] font-bold uppercase text-slate-600">{remaining > 0.009 ? 'Resta pagar' : remaining < -0.009 ? 'Queda a cuenta' : 'Cancelado'}</div>
          <div className="font-mono font-black text-slate-900 text-sm">{money(Math.abs(remaining))}</div>
        </div>
      </div>
    </div>
  );
};
