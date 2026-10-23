import React, { useState } from 'react';
import { Client, SaleItem, Warehouse } from '../../types';
import {
  FileText,
  Truck,
  CheckCircle2,
  X,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';

interface TransformToDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  cart: SaleItem[];
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onTransformToRemito: (params: {
    warehouseId: string;
    deliveryAddress: string;
    notes: string;
    clearCart: boolean;
  }) => void;
  onTransformToQuote: (params: {
    validityDays: number;
    notes: string;
    clearCart: boolean;
  }) => void;
}

export const TransformToDocumentModal: React.FC<TransformToDocumentModalProps> = ({
  isOpen,
  onClose,
  client,
  cart,
  warehouses,
  activeWarehouseId,
  onTransformToRemito,
  onTransformToQuote,
}) => {
  const [docType, setDocType] = useState<'remito' | 'presupuesto'>('remito');
  const [warehouseId, setWarehouseId] = useState<string>(activeWarehouseId);
  const [deliveryAddress, setDeliveryAddress] = useState<string>(client.address || '');
  const [validityDays, setValidityDays] = useState<number>(15);
  const [notes, setNotes] = useState<string>('');
  const [clearCart, setClearCart] = useState<boolean>(true);

  React.useEffect(() => {
    if (isOpen) {
      setWarehouseId(activeWarehouseId);
      setDeliveryAddress(client.address || '');
      setNotes(
        docType === 'remito'
          ? 'Mercadería entregada en conformidad.'
          : 'Presupuesto válido por 15 días. Sujeto a disponibilidad de stock.'
      );
    }
  }, [isOpen, client, activeWarehouseId, docType]);

  const totalAmount = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const totalUnits = cart.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (docType === 'remito') {
      onTransformToRemito({
        warehouseId,
        deliveryAddress,
        notes,
        clearCart,
      });
    } else {
      onTransformToQuote({
        validityDays,
        notes,
        clearCart,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Transformar Venta a Remito / Presupuesto
              </h3>
              <p className="text-xs text-slate-400">
                Convierte los artículos cargados en un documento comercial sin cobrar
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

        {/* Client & Cart Summary Banner */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Cliente Asignado:</span>
            <span className="font-bold text-white text-sm">{client.name}</span>
            <span className="text-slate-400 text-[11px] block">{client.taxCondition} • {client.taxId || 'S/N'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">
              {cart.length} líneas ({totalUnits} unid.)
            </span>
            <span className="text-amber-400 font-mono font-black text-base">
              ${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Document Type Selector Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Seleccionar Tipo de Destino:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDocType('remito');
                setNotes('Mercadería entregada en conformidad. Pendiente de facturar.');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col space-y-1.5 ${
                docType === 'remito'
                  ? 'bg-amber-500/20 border-amber-400 shadow-md ring-1 ring-amber-400'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <Truck className={`w-5 h-5 ${docType === 'remito' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    docType === 'remito' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  DESCUENTA STOCK
                </span>
              </div>
              <span className="font-bold text-white text-sm">Remito de Entrega</span>
              <span className="text-[11px] text-slate-400">
                Genera remito de despacho oficial. Queda pendiente para luego "Traer a Facturar".
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDocType('presupuesto');
                setNotes('Presupuesto válido por 15 días. Sujeto a disponibilidad de stock.');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col space-y-1.5 ${
                docType === 'presupuesto'
                  ? 'bg-blue-500/20 border-blue-400 shadow-md ring-1 ring-blue-400'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <FileText className={`w-5 h-5 ${docType === 'presupuesto' ? 'text-blue-400' : 'text-slate-400'}`} />
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    docType === 'presupuesto' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  COTIZACIÓN
                </span>
              </div>
              <span className="font-bold text-white text-sm">Presupuesto / Cotización</span>
              <span className="text-[11px] text-slate-400">
                Guarda la cotización con plazo de validez. No descuenta stock hasta que se facture.
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {docType === 'remito' ? (
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Depósito de Salida:
                  </label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:border-amber-400 focus:outline-none"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Dirección de Entrega:
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Domicilio de entrega u obra..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1 text-xs">
                  Observaciones / Chofer / Transporte:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Entregado por flete particular. Pendiente de facturación."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Días de Validez de Oferta:
                  </label>
                  <select
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-medium focus:border-blue-400 focus:outline-none"
                  >
                    <option value={7}>7 días</option>
                    <option value={15}>15 días (Recomendado)</option>
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold block mb-1">
                    Observaciones / Términos:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Términos comerciales..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Option to clear cart after generation */}
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <input
              type="checkbox"
              id="clearCartCheck"
              checked={clearCart}
              onChange={(e) => setClearCart(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="clearCartCheck" className="cursor-pointer">
              Vaciar artículos del carrito POS luego de generar el {docType === 'remito' ? 'remito' : 'presupuesto'}
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={`flex-2 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.98] ${
                docType === 'remito'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                GENERAR {docType === 'remito' ? 'REMITO DE ENTREGA' : 'PRESUPUESTO'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
