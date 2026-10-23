import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceList } from '../../types';
import { PriceListFormModal } from './PriceListFormModal';
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Download,
  Star,
  Layers,
  FileText,
} from 'lucide-react';

export const PriceListsView: React.FC = () => {
  const { store, showToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<PriceList | null>(null);

  const handleOpenCreate = () => {
    setEditingList(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (list: PriceList) => {
    setEditingList(list);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const list = store.priceLists.find((pl) => pl.id === id);
    if (list?.isDefault) {
      showToast('No se puede eliminar la lista predeterminada del sistema', 'error');
      return;
    }
    if (window.confirm('¿Está seguro de eliminar esta lista de precios?')) {
      const success = store.deletePriceList(id);
      if (success) {
        showToast('Lista eliminada correctamente', 'success');
      } else {
        showToast('No se pudo eliminar la lista', 'error');
      }
    }
  };

  const handleExportWholesale = () => {
    const rows = [
      ['Código', 'Producto', 'Precio Minorista', 'Precio Mayorista', 'Marca'],
      ...store.products.map((p) => {
        const mayorista = p.priceMayorista || Math.round(p.priceMinorista * 0.8 * 100) / 100;
        return [
          p.code,
          `"${p.name.replace(/"/g, '""')}"`,
          p.priceMinorista,
          mayorista,
          `"${p.brand || ''}"`,
        ];
      }),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lista_precios_mayorista_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Lista mayorista exportada en CSV con éxito', 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 dark:bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            <span>Listas de Precios</span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Gestiona diferentes listas de precios para mayoristas, minoristas, gremio o cuentas corrientes.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportWholesale}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 shadow-sm flex items-center space-x-2 transition-all cursor-pointer text-xs"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Mayorista</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Lista</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-base font-bold text-white">Listas de Precios Configurados</h2>
            <p className="text-xs text-slate-300">Las listas de precios permiten aplicar ajustes automáticos sobre el precio de venta o calcular precios desde el costo.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider bg-slate-950/80">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Base</th>
                <th className="py-3 px-4">Ajuste / Margen</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-100">
              {store.priceLists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No hay listas de precios configuradas.
                  </td>
                </tr>
              ) : (
                store.priceLists.map((pl) => {
                  const isCost = pl.baseCalculation === 'cost';
                  const marginFormatted = `${pl.marginPercentage >= 0 ? '+' : ''}${pl.marginPercentage.toFixed(2)}% s/${isCost ? 'costo' : 'precio'}`;
                  return (
                    <tr key={pl.id} className="hover:bg-slate-800/60 transition-colors group">
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span className="text-white font-bold">{pl.name}</span>
                        {pl.isDefault && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-semibold border border-amber-500/30" title="Lista Predeterminada">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Predeterminada</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-300 font-semibold">{pl.code}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isCost ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'}`}>
                          {isCost ? '$ Costo' : '% Precio'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-300">
                        {marginFormatted}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          pl.active !== false
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {pl.active !== false ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{pl.active !== false ? 'Activa' : 'Inactiva'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleOpenEdit(pl)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                            title="Editar lista"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!pl.isDefault && (
                            <button
                              onClick={() => handleDelete(pl.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-200 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Eliminar lista"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <PriceListFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        priceListToEdit={editingList}
      />
    </div>
  );
};
