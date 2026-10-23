import React, { useState, useMemo } from 'react';
import { Remito, Client } from '../../types';
import {
  FileText,
  CheckSquare,
  Square,
  Package,
  Calendar,
  Truck,
  ArrowRight,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { RemitoPriceOptionModal } from './RemitoPriceOptionModal';

interface ImportRemitosModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  pendingRemitos: Remito[];
  onImportRemitos: (selectedRemitos: Remito[], priceOption: 'keep' | 'update') => void;
}

export const ImportRemitosModal: React.FC<ImportRemitosModalProps> = ({
  isOpen,
  onClose,
  client,
  pendingRemitos,
  onImportRemitos,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    pendingRemitos.map((r) => r.id)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);

  // Sync selected IDs if pendingRemitos change
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(pendingRemitos.map((r) => r.id));
    }
  }, [isOpen, pendingRemitos]);

  const allSelected =
    pendingRemitos.length > 0 && selectedIds.length === pendingRemitos.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRemitos.map((r) => r.id));
    }
  };

  const handleToggleRemito = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedRemitos = useMemo(
    () => pendingRemitos.filter((r) => selectedIds.includes(r.id)),
    [pendingRemitos, selectedIds]
  );

  const totalItemsCount = useMemo(
    () =>
      selectedRemitos.reduce(
        (acc, r) => acc + r.items.reduce((sum, item) => sum + item.quantity, 0),
        0
      ),
    [selectedRemitos]
  );

  const totalAmount = useMemo(
    () => selectedRemitos.reduce((acc, r) => acc + r.total, 0),
    [selectedRemitos]
  );

  const handleConfirmClick = () => {
    if (selectedRemitos.length === 0) return;
    setIsPriceModalOpen(true);
  };

  const handleSelectPriceOption = (option: 'keep' | 'update') => {
    onImportRemitos(selectedRemitos, option);
    setIsPriceModalOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                <span>Traer Remitos Pendientes a Facturar</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
                  {pendingRemitos.length} disponibles
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cliente: <strong className="text-white">{client.name}</strong> • CUIT: {client.taxId || 'S/N'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-200 flex items-start space-x-2.5 shrink-0">
          <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Importación directa de artículos</p>
            <p className="text-[11px] text-slate-300">
              Seleccione uno o varios remitos para volcar sus artículos automáticamente en el carrito de venta POS. Al cerrar la venta, los remitos seleccionados quedarán marcados como Facturados.
            </p>
          </div>
        </div>

        {/* Selection summary & Toggle All Bar */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0 text-xs">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center space-x-2 text-slate-300 hover:text-white font-bold cursor-pointer transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos los Remitos'}
            </span>
          </button>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400">
              Seleccionados:{' '}
              <strong className="text-white">{selectedIds.length}</strong> de {pendingRemitos.length}
            </span>
            <span className="text-slate-400">
              Total Unidades: <strong className="text-white">{totalItemsCount}</strong>
            </span>
            <span className="text-slate-400">
              Monto:{' '}
              <strong className="text-amber-400 font-mono text-sm">
                ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>

        {/* Remitos List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1">
          {pendingRemitos.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm">No hay remitos pendientes para este cliente</p>
            </div>
          ) : (
            pendingRemitos.map((remito) => {
              const isSelected = selectedIds.includes(remito.id);
              const isExpanded = expandedId === remito.id;
              const dateStr = new Date(remito.date).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              return (
                <div
                  key={remito.id}
                  className={`border rounded-xl transition-all ${
                    isSelected
                      ? 'bg-slate-800/80 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleRemito(remito.id)}
                        className="cursor-pointer text-slate-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </button>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-white text-sm">
                            {remito.code}
                          </span>
                          <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {dateStr}
                          </span>
                          {remito.warehouseName && (
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              📍 {remito.warehouseName}
                            </span>
                          )}
                        </div>

                        {remito.deliveryAddress && (
                          <div className="text-[11px] text-slate-400 truncate flex items-center space-x-1 mt-0.5">
                            <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>Entrega: {remito.deliveryAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">
                          {remito.items.length} artículos
                        </span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          ${remito.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : remito.id)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Ver detalle de artículos"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Table */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-950/80 p-3 text-xs space-y-2">
                      <div className="text-[11px] font-bold uppercase text-slate-400">
                        Detalle de Artículos en Remito:
                      </div>
                      <div className="divide-y divide-slate-800 text-[11px]">
                        {remito.items.map((item, idx) => (
                          <div
                            key={`${item.productId}-${idx}`}
                            className="py-1.5 flex items-center justify-between"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="font-mono text-amber-400 font-semibold">
                                {item.productCode}
                              </span>
                              <span className="text-white truncate">{item.productName}</span>
                            </div>
                            <div className="flex items-center space-x-3 font-mono shrink-0 pl-2">
                              <span className="text-slate-300">
                                Cant: <strong>{item.quantity} {item.unit || 'un.'}</strong>
                              </span>
                              <span className="text-slate-400">
                                @ ${item.unitPrice.toLocaleString('es-AR')}
                              </span>
                              <span className="font-bold text-white">
                                = ${item.subtotal.toLocaleString('es-AR')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {remito.notes && (
                        <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/50">
                          Nota: {remito.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Cancelar (Esc)
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={selectedRemitos.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg flex items-center space-x-2 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
          >
            <span>Traer {selectedRemitos.length} Remito(s) a Facturar</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price Option Modal */}
      <RemitoPriceOptionModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        onSelectOption={handleSelectPriceOption}
        remitosCount={selectedRemitos.length}
      />
    </div>
  );
};
