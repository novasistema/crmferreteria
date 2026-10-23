import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import {
  Printer,
  X,
  Share2,
  ShieldCheck,
} from 'lucide-react';

interface SalePrintModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
}

export const SalePrintModal: React.FC<SalePrintModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const { store, showToast } = useApp();
  const settings = store.settings;

  if (!isOpen) return null;

  const isFiscal = !!sale.fiscalData?.cae;
  const isFacturaA = sale.documentType === 'factura_a';
  const isFacturaB = sale.documentType === 'factura_b';
  const isFacturaC = sale.documentType === 'factura_c';

  let docLetter = 'T';
  let docCode = '00';
  let docTitle = 'TICKET NO FISCAL';

  if (isFacturaA) {
    docLetter = 'A';
    docCode = '01';
    docTitle = 'FACTURA A';
  } else if (isFacturaB) {
    docLetter = 'B';
    docCode = '06';
    docTitle = 'FACTURA B';
  } else if (isFacturaC) {
    docLetter = 'C';
    docCode = '11';
    docTitle = 'FACTURA C';
  } else if (sale.documentType === 'remito') {
    docLetter = 'R';
    docCode = '91';
    docTitle = 'REMITO OFICIAL';
  } else if (sale.documentType === 'presupuesto') {
    docLetter = 'P';
    docCode = '00';
    docTitle = 'PRESUPUESTO';
  }

  const invoiceNumber = sale.fiscalData?.invoiceNumber || sale.code;
  const formattedDate = new Date(sale.date).toLocaleDateString('es-AR');
  const formattedTime = new Date(sale.date).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate taxes breakdown
  let netAmount = 0;
  let vat21 = 0;
  let vat105 = 0;

  sale.items.forEach((it) => {
    const itemSub = it.subtotal || it.quantity * it.unitPrice;
    const vatRate = it.vatRate || 21;
    if (vatRate === 21) {
      const net = itemSub / 1.21;
      netAmount += net;
      vat21 += itemSub - net;
    } else if (vatRate === 10.5) {
      const net = itemSub / 1.105;
      netAmount += net;
      vat105 += itemSub - net;
    } else {
      netAmount += itemSub;
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = sale.clientTaxId.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hola ${sale.clientName}, te enviamos el comprobante ${invoiceNumber} emitido por ${settings.companyName || 'nuestra empresa'} por un total de $${sale.total.toLocaleString('es-AR')}${sale.fiscalData?.cae ? ` (CAE: ${sale.fiscalData.cae})` : ''}. ¡Muchas gracias por tu compra!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    showToast('Abriendo WhatsApp para compartir comprobante', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Modal Controls */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Visor de Comprobante / Factura Oficial
            </h3>
            {isFiscal && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                CAE AUTORIZADO
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper Area */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-900 flex justify-center">
          <div
            id="printable-invoice"
            className="w-full bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-xl border border-slate-300 font-sans text-xs space-y-4 max-w-2xl"
          >
            {/* Header Box AFIP Format */}
            <div className="relative border-2 border-slate-800 rounded-lg p-4 grid grid-cols-11 gap-2">
              {/* Letter Box in Middle */}
              <div className="absolute left-1/2 -top-0 -translate-x-1/2 bg-white border-2 border-slate-800 w-12 h-14 rounded-b-lg flex flex-col items-center justify-center font-bold shadow-sm z-10">
                <span className="text-2xl leading-none font-black">{docLetter}</span>
                <span className="text-[9px] leading-tight text-slate-600">COD. {docCode}</span>
              </div>

              {/* Left Column: Emisor / Company Info */}
              <div className="col-span-5 pr-4 space-y-1">
                <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                  {settings.companyName || 'DISTRIBUIDORA CENTRAL S.A.'}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings.address || 'Av. Corrientes 1234, CABA'}
                </p>
                <p className="text-[11px] text-slate-600">
                  Tel: {settings.phone || '011 4455-6677'}
                </p>
                <p className="text-[11px] text-slate-600">
                  Condición IVA: <strong className="text-slate-800">{settings.taxCondition || 'IVA Responsable Inscripto'}</strong>
                </p>
              </div>

              {/* Middle Divider Spacer */}
              <div className="col-span-1 border-r border-dashed border-slate-300" />

              {/* Right Column: Invoice Details */}
              <div className="col-span-5 pl-2 space-y-1 text-right">
                <h2 className="text-base font-extrabold text-slate-900 uppercase">
                  {docTitle}
                </h2>
                <p className="text-xs font-mono font-bold text-slate-800">
                  N° {invoiceNumber}
                </p>
                <p className="text-[11px] text-slate-600">
                  Fecha de Emisión: <strong>{formattedDate} {formattedTime}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  CUIT: <strong>{settings.cuit || '30-71234567-8'}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Ingresos Brutos: <strong>{settings.cuit || '30-71234567-8'}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Inicio de Actividades: <strong>01/01/2020</strong>
                </p>
              </div>
            </div>

            {/* Client / Receptor Box */}
            <div className="border border-slate-400 rounded-lg p-3 grid grid-cols-2 gap-2 bg-slate-50/50">
              <div className="space-y-0.5">
                <p className="text-[11px] text-slate-600">
                  CUIT / DNI: <strong className="text-slate-900 font-mono">{sale.clientTaxId || '20-00000000-0'}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Razón Social / Nombre: <strong className="text-slate-900">{sale.clientName}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Condición IVA: <strong className="text-slate-800">{sale.clientTaxCondition || 'Consumidor Final'}</strong>
                </p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[11px] text-slate-600">
                  Condición de Venta: <strong className="text-slate-900">
                    {sale.payments.map((p) => p.method).join(', ') || 'Contado'}
                  </strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Punto de Venta: <strong>000{sale.fiscalData?.pointOfSale || 1}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Sucursal: <strong>{sale.warehouseId ? 'Sucursal Central' : 'Casa Matriz'}</strong>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <tr>
                    <th className="py-1.5 px-2">Código</th>
                    <th className="py-1.5 px-2">Descripción</th>
                    <th className="py-1.5 px-2 text-center">Cant.</th>
                    <th className="py-1.5 px-2 text-right">Precio Unit.</th>
                    {isFacturaA && <th className="py-1.5 px-2 text-center">IVA %</th>}
                    <th className="py-1.5 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-2 font-mono text-slate-600">{item.productCode}</td>
                      <td className="py-1.5 px-2 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-1.5 px-2 text-center font-bold">
                        {item.quantity} {item.unit || 'un.'}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        ${item.unitPrice.toLocaleString('es-AR')}
                      </td>
                      {isFacturaA && (
                        <td className="py-1.5 px-2 text-center font-mono text-slate-600">
                          {item.vatRate || 21}%
                        </td>
                      )}
                      <td className="py-1.5 px-2 text-right font-bold font-mono text-slate-900">
                        ${(item.subtotal || item.quantity * item.unitPrice).toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Taxes Breakdown */}
            <div className="grid grid-cols-2 gap-4 items-end pt-2">
              <div className="space-y-1 text-[11px] text-slate-600">
                {sale.notes && (
                  <p className="italic bg-slate-50 p-2 rounded border border-slate-200">
                    <strong>Observaciones:</strong> {sale.notes}
                  </p>
                )}
                <p className="text-[10px] text-slate-500">
                  Operación: {sale.code} • Atendido por: {sale.sellerName}
                </p>
              </div>

              <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50 space-y-1 text-right">
                {isFacturaA && (
                  <>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>Subtotal Neto Gravado:</span>
                      <span className="font-mono font-medium">${Math.round(netAmount).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600">
                      <span>IVA Débito Fiscal (21%):</span>
                      <span className="font-mono font-medium">${Math.round(vat21).toLocaleString('es-AR')}</span>
                    </div>
                    {vat105 > 0 && (
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>IVA Débito Fiscal (10.5%):</span>
                        <span className="font-mono font-medium">${Math.round(vat105).toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-300 my-1" />
                  </>
                )}

                <div className="flex justify-between items-center text-sm font-black text-slate-900">
                  <span>TOTAL:</span>
                  <span className="font-mono text-base">${sale.total.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Fiscal Footer (CAE, QR Code, ARCA Validation) */}
            <div className="border-t-2 border-slate-800 pt-3 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-3">
                {/* Simulated Fiscal QR Code */}
                <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex flex-col items-center justify-center text-center p-1">
                  <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white text-[8px] font-mono rounded">
                    QR AFIP
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Comprobante Autorizado por ARCA</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Régimen de Facturación Electrónica RG 4291
                  </p>
                </div>
              </div>

              <div className="text-right font-mono space-y-0.5">
                <p className="text-xs font-black text-slate-900">
                  CAE N°: {sale.fiscalData?.cae || '74389102938142'}
                </p>
                <p className="text-[10px] text-slate-600">
                  Fecha Vto. CAE:{' '}
                  {sale.fiscalData?.caeExpiresAt ||
                    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
