import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  Plus,
  History,
  Search,
  Building,
  X,
  Check,
  Package,
} from 'lucide-react';

interface AdjustmentRecord {
  id: string;
  date: string;
  productName: string;
  type: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  notes: string;
}

export const StockAdjustView: React.FC = () => {
  const { store, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [adjustments, setAdjustments] = useState<AdjustmentRecord[]>([
    {
      id: 'adj-1',
      date: '07/10/2026 12:25',
      productName: 'GUIRNALDA 5M + LAMPARAS',
      type: 'Ajuste',
      quantityChange: 0,
      previousStock: 4,
      newStock: 4,
      notes: 'Ajuste desde ficha de producto',
    },
    {
      id: 'adj-2',
      date: '06/10/2026 12:28',
      productName: 'FUMIGANTE FUMI XAN',
      type: 'Ajuste',
      quantityChange: 0,
      previousStock: 9,
      newStock: 9,
      notes: 'Ajuste desde ficha de producto',
    },
    {
      id: 'adj-3',
      date: '05/10/2026 10:58',
      productName: 'BARRERA ANTI HORMIGAS',
      type: 'Ajuste',
      quantityChange: 4,
      previousStock: -3,
      newStock: 1,
      notes: 'Ajuste desde ficha de producto',
    },
    {
      id: 'adj-4',
      date: '29/09/2026 09:55',
      productName: 'SOPORTE LUQUE PAR',
      type: 'Ajuste',
      quantityChange: 6,
      previousStock: -6,
      newStock: 0,
      notes: 'Ajuste desde ficha de producto',
    },
    {
      id: 'adj-5',
      date: '28/09/2026 17:56',
      productName: 'MEZCLADOR PARED',
      type: 'Ajuste',
      quantityChange: 2,
      previousStock: 0,
      newStock: 2,
      notes: 'Ajuste desde ficha de producto',
    },
  ]);

  const [selectedWarehouse, setSelectedWarehouse] = useState('Depósito Principal (Central)');
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'Sumar' | 'Restar' | 'Establecer'>('Sumar');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState('');

  const products = store.products || [];
  const searchResults = products.filter((p) => {
    if (!productSearch.trim()) return false;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      showToast('Seleccione un producto para ajustar', 'error');
      return;
    }
    const numQty = Number(quantity) || 0;
    const prevStock = selectedProduct.stock || 0;
    let newStock = prevStock;
    let change = numQty;

    if (adjustType === 'Sumar') {
      newStock = prevStock + numQty;
      change = numQty;
    } else if (adjustType === 'Restar') {
      newStock = prevStock - numQty;
      change = -numQty;
    } else {
      newStock = numQty;
      change = numQty - prevStock;
    }

    const newRecord: AdjustmentRecord = {
      id: `adj-${Date.now()}`,
      date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
      productName: selectedProduct.name,
      type: 'Ajuste Manual',
      quantityChange: change,
      previousStock: prevStock,
      newStock: newStock,
      notes: reason.trim() || 'Ajuste manual de inventario',
    };

    setAdjustments([newRecord, ...adjustments]);
    showToast(`Stock de "${selectedProduct.name}" ajustado con éxito`, 'success');
    setIsModalOpen(false);
    setSelectedProduct(null);
    setProductSearch('');
    setQuantity(1);
    setReason('');
  };

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Header matching exact user screenshot */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Sliders className="w-7 h-7 text-blue-500" />
              <span>Ajuste de Stock</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Realiza ajustes manuales al inventario.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Ajuste</span>
          </button>
        </div>

        {/* Historial de Ajustes matching exact screenshot */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" /> Historial de Ajustes
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Últimos ajustes manuales realizados al inventario.</p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Producto</th>
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4 text-center">Cantidad</th>
                  <th className="py-3.5 px-4 text-center">Stock Anterior</th>
                  <th className="py-3.5 px-4 text-center">Stock Nuevo</th>
                  <th className="py-3.5 px-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{adj.date}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{adj.productName}</td>
                    <td className="py-3.5 px-4 text-slate-300">{adj.type}</td>
                    <td className={`py-3.5 px-4 text-center font-mono font-bold ${adj.quantityChange > 0 ? 'text-emerald-400' : adj.quantityChange < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      {adj.quantityChange > 0 ? `+${adj.quantityChange}` : adj.quantityChange}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{adj.previousStock}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">{adj.newStock}</td>
                    <td className="py-3.5 px-4 text-slate-400">{adj.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Ajuste de Inventario matching exact screenshot */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
                <h3 className="text-lg font-black text-white">Ajuste de Inventario</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmAdjustment} className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                {/* Depósito / Sucursal */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-400" /> Depósito / Sucursal
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Depósito Principal (Central)">Depósito Principal (Central)</option>
                    <option value="Depósito Secundario">Depósito Secundario</option>
                    <option value="Sucursal Norte">Sucursal Norte</option>
                  </select>
                </div>

                {/* Agregar Productos */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300">Agregar Productos</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre, SKU o código de barras..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {productSearch.trim() && searchResults.length > 0 && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                      {searchResults.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductSearch('');
                          }}
                          className="p-3 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-amber-400">{p.code}</span>
                            <h5 className="font-bold text-white">{p.name}</h5>
                          </div>
                          <span className="text-slate-400">Stock actual: {p.stock}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedProduct && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-amber-400 block">{selectedProduct.code}</span>
                          <h4 className="font-bold text-white text-sm">{selectedProduct.name}</h4>
                          <span className="text-xs text-slate-400">Stock actual: {selectedProduct.stock}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="text-slate-400 hover:text-rose-400 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Tipo de Ajuste</label>
                          <select
                            value={adjustType}
                            onChange={(e) => setAdjustType(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                          >
                            <option value="Sumar">Sumar (+)</option>
                            <option value="Restar">Restar (-)</option>
                            <option value="Establecer">Establecer exacto (=)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">Cantidad</label>
                          <input
                            type="number"
                            min="0"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedProduct && (
                    <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                      No hay artículos agregados. Buscá y seleccioná productos arriba para agregarlos a la lista.
                    </div>
                  )}
                </div>

                {/* Motivo del Ajuste */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Motivo del Ajuste (aplica a todos)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe el motivo del ajuste (inventario físico, pérdida, etc.)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Confirmar Ajuste
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
