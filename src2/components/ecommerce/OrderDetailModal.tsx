import React from 'react';
import { EcommerceOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: EcommerceOrder;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, onClose }) => {
  const { store } = useApp();

  const handleUpdateStatus = (status: EcommerceOrder['status']) => {
    store.updateEcommerceOrderStatus(order.id, status);
  };

  const handleUpdatePayment = (paymentStatus: EcommerceOrder['paymentStatus']) => {
    store.updateEcommerceOrderStatus(order.id, order.status, paymentStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Pedido #{order.orderCode}</h3>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {order.channel}
                </span>
              </div>
              <p className="text-xs text-slate-400">Fecha: {order.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Status Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Estado del Pedido
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['Pendiente', 'Preparando', 'Enviado', 'Entregado', 'Cancelado'] as EcommerceOrder['status'][]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        order.status === st
                          ? st === 'Enviado'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : st === 'Entregado'
                            ? 'bg-emerald-600 text-white'
                            : st === 'Cancelado'
                            ? 'bg-rose-600 text-white'
                            : st === 'Preparando'
                            ? 'bg-purple-600 text-white'
                            : 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Estado del Pago
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(['Pendiente', 'Pagado', 'Rechazado'] as EcommerceOrder['paymentStatus'][]).map(
                  (ps) => (
                    <button
                      key={ps}
                      onClick={() => handleUpdatePayment(ps)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                        order.paymentStatus === ps
                          ? ps === 'Pagado'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : ps === 'Rechazado'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {ps}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Customer & Shipping info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Datos del Cliente
              </h4>
              <p className="text-sm font-semibold text-slate-100">{order.clientName}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5" />
                {order.clientEmail}
              </div>
              {order.clientPhone && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                  {order.clientPhone}
                </div>
              )}
            </div>

            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Entrega & Pago
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold">Método:</span>
                <span className="capitalize">
                  {order.deliveryMethod === 'shipping' ? 'Envío a domicilio' : 'Retiro en mostrador'}
                </span>
              </div>
              {order.shippingAddress && (
                <div className="flex items-start gap-2 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{order.shippingAddress}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Forma de pago: {order.paymentMethod}</span>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Artículos del Pedido
            </h4>
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5 text-right">Cant.</th>
                    <th className="px-4 py-2.5 text-right">Precio Unit.</th>
                    <th className="px-4 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-slate-200">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.productCode}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-300 font-bold">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">
                        ${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-100">
                        ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900/80 font-bold text-slate-200 border-t border-slate-800">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right">
                      Total del Pedido:
                    </td>
                    <td className="px-4 py-3 text-right text-base text-amber-400 font-black">
                      ${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {order.notes && (
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400">Observaciones del cliente: </span>
              <span className="text-xs text-slate-300 italic">{order.notes}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            Última actualización sincronizada
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
