import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Star, 
  MapPin, 
  Phone 
} from 'lucide-react';
import { WarehouseLocation } from '../../types';

const INITIAL_WAREHOUSES: WarehouseLocation[] = [
  {
    id: 'w-1',
    code: 'SUC-01',
    name: 'Bruzzone Express',
    address: 'Av. Libertador 4520, Rosario',
    phone: '341-4567890',
    isMain: false,
    active: true
  },
  {
    id: 'w-2',
    code: 'DEP-01',
    name: 'Deposito',
    address: 'Parque Industrial Lote 12',
    phone: '341-9876543',
    isMain: false,
    active: true
  },
  {
    id: 'w-3',
    code: 'CASA CENTRAL',
    name: 'Depósito Central',
    address: 'Ruta 9 Km 285',
    phone: '341-5551234',
    isMain: true,
    active: true
  }
];

export const DepositosSucursalesModule: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>(INITIAL_WAREHOUSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarehouseLocation | null>(null);

  // Form
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isMain, setIsMain] = useState(false);
  const [active, setActive] = useState(true);

  const handleOpenNew = () => {
    setEditingItem(null);
    setCode(`DEP-0${warehouses.length + 1}`);
    setName('');
    setAddress('');
    setPhone('');
    setIsMain(false);
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: WarehouseLocation) => {
    setEditingItem(w);
    setCode(w.code);
    setName(w.name);
    setAddress(w.address || '');
    setPhone(w.phone || '');
    setIsMain(!!w.isMain);
    setActive(w.active);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editingItem) {
      setWarehouses(warehouses.map(w => w.id === editingItem.id ? {
        ...w,
        code: code.trim(),
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        isMain,
        active
      } : (isMain ? { ...w, isMain: false } : w)));
    } else {
      const newWh: WarehouseLocation = {
        id: `w-${Date.now()}`,
        code: code.trim(),
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        isMain,
        active
      };
      setWarehouses(isMain 
        ? [...warehouses.map(w => ({ ...w, isMain: false })), newWh] 
        : [...warehouses, newWh]
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Desea eliminar esta sucursal/depósito?')) {
      setWarehouses(warehouses.filter(w => w.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-slate-900" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Depósitos y Sucursales</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Gestión de depósitos, sucursales y puntos de venta</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Depósito</span>
        </button>
      </div>

      {/* Main Container Card: Lista de Depósitos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-base font-bold text-slate-900 mb-3">Lista de Depósitos</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Nombre</th>
                <th className="py-2.5 px-3">Dirección</th>
                <th className="py-2.5 px-3">Teléfono</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warehouses.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-medium text-slate-700">{w.code}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{w.name}</span>
                      {w.isMain && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          Principal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{w.address || '-'}</td>
                  <td className="py-3.5 px-3 text-slate-500">{w.phone || '-'}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-700 text-white rounded text-[11px] font-bold">
                      {w.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(w)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Depósito */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingItem ? 'Editar Depósito' : 'Nuevo Depósito'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Depósito Central"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle y número, localidad"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  placeholder="Ej: 341-5551234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMain}
                    onChange={(e) => setIsMain(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">¿Establecer como Depósito Principal?</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800">Depósito Activo</span>
                </label>
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
              >
                Guardar Depósito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
