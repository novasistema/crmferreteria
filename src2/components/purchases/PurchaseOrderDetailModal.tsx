import React, { useState } from 'react';
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  X,
  Eye,
  FileSpreadsheet,
  Download,
  MessageCircle,
  Mail,
  Printer,
  Calendar,
  Truck,
  Building,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Share2,
} from 'lucide-react';

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (order: PurchaseOrder) => void;
  onStatusChange?: (orderId: string, newStatus: PurchaseOrder['status']) => void;
}

interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  const { store, showToast, settings } = useApp();

  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'sku', label: 'SKU', visible: true },
    { id: 'supplierCode', label: 'Código proveedor', visible: true },
    { id: 'product', label: 'Producto', visible: true },
    { id: 'originalSupplier', label: 'Proveedor original', visible: true },
    { id: 'quantity', label: 'Cantidad', visible: true },
    { id: 'unitCost', label: 'Costo unitario', visible: true },
    { id: 'subtotal', label: 'Subtotal', visible: true },
  ]);

  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState(store.warehouses[0]?.id || '1');
  const [receiveInvoiceNum, setReceiveInvoiceNum] = useState('');

  if (!isOpen || !order) return null;

  const visibleColumnsCount = columns.filter((c) => c.visible).length;

  const toggleColumn = (id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  const formatDate = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const parts = dStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dStr);
      return d.toLocaleDateString('es-AR');
    } catch {
      return dStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount || 0).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Borrador
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Pendiente
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            En Curso
          </span>
        );
      case 'completed':
      case 'received':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Completado
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  // WhatsApp Message Generator
  const handleSendWhatsApp = () => {
    const sup = store.suppliers.find((s) => s.id === order.supplierId);
    const phone = (order.supplierPhone || sup?.phone || '').replace(/[^0-9]/g, '');

    let msg = `*PEDIDO DE COMPRA: ${order.code}*\n`;
    msg += `Proveedor: *${order.supplierName}*\n`;
    msg += `Fecha: ${formatDate(order.date)}\n`;
    if (order.expectedDeliveryDate) {
      msg += `Entrega esperada: ${formatDate(order.expectedDeliveryDate)}\n`;
    }
    msg += `\n*Detalle de Productos:*\n`;

    order.items.forEach((item, index) => {
      msg += `${index + 1}. [SKU: ${item.productCode}] ${item.productName}\n`;
      if (item.supplierProductCode) msg += `   Cód. Prov: ${item.supplierProductCode}\n`;
      msg += `   Cantidad: ${item.quantity} | Costo: ${formatCurrency(item.unitCost)} | Subtotal: ${formatCurrency(item.subtotal)}\n`;
    });

    msg += `\n*TOTAL: ${formatCurrency(order.total)}*\n`;
    if (order.notes) {
      msg += `\n_Notas: ${order.notes}_\n`;
    }
    msg += `\nEnviado desde ${settings.companyName || 'Nova Ferretería'}`;

    const encodedMsg = encodeURIComponent(msg);
    if (phone) {
      const fullPhone = phone.startsWith('54') ? phone : `549${phone}`;
      window.open(`https://wa.me/${fullPhone}?text=${encodedMsg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    }

    if (order.status === 'draft') {
      store.savePurchaseOrder({ ...order, status: 'in_progress' });
      onStatusChange?.(order.id, 'in_progress');
      showToast('Pedido marcado como "En Curso"', 'info');
    }
  };

  // Email Generator
  const handleSendEmail = () => {
    const sup = store.suppliers.find((s) => s.id === order.supplierId);
    const email = order.supplierEmail || sup?.email || '';

    const subject = encodeURIComponent(`Pedido de Compra ${order.code} - ${settings.companyName || 'Nova Ferretería'}`);
    let body = `Estimados ${order.supplierName},\n\nAdjuntamos el detalle del pedido de compra ${order.code} con fecha ${formatDate(order.date)}:\n\n`;

    order.items.forEach((item, i) => {
      body += `${i + 1}. SKU: ${item.productCode} | Cód Prov: ${item.supplierProductCode || '-'} | ${item.productName} | Cant: ${item.quantity} | Costo: ${formatCurrency(item.unitCost)} | Subtotal: ${formatCurrency(item.subtotal)}\n`;
    });

    body += `\nTOTAL DEL PEDIDO: ${formatCurrency(order.total)}\n`;
    if (order.notes) body += `Notas: ${order.notes}\n`;
    body += `\nSaludos cordiales,\n${settings.companyName || 'Nova Ferretería'}`;

    window.open(`mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank');
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = ['SKU', 'Codigo_Proveedor', 'Producto', 'Proveedor_Original', 'Cantidad', 'Costo_Unitario', 'Subtotal'];
    const rows = order.items.map((i) => [
      `"${i.productCode}"`,
      `"${i.supplierProductCode || ''}"`,
      `"${i.productName.replace(/"/g, '""')}"`,
      `"${i.originalSupplierName || ''}"`,
      i.quantity,
      i.unitCost,
      i.subtotal,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pedido_${order.code}_${order.supplierName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Archivo Excel/CSV descargado correctamente', 'success');
  };

  // Print PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Download receipt text summary
  const handleDownloadSummary = () => {
    let content = `========================================\n`;
    content += `         PEDIDO DE COMPRA\n`;
    content += `         ${order.code}\n`;
    content += `========================================\n\n`;
    content += `PROVEEDOR: ${order.supplierName}\n`;
    content += `FECHA: ${formatDate(order.date)}\n`;
    content += `ESTADO: ${order.status.toUpperCase()}\n`;
    if (order.expectedDeliveryDate) content += `ENTREGA ESPERADA: ${formatDate(order.expectedDeliveryDate)}\n`;
    if (order.notes) content += `NOTAS: ${order.notes}\n`;
    content += `\n----------------------------------------\n`;
    content += `DETALLE DE PRODUCTOS:\n`;
    content += `----------------------------------------\n`;

    order.items.forEach((item, index) => {
      content += `${index + 1}. [${item.productCode}] ${item.productName}\n`;
      if (item.supplierProductCode) content += `   Cod. Prov: ${item.supplierProductCode}\n`;
      if (item.originalSupplierName) content += `   Prov. Original: ${item.originalSupplierName}\n`;
      content += `   Cantidad: ${item.quantity} | Unit: ${formatCurrency(item.unitCost)} | Subtotal: ${formatCurrency(item.subtotal)}\n\n`;
    });

    content += `----------------------------------------\n`;
    content += `TOTAL: ${formatCurrency(order.total)}\n`;
    content += `========================================\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pedido_${order.code}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Comprobante descargado correctamente', 'success');
  };

  const handleConfirmReceive = () => {
    store.receivePurchaseOrder(order.id, receiveWarehouseId, receiveInvoiceNum);
    showToast(`Pedido ${order.code} recibido e ingresado al stock de depósito`, 'success');
    setIsReceivingModalOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pedido {order.code}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">Proveedor</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block uppercase">
                {order.supplierName}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">Estado</span>
              <div>{getStatusBadge(order.status)}</div>
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">Fecha</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                {formatDate(order.date)}
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 dark:text-slate-500 block mb-0.5 font-medium">Entrega Esperada</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '-'}
              </span>
            </div>
          </div>

          {/* Action Tools Toolbar & Column Counter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Mostrando {visibleColumnsCount} de {columns.length} columnas
            </span>

            <div className="flex items-center space-x-2 relative">
              {/* Column picker button */}
              <button
                onClick={() => setShowColumnPicker(!showColumnPicker)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Columnas</span>
              </button>

              {/* Column Popover */}
              {showColumnPicker && (
                <div className="absolute top-10 right-24 z-30 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 pb-1 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span>Visibilidad de Columnas</span>
                    <button
                      onClick={() => setShowColumnPicker(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {columns.map((col) => (
                      <label
                        key={col.id}
                        className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-blue-600 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={col.visible}
                          onChange={() => toggleColumn(col.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Excel button */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>

              {/* PDF button */}
              <button
                onClick={handlePrintPDF}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Table of Items */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  {columns.find((c) => c.id === 'sku')?.visible && (
                    <th className="py-3 px-4">SKU</th>
                  )}
                  {columns.find((c) => c.id === 'supplierCode')?.visible && (
                    <th className="py-3 px-4">Código proveedor</th>
                  )}
                  {columns.find((c) => c.id === 'product')?.visible && (
                    <th className="py-3 px-4">Producto</th>
                  )}
                  {columns.find((c) => c.id === 'originalSupplier')?.visible && (
                    <th className="py-3 px-4">Proveedor original</th>
                  )}
                  {columns.find((c) => c.id === 'quantity')?.visible && (
                    <th className="py-3 px-4 text-right">Cantidad</th>
                  )}
                  {columns.find((c) => c.id === 'unitCost')?.visible && (
                    <th className="py-3 px-4 text-right">Costo unitario</th>
                  )}
                  {columns.find((c) => c.id === 'subtotal')?.visible && (
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {order.items.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnsCount} className="py-8 text-center text-slate-400">
                      No hay productos registrados en este pedido.
                    </td>
                  </tr>
                ) : (
                  order.items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      {columns.find((c) => c.id === 'sku')?.visible && (
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {item.productCode}
                        </td>
                      )}
                      {columns.find((c) => c.id === 'supplierCode')?.visible && (
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {item.supplierProductCode || '-'}
                        </td>
                      )}
                      {columns.find((c) => c.id === 'product')?.visible && (
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white uppercase">
                          {item.productName}
                        </td>
                      )}
                      {columns.find((c) => c.id === 'originalSupplier')?.visible && (
                        <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400 uppercase">
                          {item.originalSupplierName || '-'}
                        </td>
                      )}
                      {columns.find((c) => c.id === 'quantity')?.visible && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {item.quantity.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </td>
                      )}
                      {columns.find((c) => c.id === 'unitCost')?.visible && (
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(item.unitCost)}
                        </td>
                      )}
                      {columns.find((c) => c.id === 'subtotal')?.visible && (
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.subtotal)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Notes if present */}
          {order.notes && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-500 block mb-0.5">Notas del Pedido:</span>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Bottom Left: Communication & Download actions */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handleSendWhatsApp}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              <Mail className="w-4 h-4 text-blue-500" />
              <span>Email</span>
            </button>

            <button
              onClick={handleDownloadSummary}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Descargar</span>
            </button>

            {order.status !== 'completed' && order.status !== 'received' && (
              <button
                onClick={() => setIsReceivingModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ingresar Stock</span>
              </button>
            )}
          </div>

          {/* Bottom Right: Big Total */}
          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Modal to receive order into stock */}
        {isReceivingModalOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ingresar Mercadería a Stock</h3>
                    <p className="text-[11px] text-slate-400">Recepción de pedido {order.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsReceivingModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Depósito de Recepción:
                  </label>
                  <select
                    value={receiveWarehouseId}
                    onChange={(e) => setReceiveWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    {store.warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    N° Factura / Remito del Proveedor (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="ej: 0001-00049210"
                    value={receiveInvoiceNum}
                    onChange={(e) => setReceiveInvoiceNum(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-[11px]">
                  Se sumarán <strong>{order.items.reduce((a, b) => a + b.quantity, 0)} unidades</strong> al inventario del depósito y el pedido quedará marcado como <strong>Completado</strong>.
                </div>
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReceivingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReceive}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-600/20"
                >
                  Confirmar Ingreso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
