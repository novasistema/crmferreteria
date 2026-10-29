import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Database,
  Users
} from 'lucide-react';
import { Product } from '../../types';

interface ImportarDatosModuleProps {
  mode?: 'products' | 'stock';
  onImportProducts?: (imported: Partial<Product>[]) => void;
}

export const ImportarDatosModule: React.FC<ImportarDatosModuleProps> = ({ 
  mode = 'products' 
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileDataPreview, setFileDataPreview] = useState<any[]>([]);

  // Mapping state
  const [skuCol, setSkuCol] = useState('0');
  const [nameCol, setNameCol] = useState('1');
  const [priceCol, setPriceCol] = useState('2');
  const [stockCol, setStockCol] = useState('3');
  const [brandCol, setBrandCol] = useState('4');

  const handleSimulateFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileName(f.name);
      // Sample parsed rows
      setFileDataPreview([
        ['313073', '1/2 UNION CADENA A RODILLO 1" REFORZADA', '4500.00', '25', 'DONGHUA'],
        ['313074', '1/2 UNION CADENA CA 550', '3890.50', '14', 'ZHD'],
        ['40513P', '3 PIEZAS - TENSOR DE CADENA VENROL M72', '8950.00', '8', 'VENROL'],
        ['9152231', 'ABRAZADERA CON BASE IMP 1" NEGRO', '185.00', '150', 'PERFECTO'],
        ['9152091', 'ABRAZADERA CON BASE IMP 1/2" NEGRO', '145.00', '200', 'PERFECTO']
      ]);
      setCurrentStep(2);
    }
  };

  const handleDoImport = () => {
    setCurrentStep(3);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFileName(null);
    setFileDataPreview([]);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {mode === 'stock' ? 'Importar Stock' : 'Importar Datos'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {mode === 'stock' 
            ? 'Actualiza las cantidades de inventario masivamente desde archivos Excel o CSV.' 
            : 'Carga productos masivamente desde archivos Excel o CSV.'}
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-4 text-xs font-bold">
        <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-orange-600' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep >= 1 ? 'bg-orange-600' : 'bg-slate-300'}`}>1</span>
          <span>Cargar Archivo</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-orange-600' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep >= 2 ? 'bg-orange-600' : 'bg-slate-300'}`}>2</span>
          <span>Mapear Columnas</span>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-orange-600' : 'text-slate-400'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white ${currentStep >= 3 ? 'bg-orange-600' : 'bg-slate-300'}`}>3</span>
          <span>Importar</span>
        </div>
      </div>

      {/* Step 1: Upload Card */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Upload className="w-4 h-4 text-slate-700" />
              <span>Paso 1: Cargar Archivo</span>
            </div>
            <p className="text-xs text-slate-500">Selecciona un archivo Excel (.xlsx, .xls) o CSV con los datos de productos a importar.</p>
          </div>

          <label className="border-2 border-dashed border-orange-200 hover:border-orange-400 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-orange-50/20">
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv" 
              onChange={handleSimulateFileSelect}
              className="sr-only" 
            />
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-xs text-slate-700 font-bold">
              Arrastra tu archivo aquí o <span className="text-orange-600 hover:underline">haz clic para seleccionar</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Formatos aceptados: Excel (.xlsx, .xls) o CSV</p>
          </label>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Consejos para la importación</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>La primera fila debe contener los encabezados de columna.</li>
              <li>Campos obligatorios: Nombre y al menos Código/SKU o Código Proveedor.</li>
              <li>Si solo tenés código de proveedor, el SKU interno se genera automáticamente (ej: INT-20260722-AB3XY).</li>
              <li>Los precios pueden usar punto o coma como separador decimal.</li>
              <li>Las marcas y categorías se crearán automáticamente si no existen.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Paso 2: Mapear Columnas ({fileName})</h3>
              <p className="text-xs text-slate-500">Asocia cada columna detectada en el archivo a los campos del sistema.</p>
            </div>
            <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-800">Cambiar archivo</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Columna SKU / Código *</label>
              <select value={skuCol} onChange={e => setSkuCol(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="0">Columna A (Código)</option>
                <option value="1">Columna B (Descripción)</option>
                <option value="2">Columna C (Precio)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Columna Nombre / Descripción *</label>
              <select value={nameCol} onChange={e => setNameCol(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="1">Columna B (Descripción)</option>
                <option value="0">Columna A (Código)</option>
                <option value="2">Columna C (Precio)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Columna Precio Venta</label>
              <select value={priceCol} onChange={e => setPriceCol(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="2">Columna C (Precio)</option>
                <option value="3">Columna D (Stock)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Columna Stock Inicial</label>
              <select value={stockCol} onChange={e => setStockCol(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="3">Columna D (Stock)</option>
                <option value="2">Columna C (Precio)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Columna Marca</label>
              <select value={brandCol} onChange={e => setBrandCol(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white">
                <option value="4">Columna E (Marca)</option>
                <option value="1">Columna B</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 mb-2">Vista Previa de Filas Detectadas (5 de 745)</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Nombre</th>
                    <th className="py-2 px-3 text-right">Precio</th>
                    <th className="py-2 px-3 text-center">Stock</th>
                    <th className="py-2 px-3">Marca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fileDataPreview.map((row, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-mono font-semibold">{row[0]}</td>
                      <td className="py-2 px-3">{row[1]}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">${row[2]}</td>
                      <td className="py-2 px-3 text-center font-bold text-blue-600">{row[3]}</td>
                      <td className="py-2 px-3">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={handleReset} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
              Atrás
            </button>
            <button onClick={handleDoImport} className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
              Iniciar Importación Masiva
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Completed */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">¡Importación completada con éxito!</h3>
            <p className="text-xs text-slate-500 mt-1">Se han procesado e incorporado 745 registros al catálogo del sistema.</p>
          </div>
          <button
            onClick={handleReset}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Importar otro archivo
          </button>
        </div>
      )}

      {/* Secondary Container: Actualizar Datos de Clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Users className="w-4 h-4 text-slate-700" />
          <span>Actualizar Datos de Clientes</span>
        </div>
        <p className="text-xs text-slate-500">
          Sube un Excel con columnas "Nombre" y "CUIT" (o DNI, Teléfono, Email, etc.) para actualizar clientes existentes sin crear duplicados. El sistema busca por nombre exacto y actualiza solo los campos que vengan en el archivo.
        </p>

        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Archivo Excel (.xlsx, .xls, .csv)</label>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".xlsx,.xls,.csv"
              className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
