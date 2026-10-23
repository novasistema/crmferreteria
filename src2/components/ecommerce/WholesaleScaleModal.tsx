import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, Save, Layers, DollarSign, Percent } from 'lucide-react';

interface WholesaleScaleModalProps {
  product: Product;
  onClose: () => void;
}

export const WholesaleScaleModal: React.FC<WholesaleScaleModalProps> = ({ product, onClose }) => {
  const { store } = useApp();

  const [tiers, setTiers] = useState<
    { minQty: number; discountPercent?: number; price?: number }[]
  >(
    product.wholesalePriceTiers && product.wholesalePriceTiers.length > 0
      ? [...product.wholesalePriceTiers]
      : [
          { minQty: 5, discountPercent: 5, price: Math.round(product.priceMinorista * 0.95) },
          { minQty: 10, discountPercent: 10, price: Math.round(product.priceMinorista * 0.9) },
        ]
  );

  const handleAddTier = () => {
    const lastQty = tiers.length > 0 ? tiers[tiers.length - 1].minQty : 0;
    setTiers([...tiers, { minQty: lastQty + 5, discountPercent: 15, price: 0 }]);
  };

  const handleRemoveTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleTierChange = (
    index: number,
    field: 'minQty' | 'discountPercent' | 'price',
    val: number
  ) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: val };
    if (field === 'discountPercent') {
      const basePrice = product.wholesaleCustomPrice || product.priceMayorista || product.priceMinorista;
      newTiers[index].price = Math.round(basePrice * (1 - val / 100) * 100) / 100;
    }
    setTiers(newTiers);
  };

  const handleSave = () => {
    store.updateProductWholesale(product.id, {
      wholesalePriceTiers: tiers.sort((a, b) => a.minQty - b.minQty),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Escalas de Precios por Volumen</h3>
              <p className="text-xs text-slate-400">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            Define descuentos automáticos por cantidad para clientes mayoristas.
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {tiers.map((tier, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800"
              >
                <div className="w-28">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Cant. Mínima
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tier.minQty}
                    onChange={(e) => handleTierChange(idx, 'minQty', parseInt(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="w-28">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    % Descuento
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={tier.discountPercent ?? ''}
                      onChange={(e) =>
                        handleTierChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 pr-6 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                    />
                    <Percent className="w-3 h-3 text-slate-400 absolute right-2 top-2" />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Precio Unit. ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tier.price ?? ''}
                    onChange={(e) =>
                      handleTierChange(idx, 'price', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={() => handleRemoveTier(idx)}
                  className="p-2 mt-4 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddTier}
            className="w-full py-2 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Escala de Cantidad
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Escalas
          </button>
        </div>
      </div>
    </div>
  );
};
