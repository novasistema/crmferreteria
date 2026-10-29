import React, { useState } from 'react';
import { 
  TrendingUp, 
  RotateCcw, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  Layers,
  Check
} from 'lucide-react';
import { Product, Supplier, PriceUpdateTemplate } from '../../types';

interface ActualizacionPreciosModuleProps {
  products: Product[];
  suppliers: Supplier[];
  onApplyPricesUpdate?: (updatedProductsCount: number) => void;
}

const DEFAULT_SUPPLIERS = [
  { id: 's1', businessName: 'ACCESORIOS PATRICIO', email: '' },
  { id: 's2', businessName: 'AGENCIA PROGRAMARTE S.A.S', email: '' },
  { id: 's3', businessName: 'AGRO PARTES RIO CUARTO S.A.', email: '' },
  { id: 's4', businessName: 'AGROCENTRO', email: '' },
  { id: 's5', businessName: 'AGUAS S R L', email: '' },
  { id: 's6', businessName: 'AHORROS', email: '' },
  { id: 's7', businessName: 'ALAR COMUNICACIONES S.R.L.', email: '' },
  { id: 's8', businessName: 'ALDO BENITO', email: '' },
  { id: 's9', businessName: 'ALESSANDRONI, DARIO', email: '' },
  { id: 's10', businessName: 'ALT ALBERTO RAFAEL Y ALT HECTOR JOSE SOCIEDAD DE HECHO', email: '' },
  { id: 's11', businessName: 'ALVAREZ JORGE WALTER', email: '' },
  { id: 's12', businessName: 'ANGEL M BEBER SOCIEDAD ANONIMA', email: '' },
  { id: 's13', businessName: 'FERRETERA CENTRAL', email: 'ventas@ferreteracentral.com' },
  { id: 's14', businessName: 'CRUCECOR', email: 'contacto@crucecor.com.ar' },
  { id: 's15', businessName: 'PINTURAS COLOREAR S.A.', email: 'fabrica@colorear.com.ar' }
];

const INITIAL_TEMPLATES: PriceUpdateTemplate[] = [
  {
    id: 't-1',
    supplierId: 's13',
    supplierName: 'FERRETERA CENTRAL',
    name: 'ferretera central',
    codeColumn: 'A',
    descColumn: 'B',
    priceColumn: 'C',
    hasHeaderRow: false,
    startRow: 1
  }
];

interface AnalysisRow {
  status: 'actualizar' | 'no_encontrado' | 'discontinuado';
  supplierCode: string;
  sku: string;
  productName: string;
  oldPrice: number;
  newPrice: number;
  variationPct: number;
}

