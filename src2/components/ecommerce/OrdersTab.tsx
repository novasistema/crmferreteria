import React, { useState } from 'react';
import { EcommerceOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Search,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  DollarSign,
  Filter,
} from 'lucide-react';
import { OrderDetailModal } from './OrderDetailModal';

export const OrdersTab: React.FC = () => {
  const { store } = useApp();
  const orders = store.ecommerceOrders;

  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<EcommerceOrder | null>(null);

  const filtered = orders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      o.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'all' || o.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por código de pedido, cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Channel */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los Canales</option>
            <option value="Minorista">Minorista (Tienda Web)</option>
            <option value="Mayorista">Mayorista (Distribuidora)</option>
            <option value="MercadoLibre">MercadoLibre</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Preparando">Preparando</option>
            <option value="Enviado">Enviado</option>
            <option value="Entregado">Entregado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">ID Pedido</th>
                <th className="p-3">Canal</th>
                <th className="p-3">Cliente</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Pago</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No hay pedidos registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-200">{o.orderCode}</td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {o.channel}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-200">{o.clientName}</div>
                      <div className="text-[10px] text-slate-500">{o.clientEmail}</div>
                    </td>

                    <td className="p-3 text-right font-black text-amber-400">
                      ${o.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          o.status === 'Enviado'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : o.status === 'Entregado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : o.status === 'Cancelado'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : o.status === 'Preparando'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {o.status === 'Enviado' && <Truck className="w-3 h-3" />}
                        {o.status === 'Entregado' && <CheckCircle2 className="w-3 h-3" />}
                        {o.status === 'Cancelado' && <XCircle className="w-3 h-3" />}
                        {o.status === 'Pendiente' && <Clock className="w-3 h-3" />}
                        {o.status}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          o.paymentStatus === 'Pagado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : o.paymentStatus === 'Rechazado'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>

                    <td className="p-3 text-slate-400 text-[11px]">{o.date}</td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-bold rounded-lg transition-colors flex items-center gap-1 mx-auto text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
