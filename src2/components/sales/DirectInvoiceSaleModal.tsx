import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, DocumentType } from '../../types';
import {
  FileCheck,
  ShieldCheck,
  Sparkles,
  X,
  Search,
  Check,
} from 'lucide-react';

interface DirectInvoiceSaleModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSale: Sale, shouldPrint: boolean) => void;
}

export const DirectInvoiceSaleModal: React.FC<DirectInvoiceSaleModalProps> = ({
  sale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { store, showToast } = useApp();

  // Determine initial document type based on client's tax condition
  const defaultDocType: DocumentType = useMemo(() => {
    if (sale.clientTaxCondition === 'Responsable Inscripto') {
      return 'factura_a';
    }
    if (sale.documentType === 'factura_c') {
      return 'factura_c';
    }
    return 'factura_b';
  }, [sale]);

  const [documentType, setDocumentType] = useState<DocumentType>(defaultDocType);
  const [pointOfSale, setPointOfSale] = useState<number>(
    sale.fiscalData?.pointOfSale || store.settings.fiscalPointOfSale || 1
  );
  const [clientName, setClientName] = useState(sale.clientName || 'Consumidor Final');
  const [clientTaxId, setClientTaxId] = useState(sale.clientTaxId || '20-00000000-0');
  const [clientTaxCondition, setClientTaxCondition] = useState(
    sale.clientTaxCondition || 'Consumidor Final'
  );
  const [notes] = useState(sale.notes || '');
  const [autoOpenPrint, setAutoOpenPrint] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isConsultingArca, setIsConsultingArca] = useState(false);

  // Financial calculations
  const { netAmount, vat21Amount, vat105Amount, totalAmount } = useMemo(() => {
    let net = 0;
    let v21 = 0;
    let v105 = 0;

    sale.items.forEach((it) => {
      const itemSubtotal = it.subtotal || it.quantity * it.unitPrice;
      const vatRate = it.vatRate || 21;

      if (vatRate === 21) {
        const itemNet = itemSubtotal / 1.21;
        net += itemNet;
        v21 += itemSubtotal - itemNet;
      } else if (vatRate === 10.5) {
        const itemNet = itemSubtotal / 1.105;
        net += itemNet;
        v105 += itemSubtotal - itemNet;
      } else {
        net += itemSubtotal;
      }
    });

    return {
      netAmount: Math.round(net * 100) / 100,
      vat21Amount: Math.round(v21 * 100) / 100,
      vat105Amount: Math.round(v105 * 100) / 100,
      totalAmount: sale.total,
    };
  }, [sale]);

  // Consult ARCA simulation/padron
  const handleConsultArcaPadron = () => {
    const cleanId = clientTaxId.replace(/[^0-9]/g, '');
    if (cleanId.length !== 11 && cleanId.length !== 8) {
      showToast('Ingrese un CUIT (11 dígitos) o DNI (8 dígitos) válido para consultar en ARCA', 'error');
      return;
    }

    setIsConsultingArca(true);
    setTimeout(() => {
      setIsConsultingArca(false);
      // If CUIT starts with 30, 33, 34 -> Responsable Inscripto
      if (cleanId.startsWith('30') || cleanId.startsWith('33') || cleanId.startsWith('34')) {
        setClientTaxCondition('Responsable Inscripto');
        setDocumentType('factura_a');
        if (clientName === 'Consumidor Final') {
          setClientName('EMPRESA REGISTRADA S.A.');
        }
        showToast('Padrón ARCA: CUIT Activo - Responsable Inscripto. Sugerida Factura A', 'success');
      } else if (cleanId.startsWith('20') || cleanId.startsWith('27') || cleanId.startsWith('23') || cleanId.startsWith('24')) {
        setClientTaxCondition('Monotributo');
        setDocumentType('factura_b');
        showToast('Padrón ARCA: Contribuyente Monotributo Activo. Sugerida Factura B', 'success');
      } else {
        setClientTaxCondition('Consumidor Final');
        setDocumentType('factura_b');
        showToast('Padrón ARCA: DNI / Consumidor Final verificado. Sugerida Factura B', 'success');
      }
    }, 600);
  };

  // Submit Authorization
  const handleAuthorizeInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (documentType === 'factura_a' && clientTaxCondition !== 'Responsable Inscripto') {
      if (!confirm('Para emitir Factura A, el cliente debe ser Responsable Inscripto. ¿Desea continuar de todos modos?')) {
        return;
      }
    }

    setIsAuthorizing(true);

    setTimeout(() => {
      try {
        const updatedSale = store.emitElectronicInvoiceForSale({
          saleId: sale.id,
          documentType,
          pointOfSale,
          clientName: clientName.trim(),
          clientTaxId: clientTaxId.trim(),
          clientTaxCondition,
          notes: notes.trim(),
        });

        if (updatedSale) {
          const caeNum = updatedSale.fiscalData.cae || '74389102938';
          const invNum = updatedSale.fiscalData.invoiceNumber;
          showToast(
            `Factura Electrónica ${invNum} emitida y autorizada con éxito (CAE: ${caeNum})`,
            'success'
          );
          onSuccess(updatedSale, autoOpenPrint);
          onClose();
        } else {
          showToast('No se pudo emitir la factura electrónica', 'error');
        }
      } catch (err: any) {
        showToast(`Error al autorizar con ARCA: ${err.message || 'Error desconocido'}`, 'error');
      } finally {
        setIsAuthorizing(false);
      }
    }, 850);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl max-w-2xl w-full my-auto shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/50 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-md">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Facturación Electrónica Directa de Venta
                </h3>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  ARCA / AFIP
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Emisión de comprobante fiscal oficial con CAE y QR para la operación {sale.code}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleAuthorizeInvoice} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Sale Summary Banner */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Comprobante Origen
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-white font-mono font-bold text-sm">{sale.code}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold uppercase border border-slate-700">
                  {sale.documentType.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Fecha: {new Date(sale.date).toLocaleDateString('es-AR')} {new Date(sale.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} • Vendedor: {sale.sellerName}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Total Operación
              </span>
              <span className="text-lg font-black text-amber-400 font-mono">
                ${sale.total.toLocaleString('es-AR')}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {sale.items.reduce((acc, it) => acc + it.quantity, 0)} unidades ({sale.items.length} ítems)
              </span>
            </div>
          </div>

          {/* 1. Selector de Tipo de Factura */}
          <div>
            <label className="font-bold text-slate-200 block mb-2">
              1. Seleccione el Tipo de Comprobante Fiscal *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Factura A */}
              <button
                type="button"
                onClick={() => {
                  setDocumentType('factura_a');
                  if (clientTaxCondition !== 'Responsable Inscripto') {
                    setClientTaxCondition('Responsable Inscripto');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  documentType === 'factura_a'
                    ? 'bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-blue-400">Factura A</span>
                  {documentType === 'factura_a' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Para Clientes Responsables Inscriptos. Discrimina IVA 21% y 10.5%.
                </p>
              </button>

              {/* Factura B */}
              <button
                type="button"
                onClick={() => {
                  setDocumentType('factura_b');
                  if (clientTaxCondition === 'Responsable Inscripto') {
                    setClientTaxCondition('Consumidor Final');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  documentType === 'factura_b'
                    ? 'bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-400">Factura B</span>
                  {documentType === 'factura_b' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Consumidor Final, Monotributo, Exentos. IVA incluido en el precio.
                </p>
              </button>

              {/* Factura C */}
              <button
                type="button"
                onClick={() => setDocumentType('factura_c')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                  documentType === 'factura_c'
                    ? 'bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-purple-400">Factura C</span>
                  {documentType === 'factura_c' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Para emisores Monotributistas o comprobante C unificado.
                </p>
              </button>
            </div>
          </div>

          {/* 2. Datos del Cliente / Receptor */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">2. Datos Fiscales del Receptor (Cliente)</span>
              <button
                type="button"
                onClick={handleConsultArcaPadron}
                disabled={isConsultingArca}
                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-bold flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <Search className="w-3 h-3" />
                <span>{isConsultingArca ? 'Consultando...' : 'Consultar Padrón ARCA'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">
                  CUIT / CUIL / DNI *
                </label>
                <input
                  type="text"
                  required
                  value={clientTaxId}
                  onChange={(e) => setClientTaxId(e.target.value)}
                  placeholder="Ej: 30-71234567-8 o 20-33445566-9"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">
                  Razón Social / Nombre y Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Juan Pérez / Empresa SRL"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">
                  Condición frente al IVA
                </label>
                <select
                  value={clientTaxCondition}
                  onChange={(e) => {
                    setClientTaxCondition(e.target.value);
                    if (e.target.value === 'Responsable Inscripto') {
                      setDocumentType('factura_a');
                    } else if (documentType === 'factura_a') {
                      setDocumentType('factura_b');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Consumidor Final">Consumidor Final</option>
                  <option value="Responsable Inscripto">Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo / Pequeño Contribuyente</option>
                  <option value="Exento">IVA Exento</option>
                  <option value="No Responsable">No Responsable</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">
                  Punto de Venta ARCA
                </label>
                <select
                  value={pointOfSale}
                  onChange={(e) => setPointOfSale(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                >
                  <option value={1}>0001 - Facturación Electrónica Principal</option>
                  <option value={2}>0002 - Sucursal Mostrador Ventas</option>
                  <option value={3}>0003 - Distribución y Logística</option>
                  <option value={4}>0004 - E-Commerce y Portal Web</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Desglose Fiscal de la Factura */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200 block">3. Desglose Impositivo Oficial</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Neto Gravado</span>
                <span className="text-xs font-bold text-white font-mono">${netAmount.toLocaleString('es-AR')}</span>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">IVA 21%</span>
                <span className="text-xs font-bold text-blue-400 font-mono">${vat21Amount.toLocaleString('es-AR')}</span>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">IVA 10.5%</span>
                <span className="text-xs font-bold text-blue-300 font-mono">${vat105Amount.toLocaleString('es-AR')}</span>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Factura</span>
                <span className="text-sm font-black text-amber-400 font-mono">${totalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {documentType === 'factura_a' && (
              <div className="flex items-center space-x-1.5 text-[11px] text-blue-400 bg-blue-950/40 p-2 rounded-lg border border-blue-800/40 mt-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Factura A: El IVA se discrimina automáticamente en el comprobante según RG 1415/AFIP.</span>
              </div>
            )}
          </div>

          {/* Post-Actions Options */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoOpenPrint}
                onChange={(e) => setAutoOpenPrint(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium">
                Abrir automáticamente el visor de impresión con CAE y QR tras autorizar
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isAuthorizing}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isAuthorizing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isAuthorizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Obteniendo CAE con ARCA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Emitir Factura Electrónica ARCA</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