export const ActualizacionPreciosModule: React.FC<ActualizacionPreciosModuleProps> = ({ 
  products, 
  suppliers: propSuppliers,
  onApplyPricesUpdate 
}) => {
  // Top sub-nav tabs
  const [activeSubTab, setActiveSubTab] = useState<'por_proveedor' | 'por_codigo' | 'aumento_masivo' | 'lista_fabrica'>('por_proveedor');

  // Wizard Step: 1 | 2 | 3 | 4 | 5 | 6
  const [step, setStep] = useState<number>(1);

  // Step 1: Supplier selection
  const supplierList = propSuppliers && propSuppliers.length > 0 ? propSuppliers : DEFAULT_SUPPLIERS;
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(DEFAULT_SUPPLIERS.find(s => s.businessName === 'FERRETERA CENTRAL') || DEFAULT_SUPPLIERS[0]);

  // Step 2: Templates
  const [templates, setTemplates] = useState<PriceUpdateTemplate[]>(INITIAL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('t-1');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newCodeCol, setNewCodeCol] = useState('A');
  const [newDescCol, setNewDescCol] = useState('B');
  const [newPriceCol, setNewPriceCol] = useState('C');
  const [newHasHeader, setNewHasHeader] = useState(false);
  const [newStartRow, setNewStartRow] = useState(1);
  const [newSheetName, setNewSheetName] = useState('');

  // Step 3: File Upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Step 4: Preview rows (replicates screenshot image_4fff1603.png)
  const samplePreviewRows = [
    { code: '9152231', desc: 'ABRAZACAÑO CON BASE IMP 1" NEGRO', price: 78.03 },
    { code: '9152091', desc: 'ABRAZACAÑO CON BASE IMP 1/2" NEGRO', price: 149.02 },
    { code: '9152102', desc: 'ABRAZACAÑO CON BASE IMP 5/8" BLANCO', price: 28.37 },
    { code: '915210',  desc: 'ABRAZACAÑO CON BASE IMP 5/8" NEGRO', price: 47.29 },
    { code: '937',     desc: 'ABRAZADERA C/R 12mm PERFECTO 10-20 mm', price: 589.28 },
    { code: '938',     desc: 'ABRAZADERA C/R 12mm PERFECTO 17-28 mm', price: 596.03 },
    { code: '939',     desc: 'ABRAZADERA C/R 12mm PERFECTO 25-35 mm', price: 610.21 },
    { code: '940',     desc: 'ABRAZADERA C/R 12mm PERFECTO 32-44 mm', price: 666.91 },
    { code: '941',     desc: 'ABRAZADERA C/R 12mm PERFECTO 40-52 mm', price: 718.88 }
  ];

  // Step 5: Analysis data (replicates screenshot image_0bb3549d.png)
  const [analysisTab, setAnalysisTab] = useState<'todos' | 'actualizar' | 'no_encontrados' | 'discontinuados'>('actualizar');

  const sampleAnalysisRows: AnalysisRow[] = [
    { status: 'actualizar', supplierCode: '9152231', sku: '9152231', productName: 'ABRAZACA?O CON BASE IMP 1" NEGRO', oldPrice: 78.03, newPrice: 78.03, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '9152091', sku: '9152091', productName: 'ABRAZACA?O CON BASE IMP 1/2" NEGRO', oldPrice: 149.02, newPrice: 149.02, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '9152102', sku: '9152102', productName: 'ABRAZACA?O CON BASE IMP 5/8" BLANCO', oldPrice: 28.37, newPrice: 28.37, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '915210',  sku: '915210',  productName: 'ABRAZACA?O CON BASE IMP 5/8" NEGRO', oldPrice: 47.29, newPrice: 47.29, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '937',     sku: '000937',  productName: 'ABRAZADERA C/R 12mm PERFECTO 10-20 mm', oldPrice: 589.28, newPrice: 589.28, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '39232',   sku: '146413',  productName: 'GRAMPA "U" C/TOPE x38mm 1 1/2"', oldPrice: 3215.74, newPrice: 3215.74, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '39230',   sku: '146411',  productName: 'GRAMPA "U" C/TOPE x32mm 1 1/4"', oldPrice: 3094.91, newPrice: 3094.91, variationPct: 0.0 },
    { status: 'actualizar', supplierCode: '39234',   sku: '146415',  productName: 'GRAMPA "U" C/TOPE x45mm 1 3/4"', oldPrice: 3321.72, newPrice: 3321.72, variationPct: 0.0 }
  ];

  const filteredSuppliers = supplierList.filter(s => 
    s.businessName.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  const handleSelectSupplier = (s: any) => {
    setSelectedSupplier(s);
    setStep(2);
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    const newT: PriceUpdateTemplate = {
      id: `t-${Date.now()}`,
      supplierId: selectedSupplier?.id || '',
      supplierName: selectedSupplier?.businessName || '',
      name: newTemplateName.trim(),
      codeColumn: newCodeCol,
      descColumn: newDescCol,
      priceColumn: newPriceCol,
      hasHeaderRow: newHasHeader,
      startRow: newStartRow,
      sheetName: newSheetName.trim()
    };
    setTemplates([...templates, newT]);
    setSelectedTemplateId(newT.id);
    setIsTemplateModalOpen(false);
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setTimeout(() => {
        setStep(4);
      }, 300);
    }
  };

  const handleApplyFinalUpdates = () => {
    if (onApplyPricesUpdate) {
      onApplyPricesUpdate(1375);
    }
    setStep(6);
  };

  const handleRestart = () => {
    setStep(1);
    setUploadedFile(null);
  };

  const currentAnalysisFiltered = sampleAnalysisRows.filter(r => {
    if (analysisTab === 'todos') return true;
    if (analysisTab === 'actualizar') return r.status === 'actualizar';
    if (analysisTab === 'no_encontrados') return r.status === 'no_encontrado';
    if (analysisTab === 'discontinuados') return r.status === 'discontinuado';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Actualización de Precios</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Actualiza los costos de productos desde listas de proveedores o archivos con códigos
          </p>
        </div>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Sub-Nav Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs font-bold text-slate-600 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('por_proveedor')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            activeSubTab === 'por_proveedor' ? 'bg-white border border-slate-300 text-slate-900 shadow-2xs font-bold' : 'hover:bg-slate-200/60'
          }`}
        >
          Por Proveedor
        </button>
        <button
          onClick={() => setActiveSubTab('por_codigo')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            activeSubTab === 'por_codigo' ? 'bg-white border border-slate-300 text-slate-900 shadow-2xs font-bold' : 'hover:bg-slate-200/60'
          }`}
        >
          Importar por Código
        </button>
        <button
          onClick={() => setActiveSubTab('aumento_masivo')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            activeSubTab === 'aumento_masivo' ? 'bg-white border border-slate-300 text-slate-900 shadow-2xs font-bold' : 'hover:bg-slate-200/60'
          }`}
        >
          Aumento Masivo %
        </button>
        <button
          onClick={() => setActiveSubTab('lista_fabrica')}
          className={`px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
            activeSubTab === 'lista_fabrica' ? 'bg-white border border-slate-300 text-slate-900 shadow-2xs font-bold' : 'hover:bg-slate-200/60'
          }`}
        >
          Lista de Fábrica
        </button>
      </div>

      {/* Stepper Wizard Bar (6 Steps) */}
      <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto py-1">
        <button
          onClick={() => setStep(1)}
          className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
            step === 1 ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          1. Proveedor
        </button>
        <span className="text-slate-400">→</span>

        <button
          onClick={() => setStep(2)}
          className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
            step === 2 ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          2. Plantilla
        </button>
        <span className="text-slate-400">→</span>

        <button
          onClick={() => setStep(3)}
          className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
            step === 3 ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          3. Archivo
        </button>
        <span className="text-slate-400">→</span>

        <button
          onClick={() => setStep(4)}
          className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
            step === 4 ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          4. Vista Previa
        </button>
        <span className="text-slate-400">→</span>

        <button
          onClick={() => setStep(5)}
          className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
            step === 5 ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          5. Análisis
        </button>
        <span className="text-slate-400">→</span>

        <button
          onClick={() => setStep(6)}
          className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
            step === 6 ? 'bg-blue-700 text-white font-bold' : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          6. Completado
        </button>
      </div>

      {/* STEP 1: Seleccionar Proveedor */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Paso 1: Seleccionar Proveedor</h2>
            <p className="text-xs text-slate-500">Elige el proveedor cuya lista de precios vas a importar</p>
          </div>

          <div className="relative max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 3-column Grid of supplier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSuppliers.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSupplier(s)}
                className={`p-4 border rounded-xl cursor-pointer transition-all hover:border-blue-400 hover:shadow-xs group ${
                  selectedSupplier?.id === s.id ? 'border-blue-600 bg-blue-50/20 ring-1 ring-blue-600' : 'border-slate-200 bg-white'
                }`}
              >
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                  {s.businessName}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  {s.email || 'Sin email'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Configurar Plantilla de Lectura */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Paso 2: Configurar Plantilla de Lectura</h2>
              <p className="text-xs text-slate-500">
                Configura cómo leer el archivo Excel de <span className="font-bold text-slate-800">{selectedSupplier?.businessName}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Plantillas guardadas</span>
              <button
                onClick={() => {
                  setNewTemplateName(selectedSupplier?.businessName.toLowerCase() || 'plantilla');
                  setIsTemplateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Plantilla</span>
              </button>
            </div>

            <div className="space-y-2">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                    selectedTemplateId === t.id ? 'border-blue-600 bg-blue-50/10' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-500">
                      Código: {t.codeColumn}, Precio: {t.priceColumn}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsTemplateModalOpen(true); }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Eliminar plantilla?')) setTemplates(templates.filter(x => x.id !== t.id));
                      }}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <span>Siguiente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Cargar Archivo Excel */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Paso 3: Cargar Archivo Excel</h2>
            <p className="text-xs text-slate-500">
              Sube la lista de precios de <span className="font-bold text-slate-800">{selectedSupplier?.businessName}</span>
            </p>
          </div>

          <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/40">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleSimulateUpload}
              className="sr-only"
            />
            <FileSpreadsheet className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-xs text-slate-800 font-bold">
              Arrastra un archivo o haz clic para seleccionar
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Formatos soportados: .xlsx, .xls, .csv</p>
            <div className="mt-3 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-2xs">
              Seleccionar archivo <span className="text-slate-400 font-normal">Sin archiv...ccionados</span>
            </div>
          </label>

          <div className="text-xs space-y-1.5 text-slate-600 border-t border-slate-100 pt-4">
            <p className="font-bold text-slate-800">Configuración de la plantilla:</p>
            <p>• Columna Código Proveedor: <strong className="text-slate-900">{selectedTemplate.codeColumn}</strong></p>
            <p>• Columna Descripción: <strong className="text-slate-900">{selectedTemplate.descColumn}</strong></p>
            <p>• Columna Precio: <strong className="text-slate-900">{selectedTemplate.priceColumn}</strong></p>
            <p>• Tiene encabezado: <strong className="text-slate-900">{selectedTemplate.hasHeaderRow ? 'Sí' : 'No'}</strong></p>
            <p>• Fila inicial: <strong className="text-slate-900">{selectedTemplate.startRow}</strong></p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
            >
              Continuar a Vista Previa
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Vista Previa de Datos */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Paso 4: Vista Previa de Datos</h2>
            <p className="text-xs text-slate-500">Verifica que las columnas se leyeron correctamente (7745 filas)</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Código Proveedor</th>
                  <th className="py-2.5 px-4">Descripción</th>
                  <th className="py-2.5 px-4 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samplePreviewRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-700">{r.code}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{r.desc}</td>
                    <td className="py-2.5 px-4 text-right font-black text-slate-900">${r.price.toFixed(2).replace('.', ',')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-center text-xs text-slate-400 py-1">
            Mostrando 50 de 7745 filas
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setStep(5)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <span>Analizar Cambios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Análisis de Actualización */}
      {step === 5 && (
        <div className="space-y-4">
          {/* Top 5 Metric Cards matching screenshot image_0bb3549d.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs text-center">
              <div className="text-2xl font-black text-slate-900">7745</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Total en archivo</div>
            </div>
            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl shadow-2xs text-center">
              <div className="text-2xl font-black text-blue-600">1375</div>
              <div className="text-[11px] text-blue-600/80 font-medium mt-0.5">A actualizar</div>
            </div>
            <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl shadow-2xs text-center">
              <div className="text-2xl font-black text-amber-600">6370</div>
              <div className="text-[11px] text-amber-600/80 font-medium mt-0.5">No encontrados</div>
            </div>
            <div className="p-4 bg-red-50/40 border border-red-200 rounded-xl shadow-2xs text-center">
              <div className="text-2xl font-black text-red-500">375</div>
              <div className="text-[11px] text-red-500/80 font-medium mt-0.5">Discontinuados</div>
            </div>
            <div className="p-3 bg-amber-50/30 border border-amber-200 rounded-xl flex items-center justify-center">
              <button
                onClick={() => alert('Descargando archivo Excel de 375 productos discontinuados...')}
                className="w-full py-2 px-3 border border-orange-400 bg-white text-orange-600 hover:bg-orange-50 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Discontinuados</span>
              </button>
            </div>
          </div>

          {/* Average Variation Card */}
          <div className="p-3 bg-red-50/20 border border-red-200 rounded-xl w-48 text-center">
            <div className="text-xl font-black text-red-600">+0.0%</div>
            <div className="text-[11px] text-red-500/80 font-medium">Variación promedio</div>
          </div>

          {/* Analysis Container Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Paso 5: Análisis de Actualización</h2>
              <p className="text-xs text-slate-500">Revisa los cambios antes de aplicarlos</p>
            </div>

            {/* Filter Sub-Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold max-w-lg">
              <button
                onClick={() => setAnalysisTab('todos')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  analysisTab === 'todos' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos (8120)
              </button>
              <button
                onClick={() => setAnalysisTab('actualizar')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  analysisTab === 'actualizar' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Actualizar (1375)
              </button>
              <button
                onClick={() => setAnalysisTab('no_encontrados')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  analysisTab === 'no_encontrados' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                No encontrados (6370)
              </button>
              <button
                onClick={() => setAnalysisTab('discontinuados')}
                className={`flex-1 py-1.5 rounded-md text-center transition-colors ${
                  analysisTab === 'discontinuados' ? 'bg-white shadow-xs text-red-600 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Discontinuados (375)
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3 text-right">Precio Anterior</th>
                    <th className="py-2.5 px-3 text-right">Precio Nuevo</th>
                    <th className="py-2.5 px-3 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentAnalysisFiltered.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 border border-blue-600 text-blue-700 rounded text-[11px] font-bold">
                          Actualizar
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-600">{row.supplierCode}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{row.sku}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{row.productName}</td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">${row.oldPrice.toFixed(2).replace('.', ',')}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-950">${row.newPrice.toFixed(2).replace('.', ',')}</td>
                      <td className="py-3 px-3 text-right text-slate-500 font-mono text-[11px]">
                        — {row.variationPct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(4)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleApplyFinalUpdates}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar 1375 Actualizaciones</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6: Completado */}
      {step === 6 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">¡Actualización de Precios Completada!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Se han actualizado los costos y recalculado los precios de venta para 1.375 productos de <strong className="text-slate-800">{selectedSupplier?.businessName}</strong>.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Realizar otra actualización
            </button>
          </div>
        </div>
      )}

      {/* Modal Nueva Plantilla */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Nueva Plantilla</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Nombre de la plantilla *</label>
                <input
                  type="text"
                  placeholder="Ej: Lista Oficial 2024"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Col. Código</label>
                  <select
                    value={newCodeCol}
                    onChange={(e) => setNewCodeCol(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Col. Descripción</label>
                  <select
                    value={newDescCol}
                    onChange={(e) => setNewDescCol(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Col. Precio</label>
                  <select
                    value={newPriceCol}
                    onChange={(e) => setNewPriceCol(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newHasHeader}
                    onChange={(e) => setNewHasHeader(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${newHasHeader ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${newHasHeader ? 'right-0.5' : 'left-0.5'}`}></div>
                  </div>
                  <span className="font-semibold text-slate-800">Tiene fila de encabezado</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Fila inicial</label>
                  <input
                    type="number"
                    value={newStartRow}
                    onChange={(e) => setNewStartRow(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nombre de hoja</label>
                  <input
                    type="text"
                    placeholder="(primera hoja)"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Crear Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
