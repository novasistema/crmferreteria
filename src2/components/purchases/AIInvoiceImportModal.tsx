import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Cpu,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { parseInvoiceWithAI, ExtractedInvoiceData } from '../../lib/geminiInvoiceService';
import { Supplier, Warehouse } from '../../types';

interface AIInvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  onImportComplete: (extracted: ExtractedInvoiceData) => void;
}

export const AIInvoiceImportModal: React.FC<AIInvoiceImportModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  warehouses,
  onImportComplete,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'text' | 'demo'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedInvoiceData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleProcessAI = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;
      let textContent: string | undefined;

      if (activeInputTab === 'upload' && selectedFile) {
        if (selectedFile.type.startsWith('image/')) {
          imageBase64 = previewUrl || undefined;
          mimeType = selectedFile.type;
        } else {
          // If text or PDF file
          textContent = await selectedFile.text();
        }
      } else if (activeInputTab === 'text') {
        textContent = rawText;
      } else if (activeInputTab === 'demo') {
        textContent = `
FACTURA A - ORIGINAL
Punto de Venta: 00001  Comp. Nro: 00016770
Fecha de Emisión: 27/08/2026
Emisor: ACCESORIOS PATRICIO S.R.L.
CUIT: 30-71899234-5  IVA: Responsable Inscripto
Dirección: Av. Warnes 1420 - CABA

Detalle:
Código: 001677 | Descripción: CANILLA LAVARROPA DOBLE C/MANGUER | Cant: 1.00 | Precio Unit: $12.998,68 | IVA: 21% | Subtotal: $12.998,68

Subtotal Gravado: $12.998,68
IVA 21%: $2.729,72
Impuestos Internos: $0,00
Percepción IIBB: $0,00
Importe Total: $15.728,40
        `;
      }

      if (!imageBase64 && !textContent) {
        setErrorMsg('Por favor seleccione una imagen/archivo o ingrese el texto de la factura.');
        setIsProcessing(false);
        return;
      }

      const result = await parseInvoiceWithAI({
        imageBase64,
        mimeType,
        textContent,
      });

      setExtractedResult(result);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error procesando el comprobante con IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyToPurchase = () => {
    if (!extractedResult) return;
    onImportComplete(extractedResult);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Ingreso Inteligente de Mercadería & Facturas con IA
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  Gemini OCR
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Sube una foto, PDF o texto de la factura del proveedor para extraer automáticamente los ítems, precios, IVA y descuentos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!extractedResult ? (
            <div className="space-y-5">
              {/* Method Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveInputTab('upload')}
                  className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeInputTab === 'upload'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Subir Imagen o Documento
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('text')}
                  className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeInputTab === 'text'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Pegar Texto de Factura / AFIP
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInputTab('demo')}
                  className={`pb-3 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                    activeInputTab === 'demo'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Ejemplo Modelo (Factura A Canilla)
                </button>
              </div>

              {/* Tab: Upload */}
              {activeInputTab === 'upload' && (
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="invoice-file"
                    accept="image/*,.pdf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="invoice-file"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-base">
                        {selectedFile ? selectedFile.name : 'Haz clic para seleccionar o arrastra una factura'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Soporta formatos JPG, PNG, WEBP, PDF o TXT de comprobantes AFIP/ARCA
                      </p>
                    </div>
                  </label>

                  {previewUrl && (
                    <div className="mt-4 inline-block relative border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-48">
                      <img
                        src={previewUrl}
                        alt="Vista previa factura"
                        className="max-h-48 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Text */}
              {activeInputTab === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Texto copiado de factura digital, remito o correo:
                  </label>
                  <textarea
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Pega aquí el texto copiado de la factura electrónica, AFIP, correo o WhatsApp del proveedor..."
                    className="w-full text-sm font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Tab: Demo */}
              {activeInputTab === 'demo' && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Factura de Compra de Ejemplo (Patricio - Canilla Lavarropa)
                  </div>
                  <p className="text-xs text-amber-700">
                    Esta opción cargará una factura tipo correspondiente a <strong>ACCESORIOS PATRICIO</strong> con el artículo <strong>CANILLA LAVARROPA DOBLE C/MANGUER</strong>, IVA 21%, subtotal de $12.998,68 y total de $15.728,40 para probar el flujo de forma inmediata.
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* Result Verification Screen */
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">¡Factura interpretada con éxito!</h4>
                    <p className="text-xs text-slate-600">
                      Verifica los datos extraídos antes de aplicarlos al formulario de compra.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExtractedResult(null)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Escanear otra
                </button>
              </div>

              {/* General Extracted Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Proveedor</span>
                  <span className="font-bold text-slate-800">{extractedResult.supplierName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-medium">CUIT</span>
                  <span className="font-semibold text-slate-700">{extractedResult.supplierTaxId}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Comprobante</span>
                  <span className="font-bold text-blue-700">
                    {extractedResult.invoiceType} {extractedResult.pointOfSale}-{extractedResult.invoiceNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Fecha</span>
                  <span className="font-semibold text-slate-700">{extractedResult.date}</span>
                </div>
              </div>

              {/* Items Extracted Table */}
              <div>
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Artículos Detectados ({extractedResult.items.length})
                </h5>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3 text-right">Cant.</th>
                        <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                        <th className="py-2.5 px-3 text-right">IVA %</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {extractedResult.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{it.productCode}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{it.productName}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            ${it.unitCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">{it.vatRate}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                            ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-slate-400">Subtotal Neto: </span>
                    <span className="font-semibold text-slate-200">
                      ${extractedResult.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">IVA Fiscal: </span>
                    <span className="font-semibold text-slate-200">
                      ${extractedResult.vatAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {extractedResult.extraDiscountPercent ? (
                    <div>
                      <span className="text-amber-400">Desc. Extra (No IVA): </span>
                      <span className="font-semibold text-amber-300">
                        {extractedResult.extraDiscountPercent}%
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block uppercase font-medium">Total Factura</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ${extractedResult.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          {!extractedResult ? (
            <button
              type="button"
              onClick={handleProcessAI}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analizando Comprobante con Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Procesar Comprobante con IA</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyToPurchase}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Cargar a Factura de Compra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
