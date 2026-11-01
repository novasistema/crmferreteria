import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Calculator,
  Receipt,
  Landmark,
  CalendarClock,
  Settings2,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  X,
  Info
} from 'lucide-react';
import {
  ArcaElectronicVoucher,
  PurchaseInvoice,
  SalesOrder,
  Supplier,
  CompanyConfig,
  TaxSettings,
  TaxPeriod,
  TaxAdjustment,
  TaxAdjustmentKind,
  TaxPaymentRecord,
  FinancialTransaction,
  UserRole
} from '../types';
import {
  computeTaxHistory,
  withTaxDefaults,
  periodLabel,
  addMonths,
  last12MonthsSales,
  ADJUSTMENT_LABELS,
  MonthlyTaxResult,
  round2
} from '../services/taxEngine';

interface TaxAccountantModuleProps {
  config: CompanyConfig | null;
  vouchers: ArcaElectronicVoucher[];
  purchaseInvoices: PurchaseInvoice[];
  salesOrders: SalesOrder[];
  suppliers: Supplier[];
  periods: TaxPeriod[];
  currentUserRole?: UserRole;
  onSaveSettings: (settings: TaxSettings) => Promise<void>;
  onSavePeriod: (period: TaxPeriod) => Promise<void>;
  onRegisterPayment: (tx: FinancialTransaction) => Promise<void>;
}

type Tab = 'resumen' | 'iva' | 'iibb' | 'ajustes' | 'config';
type TaxKey = 'iva' | 'iibb';

