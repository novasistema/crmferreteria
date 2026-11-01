// Motor de cálculo del Contador Interno: IVA mensual e Ingresos Brutos.
// Funciones puras (sin Firebase) para poder probarlas y reutilizarlas.
import {
  ArcaElectronicVoucher,
  PurchaseInvoice,
  SalesOrder,
  TaxSettings,
  TaxPeriod,
  TaxAdjustmentKind
} from '../types';

export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  ivaCondition: 'responsable_inscripto',
  iibbRegime: 'local',
  iibbNumber: '',
  iibbJurisdiction: 'Córdoba',
  iibbCoefficient: 1,
  iibbActivities: [{ id: 'act-1', name: 'Comercio minorista', code: '', rate: 4.75, share: 100 }],
  iibbMonthlyMinimum: 0,
  iibbIncludeNonInvoicedSales: false,
  ivaDueDay: 18,
  iibbDueDay: 16,
  startPeriod: `${new Date().getFullYear()}-01`,
  initialIvaTechnicalBalance: 0,
  initialIvaFreeBalance: 0,
  initialIibbBalance: 0,
  monotributoCategory: '',
  monotributoMonthlyFee: 0,
  monotributoAnnualLimit: 0,
  defaultPaymentEntity: 'Red Link'
};

export const withTaxDefaults = (s?: Partial<TaxSettings>): TaxSettings => ({
  ...DEFAULT_TAX_SETTINGS,
  ...(s || {}),
  iibbActivities: s?.iibbActivities?.length ? s.iibbActivities : DEFAULT_TAX_SETTINGS.iibbActivities
});

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const periodOf = (date?: string) => (date || '').slice(0, 7); // YYYY-MM

