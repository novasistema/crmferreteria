import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Building,
  User,
  X,
  Check,
} from 'lucide-react';

interface ShipmentItem {
  id: string;
  trackingNumber: string;
  type: 'Minorista' | 'Mayorista';
  recipient: string;
  destination: string;
  transport: string;
  trackingCode: string;
  status: 'Pendiente' | 'Entregado' | 'Devuelto / Cancelado';
  date: string;
}

export const WholesaleShippingView: React.FC = () => {
  const { showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [shipments, setShipments] = useState<ShipmentItem[]>([
    {
      id: 'sh-1',
      trackingNumber: 'ENV-000003',
      type: 'Minorista',
      recipient: 'Jorge Manganiello',
      destination: '-',
      transport: '-',
      trackingCode: '-',
      status: 'Pendiente',
      date: '19/08/26, 05:28 p.m.',
    },
    {
      id: 'sh-2',
      trackingNumber: 'ENV-000002',
      type: 'Minorista',
      recipient: 'Miguel Angel Llapur',
      destination: '-',
      transport: 'Andriani',
      trackingCode: '-',
      status: 'Pendiente',
      date: '14/08/26, 06:23 p.m.',
    },
    {
      id: 'sh-3',
      trackingNumber: 'ENV-000001',
      type: 'Mayorista',
      recipient: 'Tomas Dominguez',
      destination: 'Diego Pombo 5646, San Martín',
      transport: '-',
      trackingCode: '-',
      status: 'Entregado',
      date: '31/03/26, 04:00 p.m.',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newType, setNewType] = useState<'Minorista' | 'Mayorista'>('Minorista');
  const [newDestination, setNewDestination] = useState('');
  const [newTransport, setNewTransport] = useState('');

  const filteredShipments = shipments.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        s.recipient.toLowerCase().includes(q) ||
        s.transport.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim()) {
      showToast('Por favor ingrese el destinatario del envío', 'error');
      return;
    }
    const nextNum = shipments.length + 1;
    const trackingNum = `ENV-${String(nextNum).padStart(6, '0')}`;
    const newSh: ShipmentItem = {
      id: `sh-${Date.now()}`,
      trackingNumber: trackingNum,
      type: newType,
      recipient: newRecipient.trim(),
      destination: newDestination.trim() || '-',
      transport: newTransport.trim() || '-',
      trackingCode: '-',
      status: 'Pendiente',
      date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
    };
    setShipments([newSh, ...shipments]);
    showToast('Envío registrado con éxito', 'success');
    setIsModalOpen(false);
    setNewRecipient('');
    setNewDestination('');
    setNewTransport('');
  };

  const handleDelete = (id: string, num: string) => {
    if (window.confirm(`¿Desea eliminar el envío ${num}?`)) {
      setShipments(shipments.filter((s) => s.id !== id));
      showToast('Envío eliminado', 'info');
    }
  };

  const totalCount = shipments.length;
  const activeCount = shipments.filter((s) => s.status === 'Pendiente').length;
  const deliveredCount = shipments.filter((s) => s.status === 'Entregado').length;
  const cancelledCount = shipments.filter((s) => s.status === 'Devuelto / Cancelado').length;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full">
      {/* Header matching exact user screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-amber-500" />
            <span>Gestión de Envíos</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administrá los envíos minoristas y mayoristas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Envío</span>
        </button>
      </div>

      {/* Top 4 KPI Summary Cards matching exact screenshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Envíos</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {totalCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activos</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            {activeCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Entregados</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            {deliveredCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Devueltos / Cancelados</span>
          <div className="mt-2 text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
            {cancelledCount}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nro, destinatario, tracking, transporte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium w-full sm:w-auto"
        >
          <option value="all">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Entregado">Entregado</option>
          <option value="Devuelto / Cancelado">Devuelto / Cancelado</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium w-full sm:w-auto"
        >
          <option value="all">Todos (Tipos)</option>
          <option value="Minorista">Minorista</option>
          <option value="Mayorista">Mayorista</option>
        </select>
      </div>

      {/* Shipments Table matching exact user screenshot */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3.5 px-4">Nro. Envío</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Destinatario</th>
                <th className="py-3.5 px-4">Destino</th>
                <th className="py-3.5 px-4">Transporte</th>
                <th className="py-3.5 px-4">Tracking</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredShipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {shipment.trackingNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        shipment.type === 'Minorista'
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                      }`}
                    >
                      {shipment.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {shipment.recipient}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">{shipment.destination}</td>
                  <td className="py-3.5 px-4 text-slate-500">{shipment.transport}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{shipment.trackingCode}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                        shipment.status === 'Entregado'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : shipment.status === 'Pendiente'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {shipment.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{shipment.date}</td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => showToast(`Detalle del envío ${shipment.trackingNumber}`, 'info')}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Ver Envío"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(shipment.id, shipment.trackingNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Eliminar Envío"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Envío */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Registrar Nuevo Envío</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Crear un envío minorista o mayorista</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Envío
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                >
                  <option value="Minorista">Minorista</option>
                  <option value="Mayorista">Mayorista</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destinatario *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Pérez"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Destino / Dirección
                </label>
                <input
                  type="text"
                  placeholder="ej. Av. Corrientes 1234, CABA"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Transporte / Empresa de Envío
                </label>
                <input
                  type="text"
                  placeholder="ej. Andriani, Oca, Expreso..."
                  value={newTransport}
                  onChange={(e) => setNewTransport(e.target.value)}
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
                  Registrar Envío
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