const money = (n: number) => `$ ${(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso?: string) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR') : '—');
const todayIso = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const currentPeriod = () => todayIso().slice(0, 7);
const daysUntil = (iso: string) => Math.round((new Date(`${iso}T12:00:00`).getTime() - new Date(`${todayIso()}T12:00:00`).getTime()) / 86400000);

const STATUS_META: Record<TaxPaymentRecord['status'], { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800' },
  ddjj_presentada: { label: 'DDJJ presentada', cls: 'bg-sky-100 text-sky-800' },
  vep_generado: { label: 'VEP generado', cls: 'bg-indigo-100 text-indigo-800' },
  pagado: { label: 'Pagado', cls: 'bg-emerald-100 text-emerald-800' }
};

const PAYMENT_ENTITIES = ['Red Link', 'Banelco / Pago Mis Cuentas', 'Interbanking', 'Banca electrónica del banco', 'Otra'];

const ARCA_LOGIN = 'https://auth.afip.gob.ar/contribuyente_/login.xhtml';
const RENTAS_CBA = 'https://www.rentascordoba.gob.ar';

const CopyField: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-bold font-mono text-slate-900 truncate">{value}</span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1200);
            });
          }}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 shrink-0"
          title="Copiar"
        >
          {done ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: number; bold?: boolean; negative?: boolean; hint?: string }> = ({ label, value, bold, negative, hint }) => (
  <div className={`flex items-center justify-between py-1.5 text-sm ${bold ? 'font-extrabold text-slate-900 border-t border-slate-200 mt-1 pt-2' : 'text-slate-700'}`}>
    <span title={hint}>{label}</span>
    <span className="font-mono">{negative && value > 0 ? '− ' : ''}{money(value)}</span>
  </div>
);

export const TaxAccountantModule: React.FC<TaxAccountantModuleProps> = ({
  config,
  vouchers,
  purchaseInvoices,
  salesOrders,
  suppliers,
  periods,
  currentUserRole,
  onSaveSettings,
  onSavePeriod,
  onRegisterPayment
}) => {
  const [tab, setTab] = useState<Tab>('resumen');
  // Por defecto se liquida el mes anterior (el que vence este mes)
  const [period, setPeriod] = useState<string>(addMonths(currentPeriod(), -1));
  const [vepFor, setVepFor] = useState<TaxKey | null>(null);
  const canEdit = currentUserRole === 'creador' || currentUserRole === 'admin' || currentUserRole === 'finanzas';

  const settings = useMemo(() => withTaxDefaults(config?.taxSettings), [config?.taxSettings]);
  const periodMap = useMemo(() => Object.fromEntries(periods.map(p => [p.id, p])), [periods]);
  const supplierTaxIds = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s.taxId || ''])), [suppliers]);

  const history = useMemo(
    () => computeTaxHistory({ settings, vouchers, purchaseInvoices, salesOrders, periods: periodMap, supplierTaxIds }, period),
    [settings, vouchers, purchaseInvoices, salesOrders, periodMap, supplierTaxIds, period]
  );
  const result: MonthlyTaxResult | undefined = history[history.length - 1];
  const periodDoc: TaxPeriod = periodMap[period] || { id: period, adjustments: [] };

  const isMonotributo = settings.ivaCondition === 'monotributo';
  const sales12 = useMemo(() => last12MonthsSales(vouchers, period), [vouchers, period]);

  const savePeriod = async (patch: Partial<TaxPeriod>) => {
    await onSavePeriod({ ...periodDoc, ...patch, id: period, adjustments: patch.adjustments ?? periodDoc.adjustments ?? [], updatedAt: new Date().toISOString() });
  };

  const exportExcel = () => {
    if (!result) return;
    const wb = XLSX.utils.book_new();
    const ventas = result.sales.map(r => ({
      Fecha: r.date,
      Comprobante: r.type,
      Número: r.number,
      Cliente: r.customer,
      'CUIT/DNI': r.taxId,
      'Neto gravado': r.sign * r.net,
      'IVA 21%': r.sign * r.iva21,
      'IVA 10,5%': r.sign * r.iva105,
      'No gravado / Exento': r.sign * r.exempt,
      Total: r.sign * r.total
    }));
    const compras = result.purchases.map(r => ({
      Fecha: r.date,
      Comprobante: r.type,
      Número: r.number,
      Proveedor: r.supplier,
      CUIT: r.supplierTaxId,
      'Neto gravado': r.sign * r.net,
      'IVA (crédito fiscal)': r.sign * r.iva,
      'Percepción IVA': r.sign * r.ivaPerception,
      'Percepción IIBB': r.sign * r.iibbPerception,
      'Otros impuestos': r.sign * r.otherTaxes,
      Total: r.sign * r.total
    }));
    const iva = result.iva;
    const liqIva = [
      ['Débito fiscal', iva.debit],
      ['Otros débitos', iva.otherDebits],
      ['Crédito fiscal', -iva.credit],
      ['Otros créditos', -iva.otherCredits],
      ['Saldo técnico a favor mes anterior', -iva.previousTechnical],
      ['Impuesto determinado', iva.determined],
      ['Percepciones (compras)', -iva.purchasePerceptions],
      ['Percepciones (otras)', -iva.manualPerceptions],
      ['Retenciones', -iva.withholdings],
      ['Saldo libre disponibilidad anterior', -iva.previousFree],
      ['IVA A PAGAR', iva.toPay],
      ['Saldo técnico a favor (próximo mes)', iva.nextTechnical],
      ['Saldo libre disponibilidad (próximo mes)', iva.nextFree]
    ].map(([k, v]) => ({ Concepto: k, Importe: v }));
    const ib = result.iibb;
    const liqIibb = [
      ...ib.byActivity.map(a => ({ Concepto: `${a.name}${a.code ? ` (${a.code})` : ''} — base ${round2(a.base)} × ${a.rate}%`, Importe: a.tax })),
      { Concepto: 'Impuesto (con mínimo)', Importe: ib.tax },
      { Concepto: 'Retenciones', Importe: -ib.withholdings },
      { Concepto: 'Percepciones', Importe: -ib.perceptions },
      { Concepto: 'SIRCREB / SIRTAC', Importe: -ib.bankCollections },
      { Concepto: 'Saldo a favor anterior', Importe: -ib.previousBalance },
      { Concepto: 'IIBB A PAGAR', Importe: ib.toPay },
      { Concepto: 'Saldo a favor (próximo mes)', Importe: ib.nextBalance }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventas.length ? ventas : [{ Info: 'Sin comprobantes' }]), 'IVA Ventas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(compras.length ? compras : [{ Info: 'Sin comprobantes' }]), 'IVA Compras');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liqIva), 'Liquidación IVA');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(liqIibb), 'Liquidación IIBB');
    XLSX.writeFile(wb, `Impuestos_${config?.cuit || 'empresa'}_${period}.xlsx`);
  };

  if (!result) return null;

  const tabBtn = (id: Tab, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${tab === id ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  const record = (k: TaxKey): TaxPaymentRecord => periodDoc[k] || { status: 'pendiente' };

  const TaxCard: React.FC<{ k: TaxKey }> = ({ k }) => {
    const isIva = k === 'iva';
    const applies = isIva ? result.iva.applies : result.iibb.applies;
    const toPay = isIva ? result.iva.toPay : result.iibb.toPay;
    const due = isIva ? result.ivaDue : result.iibbDue;
    const rec = record(k);
    const days = daysUntil(due);
    const nextFavor = isIva ? result.iva.nextTechnical + result.iva.nextFree : result.iibb.nextBalance;
    const notApplies = isIva
      ? 'No corresponde: el contribuyente no es Responsable Inscripto.'
      : settings.iibbRegime === 'simplificado'
        ? 'Incluido en la cuota del Monotributo Unificado (Régimen Simplificado).'
        : 'Exento de Ingresos Brutos.';
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${isIva ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}>
              {isIva ? <Receipt className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-extrabold text-slate-900">{isIva ? 'IVA' : `Ingresos Brutos ${settings.iibbJurisdiction}`}</div>
              <div className="text-[11px] text-slate-500">{periodLabel(period)}{!isIva && settings.iibbRegime === 'convenio_multilateral' ? ' · Convenio Multilateral' : ''}</div>
            </div>
          </div>
          {applies && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_META[rec.status].cls}`}>{STATUS_META[rec.status].label}</span>}
        </div>

        {applies ? (
          <>
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400">A pagar</div>
              <div className="text-3xl font-black font-mono text-slate-900">{money(toPay)}</div>
              {toPay === 0 && nextFavor > 0 && <div className="text-xs font-bold text-emerald-700">Saldo a favor para el mes próximo: {money(nextFavor)}</div>}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold ${rec.status === 'pagado' ? 'text-emerald-700' : days < 0 ? 'text-rose-600' : days <= 5 ? 'text-amber-700' : 'text-slate-600'}`}>
              <CalendarClock className="w-4 h-4" />
              Vence {fmtDate(due)}
              {rec.status !== 'pagado' && <span>· {days < 0 ? `vencido hace ${-days} días` : days === 0 ? 'vence hoy' : `faltan ${days} días`}</span>}
            </div>
            {rec.status === 'pagado' && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                Pagado el {fmtDate(rec.paidDate)} · {money(rec.paidAmount || 0)}{rec.vepNumber ? ` · VEP ${rec.vepNumber}` : ''}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setVepFor(k)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white"
              >
                <Wallet className="w-4 h-4" /> {rec.status === 'pagado' ? 'Ver pago' : 'Preparar VEP y pagar'}
              </button>
              <button onClick={() => setTab(k)} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700">Ver detalle</button>
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500">{notApplies}</div>
        )}
      </div>
    );
  };

  const recentHistory = history.slice(-6).reverse();

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700"><Calculator className="w-6 h-6" /></div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Contador Interno</h1>
              <p className="text-xs text-slate-500">IVA e Ingresos Brutos calculados con tus facturas de venta y de compra, saldos a favor y vencimientos.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl">
              <button onClick={() => setPeriod(addMonths(period, -1))} className="p-2 hover:bg-slate-200 rounded-l-xl" title="Mes anterior"><ChevronLeft className="w-4 h-4" /></button>
              <input type="month" value={period} onChange={e => e.target.value && setPeriod(e.target.value)} className="bg-transparent text-sm font-bold px-2 py-1.5 outline-hidden" />
              <button onClick={() => setPeriod(addMonths(period, 1))} className="p-2 hover:bg-slate-200 rounded-r-xl" title="Mes siguiente"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
              <FileSpreadsheet className="w-4 h-4" /> Excel para el contador
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {tabBtn('resumen', 'Resumen', Calculator)}
          {settings.ivaCondition === 'responsable_inscripto' && tabBtn('iva', 'IVA', Receipt)}
          {result.iibb.applies && tabBtn('iibb', 'Ingresos Brutos', Landmark)}
          {tabBtn('ajustes', 'Retenciones y percepciones', Wallet)}
          {tabBtn('config', 'Configuración', Settings2)}
        </div>
      </div>

      {!config?.taxSettings && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            Se están usando valores por defecto (Responsable Inscripto, IIBB Córdoba 4,75 %, vencimientos día 18 y 16).{' '}
            <button onClick={() => setTab('config')} className="font-bold underline">Revisá la configuración</button> antes de usar los números.
          </div>
        </div>
      )}

      {/* --- RESUMEN --- */}
      {tab === 'resumen' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TaxCard k="iva" />
            <TaxCard k="iibb" />
          </div>

          {isMonotributo && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="font-extrabold text-slate-900">Monotributo {settings.monotributoCategory ? `· Categoría ${settings.monotributoCategory}` : ''}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div><div className="text-[11px] uppercase font-bold text-slate-400">Cuota mensual</div><div className="font-black font-mono">{money(settings.monotributoMonthlyFee || 0)}</div></div>
                <div><div className="text-[11px] uppercase font-bold text-slate-400">Facturado últimos 12 meses</div><div className="font-black font-mono">{money(sales12)}</div></div>
                <div><div className="text-[11px] uppercase font-bold text-slate-400">Tope de la categoría</div><div className="font-black font-mono">{settings.monotributoAnnualLimit ? money(settings.monotributoAnnualLimit) : 'sin cargar'}</div></div>
              </div>
              {!!settings.monotributoAnnualLimit && (
                <div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${sales12 / settings.monotributoAnnualLimit > 0.9 ? 'bg-rose-500' : sales12 / settings.monotributoAnnualLimit > 0.75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (sales12 / settings.monotributoAnnualLimit) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{Math.round((sales12 / settings.monotributoAnnualLimit) * 100)} % del tope usado</div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-extrabold text-slate-900 mb-3">Últimos meses</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-2">Período</th>
                    <th className="py-2 px-2 text-right">Ventas</th>
                    {result.iva.applies && <th className="py-2 px-2 text-right">IVA a pagar</th>}
                    {result.iva.applies && <th className="py-2 px-2">Estado IVA</th>}
                    {result.iibb.applies && <th className="py-2 px-2 text-right">IIBB a pagar</th>}
                    {result.iibb.applies && <th className="py-2 pl-2">Estado IIBB</th>}
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.map(h => {
                    const pd = periodMap[h.period];
                    const sIva = pd?.iva?.status || 'pendiente';
                    const sIb = pd?.iibb?.status || 'pendiente';
                    return (
                      <tr key={h.period} className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${h.period === period ? 'bg-slate-50 font-bold' : ''}`} onClick={() => setPeriod(h.period)}>
                        <td className="py-2 pr-2">{periodLabel(h.period)}</td>
                        <td className="py-2 px-2 text-right font-mono">{money(h.salesTotal)}</td>
                        {result.iva.applies && <td className="py-2 px-2 text-right font-mono">{money(h.iva.toPay)}</td>}
                        {result.iva.applies && <td className="py-2 px-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_META[sIva].cls}`}>{STATUS_META[sIva].label}</span></td>}
                        {result.iibb.applies && <td className="py-2 px-2 text-right font-mono">{money(h.iibb.toPay)}</td>}
                        {result.iibb.applies && <td className="py-2 pl-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_META[sIb].cls}`}>{STATUS_META[sIb].label}</span></td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
              Cálculo para control interno con los comprobantes cargados en el sistema. La declaración jurada oficial se presenta en ARCA y en Rentas; conviene que tu contador la revise.
            </p>
          </div>
        </>
      )}

      {/* --- IVA --- */}
      {tab === 'iva' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-extrabold text-slate-900 mb-2">Liquidación de IVA · {periodLabel(period)}</h2>
            <Row label="Débito fiscal (ventas)" value={result.iva.debit} />
            {result.iva.otherDebits > 0 && <Row label="Otros débitos" value={result.iva.otherDebits} />}
            <Row label="Crédito fiscal (compras)" value={result.iva.credit} negative />
            {result.iva.otherCredits > 0 && <Row label="Otros créditos" value={result.iva.otherCredits} negative />}
            {result.iva.previousTechnical > 0 && <Row label="Saldo técnico a favor anterior" value={result.iva.previousTechnical} negative />}
            <Row label="Impuesto determinado" value={result.iva.determined} bold />
            <Row label="Percepciones en compras" value={result.iva.purchasePerceptions} negative />
            {result.iva.manualPerceptions > 0 && <Row label="Otras percepciones" value={result.iva.manualPerceptions} negative />}
            <Row label="Retenciones sufridas" value={result.iva.withholdings} negative />
            {result.iva.previousFree > 0 && <Row label="Saldo libre disponibilidad anterior" value={result.iva.previousFree} negative />}
            <Row label="IVA A PAGAR" value={result.iva.toPay} bold />
            {(result.iva.nextTechnical > 0 || result.iva.nextFree > 0) && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                Pasa al mes siguiente: saldo técnico {money(result.iva.nextTechnical)} · libre disponibilidad {money(result.iva.nextFree)}
              </div>
            )}
          </div>
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-extrabold text-slate-900 mb-2">Libro IVA Ventas ({result.sales.length})</h3>
              {result.sales.length === 0 ? (
                <p className="text-sm text-slate-500">No hay facturas autorizadas en ARCA en este período.</p>
              ) : (
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-2">Fecha</th><th className="py-2 px-2">Comprobante</th><th className="py-2 px-2">Cliente</th>
                        <th className="py-2 px-2 text-right">Neto</th><th className="py-2 px-2 text-right">IVA</th><th className="py-2 pl-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.sales.map(r => (
                        <tr key={r.id} className="border-b border-slate-100">
                          <td className="py-1.5 pr-2">{fmtDate(r.date)}</td>
                          <td className="py-1.5 px-2 font-mono">{r.type} {r.number}</td>
                          <td className="py-1.5 px-2">{r.customer}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{money(r.sign * r.net)}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{money(r.sign * (r.iva21 + r.iva105))}</td>
                          <td className="py-1.5 pl-2 text-right font-mono">{money(r.sign * r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-extrabold text-slate-900 mb-2">Libro IVA Compras ({result.purchases.length})</h3>
              {result.purchases.length === 0 ? (
                <p className="text-sm text-slate-500">No hay facturas de compra cargadas en este período.</p>
              ) : (
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-left uppercase text-slate-500 border-b border-slate-200">
                        <th className="py-2 pr-2">Fecha</th><th className="py-2 px-2">Comprobante</th><th className="py-2 px-2">Proveedor</th>
                        <th className="py-2 px-2 text-right">Neto</th><th className="py-2 px-2 text-right">Crédito IVA</th><th className="py-2 px-2 text-right">Perc. IVA</th><th className="py-2 pl-2 text-right">Perc. IIBB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.purchases.map(r => (
                        <tr key={r.id} className={`border-b border-slate-100 ${!r.computesCredit ? 'text-slate-400' : ''}`}>
                          <td className="py-1.5 pr-2">{fmtDate(r.date)}</td>
                          <td className="py-1.5 px-2 font-mono">{r.type} {r.number}</td>
                          <td className="py-1.5 px-2">{r.supplier}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{money(r.sign * r.net)}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{r.computesCredit ? money(r.sign * r.iva) : 'no computa'}</td>
                          <td className="py-1.5 px-2 text-right font-mono">{money(r.sign * r.ivaPerception)}</td>
                          <td className="py-1.5 pl-2 text-right font-mono">{money(r.sign * r.iibbPerception)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-2">El crédito fiscal se calcula sobre el neto de cada ítem con su alícuota (21 %, 10,5 %, etc.). Solo computan las facturas A y M.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- IIBB --- */}
      {tab === 'iibb' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="font-extrabold text-slate-900 mb-2">Ingresos Brutos {settings.iibbJurisdiction} · {periodLabel(period)}</h2>
            <Row label="Ventas facturadas sin IVA" value={result.iibb.invoicedBase} />
            {settings.iibbIncludeNonInvoicedSales && <Row label="Ventas sin factura" value={result.iibb.nonInvoicedBase} />}
            <Row label="Base imponible" value={result.iibb.base} bold />
            {settings.iibbRegime === 'convenio_multilateral' && <Row label={`Base atribuible (coef. ${settings.iibbCoefficient})`} value={result.iibb.attributedBase} />}
            <div className="mt-2 space-y-1">
              {result.iibb.byActivity.map((a, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-600">
                  <span>{a.name}{a.code ? ` (${a.code})` : ''}: {money(a.base)} × {a.rate} %</span>
                  <span className="font-mono">{money(a.tax)}</span>
                </div>
              ))}
            </div>
            {result.iibb.minimum > result.iibb.computedTax && <div className="text-xs text-amber-700 font-bold mt-1">Se aplica el mínimo mensual de {money(result.iibb.minimum)}</div>}
            <Row label="Impuesto del mes" value={result.iibb.tax} bold />
            <Row label="Retenciones sufridas" value={result.iibb.withholdings} negative />
            <Row label="Percepciones" value={result.iibb.perceptions} negative />
            <Row label="SIRCREB / SIRTAC" value={result.iibb.bankCollections} negative />
            {result.iibb.previousBalance > 0 && <Row label="Saldo a favor anterior" value={result.iibb.previousBalance} negative />}
            <Row label="IIBB A PAGAR" value={result.iibb.toPay} bold />
            {result.iibb.nextBalance > 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">Saldo a favor para el mes siguiente: {money(result.iibb.nextBalance)}</div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 space-y-2">
            <h3 className="font-extrabold text-slate-900">Cómo se calcula</h3>
            <p>La base imponible son las ventas facturadas sin IVA del mes (las notas de crédito restan). En Factura C se toma el total.</p>
            <p>Se reparte entre las actividades según el porcentaje configurado y se aplica la alícuota de cada una. Si el resultado es menor al mínimo mensual, se paga el mínimo.</p>
            <p>Se restan las retenciones, percepciones y recaudaciones bancarias (SIRCREB y SIRTAC) del mes, más el saldo a favor que quedó del mes anterior.</p>
            <p className="text-xs text-slate-400">Las alícuotas dependen de la actividad (código NAES) y de la facturación del año anterior. Confirmalas con la Ley Impositiva vigente o con tu contador.</p>
          </div>
        </div>
      )}

      {/* --- AJUSTES --- */}
      {tab === 'ajustes' && (
        <AdjustmentsPanel periodDoc={periodDoc} period={period} canEdit={canEdit} onSave={adjustments => savePeriod({ adjustments })} />
      )}

      {/* --- CONFIG --- */}
      {tab === 'config' && <SettingsPanel settings={settings} canEdit={canEdit} onSave={onSaveSettings} />}

      {vepFor && (
        <VepModal
          tax={vepFor}
          config={config}
          settings={settings}
          result={result}
          record={record(vepFor)}
          canEdit={canEdit}
          onClose={() => setVepFor(null)}
          onSave={async (rec, tx) => {
            if (tx) await onRegisterPayment(tx);
            await savePeriod({ [vepFor]: rec } as Partial<TaxPeriod>);
          }}
        />
      )}
    </div>
  );
};

// ---------------- Retenciones y percepciones ----------------
const AdjustmentsPanel: React.FC<{ periodDoc: TaxPeriod; period: string; canEdit: boolean; onSave: (a: TaxAdjustment[]) => Promise<void> }> = ({ periodDoc, period, canEdit, onSave }) => {
  const [kind, setKind] = useState<TaxAdjustmentKind>('retencion_iva');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const list = periodDoc.adjustments || [];

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(String(amount).replace(/\./g, '').replace(',', '.'));
    if (!(value > 0)) return alert('Ingresá un importe mayor a 0.');
    setBusy(true);
    try {
      await onSave([...list, { id: `adj-${Date.now()}`, kind, amount: round2(value), description: description.trim(), date: todayIso() }]);
      setAmount('');
      setDescription('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {canEdit && (
        <form onSubmit={add} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h2 className="font-extrabold text-slate-900">Agregar a {periodLabel(period)}</h2>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Tipo</span>
            <select value={kind} onChange={e => setKind(e.target.value as TaxAdjustmentKind)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm">
              {Object.entries(ADJUSTMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.tax} · {v.label}</option>)}
            </select>
            <span className="text-[11px] text-slate-500">{ADJUSTMENT_LABELS[kind].hint}</span>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Importe</span>
            <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Detalle (certificado, banco, cliente)</span>
            <input value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
          </label>
          <button disabled={busy} className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black text-white disabled:opacity-50"><Plus className="w-4 h-4" /> Agregar</button>
          <p className="text-[11px] text-slate-400">Las percepciones que vienen en las facturas de compra ya se toman solas. Acá cargás lo que no está en el sistema.</p>
        </form>
      )}
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 ${canEdit ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
        <h2 className="font-extrabold text-slate-900 mb-3">Cargados en {periodLabel(period)}</h2>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">No hay retenciones ni percepciones cargadas a mano en este mes.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {list.map(a => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="py-2 pr-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ADJUSTMENT_LABELS[a.kind].tax === 'IVA' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>{ADJUSTMENT_LABELS[a.kind].tax}</span></td>
                  <td className="py-2 px-2">{ADJUSTMENT_LABELS[a.kind].label}<div className="text-xs text-slate-500">{a.description}</div></td>
                  <td className="py-2 px-2 text-right font-mono">{money(a.amount)}</td>
                  <td className="py-2 pl-2 text-right">
                    {canEdit && (
                      <button onClick={() => { if (window.confirm('¿Eliminar este registro?')) onSave(list.filter(x => x.id !== a.id)); }} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ---------------- Configuración ----------------
const SettingsPanel: React.FC<{ settings: TaxSettings; canEdit: boolean; onSave: (s: TaxSettings) => Promise<void> }> = ({ settings, canEdit, onSave }) => {
  const [s, setS] = useState<TaxSettings>(settings);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof TaxSettings>(k: K, v: TaxSettings[K]) => setS(prev => ({ ...prev, [k]: v }));
  const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm disabled:bg-slate-50';
  const shareTotal = s.iibbActivities.reduce((a, x) => a + (Number(x.share) || 0), 0);

  const save = async () => {
    if (s.iibbActivities.some(a => !a.name.trim())) return alert('Cada actividad necesita un nombre.');
    if (Math.abs(shareTotal - 100) > 0.01 && (s.iibbRegime === 'local' || s.iibbRegime === 'convenio_multilateral')) return alert(`Los porcentajes de las actividades suman ${shareTotal} %. Tienen que sumar 100 %.`);
    setBusy(true);
    try {
      await onSave({
        ...s,
        iibbCoefficient: Number(s.iibbCoefficient) || 0,
        iibbMonthlyMinimum: Number(s.iibbMonthlyMinimum) || 0,
        ivaDueDay: Number(s.ivaDueDay) || 18,
        iibbDueDay: Number(s.iibbDueDay) || 16,
        initialIvaTechnicalBalance: Number(s.initialIvaTechnicalBalance) || 0,
        initialIvaFreeBalance: Number(s.initialIvaFreeBalance) || 0,
        initialIibbBalance: Number(s.initialIibbBalance) || 0,
        monotributoMonthlyFee: Number(s.monotributoMonthlyFee) || 0,
        monotributoAnnualLimit: Number(s.monotributoAnnualLimit) || 0,
        iibbActivities: s.iibbActivities.map(a => ({ ...a, rate: Number(a.rate) || 0, share: Number(a.share) || 0 }))
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
      {!canEdit && <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">Solo el creador, administradores y finanzas pueden modificar la configuración.</div>}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <h3 className="md:col-span-3 font-extrabold text-slate-900">Condición fiscal</h3>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Condición frente al IVA</span>
          <select disabled={!canEdit} value={s.ivaCondition} onChange={e => set('ivaCondition', e.target.value as any)} className={inputCls}>
            <option value="responsable_inscripto">Responsable Inscripto</option>
            <option value="monotributo">Monotributo</option>
            <option value="exento">Exento</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Día de vencimiento IVA</span>
          <input disabled={!canEdit} type="number" min={1} max={31} value={s.ivaDueDay} onChange={e => set('ivaDueDay', Number(e.target.value))} className={inputCls} />
          <span className="text-[11px] text-slate-400">Según terminación de CUIT (calendario de ARCA).</span>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Medio de pago habitual del VEP</span>
          <select disabled={!canEdit} value={s.defaultPaymentEntity} onChange={e => set('defaultPaymentEntity', e.target.value)} className={inputCls}>
            {PAYMENT_ENTITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </label>
        {s.ivaCondition === 'monotributo' && (
          <>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Categoría</span>
              <input disabled={!canEdit} value={s.monotributoCategory || ''} onChange={e => set('monotributoCategory', e.target.value.toUpperCase())} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Cuota mensual ($)</span>
              <input disabled={!canEdit} type="number" value={s.monotributoMonthlyFee || 0} onChange={e => set('monotributoMonthlyFee', Number(e.target.value))} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-600">Tope anual de facturación ($)</span>
              <input disabled={!canEdit} type="number" value={s.monotributoAnnualLimit || 0} onChange={e => set('monotributoAnnualLimit', Number(e.target.value))} className={inputCls} />
            </label>
          </>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <h3 className="md:col-span-3 font-extrabold text-slate-900">Ingresos Brutos</h3>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Régimen</span>
          <select disabled={!canEdit} value={s.iibbRegime} onChange={e => set('iibbRegime', e.target.value as any)} className={inputCls}>
            <option value="local">Contribuyente local (Rentas)</option>
            <option value="convenio_multilateral">Convenio Multilateral</option>
            <option value="simplificado">Régimen Simplificado / Monotributo Unificado</option>
            <option value="exento">Exento</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Jurisdicción</span>
          <input disabled={!canEdit} value={s.iibbJurisdiction} onChange={e => set('iibbJurisdiction', e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">N.º de inscripción IIBB</span>
          <input disabled={!canEdit} value={s.iibbNumber || ''} onChange={e => set('iibbNumber', e.target.value)} className={inputCls} />
        </label>
        {s.iibbRegime === 'convenio_multilateral' && (
          <label className="block">
            <span className="text-xs font-bold text-slate-600">Coeficiente de la jurisdicción</span>
            <input disabled={!canEdit} type="number" step="0.0001" min={0} max={1} value={s.iibbCoefficient} onChange={e => set('iibbCoefficient', Number(e.target.value))} className={inputCls} />
          </label>
        )}
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Mínimo mensual ($)</span>
          <input disabled={!canEdit} type="number" min={0} value={s.iibbMonthlyMinimum} onChange={e => set('iibbMonthlyMinimum', Number(e.target.value))} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Día de vencimiento IIBB</span>
          <input disabled={!canEdit} type="number" min={1} max={31} value={s.iibbDueDay} onChange={e => set('iibbDueDay', Number(e.target.value))} className={inputCls} />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-3">
          <input disabled={!canEdit} type="checkbox" checked={s.iibbIncludeNonInvoicedSales} onChange={e => set('iibbIncludeNonInvoicedSales', e.target.checked)} />
          Sumar a la base las ventas registradas sin factura
        </label>

        {(s.iibbRegime === 'local' || s.iibbRegime === 'convenio_multilateral') && (
          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Actividades y alícuotas</span>
              <span className={`text-xs font-bold ${Math.abs(shareTotal - 100) > 0.01 ? 'text-rose-600' : 'text-emerald-600'}`}>Reparto: {shareTotal} %</span>
            </div>
            {s.iibbActivities.map((a, i) => (
              <div key={a.id} className="flex flex-wrap gap-2 items-center">
                <input disabled={!canEdit} value={a.name} onChange={e => set('iibbActivities', s.iibbActivities.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Actividad" className="flex-1 min-w-[180px] border border-slate-300 rounded-xl px-3 py-2 text-sm" />
                <input disabled={!canEdit} value={a.code || ''} onChange={e => set('iibbActivities', s.iibbActivities.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} placeholder="Código NAES" className="w-32 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono" />
                <div className="relative w-28">
                  <input disabled={!canEdit} type="number" step="0.01" value={a.rate} onChange={e => set('iibbActivities', s.iibbActivities.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x)))} className="w-full border border-slate-300 rounded-xl pl-3 pr-14 py-2 text-sm font-mono text-right" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">% alíc.</span>
                </div>
                <div className="relative w-28">
                  <input disabled={!canEdit} type="number" step="0.01" value={a.share} onChange={e => set('iibbActivities', s.iibbActivities.map((x, j) => (j === i ? { ...x, share: Number(e.target.value) } : x)))} className="w-full border border-slate-300 rounded-xl pl-3 pr-14 py-2 text-sm font-mono text-right" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">% vtas.</span>
                </div>
                {canEdit && s.iibbActivities.length > 1 && (
                  <button type="button" onClick={() => set('iibbActivities', s.iibbActivities.filter((_, j) => j !== i))} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {canEdit && (
              <button type="button" onClick={() => set('iibbActivities', [...s.iibbActivities, { id: `act-${Date.now()}`, name: '', code: '', rate: 4.75, share: 0 }])} className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Actividad</button>
            )}
            <p className="text-[11px] text-slate-400">En Córdoba la alícuota general es 4,75 %, pero varía según la actividad y la facturación del año anterior. Confirmala con tu constancia de inscripción o con tu contador.</p>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <h3 className="md:col-span-4 font-extrabold text-slate-900">Saldos iniciales</h3>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Calcular desde (período)</span>
          <input disabled={!canEdit} type="month" value={s.startPeriod} onChange={e => set('startPeriod', e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">IVA saldo técnico a favor</span>
          <input disabled={!canEdit} type="number" value={s.initialIvaTechnicalBalance} onChange={e => set('initialIvaTechnicalBalance', Number(e.target.value))} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">IVA saldo libre disponibilidad</span>
          <input disabled={!canEdit} type="number" value={s.initialIvaFreeBalance} onChange={e => set('initialIvaFreeBalance', Number(e.target.value))} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">IIBB saldo a favor</span>
          <input disabled={!canEdit} type="number" value={s.initialIibbBalance} onChange={e => set('initialIibbBalance', Number(e.target.value))} className={inputCls} />
        </label>
        <p className="md:col-span-4 text-[11px] text-slate-400">Copialos de la última declaración jurada presentada antes del período inicial.</p>
      </section>

      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Guardado</span>}
          <button onClick={save} disabled={busy} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black text-white disabled:opacity-50">Guardar configuración</button>
        </div>
      )}
    </div>
  );
};

// ---------------- VEP y pago ----------------
const VepModal: React.FC<{
  tax: TaxKey;
  config: CompanyConfig | null;
  settings: TaxSettings;
  result: MonthlyTaxResult;
  record: TaxPaymentRecord;
  canEdit: boolean;
  onClose: () => void;
  onSave: (rec: TaxPaymentRecord, tx?: FinancialTransaction) => Promise<void>;
}> = ({ tax, config, settings, result, record, canEdit, onClose, onSave }) => {
  const isIva = tax === 'iva';
  const amount = isIva ? result.iva.toPay : result.iibb.toPay;
  const [mm, yyyy] = [result.period.slice(5, 7), result.period.slice(0, 4)];
  const [vepNumber, setVepNumber] = useState(record.vepNumber || '');
  const [entity, setEntity] = useState(record.paymentEntity || settings.defaultPaymentEntity);
  const [paidDate, setPaidDate] = useState(record.paidDate || todayIso());
  const [paidAmount, setPaidAmount] = useState<number>(record.paidAmount ?? amount);
  const [method, setMethod] = useState<FinancialTransaction['paymentMethod']>('transferencia');
  const [registerExpense, setRegisterExpense] = useState(true);
  const [busy, setBusy] = useState(false);

  const isCM = !isIva && settings.iibbRegime === 'convenio_multilateral';
  const taxName = isIva ? 'IVA' : `Ingresos Brutos ${settings.iibbJurisdiction}${isCM ? ' (Convenio Multilateral)' : ''}`;

  const save = async (status: TaxPaymentRecord['status']) => {
    setBusy(true);
    try {
      const rec: TaxPaymentRecord = { ...record, status, amount, paymentEntity: entity };
      if (vepNumber.trim()) rec.vepNumber = vepNumber.trim();
      if (status === 'vep_generado' && !rec.vepDate) rec.vepDate = todayIso();
      let tx: FinancialTransaction | undefined;
      if (status === 'pagado') {
        rec.paidDate = paidDate;
        rec.paidAmount = round2(Number(paidAmount) || 0);
        rec.paymentMethod = method;
        if (registerExpense && !record.transactionId && rec.paidAmount > 0) {
          tx = {
            id: `tx-imp-${tax}-${result.period}-${Date.now()}`,
            type: 'impuestos',
            direction: 'egreso',
            amount: rec.paidAmount,
            date: paidDate,
            entityName: isIva ? 'ARCA' : isCM ? 'Convenio Multilateral' : `Rentas ${settings.iibbJurisdiction}`,
            paymentMethod: method,
            concept: `${taxName} ${mm}/${yyyy}${rec.vepNumber ? ` · VEP ${rec.vepNumber}` : ''}`,
            ...(rec.vepNumber ? { receiptNumber: rec.vepNumber } : {})
          };
          rec.transactionId = tx.id;
        }
      }
      await onSave(rec, tx);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const step = (n: number, text: React.ReactNode) => (
    <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">{n}</span><span>{text}</span></li>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase font-bold text-slate-400">Preparar VEP y registrar pago</div>
            <h2 className="text-lg font-black text-slate-900">{taxName} · {periodLabel(result.period)}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-extrabold text-slate-900 mb-1">Datos para el VEP</div>
            <CopyField label="CUIT" value={(config?.cuit || '').replace(/\D/g, '') || 'sin configurar'} />
            {isIva ? (
              <>
                <CopyField label="Impuesto" value="30 - IVA" />
                <CopyField label="Concepto / Subconcepto" value="019 / 019 (saldo DDJJ)" />
              </>
            ) : (
              <CopyField label="Impuesto" value={`Ingresos Brutos${settings.iibbNumber ? ` · Insc. ${settings.iibbNumber}` : ''}`} />
            )}
            <CopyField label="Período" value={`${yyyy}${mm}`} />
            <CopyField label="Importe" value={amount.toFixed(2).replace('.', ',')} />
          </div>

          <ol className="space-y-2 text-sm text-slate-700">
            {isIva ? (
              <>
                {step(1, <>Entrá a ARCA con clave fiscal y abrí <b>Portal IVA</b>. Revisá que los comprobantes coincidan con el Excel del sistema.</>)}
                {step(2, <>Presentá la declaración jurada (F.2051) del período {mm}/{yyyy}. El saldo a pagar tiene que dar {amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} (si no coincide, revisá retenciones y percepciones).</>)}
                {step(3, <>Desde el mismo portal elegí <b>Generar VEP</b> y seleccioná <b>{entity}</b> como medio de pago. Anotá el número de VEP abajo.</>)}
                {step(4, <>Pagalo desde el home banking o el medio elegido y registrá el pago abajo.</>)}
              </>
            ) : isCM ? (
              <>
                {step(1, <>Entrá a ARCA con clave fiscal y abrí <b>SIFERE Web</b>.</>)}
                {step(2, <>Presentá la DDJJ mensual (CM03) del anticipo {mm}/{yyyy} cargando bases, retenciones y percepciones.</>)}
                {step(3, <>Generá el VEP con <b>{entity}</b> y anotá el número abajo.</>)}
                {step(4, <>Pagalo y registrá el pago.</>)}
              </>
            ) : (
              <>
                {step(1, <>Entrá a <b>Rentas {settings.iibbJurisdiction}</b> con tu usuario (en Córdoba, con CiDi).</>)}
                {step(2, <>Presentá la DDJJ del anticipo {mm}/{yyyy} de Ingresos Brutos con la base y las deducciones del sistema.</>)}
                {step(3, <>Generá el comprobante o VEP de pago con <b>{entity}</b> y anotá el número abajo.</>)}
                {step(4, <>Pagalo y registrá el pago.</>)}
              </>
            )}
          </ol>
          <div className="flex flex-wrap gap-2">
            <a href={ARCA_LOGIN} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white">
              Abrir ARCA <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {!isIva && !isCM && /c[oó]rdoba/i.test(settings.iibbJurisdiction) && (
              <a href={RENTAS_CBA} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white">
                Abrir Rentas Córdoba <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {canEdit && (
            <>
              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="text-xs font-extrabold text-slate-900">VEP generado</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Número de VEP</span>
                    <input value={vepNumber} onChange={e => setVepNumber(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Medio de pago</span>
                    <select value={entity} onChange={e => setEntity(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm">
                      {PAYMENT_ENTITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </label>
                </div>
                {record.status !== 'pagado' && (
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busy} onClick={() => save('ddjj_presentada')} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50">Marcar DDJJ presentada</button>
                    <button disabled={busy || !vepNumber.trim()} onClick={() => save('vep_generado')} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">Guardar VEP</button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="text-xs font-extrabold text-slate-900">Registrar pago</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Fecha</span>
                    <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Importe pagado</span>
                    <input type="number" step="0.01" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono" />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-600">Forma</span>
                    <select value={method} onChange={e => setMethod(e.target.value as any)} className="mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm">
                      <option value="transferencia">Transferencia / home banking</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="echeq">E-cheq</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </label>
                </div>
                {!record.transactionId && (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={registerExpense} onChange={e => setRegisterExpense(e.target.checked)} />
                    Registrar el egreso en Finanzas
                  </label>
                )}
                {record.transactionId && <div className="text-xs text-emerald-700 font-semibold">✓ Egreso registrado en Finanzas.</div>}
                <button disabled={busy} onClick={() => save('pagado')} className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50">
                  {record.status === 'pagado' ? 'Actualizar pago' : 'Confirmar pago'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
