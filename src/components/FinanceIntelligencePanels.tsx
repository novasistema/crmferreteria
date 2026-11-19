import React, { useMemo, useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, Plus, Trash2, X, Bell, PiggyBank, ShieldCheck, Info } from 'lucide-react';
import { SalesOrder, Product, Employee, FixedExpense, Loan, Cashbox, FinanceSettings, SavingsPlan, FinanceReminder } from '../types';
import {
  monthlyStats, averageMargin, employeeCost, monthlyFixedCosts, breakEven, averageGrowth, projectSales, savingsStatus, round2, addMonths
} from '../services/financeIntelligence';
import { todayIso } from '../services/financePlanning';
import { NumInput, parseArNumber } from './NumInput';

const money = (n: number) => (isFinite(n) ? `$ ${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '—');
const pct = (n: number) => `${(Number(n) || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const monthLabel = (p: string) => `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(2, 4)}`;
const fmtDate = (iso?: string) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');
const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm';
const card = 'bg-white rounded-2xl border border-slate-200 p-5';

const NumberField: React.FC<{ label: string; value: number; onChange: (n: number) => void; suffix?: string; disabled?: boolean; step?: string }> = ({ label, value, onChange, suffix, disabled, step }) => (
  <label className="block">
    <span className="text-xs font-bold text-slate-600">{label}</span>
    <div className="relative">
      <NumInput step={step || 'any'} disabled={disabled} value={Number.isFinite(value) ? value : 0} onChange={e => onChange(Number(e.target.value))} className={`${inputCls} ${suffix ? 'pr-10' : ''} disabled:bg-slate-50`} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-xs text-slate-400">{suffix}</span>}
    </div>
  </label>
);

interface Common {
  salesOrders: SalesOrder[];
  products: Product[];
  employees: Employee[];
  fixedExpenses: FixedExpense[];
  loans: Loan[];
  settings: FinanceSettings;
  canEdit: boolean;
  onSaveSettings: (s: FinanceSettings) => Promise<void>;
}

// ---------------- Punto de equilibrio ----------------
export const BreakEvenPanel: React.FC<Common> = ({ salesOrders, products, employees, fixedExpenses, loans, settings, canEdit, onSaveSettings }) => {
  const today = todayIso();
  const month = today.slice(0, 7);
  const stats = useMemo(() => monthlyStats(salesOrders, products, month, 6), [salesOrders, products, month]);
  const avg = useMemo(() => averageMargin(stats, settings.defaultMarginPct ?? 30), [stats, settings.defaultMarginPct]);
  const fixed = useMemo(() => monthlyFixedCosts(settings, fixedExpenses, employees, loans, today), [settings, fixedExpenses, employees, loans, today]);
  const [marginOverride, setMarginOverride] = useState<number | null>(null);
  const margin = marginOverride ?? avg.pct;
  const current = stats[stats.length - 1];
  const be = breakEven(fixed.total, margin, current?.netSales || 0, month, today, settings.workingDaysPerMonth);

  const toggle = (k: 'includeEmployeesInFixed' | 'includeLoansInFixed') => canEdit && onSaveSettings({ ...settings, [k]: !settings[k] });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">Costos fijos del mes</div><div className="text-xl font-black font-mono">{money(fixed.total)}</div></div>
        <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">Margen sobre ventas</div><div className="text-xl font-black font-mono">{pct(margin)}</div><div className="text-[11px] text-slate-500">{marginOverride !== null ? 'simulado' : avg.estimated ? 'estimado (faltan costos cargados)' : 'real, últimos meses'}</div></div>
        <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">Punto de equilibrio</div><div className="text-xl font-black font-mono text-teal-700">{money(be.breakEvenSales)}</div><div className="text-[11px] text-slate-500">ventas sin IVA por mes</div></div>
        <div className={card}><div className="text-[11px] font-bold uppercase text-slate-400">Hay que vender por día</div><div className="text-xl font-black font-mono">{money(be.perWorkingDay)}</div><div className="text-[11px] text-slate-500">{settings.workingDaysPerMonth} días hábiles</div></div>
      </div>

      <div className={card}>
        <div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-teal-600" /><h3 className="font-extrabold">Este mes</h3></div>
        <div className="flex justify-between text-sm mb-1"><span>Vendido sin IVA: <b className="font-mono">{money(current?.netSales || 0)}</b></span><span className="text-slate-500">{Math.round(be.progress * 100)} % del equilibrio</span></div>
        <div className="h-4 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${be.reachedAlready ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(100, be.progress * 100)}%` }} /></div>
        <div className="mt-3 text-sm">
          {be.reachedAlready ? (
            <div className="flex items-center gap-2 text-emerald-700 font-semibold"><CheckCircle2 className="w-4 h-4" /> Ya cubriste los costos fijos del mes: lo que se venda de acá en adelante deja ganancia.</div>
          ) : be.reachDay ? (
            <div className="text-slate-700">Al ritmo actual cubrís los costos fijos el <b>día {be.reachDay}</b> del mes. Cerrarías el mes en {money(be.projectedMonth)} con una ganancia de <b className={be.profitAtPace >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{money(be.profitAtPace)}</b>.</div>
          ) : (
            <div className="flex items-start gap-2 text-rose-700"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Al ritmo actual ({money(be.projectedMonth)} en el mes) no se llegan a cubrir los costos fijos: quedarían {money(-be.profitAtPace)} sin cubrir.</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className={card}>
          <h3 className="font-extrabold mb-3">De dónde salen los costos fijos</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Gastos fijos cargados</span><span className="font-mono">{money(fixed.expenses)}</span></div>
            <label className="flex justify-between items-center gap-2"><span className="flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={settings.includeEmployeesInFixed} onChange={() => toggle('includeEmployeesInFixed')} /> Sueldos con cargas ({employees.filter(e => e.active).length} empleados)</span><span className="font-mono">{money(fixed.staff)}</span></label>
            <label className="flex justify-between items-center gap-2"><span className="flex items-center gap-2"><input type="checkbox" disabled={!canEdit} checked={settings.includeLoansInFixed} onChange={() => toggle('includeLoansInFixed')} /> Cuotas de préstamos (promedio 12 meses)</span><span className="font-mono">{money(fixed.loans)}</span></label>
            <div className="flex justify-between items-end gap-2">
              <div className="flex-1"><NumberField label="Otros costos fijos por mes" value={settings.extraFixedCosts} disabled={!canEdit} onChange={n => onSaveSettings({ ...settings, extraFixedCosts: n })} /></div>
            </div>
            <div className="flex justify-between font-black border-t border-slate-200 pt-2"><span>Total</span><span className="font-mono">{money(fixed.total)}</span></div>
          </div>
        </div>
        <div className={card}>
          <h3 className="font-extrabold mb-3">Simulador</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Margen sobre ventas" suffix="%" value={margin} onChange={n => setMarginOverride(n)} />
            <NumberField label="Días hábiles por mes" value={settings.workingDaysPerMonth} disabled={!canEdit} onChange={n => onSaveSettings({ ...settings, workingDaysPerMonth: Math.max(1, Math.round(n)) })} />
          </div>
          {marginOverride !== null && <button onClick={() => setMarginOverride(null)} className="mt-2 text-xs font-bold text-teal-700">Volver al margen real ({pct(avg.pct)})</button>}
          <p className="text-[11px] text-slate-500 mt-3 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-px" /> El margen real sale del costo cargado en cada producto. Si muchos productos no tienen costo, se usa {pct(settings.defaultMarginPct ?? 30)} como estimación.</p>
          <div className="mt-3 text-xs bg-slate-50 rounded-xl p-3 space-y-1">
            {[-5, 0, 5].map(d => {
              const m = Math.max(1, margin + d);
              return <div key={d} className="flex justify-between"><span>Con margen {pct(m)}</span><b className="font-mono">{money(fixed.total / (m / 100))}</b></div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- Comparativo y proyección ----------------
export const ComparisonPanel: React.FC<Common> = ({ salesOrders, products }) => {
  const today = todayIso();
  const month = today.slice(0, 7);
  const stats = useMemo(() => monthlyStats(salesOrders, products, month, 24), [salesOrders, products, month]);
  const last12 = stats.slice(-12);
  const suggested = useMemo(() => averageGrowth(stats), [stats]);
  const [growth, setGrowth] = useState<number | null>(null);
  const g = growth ?? suggested;
  const projection = useMemo(() => projectSales(stats, g, 6), [stats, g]);
  const max = Math.max(1, ...last12.map(s => s.netSales), ...projection.map(p => p.sales));
  const prevOf = (m: string) => stats.find(s => s.month === addMonths(m, -1));
  const yearAgo = (m: string) => stats.find(s => s.month === addMonths(m, -12));
  const varPct = (a?: number, b?: number) => (b && b > 0 && a !== undefined ? ((a - b) / b) * 100 : null);
  const varCell = (v: number | null) => (v === null ? <span className="text-slate-300">—</span> : <span className={v >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{v >= 0 ? '+' : ''}{pct(v)}</span>);

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-extrabold">Ventas sin IVA: últimos 12 meses y proyección</h3>
          <div className="flex items-end gap-2">
            <div className="w-40"><NumberField label="Crecimiento mensual" suffix="%" value={g} onChange={n => setGrowth(n)} /></div>
            {growth !== null && <button onClick={() => setGrowth(null)} className="text-xs font-bold text-teal-700 pb-2.5">Usar {pct(suggested)}</button>}
          </div>
        </div>
        <div className="flex items-end gap-1 h-48">
          {last12.map(s => (
            <div key={s.month} className="flex-1 h-full flex flex-col justify-end items-center" title={`${monthLabel(s.month)}: ${money(s.netSales)}`}>
              <div className={`w-full rounded-t ${s.month === month ? 'bg-teal-300' : 'bg-teal-600'}`} style={{ height: `${(s.netSales / max) * 100}%`, minHeight: s.netSales ? 3 : 0 }} />
            </div>
          ))}
          {projection.map(p => (
            <div key={p.month} className="flex-1 h-full flex flex-col justify-end" title={`${monthLabel(p.month)} (proyección): ${money(p.sales)}`}>
              <div className="w-full rounded-t border-2 border-dashed border-teal-500 bg-teal-50" style={{ height: `${(p.sales / max) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1">{[...last12.map(s => s.month), ...projection.map(p => p.month)].map(m => <div key={m} className="flex-1 text-center text-[9px] text-slate-400">{monthLabel(m).split(' ')[0]}</div>)}</div>
        <p className="text-[11px] text-slate-500 mt-2">La proyección parte del promedio de los últimos 3 meses cerrados. El crecimiento sugerido ({pct(suggested)}) es el promedio de los últimos meses; con inflación alta conviene comparar también en unidades.</p>
      </div>

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200"><th className="py-2">Mes</th><th className="text-right">Ventas sin IVA</th><th className="text-right">vs mes anterior</th><th className="text-right">vs año anterior</th><th className="text-right">Operaciones</th><th className="text-right">Ticket prom.</th><th className="text-right">Margen</th></tr></thead>
          <tbody>
            {[...last12].reverse().map(s => (
              <tr key={s.month} className="border-b border-slate-50">
                <td className="py-2 font-semibold">{monthLabel(s.month)}{s.month === month ? <span className="text-[10px] text-slate-400"> (en curso)</span> : ''}</td>
                <td className="text-right font-mono">{money(s.netSales)}</td>
                <td className="text-right text-xs">{s.month === month ? <span className="text-slate-300">—</span> : varCell(varPct(s.netSales, prevOf(s.month)?.netSales))}</td>
                <td className="text-right text-xs">{varCell(varPct(s.netSales, yearAgo(s.month)?.netSales))}</td>
                <td className="text-right">{s.count}</td>
                <td className="text-right font-mono">{money(s.avgTicket)}</td>
                <td className="text-right">{s.costCoverage >= 0.5 ? pct(s.grossMargin) : <span className="text-slate-300">s/costo</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------- Colchón, ahorros y recordatorios ----------------
export const ReservesPanel: React.FC<Common & {
  cashboxes: Cashbox[];
  savingsPlans: SavingsPlan[];
  reminders: FinanceReminder[];
  onSavePlan: (p: SavingsPlan) => Promise<void>;
  onDeletePlan: (id: string) => Promise<void>;
  onSaveReminder: (r: FinanceReminder) => Promise<void>;
  onDeleteReminder: (id: string) => Promise<void>;
}> = props => {
  const { cashboxes, settings, canEdit, onSaveSettings, savingsPlans, reminders } = props;
  const today = todayIso();
  const fixed = useMemo(() => monthlyFixedCosts(settings, props.fixedExpenses, props.employees, props.loans, today), [settings, props.fixedExpenses, props.employees, props.loans, today]);
  const target = round2(fixed.total * settings.cushionMonths);
  const reserveBoxes = cashboxes.filter(c => settings.cushionCashboxIds.includes(c.id) && c.currency === 'ARS');
  const reserve = round2(reserveBoxes.reduce((a, c) => a + c.currentBalance, 0));
  const covered = fixed.total > 0 ? reserve / fixed.total : 0;

  const [newPlan, setNewPlan] = useState<{ name: string; goal: number; targetDate: string } | null>(null);
  const [contrib, setContrib] = useState<Record<string, string>>({});
  const [newRem, setNewRem] = useState<{ title: string; date: string; amount: number; repeat: FinanceReminder['repeat'] } | null>(null);

  const completeReminder = async (r: FinanceReminder) => {
    if (r.repeat === 'no') return props.onSaveReminder({ ...r, done: true });
    const [y, m, d] = r.date.split('-').map(Number);
    const next = new Date(Date.UTC(y + (r.repeat === 'anual' ? 1 : 0), m - 1 + (r.repeat === 'mensual' ? 1 : 0), 1));
    const last = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
    next.setUTCDate(Math.min(d, last));
    await props.onSaveReminder({ ...r, date: next.toISOString().slice(0, 10), done: false });
  };

  const pending = [...reminders].filter(r => !r.done).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-5 h-5 text-teal-600" /><h3 className="font-extrabold">Colchón de emergencia</h3></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex justify-between text-sm"><span>Reserva actual <b className="font-mono">{money(reserve)}</b></span><span>Objetivo <b className="font-mono">{money(target)}</b></span></div>
            <div className="h-4 rounded-full bg-slate-100 overflow-hidden"><div className={`h-full ${reserve >= target ? 'bg-emerald-500' : covered >= 1 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${target > 0 ? Math.min(100, (reserve / target) * 100) : 0}%` }} /></div>
            <p className="text-sm text-slate-600">La reserva cubre <b>{covered.toLocaleString('es-AR', { maximumFractionDigits: 1 })} meses</b> de costos fijos ({money(fixed.total)} por mes).{reserve < target ? ` Faltan ${money(target - reserve)} para llegar a ${settings.cushionMonths} meses.` : ' Objetivo cumplido.'}</p>
          </div>
          <div className="space-y-2">
            <NumberField label="Meses a cubrir" value={settings.cushionMonths} disabled={!canEdit} onChange={n => onSaveSettings({ ...settings, cushionMonths: Math.max(1, Math.round(n)) })} />
            <div className="text-xs font-bold text-slate-600">Cajas que son reserva</div>
            {cashboxes.filter(c => c.currency === 'ARS').map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={!canEdit} checked={settings.cushionCashboxIds.includes(c.id)} onChange={e => onSaveSettings({ ...settings, cushionCashboxIds: e.target.checked ? [...settings.cushionCashboxIds, c.id] : settings.cushionCashboxIds.filter(x => x !== c.id) })} />
                {c.name} <span className="text-slate-400 font-mono text-xs">{money(c.currentBalance)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><PiggyBank className="w-5 h-5 text-teal-600" /><h3 className="font-extrabold">Planes de ahorro</h3></div>
            {canEdit && !newPlan && <button onClick={() => setNewPlan({ name: '', goal: 0, targetDate: addMonths(today.slice(0, 7), 6) + '-01' })} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Nuevo</button>}
          </div>
          {newPlan && (
            <form onSubmit={async e => { e.preventDefault(); if (!newPlan.name.trim() || !(newPlan.goal > 0)) return; await props.onSavePlan({ id: `sav-${Date.now()}`, name: newPlan.name.trim(), goal: round2(newPlan.goal), targetDate: newPlan.targetDate || undefined, contributions: [], createdAt: new Date().toISOString() }); setNewPlan(null); }} className="mb-4 p-3 rounded-xl bg-slate-50 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="block sm:col-span-3"><span className="text-xs font-bold text-slate-600">Para qué</span><input value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })} placeholder="Ej: Camioneta nueva, Aguinaldos" className={inputCls} /></label>
              <NumberField label="Meta" value={newPlan.goal} onChange={n => setNewPlan({ ...newPlan, goal: n })} />
              <label className="block"><span className="text-xs font-bold text-slate-600">Para cuándo</span><input type="date" value={newPlan.targetDate} onChange={e => setNewPlan({ ...newPlan, targetDate: e.target.value })} className={inputCls} /></label>
              <div className="flex items-end gap-1"><button className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Crear</button><button type="button" onClick={() => setNewPlan(null)} className="p-2 rounded-xl bg-white border border-slate-200"><X className="w-4 h-4" /></button></div>
            </form>
          )}
          {savingsPlans.length === 0 && !newPlan && <p className="text-sm text-slate-500">Armá planes para juntar plata con un objetivo: aguinaldos, un vehículo, mercadería de temporada.</p>}
          <div className="space-y-4">
            {savingsPlans.map(p => {
              const st = savingsStatus(p, today);
              return (
                <div key={p.id}>
                  <div className="flex justify-between items-start gap-2">
                    <div><div className="font-bold text-sm">{p.name}</div><div className="text-[11px] text-slate-500">{money(st.saved)} de {money(p.goal)}{p.targetDate ? ` · para el ${fmtDate(p.targetDate)}` : ''}</div></div>
                    {canEdit && <button onClick={() => window.confirm(`¿Eliminar el plan "${p.name}"?`) && props.onDeletePlan(p.id)} className="p-1 text-rose-500"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden my-1.5"><div className={`h-full ${st.pct >= 1 ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${st.pct * 100}%` }} /></div>
                  <div className="text-[11px] text-slate-500">{st.pct >= 1 ? 'Meta cumplida' : st.perMonth !== null ? `Hay que separar ${money(st.perMonth)} por mes durante ${st.monthsLeft} meses` : `Faltan ${money(st.missing)}`}</div>
                  {canEdit && st.pct < 1 && (
                    <div className="flex gap-2 mt-2">
                      <input value={contrib[p.id] || ''} onChange={e => setContrib({ ...contrib, [p.id]: e.target.value })} inputMode="decimal" placeholder="Aporte" className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-sm" />
                      <button onClick={async () => { const n = (parseArNumber(String(contrib[p.id] || '')) ?? NaN); if (!(n > 0)) return; await props.onSavePlan({ ...p, contributions: [...p.contributions, { date: today, amount: round2(n) }] }); setContrib({ ...contrib, [p.id]: '' }); }} className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold">Registrar aporte</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Los aportes son un seguimiento: no mueven plata entre cajas.</p>
        </div>

        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-teal-600" /><h3 className="font-extrabold">Recordatorios</h3></div>
            {canEdit && !newRem && <button onClick={() => setNewRem({ title: '', date: today, amount: 0, repeat: 'no' })} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Nuevo</button>}
          </div>
          {newRem && (
            <form onSubmit={async e => { e.preventDefault(); if (!newRem.title.trim()) return; await props.onSaveReminder({ id: `rem-${Date.now()}`, title: newRem.title.trim(), date: newRem.date, amount: newRem.amount > 0 ? round2(newRem.amount) : undefined, repeat: newRem.repeat, done: false, createdAt: new Date().toISOString() }); setNewRem(null); }} className="mb-4 p-3 rounded-xl bg-slate-50 grid grid-cols-2 gap-2">
              <label className="block col-span-2"><span className="text-xs font-bold text-slate-600">Qué</span><input value={newRem.title} onChange={e => setNewRem({ ...newRem, title: e.target.value })} placeholder="Ej: Renovar seguro, pagar aguinaldo" className={inputCls} /></label>
              <label className="block"><span className="text-xs font-bold text-slate-600">Fecha</span><input type="date" value={newRem.date} onChange={e => setNewRem({ ...newRem, date: e.target.value })} className={inputCls} /></label>
              <NumberField label="Importe (opcional)" value={newRem.amount} onChange={n => setNewRem({ ...newRem, amount: n })} />
              <label className="block"><span className="text-xs font-bold text-slate-600">Se repite</span><select value={newRem.repeat} onChange={e => setNewRem({ ...newRem, repeat: e.target.value as any })} className={inputCls}><option value="no">No</option><option value="mensual">Todos los meses</option><option value="anual">Todos los años</option></select></label>
              <div className="flex items-end gap-1"><button className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold">Guardar</button><button type="button" onClick={() => setNewRem(null)} className="p-2 rounded-xl bg-white border border-slate-200"><X className="w-4 h-4" /></button></div>
            </form>
          )}
          {pending.length === 0 && !newRem && <p className="text-sm text-slate-500">Sin recordatorios pendientes.</p>}
          <div className="divide-y divide-slate-100">
            {pending.map(r => (
              <div key={r.id} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{r.title}</div>
                  <div className={`text-[11px] ${r.date < today ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{fmtDate(r.date)}{r.date < today ? ' · vencido' : ''}{r.repeat !== 'no' ? ` · ${r.repeat}` : ''}{r.amount ? ` · ${money(r.amount)}` : ''}</div>
                </div>
                {canEdit && <button onClick={() => completeReminder(r)} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">Hecho</button>}
                {canEdit && <button onClick={() => props.onDeleteReminder(r.id)} className="p-1 text-rose-500"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">Los recordatorios con importe también aparecen en el Flujo de fondos.</p>
        </div>
      </div>
    </div>
  );
};

// ---------------- Costo real del empleado ----------------
export const EmployeeCostPanel: React.FC<Common> = ({ employees, settings, canEdit, onSaveSettings }) => {
  const [raise, setRaise] = useState(0);
  const [simSalary, setSimSalary] = useState(1000000);
  const active = employees.filter(e => e.active);
  const rows = active.map(e => ({ e, c: employeeCost(e.baseSalary, settings), r: employeeCost(e.baseSalary * (1 + raise / 100), settings) }));
  const total = rows.reduce((a, x) => a + x.c.total, 0);
  const totalRaise = rows.reduce((a, x) => a + x.r.total, 0);
  const sim = employeeCost(simSalary, settings);
  const set = (k: keyof FinanceSettings, n: number) => canEdit && onSaveSettings({ ...settings, [k]: n });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={`${card} xl:col-span-2 overflow-x-auto`}>
          <h3 className="font-extrabold mb-3">Lo que cuesta cada empleado por mes</h3>
          {active.length === 0 ? <p className="text-sm text-slate-500">Cargá los empleados con su sueldo en el módulo Sueldos & Personal.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200"><th className="py-2">Empleado</th><th className="text-right">Sueldo bruto</th><th className="text-right">Cargas y previsiones</th><th className="text-right">Costo total</th><th className="text-right">Por hora</th></tr></thead>
              <tbody>
                {rows.map(({ e, c }) => (
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="py-2"><div className="font-semibold">{e.fullName || `${e.firstName} ${e.lastName}`}</div><div className="text-[11px] text-slate-500">{e.position}</div></td>
                    <td className="text-right font-mono">{money(c.base)}</td>
                    <td className="text-right font-mono text-slate-500">+{money(c.total - c.base)}</td>
                    <td className="text-right font-mono font-black">{money(c.total)}</td>
                    <td className="text-right font-mono text-xs">{money(c.perHour)}</td>
                  </tr>
                ))}
                <tr className="font-black"><td className="py-2">Total</td><td className="text-right font-mono">{money(rows.reduce((a, x) => a + x.c.base, 0))}</td><td></td><td className="text-right font-mono">{money(total)}</td><td></td></tr>
              </tbody>
            </table>
          )}
          {active.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 flex flex-wrap items-end gap-3">
              <div className="w-40"><NumberField label="Simular aumento" suffix="%" value={raise} onChange={setRaise} /></div>
              <div className="text-sm">Con {pct(raise)} de aumento la nómina pasa a <b className="font-mono">{money(totalRaise)}</b> por mes (<b>+{money(totalRaise - total)}</b>), y <b>{money((totalRaise - total) * 13)}</b> más por año contando el aguinaldo.</div>
            </div>
          )}
        </div>
        <div className={card}>
          <h3 className="font-extrabold mb-3">Calculadora</h3>
          <NumberField label="Sueldo bruto" value={simSalary} onChange={setSimSalary} />
          <div className="mt-3 space-y-1.5 text-sm">
            {[['Sueldo bruto', sim.base], [`Contribuciones patronales (${pct(settings.employerContribPct)})`, sim.contrib], [`ART (${pct(settings.artPct)})`, sim.art], [`Otros: seguro, sindicato (${pct(settings.otherLaborPct)})`, sim.other], ['Aguinaldo prorrateado', sim.sac], [`Previsión vacaciones (${pct(settings.vacationPct)})`, sim.vacation]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-2"><span className="text-slate-600">{k}</span><span className="font-mono">{money(v as number)}</span></div>
            ))}
            <div className="flex justify-between font-black border-t border-slate-200 pt-2"><span>Costo total por mes</span><span className="font-mono">{money(sim.total)}</span></div>
            <div className="text-xs text-slate-500">{pct(sim.overheadPct)} más que el sueldo · {money(sim.perHour)} por hora</div>
          </div>
        </div>
      </div>
      <div className={card}>
        <h3 className="font-extrabold mb-1">Parámetros</h3>
        <p className="text-[11px] text-slate-500 mb-3">Valores de referencia: dependen del convenio, la ART contratada y el tamaño de la empresa. Ajustalos con tu contador.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <NumberField label="Contribuciones patronales" suffix="%" disabled={!canEdit} value={settings.employerContribPct} onChange={n => set('employerContribPct', n)} />
          <NumberField label="ART" suffix="%" disabled={!canEdit} value={settings.artPct} onChange={n => set('artPct', n)} />
          <NumberField label="Otros (seguro, sindicato)" suffix="%" disabled={!canEdit} value={settings.otherLaborPct} onChange={n => set('otherLaborPct', n)} />
          <NumberField label="Previsión vacaciones" suffix="%" disabled={!canEdit} value={settings.vacationPct} onChange={n => set('vacationPct', n)} />
          <NumberField label="Horas por mes" disabled={!canEdit} value={settings.hoursPerMonth} onChange={n => set('hoursPerMonth', Math.max(1, n))} />
        </div>
      </div>
    </div>
  );
};
