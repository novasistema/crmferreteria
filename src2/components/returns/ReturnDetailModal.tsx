import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleReturn, SupplierReturn } from '../../types';
import {
  X,
  Printer,
  FileText,
  RotateCcw,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';

interface ReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnItem: SaleReturn | SupplierReturn | null;
  type: 'sale' | 'supplier';
}

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  isOpen,
  onClose,
  returnItem,
  type,
}) => {
  const { store } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !returnItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSale = type === 'sale';
  const saleRet = isSale ? (returnItem as SaleReturn) : null;
  const suppRet = !isSale ? (returnItem as SupplierReturn) : null;

  const getMethodLabel = () => {
    if (isSale && saleRet) {
      switch (saleRet.refundMethod) {
        case 'credit_note':
          return 'Nota de Crédito';
        case 'cash':
          return 'Reintegro en Efectivo';
        case 'current_account':
          return 'Ajuste Cuenta Corriente';
        case 'exchange_voucher':
          return 'Vale de Cambio';
        default:
          return saleRet.refundMethod;
      }
    } else if (suppRet) {
      switch (suppRet.creditMethod) {
        case 'supplier_current_account':
          return 'Descuento en Cta. Cte. Proveedor';
        case 'supplier_credit_note':
          return `Nota de Crédito Proveedor ${suppRet.supplierCreditNoteNumber ? `(${suppRet.supplierCreditNoteNumber})` : ''}`;
        case 'cash_refund':
          return 'Reembolso Efectivo / Transferencia';
        default:
          return suppRet.creditMethod;
      }
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {isSale ? 'Comprobante de Devolución de Venta' : 'Comprobante de Devolución a Proveedor'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{returnItem.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Voucher Area */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 print:p-0 print:text-black">
          {/* Header Voucher */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-xs uppercase tracking-wider">
                  {isSale ? 'DEV-VENTA' : 'DEV-PROV'}
                </span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {returnItem.code}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 mt-2">
                {store.settings.name || 'Ferretería Bruzzone'}
              </h2>
              <p className="text-xs text-slate-500">
                {store.settings.address || 'Av. Principal 1234'} • CUIT: {store.settings.cuit || '30-71234567-8'}
              </p>
            </div>

            <div className="sm:text-right text-xs space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Fecha: {new Date(returnItem.date).toLocaleDateString('es-AR')} {new Date(returnItem.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-600 dark:text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
                <span>Depósito: {returnItem.warehouseName || 'Casa Central'}</span>
              </div>
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-600 dark:text-slate-400">
                <User className="w-3.5 h-3.5" />
                <span>Operador: {returnItem.userName || 'Admin'}</span>
              </div>
            </div>
          </div>

          {/* Client / Supplier Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {isSale ? 'Datos del Cliente' : 'Datos del Proveedor'}
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {isSale ? saleRet?.clientName : suppRet?.supplierName}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isSale
                  ? `Identificación: ${saleRet?.clientTaxId || 'Consumidor Final'}`
                  : `CUIT / Tax ID: ${suppRet?.supplierTaxId || 'S/D'}`}
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Referencia y Motivo
              </span>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">
                Motivo: <span className="font-normal text-slate-700 dark:text-slate-300">{returnItem.reason}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isSale
                  ? saleRet?.saleCode ? `Venta de origen: ${saleRet.saleCode}` : 'Venta directa sin comprobante previo'
                  : suppRet?.purchaseCode ? `Compra de origen: ${suppRet.purchaseCode}` : 'Devolución directa de inventario'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Código</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Precio/Costo</th>
                  {isSale && <th className="p-3 text-center">Destino</th>}
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {returnItem.items.map((it: any, idx: number) => (
                  <tr key={idx} className="bg-white dark:bg-slate-900">
                    <td className="p-3 font-mono text-slate-500">{it.productCode}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{it.productName}</td>
                    <td className="p-3 text-center font-bold">{it.quantity}</td>
                    <td className="p-3 text-right">
                      ${(it.unitPrice || it.unitCost || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    {isSale && (
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          it.disposition === 'restock'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          {it.disposition === 'restock' ? 'Reingreso a Stock' : 'Dañado / Falla'}
                        </span>
                      </td>
                    )}
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                      ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Settlement Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl gap-4">
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Compensación Financiera:
              </span>
              <p className="text-slate-600 dark:text-slate-400 font-semibold">{getMethodLabel()}</p>
              {returnItem.notes && (
                <p className="text-[11px] text-slate-500 italic mt-1">Notas: {returnItem.notes}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-bold block">
                Total Comprobante
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                ${returnItem.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