export const addMonths = (period: string, delta: number) => {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const periodsBetween = (from: string, to: string) => {
  const out: string[] = [];
  if (!from || !to || from > to) return out;
  let p = from;
  while (p <= to && out.length < 240) {
    out.push(p);
    p = addMonths(p, 1);
  }
  return out;
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const periodLabel = (p: string) => {
  const [y, m] = p.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
};

// Vencimiento: el día configurado del mes siguiente al período
export const dueDateFor = (period: string, day: number) => {
  const next = addMonths(period, 1);
  const [y, m] = next.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${next}-${String(Math.min(Math.max(1, day || 1), last)).padStart(2, '0')}`;
};

// ---------- Libro IVA Ventas ----------
export interface SalesBookRow {
  id: string;
  date: string;
  type: string;
  number: string;
  customer: string;
  taxId: string;
  net: number;
  iva21: number;
  iva105: number;
  exempt: number;
  total: number;
  sign: 1 | -1;
}

const isCreditNote = (t: string) => /NOTA_CREDITO|nota de cr/i.test(t);

export const buildSalesBook = (vouchers: ArcaElectronicVoucher[], period: string): SalesBookRow[] =>
  vouchers
    .filter(v => v.status === 'autorizado' && periodOf(v.date) === period && /FACTURA|NOTA_CREDITO/.test(v.voucherType))
    .map(v => {
      const sign: 1 | -1 = isCreditNote(v.voucherType) ? -1 : 1;
      const isC = /_C$/.test(v.voucherType);
      const iva21 = isC ? 0 : v.iva21 || 0;
      const iva105 = isC ? 0 : v.iva105 || 0;
      const net = isC ? 0 : v.netAmount || 0;
      const exempt = isC ? v.total || 0 : Math.max(0, round2((v.total || 0) - net - iva21 - iva105));
      return {
        id: v.id,
        date: v.date,
        type: v.voucherType.replace('_', ' '),
        number: v.voucherNumber,
        customer: v.customerName,
        taxId: v.customerTaxId || '',
        net,
        iva21,
        iva105,
        exempt,
        total: v.total || 0,
        sign
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));

// ---------- Libro IVA Compras ----------
export interface PurchaseBookRow {
  id: string;
  date: string;
  type: string;
  number: string;
  supplier: string;
  supplierTaxId: string;
  net: number;
  iva: number;
  ivaByRate: Record<string, number>;
  ivaPerception: number;
  iibbPerception: number;
  otherTaxes: number;
  total: number;
  computesCredit: boolean;
  sign: 1 | -1;
}

export const buildPurchaseBook = (
  invoices: PurchaseInvoice[],
  period: string,
  supplierTaxIds: Record<string, string> = {}
): PurchaseBookRow[] =>
  invoices
    .filter(inv => periodOf(inv.date) === period && inv.invoiceType !== 'Remito R' && inv.invoiceType !== 'Factura X')
    .map(inv => {
      const factor = (1 - (inv.globalDiscountPercent || 0) / 100) * (1 - (inv.extraDiscountPercent || 0) / 100);
      const ivaByRate: Record<string, number> = {};
      let net = 0;
      let iva = 0;
      (inv.items || []).forEach(it => {
        const n = (it.subtotal || 0) * factor;
        const rate = Number(it.ivaRate ?? 21);
        const i = n * (rate / 100);
        net += n;
        iva += i;
        ivaByRate[String(rate)] = (ivaByRate[String(rate)] || 0) + i;
      });
      // Solo dan crédito fiscal las facturas A y M (y sus notas, que se cargan como A)
      const computesCredit = inv.invoiceType === 'Factura A' || inv.invoiceType === 'Factura M' || inv.invoiceType === 'Nota de Débito' || inv.invoiceType === 'Nota de Crédito';
      const sign: 1 | -1 = inv.invoiceType === 'Nota de Crédito' ? -1 : 1;
      Object.keys(ivaByRate).forEach(k => (ivaByRate[k] = round2(ivaByRate[k])));
      return {
        id: inv.id,
        date: inv.date,
        type: inv.invoiceType,
        number: inv.fullNumber,
        supplier: inv.supplierName,
        supplierTaxId: supplierTaxIds[inv.supplierId] || '',
        net: round2(net),
        iva: computesCredit ? round2(iva) : 0,
        ivaByRate: computesCredit ? ivaByRate : {},
        ivaPerception: inv.ivaPerception || 0,
        iibbPerception: inv.iibbPerception || 0,
        otherTaxes: (inv.otherTaxes || 0) + (inv.internalTax || 0),
        total: computesCredit ? round2(net + iva + (inv.ivaPerception || 0) + (inv.iibbPerception || 0) + (inv.otherTaxes || 0) + (inv.internalTax || 0)) : inv.total || 0,
        computesCredit,
        sign
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

const sumAdj = (period: TaxPeriod | undefined, kinds: TaxAdjustmentKind[]) =>
  round2((period?.adjustments || []).filter(a => kinds.includes(a.kind)).reduce((acc, a) => acc + (Number(a.amount) || 0), 0));

// ---------- Liquidación mensual ----------
export interface IvaResult {
  applies: boolean;
  debit: number;
  credit: number;
  otherDebits: number;
  otherCredits: number;
  previousTechnical: number;
  technicalBalance: number; // >0 impuesto determinado, <0 saldo técnico a favor
  determined: number;
  nextTechnical: number;
  purchasePerceptions: number;
  manualPerceptions: number;
  withholdings: number;
  previousFree: number;
  paymentsOnAccount: number;
  toPay: number;
  nextFree: number;
}

export interface IibbResult {
  applies: boolean;
  regime: TaxSettings['iibbRegime'];
  invoicedBase: number;
  nonInvoicedBase: number;
  base: number;
  attributedBase: number; // base × coeficiente
  byActivity: { name: string; code?: string; rate: number; base: number; tax: number }[];
  computedTax: number;
  minimum: number;
  tax: number;
  withholdings: number;
  perceptions: number;
  bankCollections: number; // SIRCREB + SIRTAC
  previousBalance: number;
  deductions: number;
  toPay: number;
  nextBalance: number;
}

export interface MonthlyTaxResult {
  period: string;
  sales: SalesBookRow[];
  purchases: PurchaseBookRow[];
  salesTotal: number;
  iva: IvaResult;
  iibb: IibbResult;
  ivaDue: string;
  iibbDue: string;
}

export interface TaxInputs {
  settings: TaxSettings;
  vouchers: ArcaElectronicVoucher[];
  purchaseInvoices: PurchaseInvoice[];
  salesOrders: SalesOrder[];
  periods: Record<string, TaxPeriod>;
  supplierTaxIds?: Record<string, string>;
}

const computeMonth = (
  inputs: TaxInputs,
  period: string,
  carry: { ivaTechnical: number; ivaFree: number; iibb: number }
): MonthlyTaxResult => {
  const { settings } = inputs;
  const p = inputs.periods[period];
  const sales = buildSalesBook(inputs.vouchers, period);
  const purchases = buildPurchaseBook(inputs.purchaseInvoices, period, inputs.supplierTaxIds);

  // --- IVA ---
  const ivaApplies = settings.ivaCondition === 'responsable_inscripto';
  const debit = round2(sales.reduce((a, r) => a + r.sign * (r.iva21 + r.iva105), 0));
  const credit = round2(purchases.reduce((a, r) => a + r.sign * r.iva, 0));
  const otherDebits = sumAdj(p, ['otro_debito_iva']);
  const otherCredits = sumAdj(p, ['otro_credito_iva']);
  const previousTechnical = ivaApplies ? carry.ivaTechnical : 0;
  const technicalBalance = round2(debit + otherDebits - credit - otherCredits - previousTechnical);
  const determined = ivaApplies ? Math.max(0, technicalBalance) : 0;
  const nextTechnical = ivaApplies ? Math.max(0, round2(-technicalBalance)) : 0;
  const purchasePerceptions = round2(purchases.reduce((a, r) => a + r.sign * r.ivaPerception, 0));
  const manualPerceptions = sumAdj(p, ['percepcion_iva']);
  const withholdings = sumAdj(p, ['retencion_iva']);
  const previousFree = ivaApplies ? carry.ivaFree : 0;
  const paymentsOnAccount = round2(purchasePerceptions + manualPerceptions + withholdings + previousFree);
  const toPay = ivaApplies ? Math.max(0, round2(determined - paymentsOnAccount)) : 0;
  const nextFree = ivaApplies ? Math.max(0, round2(paymentsOnAccount - determined)) : 0;

  // --- Ingresos Brutos ---
  const iibbApplies = settings.iibbRegime === 'local' || settings.iibbRegime === 'convenio_multilateral';
  // Base imponible: ventas sin IVA (neto + exento/no gravado; factura C por su total)
  const invoicedBase = round2(sales.reduce((a, r) => a + r.sign * (r.net + r.exempt), 0));
  const nonInvoicedBase = settings.iibbIncludeNonInvoicedSales
    ? round2(
        inputs.salesOrders
          .filter(o => o.billingType !== 'arca' && o.status !== 'cancelado' && periodOf(o.date) === period)
          .reduce((a, o) => a + (o.total || 0), 0)
      )
    : 0;
  const base = round2(invoicedBase + nonInvoicedBase);
  const coefficient = settings.iibbRegime === 'convenio_multilateral' ? Number(settings.iibbCoefficient) || 0 : 1;
  const attributedBase = round2(base * coefficient);
  const totalShare = settings.iibbActivities.reduce((a, x) => a + (Number(x.share) || 0), 0) || 100;
  const byActivity = settings.iibbActivities.map(a => {
    const actBase = round2((attributedBase * (Number(a.share) || 0)) / totalShare);
    return { name: a.name, code: a.code, rate: Number(a.rate) || 0, base: actBase, tax: round2((actBase * (Number(a.rate) || 0)) / 100) };
  });
  const computedTax = round2(byActivity.reduce((a, x) => a + x.tax, 0));
  const minimum = iibbApplies ? Number(settings.iibbMonthlyMinimum) || 0 : 0;
  const tax = iibbApplies ? Math.max(computedTax, minimum) : 0;
  const iibbWithholdings = sumAdj(p, ['retencion_iibb']);
  const iibbPerceptions = round2(purchases.reduce((a, r) => a + r.sign * r.iibbPerception, 0) + sumAdj(p, ['percepcion_iibb']));
  const bankCollections = sumAdj(p, ['sircreb', 'sirtac']);
  const previousBalance = iibbApplies ? carry.iibb : 0;
  const deductions = round2(iibbWithholdings + iibbPerceptions + bankCollections + previousBalance);
  const iibbToPay = iibbApplies ? Math.max(0, round2(tax - deductions)) : 0;
  const nextBalance = iibbApplies ? Math.max(0, round2(deductions - tax)) : 0;

  return {
    period,
    sales,
    purchases,
    salesTotal: round2(sales.reduce((a, r) => a + r.sign * r.total, 0)),
    iva: {
      applies: ivaApplies,
      debit,
      credit,
      otherDebits,
      otherCredits,
      previousTechnical,
      technicalBalance,
      determined,
      nextTechnical,
      purchasePerceptions,
      manualPerceptions,
      withholdings,
      previousFree,
      paymentsOnAccount,
      toPay,
      nextFree
    },
    iibb: {
      applies: iibbApplies,
      regime: settings.iibbRegime,
      invoicedBase,
      nonInvoicedBase,
      base,
      attributedBase,
      byActivity,
      computedTax,
      minimum,
      tax,
      withholdings: iibbWithholdings,
      perceptions: iibbPerceptions,
      bankCollections,
      previousBalance,
      deductions,
      toPay: iibbToPay,
      nextBalance
    },
    ivaDue: dueDateFor(period, settings.ivaDueDay),
    iibbDue: dueDateFor(period, settings.iibbDueDay)
  };
};

// Calcula todos los meses desde el período inicial, arrastrando los saldos a favor
export const computeTaxHistory = (inputs: TaxInputs, untilPeriod: string): MonthlyTaxResult[] => {
  const { settings } = inputs;
  const start = settings.startPeriod && settings.startPeriod <= untilPeriod ? settings.startPeriod : untilPeriod;
  let carry = {
    ivaTechnical: Number(settings.initialIvaTechnicalBalance) || 0,
    ivaFree: Number(settings.initialIvaFreeBalance) || 0,
    iibb: Number(settings.initialIibbBalance) || 0
  };
  return periodsBetween(start, untilPeriod).map(period => {
    const r = computeMonth(inputs, period, carry);
    carry = { ivaTechnical: r.iva.nextTechnical, ivaFree: r.iva.nextFree, iibb: r.iibb.nextBalance };
    return r;
  });
};

// Facturación de los últimos 12 meses (para controlar la categoría de monotributo)
export const last12MonthsSales = (vouchers: ArcaElectronicVoucher[], period: string) => {
  const from = addMonths(period, -11);
  return round2(
    vouchers
      .filter(v => v.status === 'autorizado' && periodOf(v.date) >= from && periodOf(v.date) <= period)
      .reduce((a, v) => a + (isCreditNote(v.voucherType) ? -1 : 1) * (v.total || 0), 0)
  );
};

export const ADJUSTMENT_LABELS: Record<TaxAdjustmentKind, { label: string; tax: 'IVA' | 'IIBB'; hint: string }> = {
  retencion_iva: { label: 'Retención de IVA sufrida', tax: 'IVA', hint: 'Certificados de retención que te hicieron tus clientes.' },
  percepcion_iva: { label: 'Percepción de IVA (otra)', tax: 'IVA', hint: 'Percepciones no cargadas en facturas de compra (ej. aduana).' },
  otro_credito_iva: { label: 'Otro crédito fiscal IVA', tax: 'IVA', hint: 'Crédito fiscal de comprobantes que no están en el sistema (servicios, alquileres).' },
  otro_debito_iva: { label: 'Otro débito fiscal IVA', tax: 'IVA', hint: 'Débito fiscal de ventas facturadas fuera del sistema.' },
  retencion_iibb: { label: 'Retención de IIBB sufrida', tax: 'IIBB', hint: 'Certificados de retención de Ingresos Brutos.' },
  percepcion_iibb: { label: 'Percepción de IIBB (otra)', tax: 'IIBB', hint: 'Percepciones no cargadas en facturas de compra.' },
  sircreb: { label: 'SIRCREB (bancos)', tax: 'IIBB', hint: 'Recaudación sobre acreditaciones bancarias. Sale del resumen del banco.' },
  sirtac: { label: 'SIRTAC (tarjetas / billeteras)', tax: 'IIBB', hint: 'Recaudación sobre liquidaciones de tarjetas y pagos digitales.' }
};
