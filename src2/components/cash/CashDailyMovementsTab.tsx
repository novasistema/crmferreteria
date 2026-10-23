import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  CreditCard,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Filter,
  DollarSign,
  Receipt,
  Search,
  Building,
} from 'lucide-react';

interface DayMovementGroup {
  dateKey: string; // '2026-08-28'
  dayLabel: string; // 'viernes 28/08/2026'
  count: number;
  inflows: number;
  outflows: number;
  net: number;
  movements: {
    id: string;
    time: string;
    concept: string;
    boxName: string;
    paymentMethod: string;
    user: string;
    amount: number;
    type: 'inflow' | 'outflow';
  }[];
}

export const CashDailyMovementsTab: React.FC = () => {
  const { store } = useApp();

  const [selectedBoxId, setSelectedBoxId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [expandedDayKeys, setExpandedDayKeys] = useState<Set<string>>(new Set(['2026-08-28']));

  const toggleDayExpanded = (key: string) => {
    setExpandedDayKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Realistic day-by-day dataset matching Screenshot 6
  const dailyGroups: DayMovementGroup[] = [
    {
      dateKey: '2026-08-28',
      dayLabel: 'viernes 28/08/2026',
      count: 17,
      inflows: 1741492.19,
      outflows: 0.0,
      net: 1741492.19,
      movements: [
        {
          id: 'm-28-1',
          time: '18:45',
          concept: 'Venta Mostrador #0001-00014902 (Amoladora DeWalt + Discos)',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 145000.0,
          type: 'inflow',
        },
        {
          id: 'm-28-2',
          time: '17:20',
          concept: 'Cobro Transferencia MercadoPago #TR-98214 (Pinturas & Selladores)',
          boxName: 'Caja mostrador',
          paymentMethod: 'Transferencia MP',
          user: 'Carlos Mendoza',
          amount: 34099.06,
          type: 'inflow',
        },
        {
          id: 'm-28-3',
          time: '15:10',
          concept: 'Transferencia Bancaria Galicia Factura A #0001-00012900 Constructora',
          boxName: 'Banco Galicia',
          paymentMethod: 'Transferencia',
          user: 'Mauricio Serassio',
          amount: 1544447.53,
          type: 'inflow',
        },
        {
          id: 'm-28-4',
          time: '11:30',
          concept: 'Cobro Posnet Débito Mostrador (Tornillería y Fijaciones)',
          boxName: 'Caja mostrador',
          paymentMethod: 'Tarjeta',
          user: 'Carlos Mendoza',
          amount: 2000.0,
          type: 'inflow',
        },
        {
          id: 'm-28-5',
          time: '09:15',
          concept: 'Venta Mostrador Efectivo (Herramientas Manuales)',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 15945.6,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-27',
      dayLabel: 'jueves 27/08/2026',
      count: 29,
      inflows: 1123115.62,
      outflows: 0.0,
      net: 1123115.62,
      movements: [
        {
          id: 'm-27-1',
          time: '19:10',
          concept: 'Venta Mostrador Mayorista Sanitarios',
          boxName: 'Caja mostrador',
          paymentMethod: 'Transferencia',
          user: 'Carlos Mendoza',
          amount: 680000.0,
          type: 'inflow',
        },
        {
          id: 'm-27-2',
          time: '16:00',
          concept: 'Cobranza Efectivo Mostrador',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 443115.62,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-26',
      dayLabel: 'miércoles 26/08/2026',
      count: 22,
      inflows: 294108.06,
      outflows: 0.0,
      net: 294108.06,
      movements: [
        {
          id: 'm-26-1',
          time: '18:00',
          concept: 'Ventas del día Caja Sucursal',
          boxName: 'Caja Sucursal',
          paymentMethod: 'Efectivo',
          user: 'Mauri Serassio',
          amount: 294108.06,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-25',
      dayLabel: 'martes 25/08/2026',
      count: 33,
      inflows: 1034757.57,
      outflows: 0.0,
      net: 1034757.57,
      movements: [
        {
          id: 'm-25-1',
          time: '17:30',
          concept: 'Cobranza Cheque y Transferencias Galicia',
          boxName: 'Banco Galicia',
          paymentMethod: 'Transferencia',
          user: 'Mauricio Serassio',
          amount: 1034757.57,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-24',
      dayLabel: 'lunes 24/08/2026',
      count: 38,
      inflows: 516967.05,
      outflows: 0.0,
      net: 516967.05,
      movements: [
        {
          id: 'm-24-1',
          time: '18:15',
          concept: 'Recaudación Lunes Mostrador & Sucursales',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 516967.05,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-22',
      dayLabel: 'sábado 22/08/2026',
      count: 33,
      inflows: 975131.83,
      outflows: 0.0,
      net: 975131.83,
      movements: [
        {
          id: 'm-22-1',
          time: '13:00',
          concept: 'Cierre Sábado Mostrador',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 975131.83,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-21',
      dayLabel: 'viernes 21/08/2026',
      count: 25,
      inflows: 526592.62,
      outflows: 0.0,
      net: 526592.62,
      movements: [
        {
          id: 'm-21-1',
          time: '18:30',
          concept: 'Ventas Mostrador y Transferencias',
          boxName: 'Caja mostrador',
          paymentMethod: 'Transferencia',
          user: 'Carlos Mendoza',
          amount: 526592.62,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-20',
      dayLabel: 'jueves 20/08/2026',
      count: 25,
      inflows: 348707.2,
      outflows: 18000.0,
      net: 330707.2,
      movements: [
        {
          id: 'm-20-1',
          time: '17:00',
          concept: 'Venta Mostrador',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 348707.2,
          type: 'inflow',
        },
        {
          id: 'm-20-2',
          time: '11:00',
          concept: 'Gasto Combustible Reparto',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 18000.0,
          type: 'outflow',
        },
      ],
    },
    {
      dateKey: '2026-08-19',
      dayLabel: 'miércoles 19/08/2026',
      count: 28,
      inflows: 538762.85,
      outflows: 0.0,
      net: 538762.85,
      movements: [
        {
          id: 'm-19-1',
          time: '18:00',
          concept: 'Cobros del día',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 538762.85,
          type: 'inflow',
        },
      ],
    },
    {
      dateKey: '2026-08-18',
      dayLabel: 'martes 18/08/2026',
      count: 35,
      inflows: 273762.64,
      outflows: 0.0,
      net: 273762.64,
      movements: [
        {
          id: 'm-18-1',
          time: '18:00',
          concept: 'Ventas de mostrador',
          boxName: 'Caja mostrador',
          paymentMethod: 'Efectivo',
          user: 'Carlos Mendoza',
          amount: 273762.64,
          type: 'inflow',
        },
      ],
    },
  ];

  const totalGlobalInflows = 16823896.19;
  const totalGlobalOutflows = 18000.0;
  const totalGlobalNet = 16805896.19;

  return (
    <div className="space-y-6">
      {/* Top Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Movimientos Diarios de Dinero
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoría cronológica y resumen consolidado de ingresos, egresos y neto diario.
            </p>
          </div>

          {/* Quick Period Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setSelectedPeriodTab('day')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                selectedPeriodTab === 'day' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setSelectedPeriodTab('week')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                selectedPeriodTab === 'week' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setSelectedPeriodTab('month')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                selectedPeriodTab === 'month' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setSelectedPeriodTab('year')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                selectedPeriodTab === 'year' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Año
            </button>
            <button
              onClick={() => setSelectedPeriodTab('custom')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                selectedPeriodTab === 'custom' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Caja / Cuenta</label>
            <select
              value={selectedBoxId}
              onChange={(e) => setSelectedBoxId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              <option value="all">Todas las Cajas y Cuentas</option>
              {store.cashRegisters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              {store.moneyBoxes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Medio de Pago</label>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              <option value="all">Todos los Medios de Pago</option>
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia Bancaria / QR</option>
              <option value="card">Tarjetas Débito / Crédito</option>
              <option value="check">Cheque</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <div className="w-full p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-900 flex items-center justify-between">
              <span>Período Activo: 18/08/2026 - 28/08/2026</span>
              <span className="text-[11px] text-indigo-700 font-normal">10 jornadas contables</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Totals KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Ingresos</span>
            <span className="text-2xl font-black text-emerald-800 mt-1 block">
              +${totalGlobalInflows.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Egresos</span>
            <span className="text-2xl font-black text-rose-800 mt-1 block">
              -${totalGlobalOutflows.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Neto Período</span>
            <span className="text-2xl font-black text-indigo-950 mt-1 block">
              ${totalGlobalNet.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Accordion List of Days */}
      <div className="space-y-3">
        {dailyGroups.map((day) => {
          const isExpanded = expandedDayKeys.has(day.dateKey);

          return (
            <div
              key={day.dateKey}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all"
            >
              {/* Day Header Row */}
              <div
                onClick={() => toggleDayExpanded(day.dateKey)}
                className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 capitalize">{day.dayLabel}</h3>
                    <span className="text-xs text-slate-400 font-medium">
                      {day.count} {day.count === 1 ? 'movimiento' : 'movimientos'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Ingresos</span>
                    <span className="font-bold text-emerald-600">
                      +${day.inflows.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Egresos</span>
                    <span className="font-bold text-rose-600">
                      -${day.outflows.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right pl-3 border-l border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Neto</span>
                    <span className="font-black text-slate-900 text-sm">
                      ${day.net.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable Movements Detail */}
              {isExpanded && (
                <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-2">
                  {day.movements.map((mov) => (
                    <div
                      key={mov.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600 font-bold">
                          {mov.time}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 block">{mov.concept}</span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{mov.boxName}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-medium">{mov.paymentMethod}</span>
                            <span>•</span>
                            <span>{mov.user}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black text-sm ${
                            mov.type === 'inflow' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {mov.type === 'inflow' ? '+' : '-'}$
                          {mov.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
