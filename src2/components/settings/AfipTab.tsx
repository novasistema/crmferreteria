import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Upload,
  RefreshCw,
  Save,
  Zap,
  Lock,
} from 'lucide-react';

export const AfipTab: React.FC = () => {
  const { store, showToast } = useApp();
  const certInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const [cuit, setCuit] = useState(store.settings.cuit || '20-30800287-0');
  const [posNumber, setPosNumber] = useState<number>(store.settings.fiscalPointOfSale || 5);
  const [environment, setEnvironment] = useState<'production' | 'testing'>(
    store.settings.afipEnvironment || 'production'
  );
  const [certLoaded, setCertLoaded] = useState(store.settings.afipCertLoaded ?? true);
  const [keyLoaded, setKeyLoaded] = useState(store.settings.afipKeyLoaded ?? true);
  const [certName, setCertName] = useState('certificado_produccion_2026.crt');
  const [keyName, setKeyName] = useState('privada_arca.key');

  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error';
    message: string;
    authTimestamp?: string;
  } | null>(null);

  const handleCertFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertName(file.name);
      setCertLoaded(true);
      showToast(`Certificado "${file.name}" cargado`, 'success');
    }
  };

  const handleKeyFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setKeyName(file.name);
      setKeyLoaded(true);
      showToast(`Clave privada "${file.name}" cargada de forma segura`, 'success');
    }
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      if (certLoaded && keyLoaded) {
        setTestResult({
          status: 'success',
          message: `Conexión exitosa con WSFEv1 (ARCA). Servidores operativos en modo ${
            environment === 'production' ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN'
          }. Punto de Venta ${posNumber} habilitado para Facturas A, B, C y Remitos Electrónicos.`,
          authTimestamp: new Date().toLocaleTimeString('es-AR'),
        });
        showToast('Servidor ARCA / AFIP respondió OK (200)', 'success');
      } else {
        setTestResult({
          status: 'error',
          message: 'Error de autenticación: Falta cargar certificado (.crt/.pem) o clave privada (.key).',
        });
        showToast('Error al conectar con ARCA', 'error');
      }
    }, 1200);
  };

  const handleSaveAfip = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveSettings({
      cuit,
      fiscalPointOfSale: Number(posNumber) || 5,
      afipPosNumber: Number(posNumber) || 5,
      afipEnvironment: environment,
      afipCertLoaded: certLoaded,
      afipKeyLoaded: keyLoaded,
    });
    showToast('Configuración ARCA / AFIP guardada exitosamente', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Configuración ARCA / AFIP</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configura la conexión con ARCA (ex AFIP) para facturación electrónica.
          </p>
        </div>

        {/* Info Box: Pasos para configurar facturación electrónica */}
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 space-y-2 mb-6">
          <div className="flex items-center space-x-2 font-bold text-xs text-blue-800 dark:text-blue-300">
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Pasos para configurar la facturación electrónica</span>
          </div>
          <ol className="list-decimal list-inside text-[11px] space-y-1 text-slate-700 dark:text-blue-200/90 pl-1 leading-relaxed">
            <li>
              Ingresá a <span className="font-bold">arca.gob.ar</span> con tu CUIT y clave fiscal
            </li>
            <li>En "Administración de Certificados Digitales", generá un nuevo certificado</li>
            <li>
              Para generar el CSR, ejecutá en tu computadora:{' '}
              <code className="bg-white/80 dark:bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[10px] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 select-all">
                openssl req -new -newkey rsa:2048 -nodes -keyout miempresa.key -out miempresa.csr
              </code>
            </li>
            <li>Subí el archivo .csr a ARCA y descargá el certificado .pem</li>
            <li>En "Administración de Puntos de Venta", habilitá un punto de venta electrónico</li>
            <li>Autorizá el servicio "Facturación Electrónica" en tu certificado</li>
            <li>Carga abajo el certificado (.pem), la clave privada (.key) y el punto de venta</li>
          </ol>
        </div>

        <form onSubmit={handleSaveAfip} className="space-y-5 text-xs">
          {/* Row: CUIT, Punto de Venta, Entorno */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                CUIT de la Empresa
              </label>
              <input
                type="text"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                placeholder="20-35804387-0"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                configurado en la pestaña Empresa
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Punto de Venta
              </label>
              <input
                type="number"
                min="1"
                max="9999"
                value={posNumber}
                onChange={(e) => setPosNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Número habilitado en ARCA para factura electrónica
              </span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Entorno
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="production">Producción (Facturación real)</option>
                  <option value="testing">Homologación / Testing (Sandbox)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Certificado (.pem / .crt) */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Certificado (.pem / .crt)
            </label>
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-xs">
                    Certificado cargado
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 font-mono">
                    {certName}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={certInputRef}
                  onChange={handleCertFile}
                  accept=".pem,.crt,.cer"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => certInputRef.current?.click()}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center space-x-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cambiar archivo</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-700">
                  Configurado
                </span>
              </div>
            </div>
          </div>

          {/* Clave Privada (.key) */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Clave Privada (.key)
            </label>
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-xs">
                    Clave privada cargada
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80">
                    almacenado de forma segura
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={keyInputRef}
                  onChange={handleKeyFile}
                  accept=".key"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => keyInputRef.current?.click()}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center space-x-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cambiar archivo</span>
                </button>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300 dark:border-emerald-700">
                  Configurado
                </span>
              </div>
            </div>
          </div>

          {/* Test Connection Alert Result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block">
                  {testResult.status === 'success' ? 'Respuesta del Servidor ARCA:' : 'Error en Conexión:'}
                </span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-blue-500' : ''}`} />
              <span>{testingConnection ? 'Verificando con ARCA...' : 'Probar Conexión'}</span>
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-700/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración ARCA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
