import React, { useState } from 'react';
import { 
  Tag, 
  Layers, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check 
} from 'lucide-react';

const INITIAL_BRANDS = [
  '3M', '911', 'AA', 'AB80', 'ABEG', 'ABRASOL',
  'ABRO', 'ACEITEX', 'ACOPLE', 'ACQUA SYSTEM', 'ADELBRAS', 'AGOREX',
  'AGROMEX', 'AGUA', 'AISLATECH', 'AKAI', 'AKAI ENERGY', 'ALAMBRE 100MM X 1MT',
  'ALAMBRE 127MM', 'ALAMBRE 65MM X 1MT', 'ALAMBRE 75MM X 1MT',
  'ALBA', 'COLOREAR', 'STANLEY', 'DEWALT', 'BOSCH', 'BLACK & DECKER'
];

const INITIAL_RUBROS = [
  'FERRETERIA', 'PINTURERIA', 'HERRAMIENTAS', 'ELECTRICIDAD', 'PLOMERIA',
  'BULONERIA', 'SEGURIDAD INDUSTRIAL', 'JARDINERIA', 'CONSTRUCCION', 'ADHESIVOS Y SELLADORES'
];

export const MarcasRubrosModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'marcas' | 'rubros'>('marcas');
  const [brands, setBrands] = useState<string[]>(INITIAL_BRANDS);
  const [rubros, setRubros] = useState<string[]>(INITIAL_RUBROS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ original: string; current: string } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const currentList = activeTab === 'marcas' ? brands : rubros;
  const filteredList = currentList.filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenNew = () => {
    setEditingItem(null);
    setInputValue('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: string) => {
    setEditingItem({ original: item, current: item });
    setInputValue(item);
    setIsModalOpen(true);
  };

  const handleDelete = (item: string) => {
    if (confirm(`¿Eliminar ${activeTab === 'marcas' ? 'la marca' : 'el rubro'} "${item}"?`)) {
      if (activeTab === 'marcas') {
        setBrands(brands.filter(b => b !== item));
      } else {
        setRubros(rubros.filter(r => r !== item));
      }
    }
  };

  const handleSave = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (!trimmed) return;

    if (activeTab === 'marcas') {
      if (editingItem) {
        setBrands(brands.map(b => b === editingItem.original ? trimmed : b));
      } else {
        if (!brands.includes(trimmed)) setBrands([trimmed, ...brands]);
      }
    } else {
      if (editingItem) {
        setRubros(rubros.map(r => r === editingItem.original ? trimmed : r));
      } else {
        if (!rubros.includes(trimmed)) setRubros([trimmed, ...rubros]);
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Marcas y Rubros</h1>
        <p className="text-xs text-slate-500 mt-0.5">Gestiona las marcas y rubros de productos</p>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Subtabs */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('marcas'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'marcas' ? 'bg-white shadow-xs text-blue-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Marcas ({brands.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('rubros'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'rubros' ? 'bg-white shadow-xs text-blue-800 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rubros ({rubros.length})</span>
          </button>
        </div>

        {/* Search & New Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'marcas' ? 'marcas' : 'rubros'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'marcas' ? 'Nueva Marca' : 'Nuevo Rubro'}</span>
          </button>
        </div>
      </div>

      {/* Grid of 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredList.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <Tag className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800 tracking-wide truncate">{item}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Editar"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="p-1 text-red-400 hover:text-red-600 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nueva/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? `Editar ${activeTab === 'marcas' ? 'Marca' : 'Rubro'}` : `Nueva ${activeTab === 'marcas' ? 'Marca' : 'Rubro'}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
              <input
                type="text"
                placeholder="Ej: COLOREAR, STANLEY..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg uppercase"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!inputValue.trim()} className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
