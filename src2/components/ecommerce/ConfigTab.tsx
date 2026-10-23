import React, { useState } from 'react';
import { EcommerceConfig } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Save,
  Globe,
  Truck,
  Layers,
  Smartphone,
  Store,
  DollarSign,
  Tag,
  Share2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const MOBILE_MODULE_OPTIONS = [
  'Clientes',
  'Productos',
  'Pedidos',
  'Ventas',
  'Gastos',
  'Saldos Clientes',
  'Proveedores',
];

export const ConfigTab: React.FC = () => {
  const { store, showToast } = useApp();
  const currentConfig = store.ecommerceConfig;
  const categories = store.categories;

  const [form, setForm] = useState<EcommerceConfig>({ ...currentConfig });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync if store changes externally
  React.useEffect(() => {
    setForm({ ...store.ecommerceConfig });
  }, [store.ecommerceConfig]);

  const handleToggleCategory = (catId: string) => {
    const current = form.selectedCategoryIds || [];
    if (current.includes(catId)) {
      setForm({ ...form, selectedCategoryIds: current.filter((id) => id !== catId) });
    } else {
      setForm({ ...form, selectedCategoryIds: [...current, catId] });
    }
  };

  const handleToggleMobileModule = (moduleName: string) => {
    const current = form.selectedMobileModules || [];
    if (current.includes(moduleName)) {
      setForm({ ...form, selectedMobileModules: current.filter((m) => m !== moduleName) });
    } else {
      setForm({ ...form, selectedMobileModules: [...current, moduleName] });
    }
  };

  const handleSave = () => {
    store.updateEcommerceConfig(form);
    setSavedSuccess(true);
    showToast('Configuración de E-Commerce guardada y aplicada exitosamente', 'success');
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Sticky/Quick Save Action Bar */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Configuración de Tienda & Distribuidora</h3>
            <p className="text-[11px] text-slate-400">
              Personalizá datos de contacto, listas, categorías, módulos y logística
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Guardar Cambios
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">
            ¡Configuración guardada exitosamente! Los cambios ya se encuentran activos en la tienda y la distribuidora.
          </p>
        </div>
      )}

      {/* 1. Tienda Online General */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Tienda Online (Minorista)</h3>
              <p className="text-xs text-slate-400">
                Ajustes generales del catálogo público para clientes finales.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Activar Tienda Online</span>
            <input
              type="checkbox"
              checked={form.storeActive}
              onChange={(e) => setForm({ ...form, storeActive: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de la Tienda
            </label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Moneda</label>
            <input
              type="text"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción del Negocio
            </label>
            <textarea
              rows={2}
              value={form.storeDescription}
              onChange={(e) => setForm({ ...form, storeDescription: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Socials */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Facebook (URL)
            </label>
            <input
              type="text"
              value={form.facebookUrl || ''}
              onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Instagram (URL)
            </label>
            <input
              type="text"
              value={form.instagramUrl || ''}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              WhatsApp de Ventas
            </label>
            <input
              type="text"
              value={form.whatsappNumber || ''}
              onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descuento General Web (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={form.generalDiscountPercent}
                onChange={(e) =>
                  setForm({ ...form, generalDiscountPercent: parseFloat(e.target.value) || 0 })
                }
                className="w-28 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
              />
              {form.generalDiscountPercent > 0 && (
                <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg">
                  {form.generalDiscountPercent.toFixed(2)}% OFF en toda la tienda
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Envíos y Logística */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Envíos & Logística</h3>
            <p className="text-xs text-slate-400">
              Configura costos de entrega a domicilio y opciones de retiro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">Habilitar Envíos</span>
            <input
              type="checkbox"
              checked={form.shippingEnabled}
              onChange={(e) => setForm({ ...form, shippingEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">Retiro en Local</span>
            <input
              type="checkbox"
              checked={form.storePickupEnabled}
              onChange={(e) => setForm({ ...form, storePickupEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
            />
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Costo de Envío Fijo ($)
            </label>
            <input
              type="number"
              step="100"
              value={form.fixedShippingCost}
              onChange={(e) =>
                setForm({ ...form, fixedShippingCost: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Envío Gratis desde ($)
            </label>
            <input
              type="number"
              step="1000"
              value={form.freeShippingMinAmount}
              onChange={(e) =>
                setForm({ ...form, freeShippingMinAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* 3. Categorías de la Tienda */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Categorías Visibles en la Tienda</h3>
              <p className="text-xs text-slate-400">
                Selecciona qué rubros se exhibirán en la navegación web ({form.selectedCategoryIds?.length || 0} seleccionadas).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const isSelected = form.selectedCategoryIds?.includes(cat.id);
            return (
              <label
                key={cat.id}
                onClick={() => handleToggleCategory(cat.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-semibold">{cat.name}</span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700 pointer-events-none"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Módulos Móviles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Módulos Móviles Habilitados</h3>
            <p className="text-xs text-slate-400">
              Vistas activas para la aplicación de vendedores y repartidores ({form.selectedMobileModules?.length || 0} activos).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {MOBILE_MODULE_OPTIONS.map((m) => {
            const isSelected = form.selectedMobileModules?.includes(m);
            return (
              <label
                key={m}
                onClick={() => handleToggleMobileModule(m)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-100'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-semibold">{m}</span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700 pointer-events-none"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Tienda Mayorista / Distribuidora */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Portal / Tienda Mayorista (Distribuidora)</h3>
              <p className="text-xs text-slate-400">
                Condiciones comerciales para ferreterías, revendedores y clientes de cuenta corriente.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Tienda Mayorista Activa</span>
            <input
              type="checkbox"
              checked={form.wholesaleActive}
              onChange={(e) => setForm({ ...form, wholesaleActive: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre de la Distribuidora
            </label>
            <input
              type="text"
              value={form.wholesaleName}
              onChange={(e) => setForm({ ...form, wholesaleName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Comercial
            </label>
            <input
              type="email"
              value={form.wholesaleEmail}
              onChange={(e) => setForm({ ...form, wholesaleEmail: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción Comercial
            </label>
            <textarea
              rows={2}
              value={form.wholesaleDescription}
              onChange={(e) => setForm({ ...form, wholesaleDescription: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Teléfono Comercial
            </label>
            <input
              type="text"
              value={form.wholesalePhone}
              onChange={(e) => setForm({ ...form, wholesalePhone: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              WhatsApp Mayorista
            </label>
            <input
              type="text"
              value={form.wholesaleWhatsapp}
              onChange={(e) => setForm({ ...form, wholesaleWhatsapp: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Pedido Mínimo Mayorista ($)
            </label>
            <input
              type="number"
              step="1000"
              value={form.wholesaleMinOrderAmount}
              onChange={(e) =>
                setForm({ ...form, wholesaleMinOrderAmount: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mínimo de Artículos por Pedido
            </label>
            <input
              type="number"
              min="0"
              value={form.wholesaleMinItemCount}
              onChange={(e) =>
                setForm({ ...form, wholesaleMinItemCount: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">Envío / Transporte Propio</span>
            <input
              type="checkbox"
              checked={form.wholesaleShippingEnabled}
              onChange={(e) => setForm({ ...form, wholesaleShippingEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
            <span className="text-xs font-semibold text-slate-200">Retiro en Depósito Central</span>
            <input
              type="checkbox"
              checked={form.wholesalePickupEnabled}
              onChange={(e) => setForm({ ...form, wholesalePickupEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700"
            />
          </label>
        </div>
      </div>

      {/* Save Button Bar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95"
        >
          <Save className="w-4 h-4" />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};
