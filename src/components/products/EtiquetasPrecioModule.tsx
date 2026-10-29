import React, { useState } from 'react';
import { 
  Printer, 
  Search, 
  Tag, 
  Plus, 
  Minus, 
  X, 
  Barcode, 
  Check, 
  Copy 
} from 'lucide-react';
import { Product } from '../../types';

interface EtiquetasPrecioModuleProps {
  products: Product[];
}

interface SelectedTagProduct {
  product: Product;
  copies: number;
}

export const EtiquetasPrecioModule: React.FC<EtiquetasPrecioModuleProps> = ({ products }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedTagProduct[]>([]);
  
  // Tag Settings
  const [tagSize, setTagSize] = useState('Mediana (50×30mm)');
  const [includePrice, setIncludePrice] = useState(true);
  const [includeInternalCode, setIncludeInternalCode] = useState(true);
  const [includeBrand, setIncludeBrand] = useState(true);
  const [includeBarcode, setIncludeBarcode] = useState(true);
  const [includeSupplierCode, setIncludeSupplierCode] = useState(false);
  const [includeRubro, setIncludeRubro] = useState(false);

  // Font Sizes (px)
  const [nameSize, setNameSize] = useState(10);
  const [priceSize, setPriceSize] = useState(14);
  const [codeSize, setCodeSize] = useState(8);
  const [brandSize, setBrandSize] = useState(8);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const totalTagsCount = selectedItems.reduce((acc, item) => acc + item.copies, 0);

  const searchResults = searchQuery.trim().length >= 2
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleAddProduct = (prod: Product) => {
    const existing = selectedItems.find(i => i.product.id === prod.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.product.id === prod.id ? { ...i, copies: i.copies + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { product: prod, copies: 1 }]);
    }
    setSearchQuery('');
  };

  const handlePrint = () => {
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un producto para imprimir sus etiquetas.');
      return;
    }
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Etiquetas de Precio</h1>
          <p className="text-xs text-slate-500 mt-0.5">Seleccione productos y genere etiquetas para imprimir.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">{totalTagsCount} etiquetas</span>
          <button
            onClick={handlePrint}
            disabled={totalTagsCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Container: Buscar Productos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <Search className="w-4 h-4 text-slate-500" />
            <span>Buscar Productos</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nombre, codigo o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {searchQuery.trim().length < 2 && searchResults.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
              <span>Escriba al menos 2 caracteres para buscar.</span>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {searchResults.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleAddProduct(p)}
                  className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="pr-2">
                    <p className="font-bold text-slate-800">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      SKU: {p.code} {p.brand ? `• Marca: ${p.brand}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-slate-900">${(p.priceRetail || 0).toLocaleString('es-AR')}</p>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline">+ Agregar</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Containers: Configuracion & Productos Seleccionados */}
        <div className="space-y-4">
          {/* Configuracion */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Tag className="w-4 h-4 text-slate-700" />
              <span>Configuracion</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Tamano de Etiqueta</label>
              <select
                value={tagSize}
                onChange={(e) => setTagSize(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Mediana (50×30mm)">Mediana (50×30mm)</option>
                <option value="Chica (30×20mm)">Chica (30×20mm)</option>
                <option value="Grande (80×50mm)">Grande (80×50mm)</option>
                <option value="Góndola (100×40mm)">Góndola (100×40mm)</option>
              </select>
            </div>

            {/* Checkboxes 2 columns */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includePrice} onChange={e => setIncludePrice(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-semibold text-slate-700">Precio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeBarcode} onChange={e => setIncludeBarcode(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-semibold text-slate-700">Codigo de barras</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeInternalCode} onChange={e => setIncludeInternalCode(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-semibold text-slate-700">Codigo interno</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeSupplierCode} onChange={e => setIncludeSupplierCode(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-semibold text-slate-700">Cod. Proveedor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeBrand} onChange={e => setIncludeBrand(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-semibold text-slate-700">Marca</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeRubro} onChange={e => setIncludeRubro(e.target.checked)} className="rounded text-blue-600" />
                <span className="font-semibold text-slate-700">Rubro</span>
              </label>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <span className="font-bold text-slate-700 block mb-2">Tamaño de Texto (px)</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nombre</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setNameSize(Math.max(8, nameSize - 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center font-bold">{nameSize}</span>
                    <button onClick={() => setNameSize(Math.min(20, nameSize + 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Precio</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPriceSize(Math.max(10, priceSize - 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center font-bold">{priceSize}</span>
                    <button onClick={() => setPriceSize(Math.min(32, priceSize + 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Códigos</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setCodeSize(Math.max(6, codeSize - 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center font-bold">{codeSize}</span>
                    <button onClick={() => setCodeSize(Math.min(16, codeSize + 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Marca/Rubro</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setBrandSize(Math.max(6, brandSize - 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center font-bold">{brandSize}</span>
                    <button onClick={() => setBrandSize(Math.min(16, brandSize + 1))} className="p-1 border border-slate-200 rounded hover:bg-slate-50"><Plus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Productos Seleccionados */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900">
              Productos Seleccionados ({selectedItems.length})
            </h3>

            {selectedItems.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-slate-400 text-xs">
                Busque y seleccione productos para generar etiquetas.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ${(item.product.priceRetail || 0).toLocaleString('es-AR')} • SKU: {item.product.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Copias:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.copies}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setSelectedItems(selectedItems.map((it, i) => i === idx ? { ...it, copies: val } : it));
                        }}
                        className="w-12 text-center py-0.5 border border-slate-200 rounded bg-white font-bold"
                      />
                      <button
                        onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-800" />
                <h3 className="text-base font-bold text-slate-900">Vista Previa de Impresión ({tagSize})</h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 max-h-[60vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-slate-100 p-4 rounded-xl">
              {selectedItems.flatMap((item) => 
                Array.from({ length: item.copies }).map((_, copyIdx) => (
                  <div key={`${item.product.id}-${copyIdx}`} className="bg-white border-2 border-slate-300 rounded p-2.5 flex flex-col justify-between shadow-xs aspect-[5/3]">
                    <div>
                      {includeBrand && item.product.brand && (
                        <div style={{ fontSize: `${brandSize}px` }} className="font-extrabold text-slate-500 uppercase">
                          {item.product.brand}
                        </div>
                      )}
                      <div style={{ fontSize: `${nameSize}px` }} className="font-bold text-slate-900 leading-tight line-clamp-2">
                        {item.product.name}
                      </div>
                    </div>

                    <div className="pt-1">
                      {includePrice && (
                        <div style={{ fontSize: `${priceSize}px` }} className="font-black text-slate-950">
                          ${(item.product.priceRetail || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-400 font-mono" style={{ fontSize: `${codeSize}px` }}>
                        {includeInternalCode && <span>{item.product.code}</span>}
                        {includeBarcode && <Barcode className="w-8 h-3 text-slate-700" />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Mandar a Imprimir ({totalTagsCount} etiquetas)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
