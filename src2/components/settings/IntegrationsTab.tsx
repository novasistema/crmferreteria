import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Plug,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  CreditCard,
  Store,
  Share2,
  Bot,
  RefreshCw,
  Eye,
  EyeOff,
  Radio,
  Check,
  Cpu,
} from 'lucide-react';

export const IntegrationsTab: React.FC = () => {
  const { showToast } = useApp();

  const [mpToken, setMpToken] = useState('TEST-8492048102948-082412-a720f4c9304918230948-1092834');
  const [mpPublicKey, setMpPublicKey] = useState('TEST-7a8f9d0c-1b2e-4f5a-8b9c-0d1e2f3a4b5c');
  const [mpConnected, setMpConnected] = useState(true);

  const [waToken, setWaToken] = useState('EAAG...wa_cloud_access_token');
  const [waPhoneId, setWaPhoneId] = useState('109482938472910');
  const [waBotActive, setWaBotActive] = useState(true);

  const [metaPixelId, setMetaPixelId] = useState('984029481029481');
  const [meliAppId, setMeliAppId] = useState('839201948201');
  const [meliSyncStock, setMeliSyncStock] = useState(true);

  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [aiPurchaseEnabled, setAiPurchaseEnabled] = useState(true);

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  const toggleShowToken = (key: string) => {
    setShowTokens((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSaveIntegrations = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuración de integraciones guardada con éxito', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Plug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Integraciones Externas & Inteligencia Artificial</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Conexión con MercadoPago, WhatsApp Cloud API, MercadoLibre, Meta Ads y Asistente IA Gemini.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveIntegrations} className="space-y-6 text-xs">
          {/* MercadoPago */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <CreditCard className="w-4 h-4 text-cyan-500" />
                <span className="text-sm">MercadoPago Point & QR Interoperable</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                mpConnected
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/40'
              }`}>
                {mpConnected ? 'Conectado • En Línea' : 'Desconectado'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Access Token (Producción / Sandbox)
                </label>
                <div className="relative">
                  <input
                    type={showTokens['mp'] ? 'text' : 'password'}
                    value={mpToken}
                    onChange={(e) => setMpToken(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-8 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowToken('mp')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showTokens['mp'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Public Key (Checkout Pro / Bricks)
                </label>
                <input
                  type="text"
                  value={mpPublicKey}
                  onChange={(e) => setMpPublicKey(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Cloud API & Bot */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span className="text-sm">WhatsApp Cloud API & Bot Automático</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="waBotCheck"
                  checked={waBotActive}
                  onChange={(e) => setWaBotActive(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="waBotCheck" className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer">
                  Bot de Ventas Activo
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number ID (Meta Business)
                </label>
                <input
                  type="text"
                  value={waPhoneId}
                  onChange={(e) => setWaPhoneId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Meta System User Access Token
                </label>
                <div className="relative">
                  <input
                    type={showTokens['wa'] ? 'text' : 'password'}
                    value={waToken}
                    onChange={(e) => setWaToken(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-8 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowToken('wa')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showTokens['wa'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* MercadoLibre */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <Store className="w-4 h-4 text-amber-500" />
                <span className="text-sm">MercadoLibre Sincronización</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="meliSyncCheck"
                  checked={meliSyncStock}
                  onChange={(e) => setMeliSyncStock(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="meliSyncCheck" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 cursor-pointer">
                  Sync Stock y Precios Automático
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  App ID / Client ID
                </label>
                <input
                  type="text"
                  value={meliAppId}
                  onChange={(e) => setMeliAppId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Meta Ads Pixel ID
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Gemini AI & Smart OCR */}
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm">Inteligencia Artificial Gemini & OCR Ferretero</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40">
                Operativo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Modelo de Lenguaje Asignado
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-white font-medium"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra Rápido • Recomendado)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Máximo Razonamiento y OCR)</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-5">
                <input
                  type="checkbox"
                  id="aiPurchaseCheck"
                  checked={aiPurchaseEnabled}
                  onChange={(e) => setAiPurchaseEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="aiPurchaseCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Lectura Automática de Facturas de Proveedores con IA
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración de Integraciones</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
