import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Save, DollarSign, Tag, Image, Star, Sparkles } from 'lucide-react';

interface ProductEditOnlineModalProps {
  product: Product;
  onClose: () => void;
}

export const ProductEditOnlineModal: React.FC<ProductEditOnlineModalProps> = ({ product, onClose }) => {
  const { store } = useApp();

  const [publishOnline, setPublishOnline] = useState(product.publishOnline ?? true);
  const [publishWholesale, setPublishWholesale] = useState(product.publishWholesale ?? false);
  const [isFeatured, setIsFeatured] = useState(product.isFeatured ?? false);
  const [isOnOffer, setIsOnOffer] = useState(product.isOnOffer ?? false);
  const [offerPrice, setOfferPrice] = useState<string>(
    product.offerPrice ? product.offerPrice.toString() : ''
  );
  const [customPrice, setCustomPrice] = useState<string>(product.priceMinorista.toString());
  const [description, setDescription] = useState(product.description || '');
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');

  const handleSave = () => {
    store.updateProductEcommerce(product.id, {
      publishOnline,
      publishWholesale,
      isFeatured,
      isOnOffer,
      offerPrice: isOnOffer && offerPrice ? parseFloat(offerPrice) || undefined : undefined,
      priceMinorista: parseFloat(customPrice) || product.priceMinorista,
      description,
      imageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              Editar Producto Online
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {product.name} ({product.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs font-semibold text-slate-200">Publicar en Tienda Online</span>
              <input
                type="checkbox"
                checked={publishOnline}
                onChange={(e) => setPublishOnline(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs font-semibold text-slate-200">Publicar en Distribuidora</span>
              <input
                type="checkbox"
                checked={publishWholesale}
                onChange={(e) => setPublishWholesale(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                Producto Destacado
              </span>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                En Oferta Promocional
              </span>
              <input
                type="checkbox"
                checked={isOnOffer}
                onChange={(e) => setIsOnOffer(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 bg-slate-800 border-slate-700"
              />
            </label>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Precio de Venta ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Precio Oferta ($) {isOnOffer && <span className="text-rose-400">*Activo</span>}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  disabled={!isOnOffer}
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Ej: 1499.99"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 disabled:opacity-40 rounded-lg text-sm text-slate-100 font-semibold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-slate-400" />
              URL de Imagen
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
            {imageUrl && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-slate-950 rounded-lg border border-slate-800">
                <img
                  src={imageUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded object-cover border border-slate-700"
                />
                <span className="text-xs text-slate-400">Vista previa de imagen</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción para la Tienda
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada del producto visible para los clientes..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
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
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
