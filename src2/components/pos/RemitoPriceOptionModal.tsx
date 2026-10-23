import React from 'react';
import { DollarSign, FileText, RefreshCw, X } from 'lucide-react';

interface RemitoPriceOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'keep' | 'update') => void;
  remitosCount: number;
}

export const RemitoPriceOptionModal: React.FC<RemitoPriceOptionModalProps> = ({
  isOpen,
  onClose,
  onSelectOption,
  remitosCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Precios de los Remitos
              </h3>
              <p className="text-xs text-slate-400">
                {remitosCount} remito(s) seleccionado(s) para facturar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Los precios de algunos productos pueden haber cambiado desde que se generaron los remitos. Seleccione cómo desea proceder:
        </p>

        {/* Options */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelectOption('keep')}
            className="w-full text-left p-4 rounded-xl border border-slate-700 hover:border-amber-500 bg-slate-800/60 hover:bg-slate-800 transition-all flex items-start space-x-4 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                Mantener precio del remito
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Facturar con el precio que tenía el producto cuando se hizo el remito
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectOption('update')}
            className="w-full text-left p-4 rounded-xl border border-slate-700 hover:border-emerald-500 bg-slate-800/60 hover:bg-slate-800 transition-all flex items-start space-x-4 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                Actualizar al precio de hoy
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Facturar con el precio vigente actual de cada producto
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
