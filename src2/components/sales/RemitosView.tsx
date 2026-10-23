import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Remito, RemitoItem, Product, Client } from '../../types';
import { CreateRemitoPOSModal } from './CreateRemitoPOSModal';
import {
  FileText,
  Search,
  Plus,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Printer,
  ShoppingBag,
  Trash2,
  Calendar,
  User,
  Building,
  Package,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const RemitosView: React.FC = () => {
  const { store, currentUser, showToast, setActiveModule, setPendingRemitoToBill } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRemitoDetail, setSelectedRemitoDetail] = useState<Remito | null>(null);

  // Filtered remitos list
  const filteredRemitos = useMemo(() => {
    return store.remitos.filter((r) => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.clientTaxId.includes(q) ||
        (r.deliveryAddress && r.deliveryAddress.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    });
  }, [store.remitos, filterStatus, searchTerm]);

  // KPIs
  const totalRemitosCount = store.remitos.length;
  const pendingCount = store.remitos.filter((r) => r.status === 'pending_invoice').length;
  const invoicedCount = store.remitos.filter((r) => r.status === 'invoiced').length;
  const totalPendingAmount = store.remitos
    .filter((r) => r.status === 'pending_invoice')
    .reduce((acc, r) => acc + r.total, 0);

  const handleCancelRemito = (remito: Remito) => {
    if (remito.status === 'invoiced') {
      showToast('No se puede anular un remito que ya fue facturado', 'error');
      return;
    }
    if (confirm(`¿Está seguro de anular el remito ${remito.code}? Se repondrá el stock en depósito.`)) {
      const success = store.cancelRemito(remito.id);
      if (success) {
        showToast(`Remito ${remito.code} anulado y stock restaurado`, 'success');
      } else {
        showToast('Error al anular remito', 'error');
      }
    }
  };

  const handleBillInPOS = (remito: Remito) => {
    // Set pending remito to be loaded in POS
    setPendingRemitoToBill(remito);
    // Navigate to POS tab
    setActiveModule('pos');
    showToast(`Cargando remito ${remito.code} (${remito.clientName}) en el Punto de Venta...`, 'info');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">
              Gestión de Remitos de Entrega & Despacho
            </h2>
            <p className="text-xs text-slate-400">
              Control de entregas físicas, mercadería despachada y remitos pendientes de facturación
            </p>
          </div>
        </div>

        {/* Header Actions & KPIs */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Pendientes de Facturar
            </span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {pendingCount} (${totalPendingAmount.toLocaleString('es-AR')})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Remito Nuevo</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nro remito, cliente, CUIT, destino u observaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-xs text-white rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800 text-xs font-semibold text-slate-200 px-3 py-2 rounded-lg border border-slate-700 cursor-pointer"
        >
          <option value="all">Todos los Estados</option>
          <option value="pending_invoice">Pendientes de Facturar ({pendingCount})</option>
          <option value="invoiced">Facturados ({invoicedCount})</option>
          <option value="cancelled">Anulados</option>
        </select>
      </div>

      {/* Remitos List Table */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {filteredRemitos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Truck className="w-12 h-12 mb-2 stroke-1 text-slate-600" />
            <p className="text-sm font-semibold">No se encontraron remitos con los filtros seleccionados</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 text-xs text-amber-400 hover:underline font-bold"
            >
              + Crear el primer remito
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-700">
                <tr>
                  <th className="p-3">Fecha & Código</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Depósito / Despacho</th>
                  <th className="p-3">Artículos</th>
                  <th className="p-3 text-right">Monto Estimado</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRemitos.map((remito) => {
                  const dateStr = new Date(remito.date).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <tr key={remito.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Fecha & Codigo */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-white text-sm">
                          {remito.code}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="p-3">
                        <div className="font-bold text-white">{remito.clientName}</div>
                        <div className="text-[11px] text-slate-400">
                          {remito.clientTaxCondition || 'CF'} • CUIT: {remito.clientTaxId || 'S/N'}
                        </div>
                      </td>

                      {/* Deposito / Despacho */}
                      <td className="p-3">
                        <div className="text-slate-200 font-medium">{remito.warehouseName || 'Casa Central'}</div>
                        {remito.deliveryAddress && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={remito.deliveryAddress}>
                            📍 {remito.deliveryAddress}
                          </div>
                        )}
                      </td>

                      {/* Articulos */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-200">
                          {remito.items.length} ítems
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {remito.items.reduce((acc, i) => acc + i.quantity, 0)} unidades
                        </div>
                      </td>

                      {/* Monto Estimado */}
                      <td className="p-3 text-right">
                        <div className="font-mono font-black text-amber-400 text-sm">
                          ${remito.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="p-3 text-center">
                        {remito.status === 'pending_invoice' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Pendiente Facturar
                          </span>
                        )}
                        {remito.status === 'invoiced' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ✓ Facturado {remito.invoicedSaleCode && `(${remito.invoicedSaleCode})`}
                          </span>
                        )}
                        {remito.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Anulado
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Ver detalle */}
                          <button
                            type="button"
                            onClick={() => setSelectedRemitoDetail(remito)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Ver Detalle de Artículos"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Facturar en POS si pendiente */}
                          {remito.status === 'pending_invoice' && (
                            <button
                              type="button"
                              onClick={() => handleBillInPOS(remito)}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] transition-colors flex items-center space-x-1"
                              title="Ir a Facturar en POS"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Facturar</span>
                            </button>
                          )}

                          {/* Anular si pendiente */}
                          {remito.status === 'pending_invoice' && (
                            <button
                              type="button"
                              onClick={() => handleCancelRemito(remito)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Anular Remito y Reponer Stock"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Crear Remito Nuevo (Formato POS) */}
      {isCreateModalOpen && (
        <CreateRemitoPOSModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newRem) => {
            showToast(`Remito ${newRem.code} generado correctamente y stock descontado`, 'success');
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* MODAL: Ver Detalle Remito */}
      {selectedRemitoDetail && (
        <RemitoDetailModal
          remito={selectedRemitoDetail}
          onClose={() => setSelectedRemitoDetail(null)}
          onBill={() => {
            handleBillInPOS(selectedRemitoDetail);
            setSelectedRemitoDetail(null);
          }}
        />
      )}
    </div>
  );
};

// Sub-component: Remito Detail Modal
interface RemitoDetailModalProps {
  remito: Remito;
  onClose: () => void;
  onBill: () => void;
}

const RemitoDetailModal: React.FC<RemitoDetailModalProps> = ({ remito, onClose, onBill }) => {
  const dateStr = new Date(remito.date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <span>Remito {remito.code}</span>
                {remito.status === 'pending_invoice' && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    Pendiente de Facturar
                  </span>
                )}
                {remito.status === 'invoiced' && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Facturado
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Emitido el {dateStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Client & Shipping info */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Cliente:</span>
            <span className="font-bold text-white text-sm">{remito.clientName}</span>
            <span className="text-slate-400 block text-[11px]">
              {remito.clientTaxCondition} • CUIT: {remito.clientTaxId || 'S/N'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Destino / Depósito:</span>
            <span className="font-bold text-slate-200">{remito.warehouseName || 'Casa Central'}</span>
            {remito.deliveryAddress && (
              <span className="text-slate-400 block text-[11px]">📍 {remito.deliveryAddress}</span>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700">
              <tr>
                <th className="p-2.5">Código</th>
                <th className="p-2.5">Descripción</th>
                <th className="p-2.5 text-center">Cantidad</th>
                <th className="p-2.5 text-right">Precio Unit.</th>
                <th className="p-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {remito.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-mono text-amber-400">{item.productCode}</td>
                  <td className="p-2.5 text-white font-medium">{item.productName}</td>
                  <td className="p-2.5 text-center font-mono font-bold">
                    {item.quantity} {item.unit || 'un.'}
                  </td>
                  <td className="p-2.5 text-right font-mono">
                    ${item.unitPrice.toLocaleString('es-AR')}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-white">
                    ${item.subtotal.toLocaleString('es-AR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {remito.notes && (
          <div className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            Nota: {remito.notes}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <div>
            <span className="text-slate-400 text-xs block">Total Remito:</span>
            <span className="font-mono font-black text-amber-400 text-xl">
              ${remito.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Cerrar
            </button>

            {remito.status === 'pending_invoice' && (
              <button
                type="button"
                onClick={onBill}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Facturar en POS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
