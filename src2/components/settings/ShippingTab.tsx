import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShippingCarrier } from '../../types';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  X,
  Save,
} from 'lucide-react';

export const ShippingTab: React.FC = () => {
  const { store, showToast } = useApp();
  const carriers = store.shippingCarriers || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<ShippingCarrier | null>(null);

  const [form, setForm] = useState<Omit<ShippingCarrier, 'id'>>({
    name: '',
    cuit: '',
    phone: '',
    email: '',
    address: '',
    baseCost: 0,
    estimatedDays: '24 a 48 hs',
    pickupSchedule: 'Lunes a Viernes de 9 a 17 hs',
    notes: '',
    active: true,
  });

  const handleOpenCreate = () => {
    setEditingCarrier(null);
    setForm({
      name: '',
      cuit: '',
      phone: '',
      email: '',
      address: '',
      baseCost: 0,
      estimatedDays: '24 a 48 hs',
      pickupSchedule: 'Lunes a Viernes de 9 a 17 hs',
      notes: '',
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (carrier: ShippingCarrier) => {
    setEditingCarrier(carrier);
    setForm({
      name: carrier.name,
      cuit: carrier.cuit || '',
      phone: carrier.phone || '',
      email: carrier.email || '',
      address: carrier.address || '',
      baseCost: carrier.baseCost,
      estimatedDays: carrier.estimatedDays || '',
      pickupSchedule: carrier.pickupSchedule || '',
      notes: carrier.notes || '',
      active: carrier.active,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Eliminar la empresa de transporte "${name}"?`)) {
      store.deleteShippingCarrier(id);
      showToast(`Empresa "${name}" eliminada`, 'info');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Ingresá el nombre del transporte', 'error');
      return;
    }

    const carrierToSave: ShippingCarrier = {
      id: editingCarrier ? editingCarrier.id : `carrier-${Date.now()}`,
      name: form.name.trim(),
      cuit: form.cuit,
      phone: form.phone,
      email: form.email,
      address: form.address,
      baseCost: Number(form.baseCost) || 0,
      estimatedDays: form.estimatedDays,
      pickupSchedule: form.pickupSchedule,
      notes: form.notes,
      active: form.active,
    };

    store.saveShippingCarrier(carrierToSave);
    setModalOpen(false);
    showToast(
      editingCarrier
        ? 'Transporte actualizado exitosamente'
        : 'Empresa de transporte agregada con éxito',
      'success'
    );
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Header matching Image 5 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Transportes / Empresas de Envío</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configurá los transportes disponibles para despachar pedidos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Transporte</span>
          </button>
        </div>

        {/* Content Section */}
        {carriers.length === 0 ? (
          /* Empty State exactly like Image 5 */
          <div className="py-24 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              No hay transportes configurados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Agregá tu primer transporte para poder asignarlo a los pedidos.
            </p>
          </div>
        ) : (
          /* List of carriers if existing */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {carriers.map((carrier) => (
              <div
                key={carrier.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {carrier.name}
                      </h4>
                      {carrier.cuit && (
                        <p className="text-[11px] font-mono text-slate-500">
                          CUIT: {carrier.cuit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(carrier)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar transporte"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(carrier.id, carrier.name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar transporte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-1">
                  {carrier.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{carrier.phone}</span>
                    </div>
                  )}
                  {carrier.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{carrier.email}</span>
                    </div>
                  )}
                  {carrier.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{carrier.address}</span>
                    </div>
                  )}
                  {carrier.estimatedDays && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Entrega estimada: {carrier.estimatedDays}</span>
                    </div>
                  )}
                </div>

                {carrier.baseCost > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Costo base:</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      ${carrier.baseCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar / Editar Transporte */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  {editingCarrier ? 'Editar Transporte' : 'Nuevo Transporte'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre de la Empresa de Transporte *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Expreso San Juan / Andreani / Flete Local"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    CUIT
                  </label>
                  <input
                    type="text"
                    value={form.cuit}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Ej: 3584123456"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="despachos@transporte.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Costo Base ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.baseCost}
                    onChange={(e) => setForm({ ...form, baseCost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dirección del Depósito / Sucursal
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ej: Av. Sabattini 1450"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Horarios de entrega, condiciones especiales..."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
