import React, { useState } from 'react';
import { PurchaseOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Send, MessageSquare, Mail, Copy, Check, ExternalLink, ArrowRight } from 'lucide-react';

interface SendPurchaseOrderModalProps {
  isOpen: boolean;
  order: PurchaseOrder | null;
  onClose: () => void;
  onStatusUpdated?: (newStatus: PurchaseOrder['status']) => void;
}

export const SendPurchaseOrderModal: React.FC<SendPurchaseOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onStatusUpdated,
}) => {
  const { store, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [markAsSent, setMarkAsSent] = useState(true);

  if (!isOpen || !order) return null;

  const supplier = store.suppliers.find((s) => s.id === order.supplierId);
  const phone = order.supplierPhone || supplier?.phone || '';
  const email = order.supplierEmail || supplier?.email || '';

  // Generate WhatsApp formatted message
  const itemsText = order.items && order.items.length > 0
    ? order.items
        .map(
          (it, idx) =>
            `${idx + 1}. [SKU: ${it.productCode || '-'}] ${it.productName} - Cant: ${it.quantity} un.${it.unitCost > 0 ? ` ($${it.unitCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })})` : ''}`
        )
        .join('\n')
    : '(Sin ítems registrados)';

  const messageText = `Hola *${order.supplierName}*!
Te enviamos el siguiente *Pedido de Compra (${order.code})*:

📅 *Fecha:* ${order.date}
${order.expectedDeliveryDate ? `🚚 *Fecha Entrega Solicitada:* ${order.expectedDeliveryDate}\n` : ''}
📦 *Detalle de Artículos:*
${itemsText}

💰 *Total Estimado:* $${(order.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}

Por favor confirmame recepción y disponibilidad para entrega. ¡Muchas gracias!`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    showToast('Texto copiado al portapapeles', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    // Clean phone number: keep only digits
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(messageText);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(url, '_blank', 'noopener,noreferrer');

    if (markAsSent && order.status === 'draft') {
      store.updatePurchaseOrderStatus(order.id, 'in_progress');
      onStatusUpdated?.('in_progress');
      showToast(`Pedido ${order.code} marcado como En Curso`, 'success');
    }
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Pedido de Compra ${order.code} - ${store.settings.name}`);
    const body = encodeURIComponent(messageText);
    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    if (markAsSent && order.status === 'draft') {
      store.updatePurchaseOrderStatus(order.id, 'in_progress');
      onStatusUpdated?.('in_progress');
      showToast(`Pedido ${order.code} marcado como En Curso`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Enviar Pedido a Proveedor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {order.code} • {order.supplierName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Contact Info Pills */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Teléfono / WhatsApp</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {phone || 'No registrado'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Correo Electrónico</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {email || 'No registrado'}
              </span>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Mensaje generado:
              </label>
              <button
                onClick={handleCopyMessage}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-bold text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar texto'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={6}
              value={messageText}
              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 focus:outline-none text-slate-800 dark:text-slate-200 resize-none leading-relaxed"
            />
          </div>

          {/* Mark as sent checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={markAsSent}
              onChange={(e) => setMarkAsSent(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              Marcar pedido como <strong>"En Curso"</strong> al enviar
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleSendEmail}
              disabled={!email}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-40"
            >
              <Mail className="w-4 h-4 text-blue-500" />
              <span>Email</span>
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
