import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  DollarSign,
  Calculator,
  BookOpen,
  PieChart,
  Scale,
  Building,
  ShieldCheck,
  Receipt,
  Layers,
  ArrowRight,
  Printer,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const ContabilidadView: React.FC = () => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<
    | 'iva_ventas'
    | 'iva_compras'
    | 'ingresos_brutos'
    | 'municipalidad'
    | 'retenciones'
    | 'percepciones'
    | 'plan_cuenta'
    | 'asiento_manual'
    | 'libro_diario'
    | 'libro_mayor'
    | 'estado_resultados'
    | 'situacion_patrimonial'
    | 'sumas_saldos'
  >('iva_ventas');

  // Manual accounting entries state
  const [manualEntries, setManualEntries] = useState<
    { id: string; date: string; description: string; account: string; debit: number; credit: number }[]
  >([
    { id: '1', date: '2026-09-01', description: 'Aporte inicial caja', account: 'Caja', debit: 500000, credit: 0 },
    { id: '2', date: '2026-09-01', description: 'Aporte inicial caja', account: 'Capital Social', debit: 0, credit: 500000 },
    { id: '3', date: '2026-09-02', description: 'Compra de mercadería proveedor', account: 'Mercaderías', debit: 250000, credit: 0 },
    { id: '4', date: '2026-09-02', description: 'Compra de mercadería proveedor', account: 'Proveedores Cta Cte', debit: 0, credit: 250000 },
  ]);

  const [newDesc, setNewDesc] = useState('');
  const [newAccount, setNewAccount] = useState('Caja');
  const [newDebit, setNewDebit] = useState(0);
  const [newCredit, setNewCredit] = useState(0);

  const handleAddManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description: newDesc,
      account: newAccount,
      debit: Number(newDebit),
      credit: Number(newCredit),
    };
    setManualEntries([...manualEntries, entry]);
    setNewDesc('');
    setNewDebit(0);
    setNewCredit(0);
    showToast('Asiento contable registrado correctamente', 'success');
  };

  // Calculations from store sales
  const totalSalesNet = store.sales.reduce((acc, s) => acc + s.total * 0.8264, 0);
  const totalSalesVat = store.sales.reduce((acc, s) => acc + s.total * 0.1736, 0);
  const totalSalesGross = store.sales.reduce((acc, s) => acc + s.total, 0);

  const tabs = [
    { id: 'iva_ventas', label: 'IVA Ventas', icon: Receipt },
    { id: 'iva_compras', label: 'IVA Compras', icon: Receipt },
    { id: 'ingresos_brutos', label: 'Ingresos Brutos', icon: Calculator },
    { id: 'municipalidad', label: 'Municipalidad', icon: Building },
    { id: 'retenciones', label: 'Retenciones', icon: ShieldCheck },
    { id: 'percepciones', label: 'Percepciones', icon: ShieldCheck },
    { id: 'plan_cuenta', label: 'Plan de Cuenta', icon: Layers },
    { id: 'asiento_manual', label: 'Asiento Manual', icon: FileText },
    { id: 'libro_diario', label: 'Libro Diario', icon: BookOpen },
    { id: 'libro_mayor', label: 'Libro Mayor', icon: BookOpen },
    { id: 'estado_resultados', label: 'Estado de Resultados', icon: PieChart },
    { id: 'situacion_patrimonial', label: 'Estado de Situación Patrimonial', icon: Scale },
    { id: 'sumas_saldos', label: 'Sumas y Saldos', icon: DollarSign },
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Módulo de Contabilidad Integral</h1>
            <p className="text-xs text-slate-500 font-medium">
              Gestión contable, impuestos (IVA, IIBB), libros legales y balances automáticos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => showToast('Exportando reporte contable a Excel/PDF...', 'success')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center space-x-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Contabilidad</span>
          </button>
        </div>
      </header>

      {/* Submenu Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 overflow-x-auto flex items-center space-x-2 custom-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* TAB 1: IVA VENTAS */}
        {activeTab === 'iva_ventas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Ventas Neto Gravado</span>
                <span className="text-2xl font-black text-slate-900">${totalSalesNet.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Débito Fiscal IVA (21%)</span>
                <span className="text-2xl font-black text-blue-600">${totalSalesVat.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Facturado Bruto</span>
                <span className="text-2xl font-black text-slate-900">${totalSalesGross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm">Libro IVA Ventas (Período Actual)</h3>
                <span className="text-xs text-slate-500 font-medium">{store.sales.length} comprobantes registrados</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Comprobante</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3 text-right">Neto Gravado</th>
                      <th className="p-3 text-right">IVA (21%)</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {store.sales.slice(0, 15).map((sale) => {
                      const neto = sale.total * 0.8264;
                      const iva = sale.total * 0.1736;
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-slate-500">{new Date(sale.timestamp).toLocaleDateString()}</td>
                          <td className="p-3 font-bold text-blue-600">Factura B #{sale.id.slice(-6)}</td>
                          <td className="p-3 font-semibold text-slate-900">{sale.clientName || 'Consumidor Final'}</td>
                          <td className="p-3 text-right font-mono">${neto.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-mono text-blue-600">${iva.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                          <td className="p-3 text-right font-mono font-bold">${sale.total.toLocaleString('es-AR')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IVA COMPRAS */}
        {activeTab === 'iva_compras' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Compras Neto</span>
                <span className="text-2xl font-black text-slate-900">$1.240.000,00</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Crédito Fiscal IVA</span>
                <span className="text-2xl font-black text-emerald-600">$260.400,00</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Saldo Técnico IVA a Pagar</span>
                <span className="text-2xl font-black text-blue-600">
                  ${(totalSalesVat - 260400 > 0 ? totalSalesVat - 260400 : 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-black text-slate-900">Facturas de Proveedores Cargadas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Las facturas de compra de proveedores y regímenes de información AFIP se sincronizan automáticamente desde el módulo de Compras e Inteligencia AFIP.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: INGRESOS BRUTOS */}
        {activeTab === 'ingresos_brutos' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Liquidación de Ingresos Brutos (Convenio Multilateral / Córdoba)</h3>
                  <p className="text-xs text-slate-500">Cálculo automático de base imponible y alícuota aplicable (3.5%)</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">Período 2026/08</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Base Imponible Total</span>
                  <span className="text-xl font-black text-slate-900">${totalSalesGross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Alícuota Aplicada</span>
                  <span className="text-xl font-black text-blue-600">3.50%</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs text-slate-500">Impuesto Determinado</span>
                  <span className="text-xl font-black text-emerald-600">${(totalSalesGross * 0.035).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MUNICIPALIDAD */}
        {activeTab === 'municipalidad' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-black text-slate-900">Tasas Municipales y Comercio e Industria</h3>
            <p className="text-xs text-slate-500">
              Control de tasas por habilitación, seguridad e higiene y comercio de Alejandro Roca.
            </p>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <span>Próximo Vencimiento Tasa Municipal: 15/09/2026</span>
              <span className="font-black">$48.500,00</span>
            </div>
          </div>
        )}

        {/* TAB 5 & 6: RETENCIONES & PERCEPCIONES */}
        {(activeTab === 'retenciones' || activeTab === 'percepciones') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-black text-slate-900 capitalize">
              Registro de {activeTab === 'retenciones' ? 'Retenciones' : 'Percepciones'} (IVA, IIBB, SUSS)
            </h3>
            <p className="text-xs text-slate-500">
              Listado de certificados sufridos y practicados en operaciones comerciales.
            </p>
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              No se registran retenciones pendientes para el período fiscal en curso.
            </div>
          </div>
        )}

        {/* TAB 7: PLAN DE CUENTA */}
        {activeTab === 'plan_cuenta' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Plan de Cuentas Contable</h3>
              <button onClick={() => showToast('Nueva cuenta agregada', 'success')} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
                + Nueva Cuenta
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Nombre de Cuenta</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Naturaleza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="p-3 font-mono font-bold">1.1.01</td><td className="p-3 font-semibold text-slate-900">Caja General</td><td className="p-3 text-slate-500">Activo</td><td className="p-3 text-emerald-600 font-bold">Deudor</td></tr>
                <tr><td className="p-3 font-mono font-bold">1.1.02</td><td className="p-3 font-semibold text-slate-900">Banco Galicia C/C</td><td className="p-3 text-slate-500">Activo</td><td className="p-3 text-emerald-600 font-bold">Deudor</td></tr>
                <tr><td className="p-3 font-mono font-bold">1.1.03</td><td className="p-3 font-semibold text-slate-900">Deudores por Ventas</td><td className="p-3 text-slate-500">Activo</td><td className="p-3 text-emerald-600 font-bold">Deudor</td></tr>
                <tr><td className="p-3 font-mono font-bold">1.1.05</td><td className="p-3 font-semibold text-slate-900">Mercaderías de Reventa</td><td className="p-3 text-slate-500">Activo</td><td className="p-3 text-emerald-600 font-bold">Deudor</td></tr>
                <tr><td className="p-3 font-mono font-bold">2.1.01</td><td className="p-3 font-semibold text-slate-900">Proveedores Cta Cte</td><td className="p-3 text-slate-500">Pasivo</td><td className="p-3 text-rose-600 font-bold">Acreedor</td></tr>
                <tr><td className="p-3 font-mono font-bold">3.1.01</td><td className="p-3 font-semibold text-slate-900">Capital Social</td><td className="p-3 text-slate-500">Patrimonio Neto</td><td className="p-3 text-rose-600 font-bold">Acreedor</td></tr>
                <tr><td className="p-3 font-mono font-bold">4.1.01</td><td className="p-3 font-semibold text-slate-900">Ventas de Mercaderías</td><td className="p-3 text-slate-500">Resultado Positivo</td><td className="p-3 text-rose-600 font-bold">Acreedor</td></tr>
                <tr><td className="p-3 font-mono font-bold">5.1.01</td><td className="p-3 font-semibold text-slate-900">Costo de Mercadería Vendida</td><td className="p-3 text-slate-500">Resultado Negativo</td><td className="p-3 text-emerald-600 font-bold">Deudor</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 8: ASIENTO MANUAL */}
        {activeTab === 'asiento_manual' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-sm">Registrar Nuevo Asiento Contable</h3>
              <form onSubmit={handleAddManualEntry} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Concepto / Descripción</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Ej. Pago de alquiler local..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Cuenta Contable</label>
                  <select
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
                  >
                    <option value="Caja">Caja General</option>
                    <option value="Banco Galicia">Banco Galicia C/C</option>
                    <option value="Mercaderías">Mercaderías</option>
                    <option value="Proveedores Cta Cte">Proveedores Cta Cte</option>
                    <option value="Gastos Generales">Gastos Generales</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Debe ($)</label>
                    <input
                      type="number"
                      value={newDebit}
                      onChange={(e) => setNewDebit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Haber ($)</label>
                    <input
                      type="number"
                      value={newCredit}
                      onChange={(e) => setNewCredit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/20 transition-all"
                >
                  Registrar Asiento
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-black text-slate-900 text-sm">Asientos Registrados Recientemente</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Cuenta</th>
                    <th className="p-3 text-right">Debe</th>
                    <th className="p-3 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manualEntries.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-500">{item.date}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.description}</td>
                      <td className="p-3 font-medium text-blue-600">{item.account}</td>
                      <td className="p-3 text-right font-mono font-bold">${item.debit > 0 ? item.debit.toLocaleString('es-AR') : '-'}</td>
                      <td className="p-3 text-right font-mono font-bold">${item.credit > 0 ? item.credit.toLocaleString('es-AR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9 & 10: LIBRO DIARIO & MAYOR */}
        {(activeTab === 'libro_diario' || activeTab === 'libro_mayor') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 uppercase">
                {activeTab === 'libro_diario' ? 'Libro Diario General' : 'Libro Mayor Analítico por Cuenta'}
              </h3>
              <span className="text-xs text-slate-500 font-mono">EJERCICIO 2026 - FERRETERÍA BRUZZONE</span>
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Detalle de Operación</th>
                    <th className="p-3 text-right">Debe</th>
                    <th className="p-3 text-right">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="p-3">01/09/2026</td>
                    <td className="p-3 font-semibold">Asiento N° 1 - Apertura de Caja y Capital Social</td>
                    <td className="p-3 text-right">$500.000,00</td>
                    <td className="p-3 text-right">$500.000,00</td>
                  </tr>
                  <tr>
                    <td className="p-3">02/09/2026</td>
                    <td className="p-3 font-semibold">Asiento N° 2 - Compra de Mercadería Cta Cte Proveedores</td>
                    <td className="p-3 text-right">$250.000,00</td>
                    <td className="p-3 text-right">$250.000,00</td>
                  </tr>
                  <tr>
                    <td className="p-3">03/09/2026</td>
                    <td className="p-3 font-semibold">Asiento N° 3 - Ventas del Día a Consumidores Finales</td>
                    <td className="p-3 text-right">${totalSalesGross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">${totalSalesGross.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 11: ESTADO DE RESULTADOS */}
        {activeTab === 'estado_resultados' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-3xl mx-auto">
            <div className="text-center space-y-1 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">FERRETERÍA BRUZZONE</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de Resultados (P&amp;L)</p>
              <p className="text-[11px] text-slate-400">Período Fiscal Finalizado al 05/09/2026</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold">
                <span>Ventas Netas de Mercaderías</span>
                <span className="font-mono">${totalSalesNet.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-rose-600">
                <span>(-) Costo de Mercadería Vendida (CMV)</span>
                <span className="font-mono">-${(totalSalesNet * 0.6).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 font-black text-sm text-slate-900 bg-slate-50 px-3 rounded-lg">
                <span>(=) Utilidad Bruta</span>
                <span className="font-mono text-blue-600">${(totalSalesNet * 0.4).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-rose-600">
                <span>(-) Gastos Operativos y Sueldos</span>
                <span className="font-mono">-$320.000,00</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t-2 border-slate-900 font-black text-base text-slate-900 bg-blue-50 px-3 rounded-xl">
                <span>(=) Resultado Neto del Ejercicio</span>
                <span className="font-mono text-emerald-600">${(totalSalesNet * 0.4 - 320000).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: ESTADO DE SITUACIÓN PATRIMONIAL */}
        {activeTab === 'situacion_patrimonial' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm max-w-4xl mx-auto">
            <div className="text-center space-y-1 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">FERRETERÍA BRUZZONE</h3>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Estado de Situación Patrimonial (Balance General)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs uppercase text-blue-600">Activo</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-600">Caja y Bancos</span><span className="font-mono font-bold">$1.850.000,00</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Créditos por Ventas (Cta Cte)</span><span className="font-mono font-bold">$1.420.000,00</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Bienes de Cambio (Inventario)</span><span className="font-mono font-bold">$8.540.000,00</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-black"><span>Total Activo</span><span className="font-mono text-blue-600">$11.810.000,00</span></div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-black text-slate-900 text-xs uppercase text-rose-600">Pasivo + Patrimonio Neto</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-600">Deudas Comerciales (Proveedores)</span><span className="font-mono font-bold">$2.100.000,00</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Deudas Fiscales y Sociales</span><span className="font-mono font-bold">$480.000,00</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Capital Social</span><span className="font-mono font-bold">$5.000.000,00</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Resultados Acumulados</span><span className="font-mono font-bold">$4.230.000,00</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-black"><span>Total Pasivo + P.N.</span><span className="font-mono text-rose-600">$11.810.000,00</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: SUMAS Y SALDOS */}
        {activeTab === 'sumas_saldos' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-black text-slate-900 text-sm">Balance de Sumas y Saldos</h3>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Cuenta</th>
                  <th className="p-3 text-right">Débitos</th>
                  <th className="p-3 text-right">Créditos</th>
                  <th className="p-3 text-right">Saldo Deudor</th>
                  <th className="p-3 text-right">Saldo Acreedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                <tr><td className="p-3 font-semibold text-slate-900 font-sans">Caja General</td><td className="p-3 text-right">$2.400.000</td><td className="p-3 text-right">$550.000</td><td className="p-3 text-right font-bold text-emerald-600">$1.850.000</td><td className="p-3 text-right">-</td></tr>
                <tr><td className="p-3 font-semibold text-slate-900 font-sans">Banco Galicia C/C</td><td className="p-3 text-right">$3.200.000</td><td className="p-3 text-right">$1.800.000</td><td className="p-3 text-right font-bold text-emerald-600">$1.400.000</td><td className="p-3 text-right">-</td></tr>
                <tr><td className="p-3 font-semibold text-slate-900 font-sans">Mercaderías</td><td className="p-3 text-right">$9.100.000</td><td className="p-3 text-right">$560.000</td><td className="p-3 text-right font-bold text-emerald-600">$8.540.000</td><td className="p-3 text-right">-</td></tr>
                <tr><td className="p-3 font-semibold text-slate-900 font-sans">Proveedores</td><td className="p-3 text-right">$1.500.000</td><td className="p-3 text-right">$3.600.000</td><td className="p-3 text-right">-</td><td className="p-3 text-right font-bold text-rose-600">$2.100.000</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};
