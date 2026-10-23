import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceList } from '../../types';
import { X, DollarSign, Sliders, Check } from 'lucide-react';

interface PriceListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceListToEdit?: PriceList | null;
}

export const PriceListFormModal: React.FC<PriceListFormModalProps> = ({
  isOpen,
  onClose,
  priceListToEdit,
}) => {
  const { store, showToast } = useApp();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [baseCalculation, setBaseCalculation] = useState<'cost' | 'sale'>('sale');
  const [marginPercentage, setMarginPercentage] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (priceListToEdit) {
      setName(priceListToEdit.name || '');
      setCode(priceListToEdit.code || '');
      setDescription(priceListToEdit.description || '');
      setBaseCalculation(priceListToEdit.baseCalculation || 'sale');
      setMarginPercentage(priceListToEdit.marginPercentage !== undefined ? priceListToEdit.marginPercentage.toString() : '0');
      setIsDefault(Boolean(priceListToEdit.isDefault));
      setActive(priceListToEdit.active ?? true);
    } else {
      setName('');
      setCode('');
      setDescription('');
      setBaseCalculation('sale');
      setMarginPercentage('0');
      setIsDefault(false);
      setActive(true);
    }
  }, [priceListToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('El nombre de la lista es obligatorio', 'error');
      return;
    }

    const marginNum = parseFloat(marginPercentage) || 0;

    if (priceListToEdit) {
      store.updatePriceList(priceListToEdit.id, {
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase(),
        description: description.trim(),
        baseCalculation,
        marginPercentage: marginNum,
        isDefault,
        active,
      });
      showToast('Lista de precios actualizada con éxito', 'success');
    } else {
      store.addPriceList({
        name: name.trim(),
        code: code.trim() || name.substring(0, 3).toUpperCase(),
        description: description.trim(),
        baseCalculation,
        marginPercentage: marginNum,
        isDefault,
        active,
      });
      showToast('Nueva lista de precios creada con éxito', 'success');
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">
              {priceListToEdit ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-400">
            Configura los parámetros de la lista para calcular precios de venta automáticamente.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mayorista, Efectivo, Gremio..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Código</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: MAY, CT, EF"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional de la lista..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base de Cálculo</label>
              <select
                value={baseCalculation}
                onChange={(e: any) => setBaseCalculation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="sale">Sobre Precio de Venta (Minorista)</option>
                <option value="cost">Sobre Costo</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {baseCalculation === 'sale' ? 'Ajuste porcentual sobre el precio de venta.' : 'Margen o recargo aplicado sobre el costo del producto.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ajuste / Margen (%)</label>
              <input
                type="number"
                step="0.01"
                value={marginPercentage}
                onChange={(e) => setMarginPercentage(e.target.value)}
                placeholder="Ej: 15 o -10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Positivo para aumentar (+), negativo para descuento (-).
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Lista Predeterminada</span>
                <span className="text-[11px] text-slate-400">Usar como lista por defecto para nuevos clientes o ventas.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Activa</span>
                <span className="text-[11px] text-slate-400">Lista disponible para usar en ventas y presupuestos.</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{priceListToEdit ? 'Guardar Cambios' : 'Crear Lista'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
