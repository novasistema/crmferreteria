import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Wrench,
  User,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  History,
  Send,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { TechnicalServiceOrder, TechnicalServiceStatus } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface ServiceOrderDetailModalProps {
  order: TechnicalServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintTicket?: (order: TechnicalServiceOrder) => void;
}

export const ServiceOrderDetailModal: React.FC<ServiceOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onPrintTicket,
}) => {
  const { store, triggerRefresh, showToast, currentUser } = useAppContext();

  const [currentOrder, setCurrentOrder] = useState<TechnicalServiceOrder | null>(order);
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [workPerformed, setWorkPerformed] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<TechnicalServiceStatus>('received');
  const [estimatedBudget, setEstimatedBudget] = useState<string>('0');
  const [finalCost, setFinalCost] = useState<string>('0');

  useEffect(() => {
    if (order) {
      setCurrentOrder(order);
      setDiagnosis(order.diagnosis || '');
      setWorkPerformed(order.workPerformed || '');
      setSelectedStatus(order.status || 'received');
      setEstimatedBudget(String(order.estimatedBudget ?? order.totalEstimated ?? 0));
      setFinalCost(String(order.finalCost ?? order.totalFinal ?? 0));
    }
  }, [order]);

  if (!isOpen || !currentOrder) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const formatShortDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: TechnicalServiceStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Recibido
          </span>
        );
      case 'diagnosis':
      case 'in_diagnosis':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Diagnóstico
          </span>
        );
      case 'budgeted':
      case 'budget_ready':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Presupuestado
          </span>
        );
      case 'in_progress':
      case 'in_repair':
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            En Proceso
          </span>
        );
      case 'ready':
      case 'ready_for_pickup':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Listo p/ Retirar
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            Entregado
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getStatusLabel = (status: TechnicalServiceStatus): string => {
    switch (status) {
      case 'received':
        return 'Recibido';
      case 'diagnosis':
      case 'in_diagnosis':
        return 'Diagnóstico';
      case 'budgeted':
      case 'budget_ready':
        return 'Presupuestado';
      case 'in_progress':
      case 'in_repair':
        return 'En Proceso';
      case 'ready':
      case 'ready_for_pickup':
        return 'Listo p/ Retirar';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleSaveChanges = () => {
    if (!currentOrder) return;

    const numBudget = parseFloat(estimatedBudget) || 0;
    const numFinal = parseFloat(finalCost) || 0;
    const statusChanged = selectedStatus !== currentOrder.status;

    let updatedHistory = [...(currentOrder.history || [])];

    if (statusChanged) {
      const nowIso = new Date().toISOString();
      const oldLabel = getStatusLabel(currentOrder.status);
      const newLabel = getStatusLabel(selectedStatus);
      updatedHistory.unshift({
        id: `h-${Date.now()}`,
        status: selectedStatus,
        statusLabel: newLabel,
        description: `Estado: ${oldLabel.toLowerCase()} → ${newLabel.toLowerCase()}`,
        date: nowIso,
        userId: currentUser?.id,
      });
    }

    const updated: TechnicalServiceOrder = {
      ...currentOrder,
      diagnosis: diagnosis.trim(),
      workPerformed: workPerformed.trim(),
      status: selectedStatus,
      estimatedBudget: numBudget,
      finalCost: numFinal,
      totalEstimated: numBudget,
      totalFinal: numFinal,
      history: updatedHistory,
      deliveredAt: selectedStatus === 'delivered' ? new Date().toISOString() : currentOrder.deliveredAt,
    };

    store.saveServiceOrder(updated);
    setCurrentOrder(updated);
    triggerRefresh();
    showToast(`Orden ${updated.orderNumber} actualizada correctamente`, 'success');
  };

  const handleWhatsAppStatus = () => {
    if (!currentOrder.clientPhone) {
      showToast('El cliente no tiene teléfono registrado', 'info');
      return;
    }

    const phoneClean = currentOrder.clientPhone.replace(/\D/g, '');
    const fullPhone = phoneClean.startsWith('54') ? phoneClean : `54${phoneClean}`;
    const statusText = getStatusLabel(currentOrder.status);
    const msg = `Hola ${currentOrder.clientName}, te informamos desde ${store.settings.tradeName || 'Ferretería Bruzzone'} que tu orden ${currentOrder.orderNumber} (${currentOrder.itemDescription || currentOrder.equipmentType}) se encuentra en estado: *${statusText}*. Tu código de retiro es: *${currentOrder.withdrawCode || 'N/A'}*.`;

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      id="modal-service-order-detail"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {currentOrder.orderNumber}
              </h3>
              {getStatusBadge(currentOrder.status)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ingresado el {formatDate(currentOrder.date)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs sm:text-sm">
          {/* Top 2 Cards: Cliente & Código de Retiro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Left: Cliente */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Cliente
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white tracking-wide uppercase">
                {currentOrder.clientName}
              </div>
              {currentOrder.clientPhone && (
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentOrder.clientPhone}</span>
                  <button
                    type="button"
                    onClick={handleWhatsAppStatus}
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    title="Notificar por WhatsApp"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Avisar WhatsApp
                  </button>
                </div>
              )}
            </div>

            {/* Card Right: Código de Retiro */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Código de Retiro
              </span>
              <div className="p-3 rounded-lg border-2 border-dashed border-orange-400/60 dark:border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20 flex items-center justify-center">
                <span className="font-mono text-2xl font-black tracking-widest text-orange-600 dark:text-orange-400 select-all">
                  {currentOrder.withdrawCode || 'SRV999'}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Card: Artículo & Falla */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                Artículo
              </span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white uppercase flex items-center gap-2">
                <span>{currentOrder.itemDescription || currentOrder.equipmentType}</span>
                {currentOrder.serviceType && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {currentOrder.serviceType}
                  </span>
                )}
              </div>
              {(currentOrder.brand || currentOrder.model || currentOrder.serialNumber) && (
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {currentOrder.brand && (
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">Marca:</strong> {currentOrder.brand}
                    </span>
                  )}
                  {currentOrder.model && (
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">Modelo:</strong> {currentOrder.model}
                    </span>
                  )}
                  {currentOrder.serialNumber && (
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">N° Serie:</strong> {currentOrder.serialNumber}
                    </span>
                  )}
                </div>
              )}
              {currentOrder.accessories && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <strong>Accesorios:</strong> {currentOrder.accessories}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-0.5">
                Falla / Trabajo solicitado
              </span>
              <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 uppercase">
                {currentOrder.reportedFault}
              </div>
            </div>
          </div>

          {/* 2-Column Grid: Diagnóstico y Trabajo / Costos y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Card: Diagnóstico y Trabajo */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Diagnóstico y Trabajo
              </h4>
              <div>
                <textarea
                  id="order-diagnosis-input"
                  rows={2}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Diagnóstico..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
              <div>
                <textarea
                  id="order-work-input"
                  rows={2}
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  placeholder="Trabajo realizado..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Right Card: Costos y Estado */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Costos y Estado
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cambiar estado
                </label>
                <select
                  id="order-status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TechnicalServiceStatus)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium"
                >
                  <option value="received">Recibido</option>
                  <option value="diagnosis">Diagnóstico</option>
                  <option value="budgeted">Presupuestado</option>
                  <option value="in_progress">En Proceso</option>
                  <option value="ready">Listo p/ Retirar</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Presupuesto
                  </label>
                  <input
                    id="order-budget-cost"
                    type="number"
                    min="0"
                    step="any"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Costo Final
                  </label>
                  <input
                    id="order-final-cost"
                    type="number"
                    min="0"
                    step="any"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold text-orange-600 dark:text-orange-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Historial */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Clock className="w-4 h-4 text-slate-400" />
              Historial
            </h4>

            <div className="space-y-3 pl-2 relative border-l-2 border-slate-200 dark:border-slate-700 ml-2">
              {currentOrder.history && currentOrder.history.length > 0 ? (
                currentOrder.history.map((h, i) => (
                  <div key={h.id || i} className="relative pl-4 text-xs">
                    {/* Dot */}
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white dark:border-slate-900" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {h.description || `Estado: ${h.statusLabel}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {formatShortDate(h.date)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="relative pl-4 text-xs">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Orden creada
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {formatShortDate(currentOrder.date)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => onPrintTicket && onPrintTicket(currentOrder)}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            Imprimir Comprobante
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-xl transition-all cursor-pointer shadow-md hover:shadow-orange-500/20"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
