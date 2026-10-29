import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  FileDown, 
  Edit2, 
  X, 
  Check, 
  Star, 
  Percent, 
  BadgePercent,
  ListOrdered
} from 'lucide-react';

interface PriceListRecord {
  id: string;
  name: string;
  code: string;
  base: 'precio' | 'costo';
  adjustmentPercent: number;
  isDefault: boolean;
  active: boolean;
  description?: string;
}

const INITIAL_PRICE_LISTS: PriceListRecord[] = [
  {
    id: 'pl-1',
    name: '1',
    code: '-',
    base: 'precio',
    adjustmentPercent: 0.00,
    isDefault: false,
    active: true,
    description: 'Lista general de mostrador'
  },
  {
    id: 'pl-2',
    name: 'Cuenta Corriente',
    code: 'CTACTE',
    base: 'precio',
    adjustmentPercent: 10.00,
    isDefault: false,
    active: true,
    description: 'Recargo del 10% para compras financiadas a 30 días'
  },
  {
    id: 'pl-3',
    name: 'EFECTIVO',
    code: '-',
    base: 'precio',
    adjustmentPercent: 5.00,
    isDefault: true,
    active: true,
    description: 'Lista predeterminada de contado efectivo con 5% de ajuste'
  },
  {
    id: 'pl-4',
    name: 'Mayorista',
    code: 'MAY',
    base: 'costo',
    adjustmentPercent: 30.00,
    isDefault: false,
    active: true,
    description: 'Calculada desde costo base + 30%'
  }
];

export const ListasPreciosModule: React.FC = () => {
  const [lists, setLists] = useState<PriceListRecord[]>(INITIAL_PRICE_LISTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListRecord | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [baseCalculation, setBaseCalculation] = useState<'precio' | 'costo'>('precio');
  const [adjustmentPercent, setAdjustmentPercent] = useState<number>(0);
  const [isDefault, setIsDefault] = useState(false);
  const [active, setActive] = useState(true);

  const handleOpenNew = () => {
    setEditingItem(null);
    setName('');
    setCode('');
    setDescription('');
    setBaseCalculation('precio');
    setAdjustmentPercent(0);
    setIsDefault(false);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pl: PriceListRecord) => {
    setEditingItem(pl);
    setName(pl.name);
    setCode(pl.code === '-' ? '' : pl.code);
    setDescription(pl.description || '');
    setBaseCalculation(pl.base);
    setAdjustmentPercent(pl.adjustmentPercent);
    setIsDefault(pl.isDefault);
    setActive(pl.active);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingItem) {
      setLists(lists.map(l => l.id === editingItem.id ? {
        ...l,
        name: name.trim(),
        code: code.trim() || '-',
        description: description.trim(),
        base: baseCalculation,
        adjustmentPercent,
        isDefault,
        active
      } : (isDefault ? { ...l, isDefault: false } : l)));
    } else {
      const newPl: PriceListRecord = {
        id: `pl-${Date.now()}`,
        name: name.trim(),
        code: code.trim() || '-',
        description: description.trim(),
        base: baseCalculation,
        adjustmentPercent,
        isDefault,
        active
      };
      setLists(isDefault ? [...lists.map(l => ({ ...l, isDefault: false })), newPl] : [...lists, newPl]);
    }
    setIsModalOpen(false);
  };

  const handleExportMayorista = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Codigo,Nombre,Base,Ajuste,Estado\n' +
      lists.map(l => `${l.code},"${l.name}",${l.base},${l.adjustmentPercent}%,${l.active ? 'Activa' : 'Inactiva'}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'listas_precios_mayoristas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Listas de Precios</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestiona diferentes listas de precios para mayoristas, minoristas, etc.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMayorista}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar Mayorista</span>
          </button>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Lista</span>
          </button>
        </div>
      </div>

      {/* Main Container Card: Listas de Precios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <ListOrdered className="w-4 h-4 text-slate-700" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Listas de Precios</h2>
            <p className="text-xs text-slate-500">
              Las listas de precios permiten aplicar ajustes automáticos sobre el precio de venta o calcular precios desde el costo.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Nombre</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3 text-center">Base</th>
                <th className="py-2.5 px-3 text-center">Ajuste / Margen</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lists.map((pl) => (
                <tr key={pl.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{pl.name}</span>
                      {pl.isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-medium text-slate-600">{pl.code}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 bg-white border border-slate-300 rounded text-slate-700 text-[11px] font-semibold">
                      {pl.base === 'precio' ? '% Precio' : '$ Costo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-emerald-600">
                    {pl.adjustmentPercent > 0 ? `+${pl.adjustmentPercent.toFixed(2)}%` : `${pl.adjustmentPercent.toFixed(2)}%`}
                    <span className="text-[11px] font-medium text-slate-400 ml-1">
                      {pl.base === 'precio' ? 's/precio' : 's/costo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-700 text-white rounded text-[11px] font-bold">
                      {pl.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => handleOpenEdit(pl)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                      title="Editar parámetros"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva / Editar Lista de Precios */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl p-6 animate-in fade-in zoom-in-95 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
                </h3>
                <p className="text-xs text-slate-500">Configura los parámetros de la lista</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nombre *</label>
                  <input
                    type="text"
                    placeholder="Ej: Mayorista"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Código</label>
                  <input
                    type="text"
                    placeholder="Ej: MAY"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Descripción de la lista..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Base de Cálculo</label>
                <select
                  value={baseCalculation}
                  onChange={(e) => setBaseCalculation(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="precio">Sobre Precio de Venta</option>
                  <option value="costo">Sobre Costo</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {baseCalculation === 'precio' 
                    ? 'El precio de lista se calcula aplicando un ajuste porcentual al precio de venta.' 
                    : 'El precio de lista se calcula sumando el margen de ganancia al costo base del producto.'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ajuste de Precio (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentPercent}
                    onChange={(e) => setAdjustmentPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg pr-36"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 text-xs">
                    % sobre {baseCalculation === 'precio' ? 'precio venta' : 'costo'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Positivo para aumentar, negativo para descuento.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Lista Predeterminada</span>
                    <span className="text-[11px] text-slate-500">Usar como lista por defecto para nuevos clientes.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Activa</span>
                    <span className="text-[11px] text-slate-500">Lista disponible para usar.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
              >
                {editingItem ? 'Guardar Cambios' : 'Crear Lista'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
