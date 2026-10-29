import React, { useState } from 'react';
import { 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Wallet, 
  Building, 
  Users,
  X
} from 'lucide-react';
import { FinancialTransaction, Customer, Supplier } from '../types';

interface FinancesModuleProps {
  transactions: FinancialTransaction[];
  customers: Customer[];
  suppliers: Supplier[];
  onAddTransaction: (tx: FinancialTransaction) => Promise<void>;
}

export const FinancesModule: React.FC<FinancesModuleProps> = ({
  transactions,
  customers,
  suppliers,
  onAddTransaction
}) => {
  const [showTxModal, setShowTxModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'receivables' | 'payables'>('flow');

  // New Transaction form
  const [txForm, setTxForm] = useState<Partial<FinancialTransaction>>({
    type: 'cobro_cliente',
    direction: 'ingreso',
    amount: 100000,
    paymentMethod: 'transferencia',
    concept: '',
    receiptNumber: ''
  });

  // Calculations
  const totalReceivables = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);
  
  // Approximate payables from supplier accounts
  const totalPayables = 2450000; // Sample current accounts payable

  const totalIncome = transactions
    .filter(t => t.direction === 'ingreso')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.direction === 'egreso')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.concept) return;

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type: txForm.type || 'cobro_cliente',
      direction: (txForm.type === 'cobro_cliente') ? 'ingreso' : 'egreso',
      amount: Number(txForm.amount),
      date: new Date().toISOString(),
      entityName: txForm.entityName || 'Operación de Planta',
      paymentMethod: txForm.paymentMethod || 'transferencia',
      concept: txForm.concept,
      receiptNumber: txForm.receiptNumber || `REC-${Math.floor(Math.random() * 89999 + 10000)}`
    };

    await onAddTransaction(newTx);
    setShowTxModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Finanzas & Control de Flujo Diario
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                  Cobros, Pagos & Tesorería
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control estricto de cuentas por cobrar, pagos a proveedores químicos y flujo de caja diario en planta.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowTxModal(true)}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Registrar Movimiento de Caja
          </button>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Total Cobrado (Ingresos)</span>
            <div className="text-xl font-black text-emerald-700 mt-1">
              $ {totalIncome.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-slate-400">Cobranzas en cuenta</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Total Egresos (Pagos & Gastos)</span>
            <div className="text-xl font-black text-red-600 mt-1">
              $ {totalExpense.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-slate-400">Proveedores & operación</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Cuentas por Cobrar (Deudores)</span>
            <div className="text-xl font-black text-amber-600 mt-1">
              $ {totalReceivables.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-slate-400">Pinturerías & distribuidores</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 font-semibold block">Flujo Neto Operativo</span>
            <div className={`text-xl font-black mt-1 ${netBalance >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
              $ {netBalance.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-slate-400">Saldo actual en tesorería</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flow' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Libro de Movimientos de Caja ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'receivables' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cartera de Cuentas por Cobrar
          </button>
        </div>
      </div>

      {/* Tab: Flow */}
      {activeTab === 'flow' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Concepto / Referencia</th>
                  <th className="p-3.5">Entidad (Cliente / Proveedor)</th>
                  <th className="p-3.5">Medio de Pago</th>
                  <th className="p-3.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => {
                  const isIncome = tx.direction === 'ingreso';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(tx.date).toLocaleDateString('es-AR')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
                          isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {tx.concept}
                        {tx.receiptNumber && <span className="block font-mono text-[10px] text-slate-400">{tx.receiptNumber}</span>}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {tx.entityName}
                      </td>
                      <td className="p-3.5 capitalize text-slate-600">
                        {tx.paymentMethod}
                      </td>
                      <td className={`p-3.5 text-right font-mono font-black text-sm ${isIncome ? 'text-emerald-700' : 'text-red-600'}`}>
                        {isIncome ? '+' : '-'} $ {tx.amount.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Receivables */}
      {activeTab === 'receivables' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">
              Antigüedad y Estado de Deudores Comerciales
            </h3>
            <p className="text-xs text-slate-500">
              Monitoreo de vencimientos y saldos adeudados por clientes mayoristas y distribuidores.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">CUIT</th>
                  <th className="p-3.5">Teléfono</th>
                  <th className="p-3.5 text-right">Límite</th>
                  <th className="p-3.5 text-right">Saldo Deudor</th>
                  <th className="p-3.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.filter(c => c.currentBalance > 0).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-bold text-slate-900">{c.businessName}</td>
                    <td className="p-3.5 font-mono text-slate-600">{c.taxId}</td>
                    <td className="p-3.5 text-slate-600">{c.phone}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">$ {c.creditLimit.toLocaleString('es-AR')}</td>
                    <td className="p-3.5 text-right font-mono font-black text-red-600">$ {c.currentBalance.toLocaleString('es-AR')}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                        Pendiente
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR MOVIMIENTO */}
      {showTxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">
              Registrar Movimiento de Fondos / Tesorería
            </h3>

            <form onSubmit={handleTxSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Movimiento</label>
                <select
                  value={txForm.type}
                  onChange={e => setTxForm({ ...txForm, type: e.target.value as any })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="cobro_cliente">Cobro a Cliente (Ingreso)</option>
                  <option value="pago_proveedor">Pago a Proveedor Químico (Egreso)</option>
                  <option value="gasto_operativo">Gasto Operativo de Planta (Egreso)</option>
                  <option value="sueldos">Sueldos y Cargas Sociales (Egreso)</option>
                  <option value="mantenimiento">Mantenimiento de Dispersores / Planta (Egreso)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto ($)</label>
                <input
                  type="number"
                  min="1"
                  value={txForm.amount}
                  onChange={e => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                  className="w-full text-base p-2.5 rounded-xl border border-slate-300 font-mono font-black text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entidad Relacionada</label>
                <input
                  type="text"
                  value={txForm.entityName || ''}
                  onChange={e => setTxForm({ ...txForm, entityName: e.target.value })}
                  placeholder="Pinturerías Centro, Química del Plata..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medio de Pago</label>
                  <select
                    value={txForm.paymentMethod}
                    onChange={e => setTxForm({ ...txForm, paymentMethod: e.target.value as any })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="echeq">E-Cheq</option>
                    <option value="cheque">Cheque Físico</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nº Comprobante / Recibo</label>
                  <input
                    type="text"
                    value={txForm.receiptNumber || ''}
                    onChange={e => setTxForm({ ...txForm, receiptNumber: e.target.value })}
                    placeholder="REC-000412"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Concepto Detallado</label>
                <input
                  type="text"
                  value={txForm.concept || ''}
                  onChange={e => setTxForm({ ...txForm, concept: e.target.value })}
                  placeholder="Pago factura de resinas F-4890..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Asentar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
