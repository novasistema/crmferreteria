import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Package, 
  User, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Edit3,
  X
} from 'lucide-react';
import { Transport, SalesOrder, Customer } from '../types';

interface LogisticsModuleProps {
  transports: Transport[];
  salesOrders: SalesOrder[];
  customers: Customer[];
  onSaveTransport: (transport: Transport) => Promise<void>;
}

export const LogisticsModule: React.FC<LogisticsModuleProps> = ({
  transports,
  salesOrders,
  customers,
  onSaveTransport
}) => {
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [transportForm, setTransportForm] = useState<Partial<Transport>>({
    name: '',
    contactName: '',
    phone: '',
    serviceArea: '',
    vehicleType: 'Camión Chasis Playo',
    capacityKg: 10000,
    address: '',
    active: true
  });

  const activeShipments = salesOrders.filter(o => o.status === 'despachado' || o.status === 'preparando_remito');

  const handleTransportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportForm.name) return;

    const newTransport: Transport = {
      id: transportForm.id || `trans-${Date.now()}`,
      name: transportForm.name,
      contactName: transportForm.contactName || '',
      phone: transportForm.phone || '',
      serviceArea: transportForm.serviceArea || '',
      vehicleType: transportForm.vehicleType || '',
      capacityKg: Number(transportForm.capacityKg) || 10000,
      address: transportForm.address || '',
      active: true
    };

    await onSaveTransport(newTransport);
    setShowTransportModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Módulo de Transportes & Logística
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  Flota Propia & Expresos
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Asignación de expresos y camiones de fábrica a clientes, seguimiento de despachos y hojas de ruta.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setTransportForm({
                name: '',
                contactName: '',
                phone: '',
                serviceArea: '',
                vehicleType: 'Camión Chasis Playo',
                capacityKg: 10000,
                address: '',
                active: true
              });
              setShowTransportModal(true);
            }}
            className="flex items-center gap-1.5 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Registrar Empresa de Transporte
          </button>
        </div>

        {/* Quick summary of dispatches */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500 block">Empresas & Vehículos Registrados</span>
            <strong className="text-slate-900 font-mono text-base">{transports.length} unidades activas</strong>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <span className="text-blue-700 block font-semibold">Envíos en Preparación / Tránsito</span>
            <strong className="text-blue-800 font-mono text-base">{activeShipments.length} pedidos</strong>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-emerald-700 block font-semibold">Despachos Entregados (Mes)</span>
            <strong className="text-emerald-800 font-mono text-base">
              {salesOrders.filter(o => o.status === 'entregado').length} entregas
            </strong>
          </div>
        </div>
      </div>

      {/* Transport Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transports.map(t => {
          // Count assigned customers
          const assignedCount = customers.filter(c => c.transportId === t.id).length;
          const assignedOrders = salesOrders.filter(o => o.transportId === t.id && (o.status === 'despachado' || o.status === 'preparando_remito'));

          return (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">{t.name}</h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Activo
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contacto: <strong>{t.contactName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tel: <strong className="font-mono">{t.phone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Zona de Cobertura: <strong>{t.serviceArea}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>Capacidad / Tipo: <strong>{t.vehicleType} ({t.capacityKg.toLocaleString('es-AR')} kg)</strong></span>
                  </div>
                </div>

                <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                  <span>Clientes con este transporte:</span>
                  <strong className="font-mono text-slate-900">{assignedCount} asignados</strong>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-700">
                  {assignedOrders.length} envíos activos
                </span>
                <button
                  onClick={() => {
                    setTransportForm(t);
                    setShowTransportModal(true);
                  }}
                  className="text-slate-400 hover:text-slate-800 p-1"
                  title="Editar transporte"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Dispatches table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900">
            Seguimiento de Envíos en Curso
          </h3>
          <p className="text-xs text-slate-500">
            Monitoreo de pedidos despachados con choferes, expresos y códigos de guía.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Pedido</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Transporte Asignado</th>
                <th className="p-3.5">Guía / Tracking</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Total ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-800">{o.orderNumber}</td>
                  <td className="p-3.5 font-bold text-slate-900">{o.customerName}</td>
                  <td className="p-3.5 text-slate-600">{o.transportName || 'A coordinar'}</td>
                  <td className="p-3.5 font-mono text-indigo-700 font-bold">{o.trackingCode}</td>
                  <td className="p-3.5">
                    <span className="capitalize px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                      {o.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                    $ {o.total.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD TRANSPORT */}
      {showTransportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">
              {transportForm.id ? 'Editar Transporte' : 'Registrar Empresa de Transporte / Camión'}
            </h3>

            <form onSubmit={handleTransportSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Empresa / Móvil</label>
                <input
                  type="text"
                  value={transportForm.name}
                  onChange={e => setTransportForm({ ...transportForm, name: e.target.value })}
                  placeholder="Expreso Cruz del Sur..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contacto / Chofer</label>
                  <input
                    type="text"
                    value={transportForm.contactName}
                    onChange={e => setTransportForm({ ...transportForm, contactName: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={transportForm.phone}
                    onChange={e => setTransportForm({ ...transportForm, phone: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Zona de Cobertura</label>
                <input
                  type="text"
                  value={transportForm.serviceArea}
                  onChange={e => setTransportForm({ ...transportForm, serviceArea: e.target.value })}
                  placeholder="Buenos Aires, CABA, Rosario, Córdoba..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Vehículo</label>
                  <input
                    type="text"
                    value={transportForm.vehicleType}
                    onChange={e => setTransportForm({ ...transportForm, vehicleType: e.target.value })}
                    placeholder="Semirremolque sider / Utilitario"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Capacidad (kg)</label>
                  <input
                    type="number"
                    value={transportForm.capacityKg}
                    onChange={e => setTransportForm({ ...transportForm, capacityKg: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransportModal(false)}
                  className="text-xs font-semibold px-3 py-2 text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Guardar Transporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
