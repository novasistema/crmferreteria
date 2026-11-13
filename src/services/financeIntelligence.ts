// Inteligencia financiera: ventas y margen por mes, punto de equilibrio, proyección,
// colchón y costo real del empleado. Funciones puras para probarlas.
import { SalesOrder, Product, Employee, FixedExpense, Loan, FinanceSettings, SavingsPlan } from '../types';

export const round2 = (n: number) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;
const localMonth = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 7);
export const addMonths = (p: string, d: number) => {
  const [y, m] = p.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1 + d, 1));
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
};
export const daysInMonth = (p: string) => {
  const [y, m] = p.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export const DEFAULT_FINANCE: FinanceSettings = {
  cushionMonths: 3,
  cushionCashboxIds: [],
  employerContribPct: 24,
  artPct: 3,
  otherLaborPct: 1.5,
  vacationPct: 4,
  hoursPerMonth: 200,
  workingDaysPerMonth: 26,
  extraFixedCosts: 0,
  includeEmployeesInFixed: true,
  includeLoansInFixed: true,
  defaultMarginPct: 30
};
export const withFinanceDefaults = (s?: Partial<FinanceSettings>): FinanceSettings => ({ ...DEFAULT_FINANCE, ...(s || {}) });

export interface MonthStat {
  month: string;
  netSales: number; // sin IVA
  count: number;
  avgTicket: number;
  cogs: number; // costo de lo vendido (con costo cargado)
  costCoverage: number; // % de las ventas que tienen costo cargado
  grossMargin: number; // %
}

const unitCostOf = (p?: Product) => (p ? p.unitCost || p.costListWithoutIva || 0 : 0);

export const monthlyStats = (orders: SalesOrder[], products: Product[], untilMonth: string, months = 12): MonthStat[] => {
  const byId = new Map(products.map(p => [p.id, p]));
  const list = Array.from({ length: months }, (_, i) => addMonths(untilMonth, i - months + 1));
  const valid = orders.filter(o => o.status !== 'cancelado');
  return list.map(month => {
    const os = valid.filter(o => localMonth(o.date) === month);
    const netSales = round2(os.reduce((a, o) => a + (o.total - (o.taxAmount || 0)), 0));
    let costed = 0;
    let cogs = 0;
    os.forEach(o => {
      // proporción del neto de cada ítem (los descuentos globales se reparten)
      const itemsSum = o.items.reduce((a, it) => a + (it.subtotal || 0), 0) || 1;
      const orderNet = o.total - (o.taxAmount || 0);
      o.items.forEach(it => {
        const c = unitCostOf(byId.get(it.productId));
        if (c > 0) {
          cogs += c * it.quantity;
          costed += ((it.subtotal || 0) / itemsSum) * orderNet;
        }
      });
    });
    const coverage = netSales > 0 ? costed / netSales : 0;
    const margin = costed > 0 ? ((costed - cogs) / costed) * 100 : 0;
    return { month, netSales, count: os.length, avgTicket: os.length ? round2(netSales / os.length) : 0, cogs: round2(cogs), costCoverage: coverage, grossMargin: round2(margin) };
  });
};

// Margen promedio ponderado de los últimos meses con datos suficientes
export const averageMargin = (stats: MonthStat[], fallback: number) => {
  const usable = stats.filter(s => s.netSales > 0 && s.costCoverage >= 0.5).slice(-3);
  const sales = usable.reduce((a, s) => a + s.netSales * s.costCoverage, 0);
  if (sales <= 0) return { pct: fallback, estimated: true };
  const margin = usable.reduce((a, s) => a + s.netSales * s.costCoverage * s.grossMargin, 0) / sales;
  return { pct: round2(margin), estimated: false };
};

// ---------- Costo del empleado ----------
export const employeeCost = (salary: number, s: FinanceSettings) => {
  const base = Number(salary) || 0;
  const contrib = (base * s.employerContribPct) / 100;
  const art = (base * s.artPct) / 100;
  const other = (base * s.otherLaborPct) / 100;
  const sac = (base + contrib + art + other) / 12; // aguinaldo y sus cargas, prorrateado
  const vacation = (base * s.vacationPct) / 100;
  const total = base + contrib + art + other + sac + vacation;
  return {
    base: round2(base), contrib: round2(contrib), art: round2(art), other: round2(other), sac: round2(sac), vacation: round2(vacation),
    total: round2(total),
    perHour: s.hoursPerMonth > 0 ? round2(total / s.hoursPerMonth) : 0,
    overheadPct: base > 0 ? round2(((total - base) / base) * 100) : 0
  };
};

export const MONTHLY_FACTOR: Record<string, number> = { semanal: 52 / 12, mensual: 1, bimestral: 1 / 2, trimestral: 1 / 3, semestral: 1 / 6, anual: 1 / 12 };

// ---------- Costos fijos del mes ----------
export const monthlyFixedCosts = (s: FinanceSettings, fixedExpenses: FixedExpense[], employees: Employee[], loans: Loan[], fromDate: string) => {
  const expenses = round2(fixedExpenses.filter(e => e.active).reduce((a, e) => a + e.amount * (MONTHLY_FACTOR[e.frequency] || 1), 0));
  const staff = s.includeEmployeesInFixed ? round2(employees.filter(e => e.active).reduce((a, e) => a + employeeCost(e.baseSalary, s).total, 0)) : 0;
  const to = new Date(new Date(`${fromDate}T12:00:00Z`).getTime() + 365 * 864e5).toISOString().slice(0, 10);
  const loanYear = loans
    .filter(l => l.status === 'vigente' && l.currency === 'ARS')
    .reduce((a, l) => a + l.installments.filter(i => !i.paid && i.dueDate >= fromDate && i.dueDate <= to).reduce((b, i) => b + i.amount, 0), 0);
  const loansMonthly = s.includeLoansInFixed ? round2(loanYear / 12) : 0;
  const extra = round2(s.extraFixedCosts || 0);
  return { expenses, staff, loans: loansMonthly, extra, total: round2(expenses + staff + loansMonthly + extra) };
};

// ---------- Punto de equilibrio ----------
export const breakEven = (fixedTotal: number, marginPct: number, salesSoFar: number, month: string, today: string, workingDays: number) => {
  const m = marginPct / 100;
  const be = m > 0 ? round2(fixedTotal / m) : Infinity;
  const dim = daysInMonth(month);
  const dayOfMonth = month === today.slice(0, 7) ? Number(today.slice(8, 10)) : dim;
  const pacePerDay = dayOfMonth > 0 ? salesSoFar / dayOfMonth : 0;
  const reachDay = pacePerDay > 0 && isFinite(be) ? Math.ceil(be / pacePerDay) : null;
  return {
    breakEvenSales: be,
    perWorkingDay: isFinite(be) && workingDays > 0 ? round2(be / workingDays) : Infinity,
    progress: isFinite(be) && be > 0 ? salesSoFar / be : 0,
    projectedMonth: round2(pacePerDay * dim),
    reachDay: reachDay !== null && reachDay <= dim ? reachDay : null, // día del mes en que se cubre
    reachedAlready: isFinite(be) && salesSoFar >= be,
    profitAtPace: round2(pacePerDay * dim * m - fixedTotal)
  };
};

// ---------- Proyección ----------
export const averageGrowth = (stats: MonthStat[]) => {
  const closed = stats.slice(0, -1).filter(s => s.netSales > 0).slice(-4); // sin el mes en curso
  if (closed.length < 2) return 0;
  const first = closed[0].netSales;
  const last = closed[closed.length - 1].netSales;
  return round2((Math.pow(last / first, 1 / (closed.length - 1)) - 1) * 100);
};

export const projectSales = (stats: MonthStat[], growthPct: number, monthsAhead: number) => {
  const closed = stats.slice(0, -1).filter(s => s.netSales > 0).slice(-3);
  const base = closed.length ? closed.reduce((a, s) => a + s.netSales, 0) / closed.length : 0;
  const lastMonth = stats[stats.length - 1]?.month || '';
  return Array.from({ length: monthsAhead }, (_, i) => ({ month: addMonths(lastMonth, i + 1), sales: round2(base * Math.pow(1 + growthPct / 100, i + 1)) }));
};

// ---------- Ahorros ----------
export const savingsStatus = (p: SavingsPlan, today: string) => {
  const saved = round2(p.contributions.reduce((a, c) => a + c.amount, 0));
  const missing = round2(Math.max(0, p.goal - saved));
  let monthsLeft: number | null = null;
  if (p.targetDate) {
    const [ty, tm] = p.targetDate.split('-').map(Number);
    const [cy, cm] = today.split('-').map(Number);
    monthsLeft = Math.max(1, (ty - cy) * 12 + (tm - cm));
  }
  return { saved, missing, pct: p.goal > 0 ? Math.min(1, saved / p.goal) : 0, perMonth: monthsLeft ? round2(missing / monthsLeft) : null, monthsLeft };
};
