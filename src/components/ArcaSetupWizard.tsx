import React, { useEffect, useState } from 'react';
import {
  X,
  Receipt,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  KeyRound,
  PlugZap,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Circle
} from 'lucide-react';
import { CompanyConfig, ArcaConnectionTest } from '../types';
import { callArca, downloadTextFile } from '../services/arcaClient';

interface ArcaSetupWizardProps {
  config: CompanyConfig | null;
  onSave: (patch: Partial<CompanyConfig>) => Promise<void>;
  onClose: () => void;
}

const TAX_LABELS = {
  responsable_inscripto: 'Responsable Inscripto (Factura A y B)',
  monotributo: 'Monotributo (Factura C)',
  exento: 'Exento (Factura C)'
} as const;

const cleanCuit = (c: string) => (c || '').replace(/\D/g, '');
const isValidCuit = (cuit: string) => {
  const c = cleanCuit(cuit);
  if (c.length !== 11) return false;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = mult.reduce((a, m, i) => a + m * Number(c[i]), 0);
  let dv = 11 - (sum % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) dv = 9;
  return dv === Number(c[10]);
};

const readFileText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });

const StepHeader: React.FC<{ n: number; title: string; done: boolean; subtitle?: string }> = ({ n, title, done, subtitle }) => (
  <div className="flex items-start gap-3">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
      {done ? <CheckCircle2 className="w-5 h-5" /> : n}
    </div>
    <div>
      <h3 className="font-extrabold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export const ArcaSetupWizard: React.FC<ArcaSetupWizardProps> = ({ config, onSave, onClose }) => {
  const [companyName, setCompanyName] = useState(config?.companyName || '');
  const [cuit, setCuit] = useState(config?.cuit || '');
  const [taxCondition, setTaxCondition] = useState<NonNullable<CompanyConfig['arcaTaxCondition']>>(config?.arcaTaxCondition || 'responsable_inscripto');
  const [pointOfSale, setPointOfSale] = useState<number>(config?.arcaPointOfSale || 1);
  const [env, setEnv] = useState<'homologacion' | 'produccion'>(config?.arcaEnvironment || 'homologacion');
  const [fiscalAddress, setFiscalAddress] = useState(config?.fiscalAddress || '');
  const [grossIncome, setGrossIncome] = useState(config?.grossIncomeNumber || '');
  const [activityStart, setActivityStart] = useState(config?.activityStartDate || '');
  const [alias, setAlias] = useState(config?.arcaAlias || 'sistemagestion');
  const [certText, setCertText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [serverReady, setServerReady] = useState<boolean | null>(null);
  const [serverError, setServerError] = useState<string>('');
  const [certMode, setCertMode] = useState<'generate' | 'import'>('generate');
  const [test, setTest] = useState<ArcaConnectionTest | undefined>(config?.arcaLastTest);

  useEffect(() => {
    callArca('status').then(r => {
      setServerReady(r.ok);
      if (!r.ok) setServerError(r.error || '');
    });
  }, []);

  const dataDone = !!(config?.companyName && isValidCuit(config?.cuit || '') && config?.arcaTaxCondition && config?.arcaPointOfSale);
  const keyDone = !!config?.arcaKeyEnc;
  const certDone = !!config?.arcaCertPem;
  const testDone = !!(config?.arcaLastTest?.ok && config.arcaLastTest.env === config.arcaEnvironment && config.arcaLastTest.pointOfSale === config.arcaPointOfSale);

  const flash = (type: 'ok' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'ok') setTimeout(() => setMessage(null), 4000);
  };

  // --- Paso 1 ---
  const saveData = async () => {
    if (!companyName.trim()) return flash('error', 'Completá la razón social.');
    if (!isValidCuit(cuit)) return flash('error', 'El CUIT no es válido. Revisá los 11 números.');
    if (!pointOfSale || pointOfSale < 1 || pointOfSale > 99998) return flash('error', 'El punto de venta tiene que ser un número entre 1 y 99998.');
    setBusy('data');
    try {
      const cuitChanged = cleanCuit(cuit) !== cleanCuit(config?.cuit || '');
      const envChanged = env !== config?.arcaEnvironment;
      await onSave({
        companyName: companyName.trim(),
        cuit: cleanCuit(cuit),
        arcaTaxCondition: taxCondition,
        arcaPointOfSale: Number(pointOfSale),
        arcaEnvironment: env,
        fiscalAddress: fiscalAddress.trim(),
        grossIncomeNumber: grossIncome.trim(),
        activityStartDate: activityStart,
        // Cambiar de ambiente exige otro certificado; cambiar de CUIT exige clave y certificado nuevos
        ...(envChanged ? { arcaTaEnc: '', arcaCertPem: '', arcaCertNotAfter: '', arcaLastTest: undefined } : {}),
        ...(cuitChanged ? { arcaTaEnc: '', arcaKeyEnc: '', arcaCsrPem: '', arcaCertPem: '', arcaCertNotAfter: '', arcaLastTest: undefined } : {})
      });
      flash('ok', cuitChanged && keyDone ? 'Datos guardados. Cambiaste el CUIT: generá un certificado nuevo (paso 2).' : envChanged && certDone ? 'Datos guardados. Cambiaste el ambiente: pedí el certificado de ese ambiente (pasos 2 y 3).' : 'Datos fiscales guardados.');
    } finally {
      setBusy(null);
    }
  };

  // --- Paso 2 ---
  const generateCsr = async () => {
    if (!dataDone) return flash('error', 'Primero guardá los datos fiscales (paso 1).');
    if (keyDone && !window.confirm('Ya hay una clave generada. Si generás otra, el certificado actual deja de servir y tenés que pedir uno nuevo en ARCA. ¿Continuar?')) return;
    setBusy('csr');
    try {
      const r = await callArca('generate_csr', { cuit: config?.cuit, companyName: config?.companyName, alias });
      if (!r.ok) return flash('error', r.error || 'No se pudo generar el pedido.');
      await onSave({ arcaKeyEnc: r.keyEnc, arcaCsrPem: r.csrPem, arcaAlias: alias, arcaCertPem: '', arcaCertNotAfter: '', arcaTaEnc: '', arcaLastTest: undefined });
      downloadTextFile(`pedido-certificado-${config?.cuit}.csr`, r.csrPem);
      flash('ok', 'Se descargó el archivo .csr. Ahora subilo en ARCA (ver instrucciones).');
    } finally {
      setBusy(null);
    }
  };

  const importKey = async (file: File) => {
    setBusy('key');
    try {
      const keyPem = await readFileText(file);
      const r = await callArca('import_key', { keyPem });
      if (!r.ok) return flash('error', r.error || 'Clave inválida.');
      await onSave({ arcaKeyEnc: r.keyEnc, arcaCsrPem: '', arcaTaEnc: '' });
      flash('ok', 'Clave privada guardada (cifrada). Ahora cargá el certificado .crt.');
    } finally {
      setBusy(null);
    }
  };

  // --- Paso 3 ---
  const saveCert = async (pem: string) => {
    if (!keyDone) return flash('error', 'Primero completá el paso 2.');
    if (!pem.includes('BEGIN CERTIFICATE')) return flash('error', 'Eso no parece un certificado. Tiene que empezar con -----BEGIN CERTIFICATE-----');
    setBusy('cert');
    try {
      const r = await callArca('inspect_cert', { certPem: pem, keyEnc: config?.arcaKeyEnc });
      if (!r.ok) return flash('error', r.error || 'Certificado inválido.');
      const info = r.info;
      if (info.matchesKey === false) return flash('error', 'Este certificado no corresponde a la clave generada en el paso 2. Subí el .crt que te dio ARCA para el último pedido .csr.');
      if (info.cuit && info.cuit !== cleanCuit(config?.cuit || '')) return flash('error', `El certificado es del CUIT ${info.cuit}, pero el configurado es ${config?.cuit}.`);
      if (new Date(info.notAfter).getTime() < Date.now()) return flash('error', 'El certificado está vencido. Pedí uno nuevo en ARCA.');
      await onSave({ arcaCertPem: pem.trim(), arcaCertNotAfter: info.notAfter, arcaTaEnc: '' });
      setCertText('');
      flash('ok', `Certificado guardado. Vence el ${new Date(info.notAfter).toLocaleDateString('es-AR')}.`);
    } finally {
      setBusy(null);
    }
  };

  // --- Paso 4 ---
  const runTest = async () => {
    if (!certDone) return flash('error', 'Faltan pasos anteriores.');
    setBusy('test');
    try {
      const r = await callArca('test', {
        env: config?.arcaEnvironment,
        cuit: config?.cuit,
        ptoVta: config?.arcaPointOfSale,
        taxCondition: config?.arcaTaxCondition,
        keyEnc: config?.arcaKeyEnc,
        certPem: config?.arcaCertPem,
        taEnc: config?.arcaTaEnc
      });
      const result: ArcaConnectionTest = {
        ok: !!r.ok,
        at: new Date().toISOString(),
        env: config?.arcaEnvironment || 'homologacion',
        pointOfSale: config?.arcaPointOfSale || 1,
        checks: r.checks || [],
        ...(r.error ? { error: r.error } : {})
      };
      setTest(result);
      await onSave({ arcaLastTest: result, ...(r.taEnc ? { arcaTaEnc: r.taEnc } : {}) });
      flash(r.ok ? 'ok' : 'error', r.ok ? '¡Conexión correcta! El sistema ya puede facturar.' : r.error || 'La prueba encontró problemas. Revisá el detalle.');
    } finally {
      setBusy(null);
    }
  };

  const allDone = dataDone && keyDone && certDone && testDone;
  const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500';
  const btn = 'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors';

  return (
    <div className="fixed inset-0 z-[55] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-sky-950 text-white p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-sky-300">👑 Configuración del Creador</div>
              <h2 className="text-lg sm:text-xl font-black">Facturación electrónica ARCA</h2>
              <p className="text-xs text-slate-300">4 pasos para que este cliente pueda emitir facturas con CAE.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20"><X className="w-5 h-5" /></button>
        </div>

        <div className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 ${allDone ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          {allDone ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {allDone
            ? `Listo para facturar en ${config?.arcaEnvironment === 'produccion' ? 'PRODUCCIÓN (facturas reales)' : 'HOMOLOGACIÓN (pruebas, sin validez fiscal)'}.`
            : 'Facturación todavía no habilitada: completá los pasos.'}
        </div>

        {message && (
          <div className={`px-5 py-2.5 text-xs font-semibold ${message.type === 'ok' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}>{message.text}</div>
        )}

        <div className="overflow-y-auto p-5 space-y-6">
          {serverReady === false && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5"><XCircle className="w-4 h-4" /> El servidor de facturación no está listo</div>
              <div>{serverError}</div>
            </div>
          )}

          {/* Paso 1 */}
          <section className="space-y-3">
            <StepHeader n={1} done={dataDone} title="Datos fiscales del cliente" subtitle="Tal como figuran en ARCA." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold text-slate-600">Razón social</span>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">CUIT</span>
                <input value={cuit} onChange={e => setCuit(e.target.value)} placeholder="20-12345678-9" className={`${inputCls} font-mono ${cuit && !isValidCuit(cuit) ? 'border-rose-400' : ''}`} />
                {cuit && !isValidCuit(cuit) && <span className="text-[11px] text-rose-600">CUIT inválido</span>}
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Condición frente al IVA</span>
                <select value={taxCondition} onChange={e => setTaxCondition(e.target.value as any)} className={inputCls}>
                  {Object.entries(TAX_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Punto de venta (Web Services)</span>
                <input type="number" min={1} value={pointOfSale} onChange={e => setPointOfSale(Number(e.target.value))} className={`${inputCls} font-mono`} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Ambiente</span>
                <select value={env} onChange={e => setEnv(e.target.value as any)} className={inputCls}>
                  <option value="homologacion">Homologación (pruebas)</option>
                  <option value="produccion">Producción (facturas reales)</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold text-slate-600">Domicilio fiscal</span>
                <input value={fiscalAddress} onChange={e => setFiscalAddress(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Ingresos Brutos (opcional)</span>
                <input value={grossIncome} onChange={e => setGrossIncome(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Inicio de actividades (opcional)</span>
                <input type="date" value={activityStart} onChange={e => setActivityStart(e.target.value)} className={inputCls} />
              </label>
              <div className="sm:col-span-2">
                <button onClick={saveData} disabled={busy !== null} className={`${btn} bg-slate-900 hover:bg-black text-white`}>
                  {busy === 'data' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Guardar datos
                </button>
              </div>
            </div>
          </section>

          {/* Paso 2 */}
          <section className="space-y-3">
            <StepHeader n={2} done={keyDone} title="Certificado digital: pedido a ARCA" subtitle="El sistema genera la clave y el archivo que hay que subir en ARCA." />
            <div className="pl-11 space-y-3">
              <div className="flex gap-1.5">
                <button onClick={() => setCertMode('generate')} className={`${btn} ${certMode === 'generate' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Generar desde el sistema (recomendado)</button>
                <button onClick={() => setCertMode('import')} className={`${btn} ${certMode === 'import' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Ya tengo .key y .crt</button>
              </div>

              {certMode === 'generate' ? (
                <>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-600">Alias del certificado</span>
                      <input value={alias} onChange={e => setAlias(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} className={`${inputCls} font-mono w-48`} />
                    </label>
                    <button onClick={generateCsr} disabled={busy !== null || !dataDone} className={`${btn} bg-sky-600 hover:bg-sky-700 text-white`}>
                      {busy === 'csr' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} {keyDone ? 'Generar de nuevo' : 'Generar pedido (.csr)'}
                    </button>
                    {config?.arcaCsrPem && (
                      <button onClick={() => downloadTextFile(`pedido-certificado-${config?.cuit}.csr`, config.arcaCsrPem!)} className={`${btn} bg-slate-100 hover:bg-slate-200 text-slate-700`}>
                        <Download className="w-4 h-4" /> Descargar .csr otra vez
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                    <div className="font-extrabold text-slate-900">Qué hacer en ARCA con el archivo .csr</div>
                    {(config?.arcaEnvironment || env) === 'homologacion' ? (
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Entrá a <b>arca.gob.ar</b> con la clave fiscal del cliente.</li>
                        <li>Abrí el servicio <b>“WSASS - Autogestión Certificados Homologación”</b>. Si no aparece, adherilo desde <b>Administrador de Relaciones de Clave Fiscal</b>.</li>
                        <li><b>Nuevo Certificado</b>: poné el alias <code className="bg-white px-1 rounded border">{alias}</code>, pegá el contenido del .csr y generá. Copiá el certificado que aparece y guardalo como <b>.crt</b>.</li>
                        <li>En el mismo servicio: <b>Crear autorización a servicio</b> → elegí el alias, el CUIT del cliente y el servicio <b>wsfe - Facturación Electrónica</b>.</li>
                      </ol>
                    ) : (
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Entrá a <b>arca.gob.ar</b> con la clave fiscal del cliente (nivel 3).</li>
                        <li><b>Administración de Certificados Digitales</b> → <b>Agregar alias</b>: alias <code className="bg-white px-1 rounded border">{alias}</code> y subí el archivo .csr. Después descargá el certificado (.crt).</li>
                        <li><b>Administrador de Relaciones de Clave Fiscal</b> → <b>Nueva Relación</b> → Buscar → <b>ARCA → WebServices → Facturación Electrónica</b>. En <i>Representante</i> elegí <b>Computador Fiscal</b> con el alias anterior y confirmá.</li>
                        <li><b>Administración de puntos de venta y domicilios</b> → Agregar un punto de venta del tipo <b>Web Services</b> (para monotributo: <i>Factura Electrónica - Monotributo - Web Services</i>; para responsable inscripto: <i>RECE para aplicativo y web services</i>). Usá ese número en el paso 1.</li>
                      </ol>
                    )}
                    <a href="https://www.afip.gob.ar/ws/documentacion/certificados.asp" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-700 font-bold hover:underline">
                      Guía oficial de certificados <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </>
              ) : (
                <label className={`${btn} bg-slate-100 hover:bg-slate-200 text-slate-700 w-fit cursor-pointer`}>
                  {busy === 'key' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Subir clave privada (.key)
                  <input type="file" accept=".key,.pem,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importKey(f); e.target.value = ''; }} />
                </label>
              )}
              {keyDone && <div className="text-[11px] text-emerald-700 font-semibold">✓ Clave privada guardada cifrada en el servidor.</div>}
            </div>
          </section>

          {/* Paso 3 */}
          <section className="space-y-3">
            <StepHeader
              n={3}
              done={certDone}
              title="Certificado de ARCA (.crt)"
              subtitle={certDone && config?.arcaCertNotAfter ? `Cargado · vence el ${new Date(config.arcaCertNotAfter).toLocaleDateString('es-AR')}` : 'Subí el archivo que te dio ARCA o pegá su contenido.'}
            />
            <div className="pl-11 space-y-2">
              <label className={`${btn} bg-slate-100 hover:bg-slate-200 text-slate-700 w-fit cursor-pointer ${!keyDone ? 'opacity-50 pointer-events-none' : ''}`}>
                {busy === 'cert' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Subir archivo .crt
                <input type="file" accept=".crt,.pem,.cer,.txt" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) saveCert(await readFileText(f)); e.target.value = ''; }} />
              </label>
              <textarea value={certText} onChange={e => setCertText(e.target.value)} rows={3} placeholder="-----BEGIN CERTIFICATE-----" disabled={!keyDone} className={`${inputCls} font-mono text-[11px]`} />
              {certText.trim() && (
                <button onClick={() => saveCert(certText)} disabled={busy !== null} className={`${btn} bg-slate-900 hover:bg-black text-white`}>Guardar certificado pegado</button>
              )}
              {config?.arcaCertNotAfter && new Date(config.arcaCertNotAfter).getTime() - Date.now() < 30 * 864e5 && (
                <div className="text-[11px] font-bold text-amber-700">⚠ El certificado vence en menos de 30 días. Generá uno nuevo.</div>
              )}
            </div>
          </section>

          {/* Paso 4 */}
          <section className="space-y-3">
            <StepHeader n={4} done={testDone} title="Probar conexión con ARCA" subtitle="Verifica servidores, certificado, autorización y punto de venta." />
            <div className="pl-11 space-y-3">
              <button onClick={runTest} disabled={busy !== null || !certDone} className={`${btn} bg-emerald-600 hover:bg-emerald-700 text-white`}>
                {busy === 'test' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />} Probar conexión
              </button>
              {test && (
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {test.checks.map((c, i) => (
                    <div key={i} className="p-2.5 flex items-start gap-2 text-xs">
                      {c.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                      <div><div className="font-bold text-slate-800">{c.step}</div><div className="text-slate-500">{c.detail}</div></div>
                    </div>
                  ))}
                  {test.error && (
                    <div className="p-2.5 flex items-start gap-2 text-xs text-rose-700">
                      <XCircle className="w-4 h-4 shrink-0" /> <div>{test.error}</div>
                    </div>
                  )}
                  {test.checks.length === 0 && !test.error && (
                    <div className="p-2.5 flex items-center gap-2 text-xs text-slate-500"><Circle className="w-4 h-4" /> Sin resultados</div>
                  )}
                  <div className="p-2 text-[10px] text-slate-400">
                    Última prueba: {new Date(test.at).toLocaleString('es-AR')} · {test.env === 'produccion' ? 'Producción' : 'Homologación'} · PV {test.pointOfSale}
                  </div>
                </div>
              )}
              {testDone && config?.arcaEnvironment === 'homologacion' && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                  Homologación funcionando. Para facturar de verdad: generá un certificado de <b>producción</b> (cambiá el ambiente en el paso 1 y repetí los pasos 2 a 4).
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
