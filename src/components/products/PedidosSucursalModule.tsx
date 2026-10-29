import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Building2, 
  Package, 
  CheckCircle2, 
  Clock, 
  X, 
  Search,
  ShoppingCart
} from 'lucide-react';
import { Product } from '../../types';

interface BranchOrderRecord {
  id: string;
  orderNumber: string;
  branchName: string;
  targetWarehouse: string;
  date: string;
  status: 'pendiente' | 'preparado' | 'despachado' | 'entregado';
  itemsCount: number;
  totalUnits: number;
}

const INITIAL_BRANCH_ORDERS: BranchOrderRecord[] = [
  {
    id: 'bo-1',
    orderNumber: 'PED-SUC-0021',
    branchName: 'SUC-01 - Bruzzone Express',
    targetWarehouse: 'CASA CENTRAL - Depósito Central',
    date: '29/10/2026 08:30',
    status: 'pendiente',
    itemsCount: 12,
    totalUnits: 84
  },
  {
    id: 'bo-2',
    orderNumber: 'PED-SUC-0020',
    branchName: 'DEP-01 - Deposito',
    targetWarehouse: 'CASA CENTRAL - Depósito Central',
    date: '28/10/2026 15:45',
    status: 'despachado',
    itemsCount: 6,
    totalUnits: 30
  }
];

export const PedidosSucursalModule: React.FC<{ products: Product[] }> = ({ products }) => {
  const [orders, setOrders] = useState<BranchOrderRecord[]>(INITIAL_BRANCH_ORDERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchName, setBranchName] = useState('SUC-01 - Bruzzone Express');
  const [notes, setNotes] = useState('');

  const handleCreate = () => {
    const newOrd: BranchOrderRecord = {
      id: `bo-${Date.now()}`,
      orderNumber: `PED-SUC-00${orders.length + 22}`,
      branchName,
      targetWarehouse: 'CASA CENTRAL - Depósito Central',
      date: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      status: 'pendiente',
      itemsCount: 4,
      totalUnits: 25
    };
    setOrders([newOrd, ...orders]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-slate-800" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pedidos Sucursal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de solicitudes y reposición de mercadería para sucursales</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pedido Sucursal</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3">Pedidos Emitidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Pedido Nº</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Sucursal Solicitante</th>
                <th className="py-2.5 px-3">Destino / Proveedor</th>
                <th className="py-2.5 px-3 text-center">Ítems</th>
                <th className="py-2.5 px-3 text-center">Unidades Totales</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{o.date}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{o.branchName}</td>
                  <td className="py-3 px-3 text-slate-600">{o.targetWarehouse}</td>
                  <td className="py-3 px-3 text-center font-semibold text-slate-700">{o.itemsCount} productos</td>
                  <td className="py-3 px-3 text-center font-bold text-blue-700">{o.totalUnits} un.</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      o.status === 'pendiente' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {o.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nuevo Pedido de Sucursal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sucursal Solicitante</label>
                <select value={branchName} onChange={e => setBranchName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  <option value="SUC-01 - Bruzzone Express">SUC-01 - Bruzzone Express</option>
                  <option value="DEP-01 - Deposito">DEP-01 - Deposito</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Urgencia</label>
                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Pedido urgente para fin de semana..." className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleCreate} className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Enviar Solicitud</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
