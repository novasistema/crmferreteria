import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Brand, ProductCategory } from '../../types';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  FolderTree,
  X,
} from 'lucide-react';

export const BrandsRubrosView: React.FC = () => {
  const { store, showToast, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<'brands' | 'rubros'>('brands');
  const [searchTerm, setSearchTerm] = useState('');

  // Brand modals
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brandName, setBrandName] = useState('');

  // Rubro / Category modals
  const [isRubroModalOpen, setIsRubroModalOpen] = useState(false);
  const [editingRubro, setEditingRubro] = useState<ProductCategory | null>(null);
  const [rubroName, setRubroName] = useState('');
  const [rubroCode, setRubroCode] = useState('');

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return (store.brands || []).filter((b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [store.brands, searchTerm]);

  // Filtered rubros
  const filteredRubros = useMemo(() => {
    return (store.categories || []).filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [store.categories, searchTerm]);

  // Handle Save Brand
  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast('Ingrese el nombre de la marca', 'error');
      return;
    }

    if (editingBrand) {
      const updated = (store.brands || []).map((b) =>
        b.id === editingBrand.id ? { ...b, name: brandName.trim().toUpperCase() } : b
      );
      store.brands = updated;
      showToast('Marca actualizada correctamente', 'success');
    } else {
      const newBrand: Brand = {
        id: `brand-${Date.now()}`,
        name: brandName.trim().toUpperCase(),
      };
      if (!store.brands) store.brands = [];
      store.brands.push(newBrand);
      showToast('Marca creada correctamente', 'success');
    }

    triggerRefresh();
    setIsBrandModalOpen(false);
    setEditingBrand(null);
    setBrandName('');
  };

  // Handle Delete Brand
  const handleDeleteBrand = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta marca?')) {
      store.brands = (store.brands || []).filter((b) => b.id !== id);
      triggerRefresh();
      showToast('Marca eliminada', 'success');
    }
  };

  // Handle Save Rubro
  const handleSaveRubro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rubroName.trim()) {
      showToast('Ingrese el nombre del rubro', 'error');
      return;
    }

    if (editingRubro) {
      const updated = (store.categories || []).map((c) =>
        c.id === editingRubro.id
          ? {
              ...c,
              name: rubroName.trim().toUpperCase(),
              code: rubroCode.trim().toUpperCase() || c.code,
            }
          : c
      );
      store.categories = updated;
      showToast('Rubro actualizado correctamente', 'success');
    } else {
      const newCategory: ProductCategory = {
        id: `cat-${Date.now()}`,
        name: rubroName.trim().toUpperCase(),
        code: rubroCode.trim().toUpperCase() || `CAT-${Date.now().toString().slice(-4)}`,
      };
      if (!store.categories) store.categories = [];
      store.categories.push(newCategory);
      showToast('Rubro creado correctamente', 'success');
    }

    triggerRefresh();
    setIsRubroModalOpen(false);
    setEditingRubro(null);
    setRubroName('');
    setRubroCode('');
  };

  // Handle Delete Rubro
  const handleDeleteRubro = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este rubro?')) {
      store.categories = (store.categories || []).filter((c) => c.id !== id);
      triggerRefresh();
      showToast('Rubro eliminado', 'success');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center space-x-2.5">
            <Tag className="w-7 h-7 text-amber-400" />
            <span>Gestión de Marcas y Rubros</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra las marcas comerciales y rubros/categorías para clasificar todos los artículos del stock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'brands' ? (
            <button
              onClick={() => {
                setEditingBrand(null);
                setBrandName('');
                setIsBrandModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Marca</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRubro(null);
                setRubroName('');
                setRubroCode('');
                setIsRubroModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Rubro</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('brands');
              setSearchTerm('');
            }}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'brands'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Marcas ({(store.brands || []).length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('rubros');
              setSearchTerm('');
            }}
            className={`flex-1 sm:flex-none px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'rubros'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Rubros / Categorías ({(store.categories || []).length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'brands' ? 'Buscar marcas...' : 'Buscar rubros...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === 'brands' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBrands.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Tag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No se encontraron marcas</p>
            </div>
          ) : (
            filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-white text-xs truncate block">{brand.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {brand.id}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingBrand(brand);
                      setBrandName(brand.name);
                      setIsBrandModalOpen(true);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                    title="Editar Marca"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBrand(brand.id)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    title="Eliminar Marca"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRubros.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <FolderTree className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium text-sm">No se encontraron rubros</p>
            </div>
          ) : (
            filteredRubros.map((rubro) => (
              <div
                key={rubro.id}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-white text-xs truncate block">{rubro.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">Código: {rubro.code || '-'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingRubro(rubro);
                      setRubroName(rubro.name);
                      setRubroCode(rubro.code || '');
                      setIsRubroModalOpen(true);
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                    title="Editar Rubro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRubro(rubro.id)}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    title="Eliminar Rubro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>{editingBrand ? 'Editar Marca' : 'Nueva Marca'}</span>
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ej: WOKIN, BREMEN..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {editingBrand ? 'Guardar Cambios' : 'Crear Marca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rubro Modal */}
      {isRubroModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-blue-400" />
                <span>{editingRubro ? 'Editar Rubro' : 'Nuevo Rubro'}</span>
              </h3>
              <button
                onClick={() => setIsRubroModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRubro} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nombre del Rubro *
                </label>
                <input
                  type="text"
                  value={rubroName}
                  onChange={(e) => setRubroName(e.target.value)}
                  placeholder="Ej: Herramientas Manuales..."
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  value={rubroCode}
                  onChange={(e) => setRubroCode(e.target.value)}
                  placeholder="Ej: HER-MAN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-medium font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRubroModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {editingRubro ? 'Guardar Cambios' : 'Crear Rubro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
