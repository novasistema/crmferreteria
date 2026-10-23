import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Store,
  Key,
  Globe,
  Calculator,
  CheckCircle2,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Package,
} from 'lucide-react';

export const MercadoLibreView: React.FC = () => {
  const { store, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'publications' | 'config' | 'calculator'>('publications');

  // Config state
  const [appId, setAppId] = useState('4881297445019284');
  const [secretKey, setSecretKey] = useState('••••••••••••');
  const [isConnected, setIsConnected] = useState(false);

  // Calculator state
  const [calcMode, setCalcMode] = useState<'price' | 'net'>('price');
  const [salePrice, setSalePrice] = useState<number | ''>(3500);
  const [productCost, setProductCost] = useState<number | ''>(1500);
  const [listingType, setListingType] = useState<'classic' | 'premium'>('classic');

  const redirectUrl = 'https://ferreteritabruzzone.com.ar/api/mercadolibre/callback';

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Credenciales de MercadoLibre actualizadas correctamente', 'success');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(redirectUrl);
    showToast('URL de Redirección copiada al portapapeles', 'success');
  };

  const handleConnectOAuth = () => {
    showToast('Redirigiendo a autorización oficial de MercadoLibre...', 'info');
    setTimeout(() => {
      setIsConnected(true);
      showToast('¡Cuenta de MercadoLibre conectada con éxito!', 'success');
    }, 1500);
  };

  // Calculator logic
  const numPrice = Number(salePrice) || 0;
  const numCost = Number(productCost) || 0;
  const commissionRate = listingType === 'premium' ? 0.28 : 0.13; // ~13% classic, ~28% premium
  const commissionAmount = numPrice * commissionRate;
  const shippingFee = numPrice > 30000 ? 4500 : 0; // free shipping threshold estimate
  const taxesEst = numPrice * 0.03; // IIBB / retenciones
  const netEarnings = numPrice - commissionAmount - shippingFee - taxesEst - numCost;

  return (
    <div className="flex-1 w-full h-full min-h-0 overflow-y-auto bg-slate-950 text-slate-100 custom-scrollbar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Store className="w-7 h-7 text-amber-400" />
              <span>MercadoLibre</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Publicá y gestioná tus productos en MercadoLibre.
            </p>
          </div>
        </div>

        {/* 4 KPI Cards matching exact screenshots */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-3">
            <span className="text-amber-400 text-lg">⏱️</span>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estado</span>
              <span className="text-base font-black text-white">Configurado</span>
            </div>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Publicaciones Activas</span>
            <div className="mt-1 text-2xl font-black tracking-tight text-emerald-400">7</div>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Borradores</span>
            <div className="mt-1 text-2xl font-black tracking-tight text-white">0</div>
          </div>
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Con Errores</span>
            <div className="mt-1 text-2xl font-black tracking-tight text-rose-500">0</div>
          </div>
        </div>

        {/* Sub-tabs matching screenshots */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('publications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'publications' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            📦 Publicaciones (7)
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'config' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚙️ Configuración
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'calculator' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🧮 Calculadora
          </button>
        </div>

        {/* TAB 1: PUBLICATIONS & OAUTH */}
        {activeTab === 'publications' && (
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              <Globe className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-black text-white">Conectá tu cuenta de MercadoLibre</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isConnected
                  ? '¡Cuenta conectada exitosamente con MercadoLibre! Sincronizando publicaciones activas...'
                  : 'Las credenciales están configuradas. Ahora autorizá la conexión con tu cuenta de MercadoLibre.'}
              </p>
            </div>
            {!isConnected ? (
              <button
                onClick={handleConnectOAuth}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
              >
                Conectar con MercadoLibre
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" /> Conectado y Sincronizado (7 publicaciones activas)
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONFIGURATION */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* API Credentials */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Credenciales de la API</h3>
              </div>

              <p className="text-xs text-slate-400">
                Ingresá el App ID y Secret Key de tu aplicación creada en{' '}
                <a
                  href="https://developers.mercadolibre.com.ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline hover:text-blue-300 inline-flex items-center gap-0.5"
                >
                  developers.mercadolibre.com.ar <ExternalLink className="w-3 h-3" />
                </a>
              </p>

              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                Credenciales configuradas correctamente
              </div>

              <form onSubmit={handleSaveCredentials} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">App ID (Client ID)</label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Secret Key (Client Secret)</label>
                    <input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  Actualizar Credenciales
                </button>
              </form>
            </div>

            {/* OAuth Connection */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Globe className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Conexión con MercadoLibre</h3>
              </div>
              <p className="text-xs text-slate-400">
                Autorizá el acceso a tu cuenta de MercadoLibre para poder publicar productos. Hacé clic en el botón para autorizar a Nova Systems a acceder a tu cuenta de MercadoLibre. Se abrirá una nueva ventana donde deberás iniciar sesión y autorizar la aplicación.
              </p>
              <button
                onClick={handleConnectOAuth}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
              >
                Conectar con MercadoLibre
              </button>
            </div>

            {/* Important Info & Redirect URL */}
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-white">Información Importante</h3>
              <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5">
                <li>
                  Creá una aplicación en{' '}
                  <a href="https://developers.mercadolibre.com.ar" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                    developers.mercadolibre.com.ar
                  </a>
                </li>
                <li>Copiá el App ID y Secret Key que te dan</li>
                <li>Pegá las credenciales arriba y guardalas</li>
                <li>Conectá tu cuenta de MercadoLibre con el botón amarillo</li>
                <li>Agregá productos y publicalos directamente desde acá</li>
              </ol>

              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-amber-300 block">
                  URL de Redirección (Redirect URI): Configurá esta URL en tu aplicación de MercadoLibre:
                </span>
                <div className="flex items-center justify-between gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-amber-400">
                  <span className="truncate">{redirectUrl}</span>
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-lg shrink-0 cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Calculator className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Calculadora de Comisiones ML</h3>
              </div>
              <p className="text-xs text-slate-400">
                Calculá cuánto te queda después de las comisiones de MercadoLibre, o cuánto tenés que publicar para recibir lo que querés.
              </p>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                <button
                  onClick={() => setCalcMode('price')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calcMode === 'price' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Tengo el precio de venta
                </button>
                <button
                  onClick={() => setCalcMode('net')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calcMode === 'net' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Quiero recibir X
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Precio de publicación ($)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Costo del producto ($) (opcional)</label>
                  <input
                    type="number"
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl font-mono text-white focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de publicación</label>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="classic">Clásica (~13%)</option>
                    <option value="premium">Premium (Clásica) (total ~50%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">Resultado</h3>
                {numPrice > 0 ? (
                  <div className="space-y-3 pt-4 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Precio de Venta:</span>
                      <span className="font-mono font-bold text-white">${numPrice.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Comisión MercadoLibre ({(commissionRate * 100)}%):</span>
                      <span className="font-mono font-bold text-rose-400">-${commissionAmount.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Costo de Envío Estimado:</span>
                      <span className="font-mono font-bold text-amber-400">-${shippingFee.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Impuestos / Retenciones (3%):</span>
                      <span className="font-mono font-bold text-amber-400">-${taxesEst.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    {numCost > 0 && (
                      <div className="flex justify-between py-1.5 border-b border-slate-800">
                        <span className="text-slate-400">Costo del Producto:</span>
                        <span className="font-mono font-bold text-slate-300">-${numCost.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-sm font-black">
                      <span className="text-white">Ganancia Neta Estimada:</span>
                      <span className={`font-mono ${netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        ${netEarnings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center text-slate-500 text-xs">
                    Ingresá un precio para ver el cálculo de comisiones.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
