import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  CalendarClock,
  Landmark,
  Plus,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  ChevronDown,
  ChevronRight,
  Receipt
} from 'lucide-react';
import {
  FixedExpense,
  Loan,
  LoanKind,
  Cashbox,
  CheckItem,
  InternalInstallmentPlan,
  CashMovementCategory,
  ExpenseFrequency,
  CompanyConfig,
  ArcaElectronicVoucher,
  PurchaseInvoice,
  SalesOrder,
  TaxPeriod,
  Customer,
  UserRole
} from '../types';
import {
  projectCashFlow,
  pendingExpenseDues,
  buildLoanSchedule,
  loanSummary,
  todayIso,
  addDays,
  round2,
  DueItem
} from '../services/financePlanning';
import { computeTaxHistory, withTaxDefaults, addMonths, periodLabel } from '../services/taxEngine';

const CATEGORY_OPTIONS: { value: CashMovementCategory; label: string }[] = [
  { value: 'alquiler_planta', label: 'Alquiler' },
  { value: 'servicios_luz_gas', label: 'Servicios (luz, gas, internet, teléfono)' },
  { value: 'sueldos_jornales', label: 'Sueldos y cargas sociales' },
  { value: 'impuestos_tasas', label: 'Impuestos y tasas' },
  { value: 'fletes_logistica', label: 'Fletes, combustible y vehículos' },
  { value: 'mantenimiento_maquinaria', label: 'Mantenimiento' },
  { value: 'gastos_oficina', label: 'Oficina, limpieza, sistemas' },
  { value: 'otros_egresos', label: 'Otros gastos' }
];
const FREQ_LABEL: Record<ExpenseFrequency, string> = { semanal: 'Semanal', mensual: 'Mensual', bimestral: 'Bimestral', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };
const MONTHLY_FACTOR: Record<ExpenseFrequency, number> = { semanal: 52 / 12, mensual: 1, bimestral: 1 / 2, trimestral: 1 / 3, semestral: 1 / 6, anual: 1 / 12 };
const KIND_LABEL: Record<LoanKind, string> = { banco: 'Banco', financiera: 'Financiera', proveedor: 'Proveedor', particular: 'Particular', tarjeta: 'Tarjeta de crédito', otro: 'Otro' };
const WEEKDAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const money = (n: number) => `$ ${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso?: string) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');
const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm';

interface Props {
  fixedExpenses: FixedExpense[];
  loans: Loan[];
  cashboxes: Cashbox[];
  checks: CheckItem[];
  installmentPlans: InternalInstallmentPlan[];
  customers: Customer[];
  config: CompanyConfig | null;
  vouchers: ArcaElectronicVoucher[];
  purchaseInvoices: PurchaseInvoice[];
  salesOrders: SalesOrder[];
  taxPeriods: TaxPeriod[];
  currentUserRole?: UserRole;
  onSaveExpense: (e: FixedExpense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onPayExpense: (e: FixedExpense, dueDate: string, amount: number, cashboxId: string, paidDate: string) => Promise<void>;
  onSaveLoan: (l: Loan) => Promise<void>;
  onDeleteLoan: (id: string) => Promise<void>;
  onPayInstallment: (l: Loan, number: number, amount: number, cashboxId: string, paidDate: string) => Promise<void>;
}

type Tab = 'flujo' | 'gastos' | 'prestamos';

// Modal para registrar un pago desde una caja
const PayModal: React.FC<{
  title: string;
  subtitle: string;
  amount: number;
  cashboxes: Cashbox[];
  defaultCashboxId?: string;
  onClose: () => void;
  onConfirm: (amount: number, cashboxId: string, date: string) => Promise<void>;
}> = ({ title, subtitle, amount, cashboxes, defaultCashboxId, onClose, onConfirm }) => {
  const ars = cashboxes.filter(c => c.currency === 'ARS');
  const [value, setValue] = useState(amount);
  const [box, setBox] = useState(defaultCashboxId && ars.some(c => c.id === defaultCashboxId) ? defaultCashboxId : ars.find(c => c.isDefault)?.id || ars[0]?.id || '');
  const [date, setDate] = useState(todayIso());
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div><h3 className="font-black text-slate-900">{title}</h3><p className="text-xs text-slate-500">{subtitle}</p></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        <label className="block"><span className="text-xs font-bold text-slate-600">Importe</span><input type="number" step="0.01" value={value} onChange={e => setValue(Number(e.target.value))} className={`${inputCls} font-mono`} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Sale de</span>
          <select value={box} onChange={e => setBox(e.target.value)} className={inputCls}>
            {ars.length === 0 && <option value="">No hay cajas en pesos</option>}
            {ars.map(c => <option key={c.id} value={c.id}>{c.name} · {money(c.currentBalance)}</option>)}
          </select>
        </label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Fecha</span><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} /></label>
        <button
          disabled={busy || !box || !(value > 0)}
          onClick={async () => { setBusy(true); try { await onConfirm(round2(value), box, date); onClose(); } finally { setBusy(false); } }}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50"
        >
          Registrar pago
        </button>
        <p className="text-[11px] text-slate-400">Se descuenta de la caja y queda como egreso en Cajas.</p>
      </div>
    </div>
  );
};

export const FinancialPlanningModule: React.FC<Props> = props => {
  const { fixedExpenses, loans, cashboxes, checks, installmentPlans, customers, config, currentUserRole } = props;
  const [tab, setTab] = useState<Tab>('flujo');
  const [weeks, setWeeks] = useState(8);
  const [openWeek, setOpenWeek] = useState<number | null>(0);
  const [paying, setPaying] = useState<null | { kind: 'gasto'; expense: FixedExpense; due: DueItem } | { kind: 'cuota'; loan: Loan; number: number }>(null);
  const canEdit = currentUserRole === 'creador' || currentUserRole === 'admin' || currentUserRole === 'finanzas';
  const today = todayIso();

  const cashArs = round2(cashboxes.filter(c => c.currency === 'ARS').reduce((a, c) => a + (c.currentBalance || 0), 0));
  const receivables = round2(customers.reduce((a, c) => a + Math.max(0, c.currentBalance || 0), 0));

  // Impuestos estimados del Contador Interno (mes anterior y mes en curso) que no están pagados
  const taxes = useMemo(() => {
    if (!config?.taxSettings) return [];
    const settings = withTaxDefaults(config.taxSettings);
    const periodMap = Object.fromEntries(props.taxPeriods.map(p => [p.id, p]));
    const current = today.slice(0, 7);
    const hist = computeTaxHistory({ settings, vouchers: props.vouchers, purchaseInvoices: props.purchaseInvoices, salesOrders: props.salesOrders, periods: periodMap }, current);
    return hist
      .filter(h => h.period >= addMonths(current, -1))
      .flatMap(h => {
        const pd = periodMap[h.period];
        const est = h.period === current ? ' (estimado, mes en curso)' : '';
        const out: { date: string; amount: number; label: string }[] = [];
        if (h.iva.applies && pd?.iva?.status !== 'pagado' && h.iva.toPay > 0) out.push({ date: h.ivaDue, amount: h.iva.toPay, label: `IVA ${periodLabel(h.period)}${est}` });
        if (h.iibb.applies && pd?.iibb?.status !== 'pagado' && h.iibb.toPay > 0) out.push({ date: h.iibbDue, amount: h.iibb.toPay, label: `Ingresos Brutos ${periodLabel(h.period)}${est}` });
        return out;
      });
  }, [config?.taxSettings, props.taxPeriods, props.vouchers, props.purchaseInvoices, props.salesOrders, today]);

  const flow = useMemo(
    () => projectCashFlow({ startBalance: cashArs, today, weeks, fixedExpenses, loans, checks, installmentPlans, taxes }),
    [cashArs, today, weeks, fixedExpenses, loans, checks, installmentPlans, taxes]
  );
  const maxAbs = Math.max(1, ...flow.weeks.map(w => Math.abs(w.balance)), Math.abs(cashArs));

  const tabBtn = (id: Tab, label: string, Icon: React.ElementType) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 ${tab === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Planificación Financiera</h1>
            <p className="text-xs text-slate-500">Cuánta plata va a haber cada semana: cajas, cheques, cuotas a cobrar, gastos fijos, préstamos e impuestos.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {tabBtn('flujo', 'Flujo de fondos', TrendingUp)}
          {tabBtn('gastos', `Gastos fijos (${fixedExpenses.filter(e => e.active).length})`, Receipt)}
          {tabBtn('prestamos', `Préstamos (${loans.filter(l => l.status === 'vigente').length})`, Landmark)}
        </div>
      </div>

      {tab === 'flujo' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Hoy en cajas (pesos)</div><div className="text-xl font-black font-mono">{money(cashArs)}</div></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Saldo mínimo proyectado</div><div className={`text-xl font-black font-mono ${flow.minBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{money(flow.minBalance)}</div></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Vencidos sin pagar / cobrar</div><div className={`text-xl font-black ${flow.overdue.length ? 'text-amber-600' : 'text-slate-900'}`}>{flow.overdue.length}</div></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4"><div className="text-[11px] font-bold uppercase text-slate-400">Clientes deben (sin fecha)</div><div className="text-xl font-black font-mono">{money(receivables)}</div></div>
          </div>

          {flow.firstNegative ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>La semana del <b>{fmtDate(flow.firstNegative.start)}</b> la caja quedaría en <b>{money(flow.firstNegative.balance)}</b>. Conviene adelantar cobranzas o mover pagos.</div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Con lo cargado, la caja alcanza todas las semanas proyectadas.</div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold text-slate-900">Semana a semana</h2>
              <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm">
                <option value={4}>Próximas 4 semanas</option><option value={8}>Próximas 8 semanas</option><option value={13}>Próximos 3 meses</option><option value={26}>Próximos 6 meses</option>
              </select>
            </div>
            <div className="space-y-1.5">
              {flow.weeks.map((w, i) => (
                <div key={w.start} className="rounded-xl border border-slate-100">
                  <button onClick={() => setOpenWeek(openWeek === i ? null : i)} className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-slate-50 rounded-xl">
                    {openWeek === i ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div className="w-28 shrink-0 text-xs font-bold text-slate-600">{fmtDate(w.start)} – {fmtDate(w.end).slice(0, 5)}</div>
                    <div className="flex-1 hidden sm:block">
                      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${w.balance < 0 ? 'bg-rose-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(100, (Math.abs(w.balance) / maxAbs) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right text-xs font-mono w-24 text-emerald-700">{w.totalIn > 0 ? `+${money(w.totalIn).replace('$ ', '')}` : '—'}</div>
                    <div className="text-right text-xs font-mono w-24 text-rose-600">{w.totalOut > 0 ? `−${money(w.totalOut).replace('$ ', '')}` : '—'}</div>
                    <div className={`text-right text-sm font-black font-mono w-32 ${w.balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{money(w.balance)}</div>
                  </button>
                  {openWeek === i && (w.inflows.length > 0 || w.outflows.length > 0) && (
                    <div className="px-4 pb-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="font-bold text-emerald-700 mb-1">Entra</div>
                        {w.inflows.length === 0 && <div className="text-slate-400">—</div>}
                        {w.inflows.map(it => <div key={it.key} className="flex justify-between gap-2 py-0.5"><span className="truncate">{fmtDate(it.date)} · {it.label}{it.overdue && <b className="text-amber-600"> · vencido</b>}</span><span className="font-mono shrink-0">{money(it.amount)}</span></div>)}
                      </div>
                      <div>
                        <div className="font-bold text-rose-600 mb-1">Sale</div>
                        {w.outflows.length === 0 && <div className="text-slate-400">—</div>}
                        {w.outflows.map(it => <div key={it.key} className="flex justify-between gap-2 py-0.5"><span className="truncate">{fmtDate(it.date)} · {it.label}{it.overdue && <b className="text-amber-600"> · vencido</b>}</span><span className="font-mono shrink-0">{money(it.amount)}</span></div>)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Incluye cheques en cartera por fecha de cobro, cheques propios por fecha de pago, cuotas internas de clientes, gastos fijos, cuotas de préstamos en pesos e IVA / Ingresos Brutos del Contador Interno. Lo vencido sin pagar se suma a la primera semana. Las ventas futuras y las deudas de clientes sin fecha no se proyectan.
            </p>
          </div>
        </>
      )}

      {tab === 'gastos' && <ExpensesPanel {...props} canEdit={canEdit} onPay={(expense, due) => setPaying({ kind: 'gasto', expense, due })} />}
      {tab === 'prestamos' && <LoansPanel {...props} canEdit={canEdit} onPay={(loan, number) => setPaying({ kind: 'cuota', loan, number })} />}

      {paying?.kind === 'gasto' && (
        <PayModal
          title={`Pagar ${paying.expense.name}`}
          subtitle={`Vencimiento ${fmtDate(paying.due.date)}`}
          amount={paying.expense.amount}
          cashboxes={cashboxes}
          defaultCashboxId={paying.expense.defaultCashboxId}
          onClose={() => setPaying(null)}
          onConfirm={(amount, box, date) => props.onPayExpense(paying.expense, paying.due.date, amount, box, date)}
        />
      )}
      {paying?.kind === 'cuota' && (() => {
        const inst = paying.loan.installments.find(i => i.number === paying.number)!;
        return (
          <PayModal
            title={`Pagar cuota ${inst.number}/${paying.loan.installments.length}`}
            subtitle={`${paying.loan.lender} · vence ${fmtDate(inst.dueDate)}`}
            amount={inst.amount}
            cashboxes={cashboxes}
            defaultCashboxId={paying.loan.defaultCashboxId}
            onClose={() => setPaying(null)}
            onConfirm={(amount, box, date) => props.onPayInstallment(paying.loan, inst.number, amount, box, date)}
          />
        );
      })()}
    </div>
  );
};

// ---------------- Gastos fijos ----------------
const emptyExpense = (): FixedExpense => ({
  id: '',
  name: '',
  category: 'servicios_luz_gas',
  amount: 0,
  frequency: 'mensual',
  dueDay: 10,
  startDate: todayIso().slice(0, 8) + '01',
  active: true,
  payments: [],
  createdAt: new Date().toISOString()
});

const ExpensesPanel: React.FC<Props & { canEdit: boolean; onPay: (e: FixedExpense, due: DueItem) => void }> = ({ fixedExpenses, cashboxes, canEdit, onSaveExpense, onDeleteExpense, onPay }) => {
  const [editing, setEditing] = useState<FixedExpense | null>(null);
  const today = todayIso();
  const horizon = addDays(today, 45);
  const rows = useMemo(
    () =>
      [...fixedExpenses]
        .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))
        .map(e => ({ e, dues: pendingExpenseDues(e, horizon, today) })),
    [fixedExpenses, horizon, today]
  );
  const monthly = round2(fixedExpenses.filter(e => e.active).reduce((a, e) => a + e.amount * MONTHLY_FACTOR[e.frequency], 0));

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editing) return;
    if (!editing.name.trim() || !(editing.amount > 0)) return alert('Completá el nombre y el importe.');
    await onSaveExpense({ ...editing, id: editing.id || `fx-${Date.now()}`, name: editing.name.trim(), amount: round2(editing.amount) });
    setEditing(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div><h2 className="font-extrabold text-slate-900">Gastos fijos</h2><p className="text-xs text-slate-500">Equivalen a {money(monthly)} por mes</p></div>
          {canEdit && <button onClick={() => setEditing(emptyExpense())} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"><Plus className="w-4 h-4" /> Nuevo gasto fijo</button>}
        </div>
        {rows.length === 0 && <p className="text-sm text-slate-500 py-6 text-center">Cargá alquiler, servicios, contador, seguros y todo lo que se paga siempre.</p>}
        <div className="divide-y divide-slate-100">
          {rows.map(({ e, dues }) => {
            const overdue = dues.filter(d => d.overdue);
            const next = dues.find(d => !d.overdue);
            return (
              <div key={e.id} className={`py-3 flex flex-wrap items-center gap-3 ${!e.active ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-[180px]">
                  <div className="font-bold text-sm">{e.name}{e.provider ? <span className="text-slate-400 font-normal"> · {e.provider}</span> : null}</div>
                  <div className="text-[11px] text-slate-500">{FREQ_LABEL[e.frequency]} · {e.frequency === 'semanal' ? WEEKDAYS[e.dueDay] : `día ${e.dueDay}`} · {money(e.amount)}</div>
                </div>
                <div className="text-xs text-right">
                  {overdue.length > 0 && <div className="font-bold text-rose-600">{overdue.length} vencido{overdue.length > 1 ? 's' : ''} · {fmtDate(overdue[0].date)}</div>}
                  {next && <div className="text-slate-600">Próximo {fmtDate(next.date)}</div>}
                  {!next && overdue.length === 0 && e.active && <div className="text-emerald-700 font-bold">Al día</div>}
                </div>
                <div className="flex gap-1">
                  {e.active && (overdue[0] || next) && canEdit && (
                    <button onClick={() => onPay(e, (overdue[0] || next)!)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white">Pagar</button>
                  )}
                  {canEdit && <button onClick={() => setEditing({ ...e })} className="p-1.5 rounded-lg bg-slate-100" title="Editar"><Edit3 className="w-3.5 h-3.5" /></button>}
                  {canEdit && <button onClick={() => window.confirm(`¿Eliminar "${e.name}"? Los pagos ya hechos quedan en Cajas.`) && onDeleteExpense(e.id)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        {editing ? (
          <form onSubmit={save} className="space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-extrabold">{editing.id ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}</h3><button type="button" onClick={() => setEditing(null)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button></div>
            <label className="block"><span className="text-xs font-bold text-slate-600">Nombre</span><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Ej: Alquiler local, Luz EPEC, Contador" className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Proveedor / a quién se paga</span><input value={editing.provider || ''} onChange={e => setEditing({ ...editing, provider: e.target.value })} className={inputCls} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="text-xs font-bold text-slate-600">Importe</span><input type="number" step="0.01" value={editing.amount || ''} onChange={e => setEditing({ ...editing, amount: Number(e.target.value) })} className={`${inputCls} font-mono`} /></label>
              <label className="block"><span className="text-xs font-bold text-slate-600">Frecuencia</span>
                <select value={editing.frequency} onChange={e => setEditing({ ...editing, frequency: e.target.value as ExpenseFrequency, dueDay: e.target.value === 'semanal' ? 1 : editing.dueDay > 7 ? editing.dueDay : 10 })} className={inputCls}>
                  {Object.entries(FREQ_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block"><span className="text-xs font-bold text-slate-600">{editing.frequency === 'semanal' ? 'Día de la semana' : 'Día de vencimiento'}</span>
                {editing.frequency === 'semanal' ? (
                  <select value={editing.dueDay} onChange={e => setEditing({ ...editing, dueDay: Number(e.target.value) })} className={inputCls}>{WEEKDAYS.slice(1).map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select>
                ) : (
                  <input type="number" min={1} max={31} value={editing.dueDay} onChange={e => setEditing({ ...editing, dueDay: Number(e.target.value) })} className={inputCls} />
                )}
              </label>
              <label className="block"><span className="text-xs font-bold text-slate-600">Desde</span><input type="date" value={editing.startDate} onChange={e => setEditing({ ...editing, startDate: e.target.value })} className={inputCls} /></label>
            </div>
            <label className="block"><span className="text-xs font-bold text-slate-600">Categoría</span>
              <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value as CashMovementCategory })} className={inputCls}>{CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
            </label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Se paga habitualmente desde</span>
              <select value={editing.defaultCashboxId || ''} onChange={e => setEditing({ ...editing, defaultCashboxId: e.target.value || undefined })} className={inputCls}>
                <option value="">Elegir al pagar</option>
                {cashboxes.filter(c => c.currency === 'ARS').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Hasta (opcional)</span><input type="date" value={editing.endDate || ''} onChange={e => setEditing({ ...editing, endDate: e.target.value || undefined })} className={inputCls} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} /> Activo</label>
            <button className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm">Guardar</button>
          </form>
        ) : (
          <div className="text-sm text-slate-600 space-y-2">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> Cómo funciona</h3>
            <p>Cada gasto fijo genera sus vencimientos solo. Al tocar <b>Pagar</b> se descuenta de la caja elegida y queda registrado en Cajas.</p>
            <p>Los vencimientos impagos aparecen en el Flujo de fondos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------- Préstamos ----------------
const LoansPanel: React.FC<Props & { canEdit: boolean; onPay: (l: Loan, number: number) => void }> = ({ loans, cashboxes, canEdit, onSaveLoan, onDeleteLoan, onPay }) => {
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [f, setF] = useState({ lender: '', kind: 'banco' as LoanKind, principal: 0, annualRate: 0, count: 12, firstDueDate: addDays(todayIso(), 30), system: 'frances' as 'frances' | 'cuota_fija', fixedAmount: 0, currency: 'ARS' as 'ARS' | 'USD', defaultCashboxId: '', notes: '' });
  const preview = useMemo(
    () => (f.principal > 0 && f.count > 0 ? buildLoanSchedule({ principal: f.principal, annualRate: f.annualRate, count: f.count, firstDueDate: f.firstDueDate, system: f.system, fixedAmount: f.fixedAmount || undefined }) : []),
    [f]
  );

  const create = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!f.lender.trim() || !(f.principal > 0) || preview.length === 0) return alert('Completá quién presta, el capital y la cantidad de cuotas.');
    if (f.system === 'cuota_fija' && !(f.fixedAmount > 0)) return alert('Indicá el importe de cada cuota.');
    await onSaveLoan({
      id: `loan-${Date.now()}`,
      lender: f.lender.trim(),
      kind: f.kind,
      principal: round2(f.principal),
      currency: f.currency,
      annualRate: f.system === 'frances' ? f.annualRate : 0,
      system: f.system,
      startDate: todayIso(),
      installments: preview,
      defaultCashboxId: f.defaultCashboxId || undefined,
      status: 'vigente',
      notes: f.notes.trim() || undefined,
      createdAt: new Date().toISOString()
    });
    setCreating(false);
  };

  const active = loans.filter(l => l.status === 'vigente');
  const totalPending = round2(active.filter(l => l.currency === 'ARS').reduce((a, l) => a + loanSummary(l).pendingAmount, 0));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h2 className="font-extrabold text-slate-900">Préstamos y créditos</h2><p className="text-xs text-slate-500">Falta pagar {money(totalPending)} en pesos</p></div>
          {canEdit && <button onClick={() => setCreating(c => !c)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white"><Plus className="w-4 h-4" /> Nuevo préstamo</button>}
        </div>

        {creating && (
          <form onSubmit={create} className="rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-600">Quién presta</span><input value={f.lender} onChange={e => setF({ ...f, lender: e.target.value })} placeholder="Ej: Banco de Córdoba" className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Tipo</span><select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value as LoanKind })} className={inputCls}>{Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Moneda</span><select value={f.currency} onChange={e => setF({ ...f, currency: e.target.value as any })} className={inputCls}><option value="ARS">Pesos</option><option value="USD">Dólares</option></select></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Capital recibido</span><input type="number" value={f.principal || ''} onChange={e => setF({ ...f, principal: Number(e.target.value) })} className={`${inputCls} font-mono`} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Cuotas</span><input type="number" min={1} max={240} value={f.count} onChange={e => setF({ ...f, count: Number(e.target.value) })} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Primer vencimiento</span><input type="date" value={f.firstDueDate} onChange={e => setF({ ...f, firstDueDate: e.target.value })} className={inputCls} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Sistema</span><select value={f.system} onChange={e => setF({ ...f, system: e.target.value as any })} className={inputCls}><option value="frances">Francés (con tasa)</option><option value="cuota_fija">Cuota fija conocida</option></select></label>
            {f.system === 'frances' ? (
              <label className="block"><span className="text-xs font-bold text-slate-600">Tasa nominal anual (TNA %)</span><input type="number" step="0.01" value={f.annualRate || ''} onChange={e => setF({ ...f, annualRate: Number(e.target.value) })} className={inputCls} /></label>
            ) : (
              <label className="block"><span className="text-xs font-bold text-slate-600">Importe de cada cuota</span><input type="number" step="0.01" value={f.fixedAmount || ''} onChange={e => setF({ ...f, fixedAmount: Number(e.target.value) })} className={`${inputCls} font-mono`} /></label>
            )}
            <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-600">Se paga desde</span><select value={f.defaultCashboxId} onChange={e => setF({ ...f, defaultCashboxId: e.target.value })} className={inputCls}><option value="">Elegir al pagar</option>{cashboxes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block md:col-span-2"><span className="text-xs font-bold text-slate-600">Notas</span><input value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} className={inputCls} /></label>
            {preview.length > 0 && (
              <div className="md:col-span-4 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                Cuota {preview[0].amount === preview[preview.length - 1].amount ? '' : 'inicial '}<b>{money(preview[0].amount)}</b> · total a devolver <b>{money(preview.reduce((a, i) => a + i.amount, 0))}</b> · intereses <b>{money(preview.reduce((a, i) => a + i.interest, 0))}</b> · última cuota {fmtDate(preview[preview.length - 1].dueDate)}
              </div>
            )}
            <div className="md:col-span-4 flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-bold">Cancelar</button>
              <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Guardar préstamo</button>
            </div>
          </form>
        )}

        {loans.length === 0 && !creating && <p className="text-sm text-slate-500 py-6 text-center">No hay préstamos cargados.</p>}
        <div className="divide-y divide-slate-100">
          {[...loans].sort((a, b) => Number(a.status === 'cancelado') - Number(b.status === 'cancelado')).map(l => {
            const s = loanSummary(l);
            const open = openId === l.id;
            const today = todayIso();
            return (
              <div key={l.id} className={l.status === 'cancelado' ? 'opacity-50' : ''}>
                <button onClick={() => setOpenId(open ? null : l.id)} className="w-full py-3 flex flex-wrap items-center gap-3 text-left">
                  {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <div className="flex-1 min-w-[160px]">
                    <div className="font-bold text-sm">{l.lender} <span className="text-[11px] font-normal text-slate-400">{KIND_LABEL[l.kind]}{l.currency === 'USD' ? ' · USD' : ''}</span></div>
                    <div className="text-[11px] text-slate-500">{s.paidCount}/{l.installments.length} cuotas pagas · capital {money(l.principal)}{l.annualRate ? ` · TNA ${l.annualRate}%` : ''}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-black font-mono text-sm">{money(s.pendingAmount)}</div>
                    {s.next && <div className={s.next.dueDate < today ? 'text-rose-600 font-bold' : 'text-slate-500'}>Próxima {fmtDate(s.next.dueDate)} · {money(s.next.amount)}</div>}
                    {!s.next && <div className="text-emerald-700 font-bold">Cancelado</div>}
                  </div>
                </button>
                {open && (
                  <div className="pb-4 pl-7 space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="py-1.5">#</th><th>Vence</th><th className="text-right">Cuota</th><th className="text-right">Capital</th><th className="text-right">Interés</th><th className="text-right">Estado</th></tr></thead>
                        <tbody>
                          {l.installments.map(i => (
                            <tr key={i.number} className="border-b border-slate-50">
                              <td className="py-1.5">{i.number}</td>
                              <td className={!i.paid && i.dueDate < today ? 'text-rose-600 font-bold' : ''}>{fmtDate(i.dueDate)}</td>
                              <td className="text-right font-mono">{money(i.amount)}</td>
                              <td className="text-right font-mono text-slate-500">{money(i.capital)}</td>
                              <td className="text-right font-mono text-slate-500">{money(i.interest)}</td>
                              <td className="text-right">
                                {i.paid ? <span className="text-emerald-700 font-bold">Pagada {fmtDate(i.paidDate)}</span> : canEdit && l.status === 'vigente' ? <button onClick={() => onPay(l, i.number)} className="px-2 py-1 rounded-md bg-emerald-600 text-white font-bold">Pagar</button> : 'Pendiente'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        {l.status === 'vigente' && <button onClick={() => window.confirm('¿Marcar el préstamo como cancelado? Las cuotas impagas dejan de aparecer en el flujo.') && onSaveLoan({ ...l, status: 'cancelado' })} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100">Marcar cancelado</button>}
                        <button onClick={() => window.confirm(`¿Eliminar el préstamo de ${l.lender}? Los pagos ya hechos quedan en Cajas.`) && onDeleteLoan(l.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600">Eliminar</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-[11px] text-slate-400 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Los préstamos en dólares se muestran pero no entran en el flujo en pesos.</p>
    </div>
  );
};
