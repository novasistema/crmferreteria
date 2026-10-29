import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Building2, 
  Package, 
  CheckCircle2, 
  Clock, 
  X, 
  Truck, 
  Search 
} from 'lucide-react';
import { Product } from '../../types';

interface TransferRecord {
  id: string;
  code: string;
  originWarehouse: string;
  destinationWarehouse: string;
  date: string;
  status: 'completada' | 'en_transito' | 'pendiente';
  itemsCount: number;
  notes?: string;
}

const INITIAL_TRANSFERS: TransferRecord[] = [
  {
    id: 'tr-1',
    code: 'TRF-2026-0042',
    originWarehouse: 'CASA CENTRAL - Depósito Central',
    destinationWarehouse: 'SUC-01 - Bruzzone Express',
    date: '28/10/2026 14:30',
    status: 'completada',
    itemsCount: 15,
    notes: 'Reposición semanal de pinturas y selladores'
  },
  {
    id: 'tr-2',
    code: 'TRF-2026-0041',
    originWarehouse: 'CASA CENTRAL - Depósito Central',
    destinationWarehouse: 'DEP-01 - Deposito',
    date: '27/10/2026 09:15',
    status: 'en_transito',
    itemsCount: 8,
    notes: 'Transferencia de herramientas eléctricas'
  },
  {
    id: 'tr-3',
    code: 'TRF-2026-0040',
    originWarehouse: 'SUC-01 - Bruzzone Express',
    destinationWarehouse: 'CASA CENTRAL - Depósito Central',
    date: '25/10/2026 16:45',
    status: 'completada',
    itemsCount: 3,
    notes: 'Devolución de sobrantes'
  }
];

export const TransferenciasModule: React.FC<{ products: Product[] }> = ({ products }) => {
  const [transfers, setTransfers] = useState<TransferRecord[]>(INITIAL_TRANSFERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [origin, setOrigin] = useState('CASA CENTRAL - Depósito Central');
  const [dest, setDest] = useState('SUC-01 - Bruzzone Express');
  const [notes, setNotes] = useState('');

  const handleCreate = () => {
    if (origin === dest) {
      alert('El depósito de origen y destino no pueden ser el mismo.');
      return;
    }
    const newTr: TransferRecord = {
      id: `tr-${Date.now()}`,
      code: `TRF-2026-00${transfers.length + 43}`,
      originWarehouse: origin,
      destinationWarehouse: dest,
      date: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      status: 'en_transito',
      itemsCount: 5,
      notes: notes.trim() || 'Transferencia inter-depósito'
    };
    setTransfers([newTr, ...transfers]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-slate-800" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Transferencias</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Movimientos de stock entre sucursales y depósitos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Transferencia</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3">Historial de Transferencias</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Origen</th>
                <th className="py-2.5 px-3">Destino</th>
                <th className="py-2.5 px-3 text-center">Artículos</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{t.code}</td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{t.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{t.originWarehouse}</td>
                  <td className="py-3 px-3 font-semibold text-blue-700">{t.destinationWarehouse}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">{t.itemsCount} items</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      t.status === 'completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status === 'completada' ? 'Completada' : 'En tránsito'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{t.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nueva Transferencia Inter-Depósito</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Depósito Origen</label>
                <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="CASA CENTRAL - Depósito Central">CASA CENTRAL - Depósito Central</option>
                  <option value="SUC-01 - Bruzzone Express">SUC-01 - Bruzzone Express</option>
                  <option value="DEP-01 - Deposito">DEP-01 - Deposito</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Depósito Destino</label>
                <select value={dest} onChange={e => setDest(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="SUC-01 - Bruzzone Express">SUC-01 - Bruzzone Express</option>
                  <option value="CASA CENTRAL - Depósito Central">CASA CENTRAL - Depósito Central</option>
                  <option value="DEP-01 - Deposito">DEP-01 - Deposito</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Motivo</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Reposición de fin de semana..." className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleCreate} className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Emitir Transferencia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
