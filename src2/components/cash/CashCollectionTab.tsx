import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Calendar,
  Building,
  TrendingUp,
  Receipt,
  CheckCircle2,
  DollarSign,
  PieChart,
} from 'lucide-react';

export const CashCollectionTab: React.FC = () => {
  const { store, setActiveModule } = useApp();

  const [selectedRegisterId, setSelectedRegisterId] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');

  // Realistic data points matching Screenshot 3
  const paymentMethodsStats = [
    {
      id: 'current_account',
      name: 'Cuenta Corriente',
      operations: 1,
      percentage: 49.2,
      amount: 190999.03,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      lightBg: 'bg-indigo-50',
    },
    {
      id: 'cash',
      name: 'Efectivo',
      operations: 8,
      percentage: 41.5,
      amount: 160945.6,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-600',
      lightBg: 'bg-emerald-50',
    },
    {
      id: 'mp_transfer',
      name: 'MercadoPago Transferencia',
      operations: 5,
      percentage: 8.8,
      amount: 34099.06,
      color: 'bg-sky-600',
      textColor: 'text-sky-600',
      lightBg: 'bg-sky-50',
    },
    {
      id: 'card',
      name: 'Tarjeta',
      operations: 1,
      percentage: 0.5,
      amount: 2000.0,
      color: 'bg-amber-600',
      textColor: 'text-amber-600',
      lightBg: 'bg-amber-50',
    },
  ];

  const totalAmount = paymentMethodsStats.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOperations = paymentMethodsStats.reduce((acc, curr) => acc + curr.operations, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            Recaudación por Forma de Pago
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribución cuantitativa y porcentual de las ventas y cobros según medio de pago.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRegisterId}
            onChange={(e) => setSelectedRegisterId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="all">Todas las Cajas y Sucursales</option>
            {store.cashRegisters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.branchName || 'Central'})
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
          </select>

          <button
            onClick={() => setActiveModule('collection_methods')}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
            <span>Configurar Métodos</span>
          </button>
        </div>
      </div>

      {/* Global Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Recaudado</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Operaciones</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {totalOperations} <span className="text-base font-normal text-slate-500">comprobantes</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Receipt className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-4 h-4 text-indigo-600" />
          Composición de los Cobros
        </h3>

        <div className="space-y-6">
          {paymentMethodsStats.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-bold text-slate-800">{item.name}</span>
                  <span className="text-xs text-slate-400">
                    ({item.operations} {item.operations === 1 ? 'operación' : 'operaciones'} - {item.percentage}%)
                  </span>
                </div>
                <span className="text-base font-black text-slate-900">
                  ${item.amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
