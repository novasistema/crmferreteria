import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentPrintConfig } from '../../types';
import { FreehandTemplateEditorModal } from './FreehandTemplateEditorModal';
import {
  Printer,
  FileText,
  Receipt,
  Ticket,
  PackageCheck,
  Eye,
  Save,
  QrCode,
  Sliders,
  LayoutGrid,
} from 'lucide-react';

export const PrintTab: React.FC = () => {
  const { store, showToast } = useApp();
  const [selectedDocId, setSelectedDocId] = useState<'presupuesto' | 'factura' | 'ticket' | 'remito'>('presupuesto');
  const [isFreehandOpen, setIsFreehandOpen] = useState(false);

  const printConfigs = store.printConfigs || [];

  const getDocConfig = (id: 'presupuesto' | 'factura' | 'ticket' | 'remito'): DocumentPrintConfig => {
    const found = printConfigs.find((c) => c.id === id);
    if (found) return found;
    return {
      id,
      name:
        id === 'presupuesto'
          ? 'Presupuesto / Cotización'
          : id === 'factura'
          ? 'Factura'
          : id === 'ticket'
          ? 'Ticket de Venta'
          : 'Remito',
      paperSize: id === 'ticket' ? '80mm' : 'A4',
      orientation: 'portrait',
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      showLogo: true,
      showCompanyData: true,
      showClientData: true,
      showPrices: true,
      showUnitPrice: true,
      showLineSubtotal: true,
      showDiscounts: true,
      showTaxes: true,
      showTotal: true,
      showPaymentMethod: true,
      showNotes: true,
      showBarcode: false,
      showQRCode: true,
      showSignatureSpace: id === 'remito',
      fontSizeGeneral: id === 'ticket' ? 9 : 11,
      fontSizeTitle: id === 'ticket' ? 13 : 16,
      headerText: id === 'presupuesto' ? 'PRESUPUESTO VÁLIDO POR 15 DÍAS' : '',
      footerText:
        id === 'ticket'
          ? 'Gracias por su compra • Ferretería Bruzzone'
          : 'Comprobante no válido como factura.',
      copiesCount: 1,
    };
  };

  const [formConfig, setFormConfig] = useState<DocumentPrintConfig>(getDocConfig('presupuesto'));

  const handleSelectDoc = (id: 'presupuesto' | 'factura' | 'ticket' | 'remito') => {
    setSelectedDocId(id);
    setFormConfig(getDocConfig(id));
  };

  const handleCheckboxChange = (field: keyof DocumentPrintConfig) => {
    setFormConfig((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.savePrintConfig(formConfig);
    showToast(`Plantilla de ${formConfig.name} guardada correctamente`, 'success');
  };

  const handleTestPrint = () => {
    store.savePrintConfig(formConfig);
    showToast(`Imprimiendo comprobante de prueba (${formConfig.name})...`, 'success');
    window.print();
  };

  const docTypesList = [
    {
      id: 'presupuesto' as const,
      name: 'Presupuesto / Cotización',
      badge: 'A4',
      icon: FileText,
    },
    {
      id: 'factura' as const,
      name: 'Factura',
      badge: 'A4',
      icon: Receipt,
    },
    {
      id: 'ticket' as const,
      name: 'Ticket de Venta',
      badge: '80mm',
      icon: Ticket,
    },
    {
      id: 'remito' as const,
      name: 'Remito',
      badge: 'A4',
      icon: PackageCheck,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* 3-Column Layout exactly matching screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Column 1: Tipos de Comprobante (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Tipos de Comprobante
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
            Selecciona para configurar
          </p>

          <div className="space-y-2.5">
            {docTypesList.map((doc) => {
              const Icon = doc.icon;
              const isSelected = selectedDocId === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold truncate">{doc.name}</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {doc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Personalizar Comprobante (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          {!selectedDocId ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Printer className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Selecciona un comprobante
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Personaliza el formato y elementos a mostrar
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Configurar {formConfig.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Personaliza el formato y elementos a mostrar
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFreehandOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                  title="Diseño libre y orden de bloques"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Diseñador Visual</span>
                </button>
              </div>

              {/* Formato y Papel */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tamaño de Papel
                  </label>
                  <select
                    value={formConfig.paperSize}
                    onChange={(e) => setFormConfig({ ...formConfig, paperSize: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="A4">A4 (Estándar)</option>
                    <option value="14x10cm">14 x 10 cm (Remito Personalizado)</option>
                    <option value="80mm">Ticket 80mm</option>
                    <option value="58mm">Ticket 58mm</option>
                    <option value="Letter">Carta (Letter)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Copias
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formConfig.copiesCount}
                    onChange={(e) => setFormConfig({ ...formConfig, copiesCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Opciones Visibles con Interruptores */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Elementos a Mostrar
                </label>
                <div className="grid grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  {/* Logo de la empresa */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Logo de la empresa</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showLogo')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showLogo ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showLogo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Datos de la empresa */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Datos de la empresa</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showCompanyData')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showCompanyData ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showCompanyData ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Datos del cliente */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Datos del cliente</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showClientData')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showClientData ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showClientData ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Mostrar Precios */}
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-400 text-[11px] font-bold leading-tight">Mostrar Precios</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showPrices' as any)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        (formConfig as any).showPrices ?? true ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          (formConfig as any).showPrices ?? true ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Precio Unitario */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Precio Unitario</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showUnitPrice')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showUnitPrice ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showUnitPrice ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Subtotal por línea */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Subtotal por línea</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showLineSubtotal' as any)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        (formConfig as any).showLineSubtotal ?? true ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          (formConfig as any).showLineSubtotal ?? true ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Descuentos */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Descuentos</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showDiscounts')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showDiscounts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showDiscounts ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Impuestos (IVA) */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Impuestos (IVA)</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showTaxes')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showTaxes ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showTaxes ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Total</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showTotal' as any)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        (formConfig as any).showTotal ?? true ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          (formConfig as any).showTotal ?? true ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Forma de pago */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Forma de pago</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showPaymentMethod' as any)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        (formConfig as any).showPaymentMethod ?? true ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          (formConfig as any).showPaymentMethod ?? true ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Notas/Observaciones */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Notas/Observaciones</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showNotes')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showNotes ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showNotes ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Código de barras */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Código de barras</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showBarcode')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showBarcode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showBarcode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Código QR */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Código QR</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showQRCode')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showQRCode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showQRCode ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Espacio para firma */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium leading-tight">Espacio para firma</span>
                    <button
                      type="button"
                      onClick={() => handleCheckboxChange('showSignatureSpace')}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                        formConfig.showSignatureSpace ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          formConfig.showSignatureSpace ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Textos Personalizados */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Texto Encabezado
                </label>
                <input
                  type="text"
                  value={formConfig.headerText || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, headerText: e.target.value })}
                  placeholder="Ej: PRESUPUESTO VÁLIDO POR 15 DÍAS"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Pie de Página
                </label>
                <textarea
                  rows={2}
                  value={formConfig.footerText || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, footerText: e.target.value })}
                  placeholder="Ej: Los precios pueden variar según disponibilidad de stock."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Imprimir Prueba</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-blue-700/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Plantilla</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Column 3: Vista Previa (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Vista Previa</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Así se verá el comprobante al imprimir
            </p>
          </div>

          {!selectedDocId ? (
            <div className="py-24 text-center my-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Selecciona un comprobante
              </h3>
            </div>
          ) : (
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center overflow-hidden">
              {/* Paper mockup */}
              <div
                className="bg-white text-slate-900 rounded shadow-md relative overflow-hidden shrink-0 border border-slate-300"
                style={{
                  width: '320px',
                  height: '350px',
                }}
              >
                {(() => {
                  const elements = formConfig.canvasElements && formConfig.canvasElements.length > 0
                    ? formConfig.canvasElements
                    : [
                        { id: 'logo', label: 'Logo de la empresa', color: 'bg-blue-600 text-white', x: 20, y: 20, w: 130, h: 55, visible: formConfig.showLogo, locked: false },
                        { id: 'company_data', label: 'Datos de la empresa', color: 'bg-indigo-600 text-white', x: 160, y: 20, w: 200, h: 75, visible: formConfig.showCompanyData, locked: false },
                        { id: 'ticket_info', label: 'COMPROBANTE', color: 'bg-purple-600 text-white', x: 370, y: 20, w: 190, h: 75, visible: true, locked: false },
                        { id: 'client_data', label: 'Datos del cliente', color: 'bg-emerald-600 text-white', x: 20, y: 105, w: 540, h: 55, visible: formConfig.showClientData, locked: false },
                        { id: 'transport', label: 'Transporte', color: 'bg-amber-500 text-white', x: 20, y: 170, w: 540, h: 45, visible: true, locked: false },
                        { id: 'items', label: 'Tabla de Items', color: 'bg-blue-700 text-white', x: 20, y: 225, w: 540, h: 180, visible: true, locked: false },
                        { id: 'observations', label: 'Notas', color: 'bg-pink-600 text-white', x: 20, y: 415, w: 260, h: 50, visible: formConfig.showNotes, locked: false },
                        { id: 'totals', label: 'Totales', color: 'bg-teal-600 text-white', x: 290, y: 415, w: 270, h: 50, visible: (formConfig as any).showPrices ?? true, locked: false },
                        { id: 'signatures', label: 'Firma', color: 'bg-orange-600 text-white', x: 20, y: 475, w: 540, h: 55, visible: formConfig.showSignatureSpace, locked: false },
                        { id: 'footer', label: 'QR', color: 'bg-slate-600 text-white', x: 20, y: 540, w: 540, h: 35, visible: true, locked: false },
                      ];

                  // Scale factor from 580x640 canvas down to 320x350 preview
                  const scaleX = 320 / 580;
                  const scaleY = 350 / 640;

                  return elements.map((el) => {
                    if (!el.visible) return null;

                    const style: React.CSSProperties = {
                      position: 'absolute',
                      left: `${el.x * scaleX}px`,
                      top: `${el.y * scaleY}px`,
                      width: `${el.w * scaleX}px`,
                      height: `${Math.max(16, el.h * scaleY)}px`,
                      fontSize: '6px',
                      overflow: 'hidden',
                    };

                    switch (el.id) {
                      case 'logo':
                        return (
                          <div key="logo" style={style} className="bg-blue-600 text-white rounded p-1 flex items-center justify-between font-bold text-[7px] shadow-xs">
                            <span>LOGO</span>
                          </div>
                        );

                      case 'company_data':
                        return (
                          <div key="company_data" style={style} className="bg-indigo-600 text-white rounded p-1 text-[6px] shadow-xs">
                            <strong className="block truncate">{store.settings.name || 'SERASSIO MAURICIO'}</strong>
                          </div>
                        );

                      case 'ticket_info':
                        return (
                          <div key="ticket_info" style={style} className="bg-purple-600 text-white rounded p-1 text-[6px] font-bold shadow-xs">
                            <span>{formConfig.name} • 0001</span>
                          </div>
                        );

                      case 'client_data':
                        return (
                          <div key="client_data" style={style} className="bg-emerald-600 text-white rounded p-1 text-[6px] shadow-xs">
                            <span className="font-bold">Cliente:</span> Agropecuaria El Amanecer
                          </div>
                        );

                      case 'transport':
                        return (
                          <div key="transport" style={style} className="bg-amber-500 text-white rounded p-0.5 text-[6px] shadow-xs">
                            <span>Transporte</span>
                          </div>
                        );

                      case 'items':
                        return (
                          <div key="items" style={style} className="bg-blue-700 text-white rounded p-1 text-[6px] shadow-xs">
                            <div className="font-bold border-b border-white/30 pb-0.5 flex justify-between">
                              <span>Tabla de Items</span>
                              {((formConfig as any).showPrices ?? true) && <span>Total</span>}
                            </div>
                            <div className="flex justify-between py-0.5 opacity-90">
                              <span>2x Disco Corte Tyrolit</span>
                              {((formConfig as any).showPrices ?? true) && <span>$4.900</span>}
                            </div>
                          </div>
                        );

                      case 'observations':
                        return formConfig.showNotes ? (
                          <div key="observations" style={style} className="bg-pink-600 text-white rounded p-0.5 text-[6px] shadow-xs">
                            <span>Observaciones</span>
                          </div>
                        ) : null;

                      case 'totals':
                        return ((formConfig as any).showPrices ?? true) && ((formConfig as any).showTotal ?? true) ? (
                          <div key="totals" style={style} className="bg-teal-600 text-white rounded p-0.5 flex justify-between items-center text-[7px] font-bold shadow-xs">
                            <span>TOTAL:</span>
                            <span>$8.700,00</span>
                          </div>
                        ) : null;

                      case 'signatures':
                        return formConfig.showSignatureSpace ? (
                          <div key="signatures" style={style} className="bg-orange-600 text-white rounded p-0.5 flex justify-between text-[6px] shadow-xs">
                            <span>Espacio para firma</span>
                          </div>
                        ) : null;

                      case 'footer':
                        return (
                          <div key="footer" style={style} className="bg-slate-600 text-white rounded p-0.5 text-[6px] text-center shadow-xs">
                            <span>Código QR / Pie</span>
                          </div>
                        );

                      default:
                        return null;
                    }
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      <FreehandTemplateEditorModal
        isOpen={isFreehandOpen}
        onClose={() => setIsFreehandOpen(false)}
        config={formConfig}
        onSave={(updated) => {
          setFormConfig(updated);
          store.savePrintConfig(updated);
          showToast('Diseño a mano alzada actualizado correctamente', 'success');
        }}
      />
    </div>
  );
};
