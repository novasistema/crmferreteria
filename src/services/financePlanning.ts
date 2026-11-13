// Motor de la Planificación Financiera: vencimientos de gastos fijos, cronograma de préstamos
// y flujo de fondos proyectado por semana. Funciones puras para poder probarlas.
import { FixedExpense, Loan, LoanInstallment, CheckItem, InternalInstallmentPlan } from '../types';

export const round2 = (n: number) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

export const todayIso = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

const toDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
};
const daysInMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();
// Suma meses respetando el día pedido (31 → último día del mes)
export const monthDate = (y: number, m0: number, day: number) => {
  const yy = y + Math.floor(m0 / 12);
  const mm = ((m0 % 12) + 12) % 12;
  return toIso(new Date(Date.UTC(yy, mm, Math.min(Math.max(1, day), daysInMonth(yy, mm)), 12)));
};

const MONTH_STEP: Record<string, number> = { mensual: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12 };

// Fechas de vencimiento de un gasto fijo entre from y to (inclusive)
export const expenseDueDates = (e: FixedExpense, from: string, to: string): string[] => {
  const out: string[] = [];
  const start = e.startDate || from;
  const end = e.endDate && e.endDate < to ? e.endDate : to;
  if (end < start) return out;
  if (e.frequency === 'semanal') {
    // dueDay 1 = lunes ... 7 = domingo
    const target = ((Math.min(Math.max(1, e.dueDay || 1), 7)) % 7); // JS: 0 domingo
    let d = toDate(start);
    while (d.getUTCDay() !== target) d.setUTCDate(d.getUTCDate() + 1);
    while (toIso(d) <= end) {
      if (toIso(d) >= from) out.push(toIso(d));
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return out;
  }
  const step = MONTH_STEP[e.frequency] || 1;
  const s = toDate(start);
  let y = s.getUTCFullYear();
  let m = s.getUTCMonth();
  if (monthDate(y, m, e.dueDay) < start) m += step;
  for (let i = 0; i < 600; i++) {
    const d = monthDate(y, m, e.dueDay);
    if (d > end) break;
    if (d >= from) out.push(d);
    m += step;
  }
  return out;
};

export const isExpensePaid = (e: FixedExpense, dueDate: string) => (e.payments || []).some(p => p.dueDate === dueDate);

export interface DueItem {
  key: string;
  date: string;
  amount: number;
  label: string;
  kind: 'gasto_fijo' | 'cuota_prestamo' | 'cheque' | 'cuota_cliente' | 'impuesto';
  direction: 'in' | 'out';
  overdue: boolean;
  refId: string;
  dueDate?: string;
  installmentNumber?: number;
}

// Vencimientos impagos: los atrasados desde el inicio y los futuros hasta "to"
export const pendingExpenseDues = (e: FixedExpense, to: string, today = todayIso()): DueItem[] => {
  if (!e.active) return [];
  const from = e.startDate || addDays(today, -365);
  return expenseDueDates(e, from, to)
    .filter(d => !isExpensePaid(e, d))
    .map(d => ({
      key: `fx-${e.id}-${d}`,
      date: d,
      amount: e.amount,
      label: e.name,
      kind: 'gasto_fijo' as const,
      direction: 'out' as const,
      overdue: d < today,
      refId: e.id,
      dueDate: d
    }));
};

// ---------- Préstamos ----------
export interface LoanPlanInput {
  principal: number;
  annualRate: number; // TNA %
  count: number;
  firstDueDate: string;
  system: 'frances' | 'cuota_fija';
  fixedAmount?: number; // para cuota fija: importe de cada cuota
  monthsBetween?: number;
}

export const buildLoanSchedule = (p: LoanPlanInput): LoanInstallment[] => {
  const n = Math.max(1, Math.round(p.count));
  const principal = round2(p.principal);
  const first = toDate(p.firstDueDate);
  const day = first.getUTCDate();
  const step = p.monthsBetween || 1;
  const dates = Array.from({ length: n }, (_, k) => monthDate(first.getUTCFullYear(), first.getUTCMonth() + k * step, day));
  const out: LoanInstallment[] = [];
  if (p.system === 'cuota_fija') {
    const amount = round2(p.fixedAmount || principal / n);
    const capitalEach = round2(principal / n);
    let capLeft = principal;
    dates.forEach((d, k) => {
      const capital = k === n - 1 ? round2(capLeft) : capitalEach;
      capLeft = round2(capLeft - capital);
      out.push({ number: k + 1, dueDate: d, amount, capital, interest: round2(Math.max(0, amount - capital)), paid: false });
    });
    return out;
  }
  // Sistema francés: cuota constante
  const i = (Number(p.annualRate) || 0) / 100 / 12 * step;
  const cuota = i > 0 ? (principal * i) / (1 - Math.pow(1 + i, -n)) : principal / n;
  let balance = principal;
  dates.forEach((d, k) => {
    const interest = round2(balance * i);
    let capital = round2(cuota - interest);
    if (k === n - 1) capital = round2(balance); // la última cuota cierra el saldo
    balance = round2(balance - capital);
    out.push({ number: k + 1, dueDate: d, amount: round2(capital + interest), capital, interest, paid: false });
  });
  return out;
};

export const loanSummary = (l: Loan) => {
  const pending = l.installments.filter(i => !i.paid);
  const paid = l.installments.filter(i => i.paid);
  return {
    pendingCount: pending.length,
    paidCount: paid.length,
    pendingAmount: round2(pending.reduce((a, i) => a + i.amount, 0)),
    pendingCapital: round2(pending.reduce((a, i) => a + i.capital, 0)),
    totalInterest: round2(l.installments.reduce((a, i) => a + i.interest, 0)),
    next: pending.sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
  };
};

export const pendingLoanDues = (l: Loan, to: string, today = todayIso()): DueItem[] =>
  l.status === 'cancelado' || l.currency !== 'ARS'
    ? []
    : l.installments
        .filter(i => !i.paid && i.dueDate <= to)
        .map(i => ({
          key: `ln-${l.id}-${i.number}`,
          date: i.dueDate,
          amount: i.amount,
          label: `${l.lender} · cuota ${i.number}/${l.installments.length}`,
          kind: 'cuota_prestamo' as const,
          direction: 'out' as const,
          overdue: i.dueDate < today,
          refId: l.id,
          installmentNumber: i.number
        }));

// ---------- Flujo de fondos proyectado ----------
export interface CashFlowInputs {
  startBalance: number;
  today?: string;
  weeks: number;
  fixedExpenses: FixedExpense[];
  loans: Loan[];
  checks: CheckItem[];
  installmentPlans: InternalInstallmentPlan[];
  taxes: { date: string; amount: number; label: string }[];
}

export interface CashFlowWeek {
  start: string;
  end: string;
  inflows: DueItem[];
  outflows: DueItem[];
  totalIn: number;
  totalOut: number;
  net: number;
  balance: number; // saldo proyectado al cierre de la semana
}

export const projectCashFlow = (inp: CashFlowInputs) => {
  const today = inp.today || todayIso();
  const to = addDays(today, inp.weeks * 7 - 1);
  const items: DueItem[] = [
    ...inp.fixedExpenses.flatMap(e => pendingExpenseDues(e, to, today)),
    ...inp.loans.flatMap(l => pendingLoanDues(l, to, today)),
    // Cheques de terceros en cartera: entran cuando se pueden cobrar
    ...inp.checks
      .filter(c => c.status === 'en_cartera' && c.receivedFromType !== 'propio' && c.dueDate <= to)
      .map(c => ({
        key: `ch-${c.id}`,
        date: c.dueDate,
        amount: c.amount,
        label: `Cheque ${c.checkNumber} · ${c.customerName || c.issuerName}`,
        kind: 'cheque' as const,
        direction: 'in' as const,
        overdue: c.dueDate < today,
        refId: c.id
      })),
    // Cheques propios emitidos: salen en la fecha de pago
    ...inp.checks
      .filter(c => c.receivedFromType === 'propio' && ['en_cartera', 'entregado_proveedor'].includes(c.status) && c.dueDate <= to)
      .map(c => ({
        key: `chp-${c.id}`,
        date: c.dueDate,
        amount: c.amount,
        label: `Cheque propio ${c.checkNumber}${c.deliveredToSupplierName ? ` · ${c.deliveredToSupplierName}` : ''}`,
        kind: 'cheque' as const,
        direction: 'out' as const,
        overdue: c.dueDate < today,
        refId: c.id
      })),
    ...inp.installmentPlans
      .filter(p => p.status !== 'cancelado' && p.status !== 'finalizado')
      .flatMap(p =>
        (p.fees || [])
          .filter(f => f.status !== 'pagada' && f.dueDate <= to)
          .map(f => ({
            key: `cc-${p.id}-${f.feeNumber}`,
            date: f.dueDate,
            amount: round2(f.amount - (f.paidAmount || 0)),
            label: `${p.customerName} · cuota ${f.feeNumber}/${p.installmentsCount}`,
            kind: 'cuota_cliente' as const,
            direction: 'in' as const,
            overdue: f.dueDate < today,
            refId: p.id
          }))
      ),
    ...inp.taxes
      .filter(t => t.amount > 0 && t.date <= to)
      .map((t, k) => ({ key: `tx-${k}-${t.date}`, date: t.date, amount: t.amount, label: t.label, kind: 'impuesto' as const, direction: 'out' as const, overdue: t.date < today, refId: t.label }))
  ];

  const weeks: CashFlowWeek[] = [];
  let balance = round2(inp.startBalance);
  for (let w = 0; w < inp.weeks; w++) {
    const start = addDays(today, w * 7);
    const end = addDays(start, 6);
    // Lo vencido e impago se carga en la primera semana
    const inWeek = (d: DueItem) => (w === 0 ? d.date <= end : d.date >= start && d.date <= end);
    const inflows = items.filter(i => i.direction === 'in' && inWeek(i)).sort((a, b) => a.date.localeCompare(b.date));
    const outflows = items.filter(i => i.direction === 'out' && inWeek(i)).sort((a, b) => a.date.localeCompare(b.date));
    const totalIn = round2(inflows.reduce((a, i) => a + i.amount, 0));
    const totalOut = round2(outflows.reduce((a, i) => a + i.amount, 0));
    balance = round2(balance + totalIn - totalOut);
    weeks.push({ start, end, inflows, outflows, totalIn, totalOut, net: round2(totalIn - totalOut), balance });
  }
  return {
    weeks,
    overdue: items.filter(i => i.overdue),
    minBalance: weeks.reduce((m, w) => Math.min(m, w.balance), round2(inp.startBalance)),
    firstNegative: weeks.find(w => w.balance < 0)
  };
};
