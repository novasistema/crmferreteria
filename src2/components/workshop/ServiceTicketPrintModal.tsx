import React, { useRef } from 'react';
import { X, Printer, Share2, Wrench, QrCode, Phone, MapPin, Building2 } from 'lucide-react';
import { TechnicalServiceOrder } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface ServiceTicketPrintModalProps {
  order: TechnicalServiceOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceTicketPrintModal: React.FC<ServiceTicketPrintModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { store } = useAppContext();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

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

  const settings = store.settings;

  return (
    <div
      id="modal-print-service-ticket"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Comprobante de Servicio Técnico
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-sm bg-white text-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 font-mono text-xs space-y-4 print:shadow-none print:border-none print:p-0 print:w-full"
          >
            {/* Store Info */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
              <div className="font-sans font-black text-base uppercase tracking-wider text-slate-900">
                {settings.tradeName || settings.name || 'FERRETERÍA BRUZZONE'}
              </div>
              <div className="text-[11px] text-slate-600 font-sans">
                {settings.address || 'Doctor Carlos L Rocha 128'} - {settings.city || 'Alejandro Roca'}, {settings.province || 'Córdoba'}
              </div>
              <div className="text-[11px] text-slate-600 font-sans">
                CUIT: {settings.cuit || '30-71234567-8'} | Tel: {settings.phone || '03584354998'}
              </div>
              <div className="text-[11px] font-bold text-slate-800 uppercase mt-2">
                SERVICIO TÉCNICO & AFILADOS
              </div>
            </div>

            {/* Order & Withdraw Code */}
            <div className="border-b border-dashed border-slate-300 pb-3 text-center space-y-1.5">
              <div className="text-xs font-bold uppercase text-slate-600">
                ORDEN DE SERVICIO: <span className="text-slate-900 font-extrabold">{order.orderNumber}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Fecha de Ingreso: {formatDate(order.date)}
              </div>
              <div className="pt-2">
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                  CÓDIGO DE RETIRO
                </div>
                <div className="inline-block px-4 py-1.5 border-2 border-dashed border-orange-500 rounded-lg text-xl font-black tracking-widest text-orange-600 bg-orange-50">
                  {order.withdrawCode || 'SRV999'}
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="border-b border-dashed border-slate-300 pb-3 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">Cliente</div>
              <div className="font-bold text-xs uppercase text-slate-900">{order.clientName}</div>
              {order.clientPhone && (
                <div className="text-[11px] text-slate-600">Tel: {order.clientPhone}</div>
              )}
            </div>

            {/* Item Details */}
            <div className="border-b border-dashed border-slate-300 pb-3 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">Artículo Recibido</div>
              <div className="font-extrabold text-xs uppercase text-slate-900">
                {order.itemDescription || order.equipmentType} {order.serviceType ? `(${order.serviceType})` : ''}
              </div>
              {(order.brand || order.model) && (
                <div className="text-[11px] text-slate-600">
                  {order.brand && `Marca: ${order.brand} `}
                  {order.model && `| Modelo: ${order.model}`}
                </div>
              )}
              {order.serialNumber && (
                <div className="text-[11px] text-slate-600">N° Serie: {order.serialNumber}</div>
              )}
              {order.accessories && (
                <div className="text-[11px] text-slate-600">Accesorios: {order.accessories}</div>
              )}
              <div className="pt-1.5">
                <div className="text-[10px] font-bold uppercase text-slate-500">Trabajo Solicitado</div>
                <div className="text-[11px] text-slate-800 uppercase font-sans">{order.reportedFault}</div>
              </div>
            </div>

            {/* Budget / Cost */}
            <div className="border-b border-dashed border-slate-300 pb-3 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 uppercase">Presupuesto Estimado:</span>
              <span className="font-black text-slate-900">
                ${(order.estimatedBudget ?? order.totalEstimated ?? 0).toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Terms & Signature */}
            <div className="pt-2 space-y-4 text-[10px] text-slate-500 font-sans leading-tight">
              <p>
                * Es requisito indispensable presentar este comprobante o indicar el código de retiro para retirar el artículo. Pasados los 90 días, los artículos no retirados se consideran abandonados.
              </p>
              <div className="pt-8 border-t border-slate-400 flex justify-between text-center">
                <div className="w-1/2">
                  <div className="border-t border-slate-400 pt-1 text-[9px] uppercase">
                    Firma del Cliente
                  </div>
                </div>
                <div className="w-1/3">
                  <div className="border-t border-slate-400 pt-1 text-[9px] uppercase">
                    Recepción Taller
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-xl shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ahora
          </button>
        </div>
      </div>
    </div>
  );
};
