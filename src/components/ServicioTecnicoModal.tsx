import React, { useState } from 'react';
import { Wrench, X, Plus, Search, CheckCircle2, Clock, AlertCircle, FileText, User, Tag } from 'lucide-react';
import { Customer } from '../types';

interface ServiceTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerTaxId?: string;
  type: 'colorimetria' | 'calibracion_dosificadora' | 'soporte_obra' | 'mantenimiento_maquina';
  productBase?: string;
  targetColor?: string;
  requestedVolume?: string;
  technicianName: string;
  status: 'recibido' | 'en_proceso' | 'calidad_aprobada' | 'listo_entrega' | 'entregado';
  date: string;
  notes?: string;
}

interface ServicioTecnicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
}

export const ServicioTecnicoModal: React.FC<ServicioTecnicoModalProps> = ({
  isOpen,
  onClose,
  customers
}) => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([
    {
      id: 'st-01',
      ticketNumber: 'ST-2026-0089',
      customerName: 'Pinturerías Rex Pilar',
      customerTaxId: '30-70894562-4',
      type: 'colorimetria',
      productBase: 'Látex Exterior Acrílico Premium',
      targetColor: 'Gris Grafito NCS S 6502-B',
      requestedVolume: '6 Baldes 20L',
      technicianName: 'Ing. Damián Flores',
      status: 'calidad_aprobada',
      date: '2026-10-27',
      notes: 'Muestra testigo aprobada por arquitecto de obra.'
    },
    {
      id: 'st-02',
      ticketNumber: 'ST-2026-0090',
      customerName: 'Constructora del Norte S.A.',
      customerTaxId: '30-65489721-3',
      type: 'soporte_obra',
      productBase: 'Impermeabilizante Fibrado Frentes',
      targetColor: 'Terracota Tradicional',
      requestedVolume: '20 Baldes 20L',
      technicianName: 'Téc. Lucas Silva',
      status: 'en_proceso',
      date: '2026-10-28',
      notes: 'Verificación de adherencia sobre revoque grueso nuevo.'
    },
    {
      id: 'st-03',
      ticketNumber: 'ST-2026-0091',
      customerName: 'Pinturas del Centro',
      customerTaxId: '30-55443322-1',
      type: 'calibracion_dosificadora',
      technicianName: 'Téc. Mariano Ruiz',
      status: 'recibido',
      date: '2026-10-28',
      notes: 'Limpieza de boquillas y calibración de émbolos 1/384 oz.'
    }
  ]);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState(customers[0]?.businessName || '');
  const [newType, setNewType] = useState<ServiceTicket['type']>('colorimetria');
  const [newBase, setNewBase] = useState('Látex Lavable Interior Premium');
  const [newColor, setNewColor] = useState('');
  const [newVolume, setNewVolume] = useState('1 Balde 20L');
  const [newTech, setNewTech] = useState('Ing. Damián Flores');
  const [newNotes, setNewNotes] = useState('');

  if (!isOpen) return null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: ServiceTicket = {
      id: `st-${Date.now()}`,
      ticketNumber: `ST-2026-${String(Math.floor(Math.random() * 899 + 100))}`,
      customerName: newCustomerName,
      type: newType,
      productBase: newBase,
      targetColor: newColor || 'A definir según muestra física',
      requestedVolume: newVolume,
      technicianName: newTech,
      status: 'recibido',
      date: new Date().toISOString().split('T')[0],
      notes: newNotes.trim() || undefined
    };

    setTickets(prev => [newTicket, ...prev]);
    setShowNewForm(false);
    setNewColor('');
    setNewNotes('');
  };

  const handleUpdateStatus = (id: string, status: ServiceTicket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Servicio Técnico & Tintometría</h3>
              <p className="text-xs text-slate-400">
                Órdenes de preparación de muestras de color, control de calidad y asistencia de dosificadoras
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-semibold">
            {tickets.length} órdenes registradas en laboratorio
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showNewForm ? 'Ver Listado' : 'Nueva Orden Técnica'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {showNewForm ? (
            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente Solicitante:</label>
                  <select
                    value={newCustomerName}
                    onChange={e => setNewCustomerName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.businessName}>{c.businessName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Servicio:</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-medium"
                  >
                    <option value="colorimetria">Colorimetría / Muestra Color a Medida</option>
                    <option value="calibracion_dosificadora">Calibración Máquina Tintométrica</option>
                    <option value="soporte_obra">Peritaje / Asistencia Técnica en Obra</option>
                    <option value="mantenimiento_maquina">Mantenimiento de Agitador / Mezclador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base / Producto a Emplear:</label>
                  <input
                    type="text"
                    value={newBase}
                    onChange={e => setNewBase(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Color Solicitado / Código Patrón:</label>
                  <input
                    type="text"
                    placeholder="Ej: RAL 7016, NCS S 2005-Y20R o según muestra en balde"
                    value={newColor}
                    onChange={e => setNewColor(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Volumen / Envases:</label>
                  <input
                    type="text"
                    value={newVolume}
                    onChange={e => setNewVolume(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Técnico Asignado:</label>
                  <select
                    value={newTech}
                    onChange={e => setNewTech(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Ing. Damián Flores">Ing. Damián Flores (Laboratorio)</option>
                    <option value="Téc. Lucas Silva">Téc. Lucas Silva (Colorimetría)</option>
                    <option value="Téc. Mariano Ruiz">Téc. Mariano Ruiz (Mantenimiento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones Técnicas:</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Detalles del sustrato, brillo deseado o instrucciones para la cuadrilla de producción..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Guardar Orden Técnica
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {tickets.map(t => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-orange-300 transition-all shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {t.ticketNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {t.customerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={t.status}
                        onChange={e => handleUpdateStatus(t.id, e.target.value as any)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border ${
                          t.status === 'calidad_aprobada' || t.status === 'entregado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : t.status === 'en_proceso'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="recibido">🟡 Recibido</option>
                        <option value="en_proceso">🔵 En Formulación</option>
                        <option value="calidad_aprobada">🟢 Calidad Aprobada</option>
                        <option value="listo_entrega">🚚 Listo para Entrega</option>
                        <option value="entregado">✅ Entregado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 mb-2">
                    <div>
                      <strong>Servicio:</strong> {t.type.replace('_', ' ').toUpperCase()}
                    </div>
                    {t.targetColor && (
                      <div>
                        <strong>Color solicitado:</strong> <span className="text-orange-700 font-bold">{t.targetColor}</span>
                      </div>
                    )}
                    {t.productBase && (
                      <div>
                        <strong>Base:</strong> {t.productBase} ({t.requestedVolume})
                      </div>
                    )}
                    <div>
                      <strong>Técnico:</strong> {t.technicianName} · Fecha: {t.date}
                    </div>
                  </div>

                  {t.notes && (
                    <div className="bg-slate-50 p-2 rounded text-[11px] text-slate-600 border border-slate-100">
                      <em>{t.notes}</em>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Nova Systems · Módulo Industrial de Laboratorio & Asistencia Técnica</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
