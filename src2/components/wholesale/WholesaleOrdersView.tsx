import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PackageCheck,
  Plus,
  Search,
  Filter,
  Columns,
  List,
  Clock,
  CheckCircle2,
  Truck,
  FileText,
  DollarSign,
  User,
  Building,
  ArrowRight,
  MoreVertical,
  Check,
  X,
  Eye,
  Trash2,
} from 'lucide-react';

interface WholesaleOrder {
  id: string;
  code: string;
  clientName: string;
  clientTaxId?: string;
  date: string;
  status: 'pedido' | 'cobrado' | 'confirmado' | 'armado' | 'facturacion' | 'remito' | 'despachado';
  total: number;
  itemsCount: number;
  paymentStatus: string;
  shippingAddress: string;
}

export const WholesaleOrdersView: React.FC = () => {
  const { store, showToast } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [orders, setOrders] = useState<WholesaleOrder[]>([
    {
      id: 'ord-1',
      code: 'PED-9081',
      clientName: 'Corralon y Ferretería El Sol',
      clientTaxId: '30-71234567-9',
      date: '06/10/2026',
      status: 'despachado',
      total: 345000,
      itemsCount: 14,
      paymentStatus: 'Pagado',
      shippingAddress: 'Av. San Martín 1420, Rosario',
    },
    {
      id: 'ord-2',
      code: 'PED-9082',
      clientName: 'Ferretería Industrial Norte',
      clientTaxId: '20-28491029-4',
      date: '07/10/2026',
      status: 'pedido',
      total: 189500,
      itemsCount: 8,
      paymentStatus: 'Pendiente',
      shippingAddress: 'Ruta 9 Km 740, Córdoba',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const columns = [
    { id: 'pedido', label: 'Pedido', sublabel: 'Nuevos pedidos', color: 'border-blue-500 bg-blue-500/10 text-blue-600' },
    { id: 'cobrado', label: 'Cobrado', sublabel: 'Pago registrado', color: 'border-teal-500 bg-teal-500/10 text-teal-600' },
    { id: 'confirmado', label: 'Confirmado', sublabel: 'Listo para preparar', color: 'border-amber-500 bg-amber-500/10 text-amber-600' },
    { id: 'armado', label: 'Armado', sublabel: 'En preparación', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-600' },
    { id: 'facturacion', label: 'Facturación', sublabel: 'Pendiente factura', color: 'border-purple-500 bg-purple-500/10 text-purple-600' },
    { id: 'remito', label: 'Remito', sublabel: 'Con remito', color: 'border-indigo-500 bg-indigo-500/10 text-indigo-600' },
    { id: 'despachado', label: 'Despachado', sublabel: 'Enviado', color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600' },
  ];

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.code.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        (o.clientTaxId && o.clientTaxId.includes(q))
      );
    }
    return true;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newTotal) {
      showToast('Por favor complete los datos del pedido mayorista', 'error');
      return;
    }
    const newOrd: WholesaleOrder = {
      id: `ord-${Date.now()}`,
      code: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: newClientName.trim(),
      date: new Date().toLocaleDateString('es-AR'),
      status: 'pedido',
      total: Number(newTotal) || 0,
      itemsCount: 5,
      paymentStatus: 'Pendiente',
      shippingAddress: newAddress.trim() || 'Dirección de entrega mayorista',
    };
    setOrders([newOrd, ...orders]);
    showToast('Pedido mayorista creado con éxito', 'success');
    setIsModalOpen(false);
    setNewClientName('');
    setNewTotal('');
    setNewAddress('');
  };

  const handleUpdateStatus = (orderId: string, nextStatus: WholesaleOrder['status']) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    showToast('Estado del pedido mayorista actualizado', 'success');
  };

  const totalOrders = orders.length;
  const newOrdersCount = orders.filter((o) => o.status === 'pedido').length;
  const inProgressCount = orders.filter((o) => ['cobrado', 'confirmado', 'armado', 'facturacion', 'remito'].includes(o.status)).length;
  const dispatchedCount = orders.filter((o) => o.status === 'despachado').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-7 h-7 text-blue-600" />
            <span>Pedidos Mayorista</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión del flujo de pedidos de distribuidora
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar pedidos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">Todos</option>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards matching exact user screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pedidos</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {totalOrders}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nuevos</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            {newOrdersCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">En Proceso</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
            {inProgressCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Despachados</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            {dispatchedCount}
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-start overflow-x-auto pb-6">
          {columns.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <div key={col.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-w-[240px]">
                {/* Column Header */}
                <div className={`p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between border-t-4 rounded-t-2xl ${col.color.split(' ')[0]}`}>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white">{col.label}</h3>
                    <p className="text-[10px] text-slate-400">{col.sublabel}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-3 space-y-3 min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar">
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{order.code}</span>
                        <span className="text-[10px] text-slate-400">{order.date}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{order.clientName}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{order.shippingAddress}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="font-mono font-black text-slate-900 dark:text-white">${order.total.toLocaleString('es-AR')}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                          {order.paymentStatus}
                        </span>
                      </div>

                      {/* Quick Move Status */}
                      <div className="pt-1 flex justify-end gap-1">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                          className="w-full text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2 text-slate-700 dark:text-slate-300 font-medium"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              Mover a: {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs italic">
                      Sin pedidos
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Cliente Mayorista</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Estado del Flujo</th>
                  <th className="py-3.5 px-4">Pago</th>
                  <th className="py-3.5 px-4 text-right">Total ($)</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{order.code}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{order.clientName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{order.date}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as any)}
                        className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-2.5 text-slate-800 dark:text-white font-medium"
                      >
                        {columns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${order.total.toLocaleString('es-AR')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Desea eliminar el pedido mayorista ${order.code}?`)) {
                            setOrders(orders.filter((o) => o.id !== order.id));
                            showToast('Pedido eliminado', 'info');
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Eliminar Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nuevo Pedido Mayorista */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Nuevo Pedido Mayorista</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Registrar un nuevo pedido en la distribuidora</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cliente Mayorista / Corralón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ferretería Industrial del Centro"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monto Total ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={newTotal}
                  onChange={(e) => setNewTotal(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dirección de Envío / Destino
                </label>
                <input
                  type="text"
                  placeholder="ej. Av. Belgrano 450, Rosario"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Crear Pedido Mayorista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
