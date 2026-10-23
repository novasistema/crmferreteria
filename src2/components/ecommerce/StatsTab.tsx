import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Truck,
  DollarSign,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'];

export const StatsTab: React.FC = () => {
  const { store } = useApp();
  const orders = store.ecommerceOrders;
  const [timeRange, setTimeRange] = useState('30days');

  // KPIs
  const validOrders = orders.filter((o) => o.status !== 'Cancelado');
  const totalOrdersCount = validOrders.length;
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const averageTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  const deliveredCount = orders.filter((o) => o.status === 'Entregado').length;
  const deliveryRate = totalOrdersCount > 0 ? (deliveredCount / totalOrdersCount) * 100 : 0;

  // Chart data: Sales by date
  const salesByDateData = [
    { date: '01/08', ventas: 0, minorista: 0, mayorista: 0 },
    { date: '05/08', ventas: 0, minorista: 0, mayorista: 0 },
    { date: '10/08', ventas: 0, minorista: 0, mayorista: 0 },
    { date: '14/08', ventas: 53245.64, minorista: 53245.64, mayorista: 0 },
    { date: '18/08', ventas: 0, minorista: 0, mayorista: 0 },
    { date: '22/08', ventas: 0, minorista: 0, mayorista: 0 },
    { date: '28/08', ventas: 0, minorista: 0, mayorista: 0 },
  ];

  // Chart data: By Channel
  const channelData = [
    { name: 'Minorista (Web)', value: totalRevenue, color: '#f59e0b' },
    { name: 'Mayorista (Distribuidora)', value: 0, color: '#3b82f6' },
  ];

  // Chart data: Order Status
  const statusData = [
    { name: 'Enviado', count: orders.filter((o) => o.status === 'Enviado').length },
    { name: 'Pendiente', count: orders.filter((o) => o.status === 'Pendiente').length },
    { name: 'Entregado', count: orders.filter((o) => o.status === 'Entregado').length },
    { name: 'Cancelado', count: orders.filter((o) => o.status === 'Cancelado').length },
  ];

  // Chart data: Payment Method
  const paymentData = [
    { name: 'Transferencia', total: 22122.82 },
    { name: 'MercadoPago / Online', total: 31122.82 },
    { name: 'Efectivo', total: 0 },
  ];

  // Top Products sold
  const topProducts = [
    {
      code: '305006',
      name: 'ARCO SIERRA JUNIOR 6"',
      units: 3,
      revenue: 20290.80,
    },
    {
      code: '305412',
      name: 'ARCO SIERRA PROF 12"',
      units: 1,
      revenue: 20200.22,
    },
    {
      code: '207209',
      name: 'JUEGO LLAVE ALLEN X 9PZ',
      units: 1,
      revenue: 8595.62,
    },
    {
      code: '100903',
      name: 'JUEGO DE PINZAS (ALICATE + PUNTA + UNIVERSAL)',
      units: 2,
      revenue: 54003.52,
    },
    {
      code: '154810',
      name: 'JUEGO LLAVE CRIQUE 1/4" X 12PZ',
      units: 2,
      revenue: 67793.88,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Range filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Período de Análisis</span>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
        >
          <option value="30days">Últimos 30 días</option>
          <option value="thisMonth">Este Mes</option>
          <option value="7days">Últimos 7 días</option>
          <option value="all">Todo el historial</option>
        </select>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{totalOrdersCount}</span>
            <p className="text-xs font-semibold text-slate-400">Total Pedidos</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-400">
              ${totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs font-semibold text-slate-400">Facturación Total</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">
              ${averageTicket.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs font-semibold text-slate-400">Ticket Promedio</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{deliveryRate.toFixed(1)}%</span>
            <p className="text-xs font-semibold text-slate-400">Tasa de Entrega</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Day Area Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Evolución de Ventas Diarias ($)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDateData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')}`, 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Channel Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Ventas por Canal
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')}`, 'Total']}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300 font-semibold">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Pedidos por Estado
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} name="Cantidad de Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payments by method */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-400" />
            Facturación por Medio de Pago ($)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-AR')}`, 'Facturación']}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Total Facturado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top 20 Best Sellers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Top Productos Más Vendidos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Producto</th>
                <th className="p-3">Código</th>
                <th className="p-3 text-center">Unidades Vendidas</th>
                <th className="p-3 text-right">Facturación Generada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-amber-400">{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-200">{p.name}</td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{p.code}</td>
                  <td className="p-3 text-center font-bold text-slate-300">{p.units} u.</td>
                  <td className="p-3 text-right font-black text-amber-400">
                    ${p.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
