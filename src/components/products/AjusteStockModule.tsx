import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Plus, 
  History, 
  Search, 
  X, 
  Building2, 
  Package, 
  Check, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { Product, StockAdjustmentRecord } from '../../types';

interface AjusteStockModuleProps {
  products: Product[];
}

const INITIAL_HISTORY: StockAdjustmentRecord[] = [
  {
    id: 'adj-1',
    date: '22/10/2026 17:53',
    productId: 'p-1',
    productName: 'CEPILLO LIMPIA PARED PISCINA 45CM',
    type: 'Ajuste',
    quantity: -3,
    previousStock: 4,
    newStock: 1,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-22'
  },
  {
    id: 'adj-2',
    date: '16/10/2026 11:49',
    productId: 'p-2',
    productName: 'MENSULA CHAROLADA 200×250',
    type: 'Ajuste',
    quantity: 20,
    previousStock: -15,
    newStock: 5,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-16'
  },
  {
    id: 'adj-3',
    date: '16/10/2026 11:49',
    productId: 'p-3',
    productName: 'MENSULA CHAROLADA 250×300',
    type: 'Ajuste',
    quantity: 25,
    previousStock: 0,
    newStock: 25,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-16'
  },
  {
    id: 'adj-4',
    date: '16/10/2026 11:48',
    productId: 'p-4',
    productName: 'MENSULA CHAROLADA 300×350',
    type: 'Ajuste',
    quantity: 11,
    previousStock: -1,
    newStock: 10,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-16'
  },
  {
    id: 'adj-5',
    date: '16/10/2026 11:48',
    productId: 'p-5',
    productName: 'MENSULA CHAROLADA 125×150',
    type: 'Ajuste',
    quantity: 31,
    previousStock: -17,
    newStock: 14,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-16'
  },
  {
    id: 'adj-6',
    date: '16/10/2026 11:47',
    productId: 'p-6',
    productName: 'MENSULA CHAROLADA 100×125',
    type: 'Ajuste',
    quantity: 12,
    previousStock: 14,
    newStock: 26,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-16'
  },
  {
    id: 'adj-7',
    date: '13/10/2026 19:15',
    productId: 'p-7',
    productName: 'TALADRO ATORNILLADOR IMPACTO 13MM 42V 69NN',
    type: 'Ajuste',
    quantity: 0,
    previousStock: 2,
    newStock: 2,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-13'
  },
  {
    id: 'adj-8',
    date: '12/10/2026 12:16',
    productId: 'p-8',
    productName: 'CINTA DOBLE FAZ TRANSPARENTE 19X2',
    type: 'Ajuste',
    quantity: 6,
    previousStock: 0,
    newStock: 6,
    notes: 'Ajuste desde ficha de producto',
    createdAt: '2026-10-12'
  }
];

interface PendingAdjustItem {
  product: Product;
  action: 'add' | 'subtract' | 'set';
  amount: number;
}

export const AjusteStockModule: React.FC<AjusteStockModuleProps> = ({ products }) => {
  const [history, setHistory] = useState<StockAdjustmentRecord[]>(INITIAL_HISTORY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('CASA CENTRAL - Depósito Central');
  const [productQuery, setProductQuery] = useState('');
  const [pendingItems, setPendingItems] = useState<PendingAdjustItem[]>([]);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const searchResults = productQuery.trim().length >= 2
    ? products.filter(p => 
        p.name.toLowerCase().includes(productQuery.toLowerCase()) || 
        p.code.toLowerCase().includes(productQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelectProduct = (prod: Product) => {
    if (pendingItems.some(i => i.product.id === prod.id)) return;
    setPendingItems([...pendingItems, { product: prod, action: 'add', amount: 1 }]);
    setProductQuery('');
  };

  const handleConfirmAdjustments = () => {
    if (pendingItems.length === 0) return;
    const now = new Date();
    const dateStr = `${now.toLocaleDateString('es-AR')} ${now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    
    const newRecords: StockAdjustmentRecord[] = pendingItems.map(item => {
      const current = item.product.stock || 0;
      let newStock = current;
      let diff = 0;
      if (item.action === 'add') {
        diff = item.amount;
        newStock = current + item.amount;
      } else if (item.action === 'subtract') {
        diff = -item.amount;
        newStock = current - item.amount;
      } else {
        diff = item.amount - current;
        newStock = item.amount;
      }

      return {
        id: `adj-${Date.now()}-${Math.random()}`,
        date: dateStr,
        productId: item.product.id,
        productName: item.product.name,
        type: 'Ajuste',
        quantity: diff,
        previousStock: current,
        newStock,
        notes: adjustmentReason.trim() || 'Ajuste manual de inventario físico',
        warehouseName: selectedWarehouse,
        createdAt: now.toISOString()
      };
    });

    setHistory([...newRecords, ...history]);
    setIsModalOpen(false);
    setPendingItems([]);
    setAdjustmentReason('');
  };

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ajuste de Stock</h1>
          <p className="text-xs text-slate-500 mt-0.5">Realiza ajustes manuales al inventario.</p>
        </div>
        <button
          onClick={() => {
            setPendingItems([]);
            setAdjustmentReason('');
            setProductQuery('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Ajuste</span>
        </button>
      </div>

      {/* Main Container Card: Historial de Ajustes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Historial de Ajustes</h2>
            <p className="text-xs text-slate-500">Últimos ajustes manuales realizados al inventario.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 text-center">Tipo</th>
                <th className="py-2.5 px-3 text-center">Cantidad</th>
                <th className="py-2.5 px-3 text-center">Stock Anterior</th>
                <th className="py-2.5 px-3 text-center">Stock Nuevo</th>
                <th className="py-2.5 px-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">{record.date}</td>
                  <td className="py-3 px-3 font-bold text-slate-900 max-w-sm">{record.productName}</td>
                  <td className="py-3 px-3 text-center text-slate-600">{record.type}</td>
                  <td className={`py-3 px-3 text-center font-bold ${
                    record.quantity > 0 ? 'text-emerald-600' : record.quantity < 0 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">{record.previousStock}</td>
                  <td className="py-3 px-3 text-center font-black text-slate-900 text-sm">{record.newStock}</td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">{record.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajuste de Inventario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Ajuste de Inventario</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Warehouse selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Depósito / Sucursal</span>
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white"
                >
                  <option value="CASA CENTRAL - Depósito Central">CASA CENTRAL - Depósito Central ⭐</option>
                  <option value="SUC-01 - Bruzzone Express">SUC-01 - Bruzzone Express</option>
                  <option value="DEP-01 - Deposito">DEP-01 - Deposito</option>
                </select>
              </div>

              {/* Agregar Productos Zone */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                <label className="block text-xs font-bold text-slate-900">Agregar Productos</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre, SKU o código de barras..."
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {searchResults.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 mr-2">{p.code}</span>
                            <span className="font-semibold text-slate-800">{p.name}</span>
                          </div>
                          <span className="font-bold text-slate-600">Stock: {p.stock || 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Buscá y seleccioná un producto activo, luego indicá si querés sumar, restar o establecer el nuevo stock.
                </p>

                {/* Items container */}
                <div className="min-h-[140px] border border-slate-200 rounded-lg p-3 bg-white">
                  {pendingItems.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
                      <Package className="w-7 h-7 mb-1.5 stroke-1" />
                      <span className="font-semibold text-slate-600">No hay artículos agregados</span>
                      <span className="text-[11px]">Buscá y seleccioná productos arriba para agregarlos a la lista</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingItems.map((item, idx) => {
                        const current = item.product.stock || 0;
                        let finalStock = current;
                        if (item.action === 'add') finalStock = current + item.amount;
                        else if (item.action === 'subtract') finalStock = current - item.amount;
                        else finalStock = item.amount;

                        return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                              <p className="text-[11px] text-slate-500">Stock actual: <span className="font-bold text-slate-700">{current}</span></p>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={item.action}
                                onChange={(e) => {
                                  const act = e.target.value as any;
                                  setPendingItems(pendingItems.map((it, i) => i === idx ? { ...it, action: act } : it));
                                }}
                                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white font-semibold"
                              >
                                <option value="add">➕ Sumar</option>
                                <option value="subtract">➖ Restar</option>
                                <option value="set">🎯 Fijar en</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                value={item.amount}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setPendingItems(pendingItems.map((it, i) => i === idx ? { ...it, amount: val } : it));
                                }}
                                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center font-bold"
                              />
                              <div className="text-[11px] text-slate-600 min-w-24">
                                Nuevo stock: <strong className="text-blue-700">{finalStock}</strong>
                              </div>
                              <button
                                onClick={() => setPendingItems(pendingItems.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo del Ajuste */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Motivo del Ajuste (aplica a todos)</label>
                <textarea
                  rows={2}
                  placeholder="Describe el motivo del ajuste (inventario físico, pérdida, rotura, etc.)"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAdjustments}
                disabled={pendingItems.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                Confirmar {pendingItems.length} Ajustes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
