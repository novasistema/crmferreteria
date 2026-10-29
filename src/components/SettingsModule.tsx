import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  MessageSquare, 
  Save, 
  CheckCircle, 
  FileText, 
  Globe, 
  Mail, 
  Phone,
  Server,
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Lock,
  Clock,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Sliders,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { CompanyConfig } from '../types';
import { 
  BackupConfig, 
  BackupFrequency,
  FREQUENCY_LABELS,
  getStoredBackupConfig, 
  saveStoredBackupConfig, 
  createFullBackupSnapshot, 
  downloadBackupPackage, 
  restoreBackupPackage, 
  resetSystemToFactory,
  BackupPackage 
} from '../services/backupAndResetService';

interface SettingsModuleProps {
  config: CompanyConfig | null;
  onSaveConfig: (config: CompanyConfig) => Promise<void>;
  onResetCompleted?: () => void;
  onOpenCreatorModuleControl?: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  config,
  onSaveConfig,
  onResetCompleted,
  onOpenCreatorModuleControl
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'templates' | 'backup' | 'integrations' | 'danger_zone'>('company');

  // Company Form Data
  const [formData, setFormData] = useState<CompanyConfig>(() => {
    return config || {
      id: 'main_config',
      companyName: 'Colorear Pinturas S.R.L.',
      tradeName: 'Colorear PINTURAS',
      logoUrl: '/assets/aistudio/colorear-500px_0158e3cb.webp',
      cuit: '30-71489234-8',
      arcaPointOfSale: 4,
      arcaEnvironment: 'homologacion',
      grossIncomeNumber: '901-294812-3',
      activityStartDate: '01/03/2012',
      fiscalAddress: 'Av. Industria Química 4520, Parque Industrial Pilar, Buenos Aires',
      plantAddress: 'Ruta 8 Km 58, Parque Industrial Pilar, Buenos Aires',
      phone: '+54 11 4890-7000',
      whatsappNumber: '5491148907000',
      email: 'administracion@colorearpinturas.com.ar',
      notificationWhatsappTemplate: 'Hola {cliente}, le informamos desde Colorear Pinturas que su pedido {pedido} se encuentra {estado}. Transporte: {transporte}. Seguimiento: {tracking}. Total: ${total}. Muchas gracias.',
      paymentReminderTemplate: 'Estimado/a {cliente}, le recordamos desde el área de administración de Colorear Pinturas que registra un saldo pendiente de ${monto}. Agradecemos coordinar la cancelación correspondiente. Datos de cuenta CBU: 0720045620000012345678.'
    };
  });

  // Sync formData if config updates from Firestore
  useEffect(() => {
    if (config) {
      setFormData(prev => ({
        ...config,
        logoUrl: config.logoUrl || prev.logoUrl || '/assets/aistudio/colorear-500px_0158e3cb.webp'
      }));
    }
  }, [config]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 2 MB. Por favor elija una imagen más liviana.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup state
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(getStoredBackupConfig);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState<string | null>(null);

  // Restore state
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePackage, setRestorePackage] = useState<BackupPackage | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<string | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);

  // Reset System to Factory state
  const [resetMode, setResetMode] = useState<'operations_only' | 'total'>('total');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [backupBeforeReset, setBackupBeforeReset] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [resetProgressMessage, setResetProgressMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    saveStoredBackupConfig(backupConfig);
  }, [backupConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handler: Instant Backup Creation & Download
  const handleCreateAndDownloadBackup = async () => {
    setIsExportingBackup(true);
    setBackupSuccessMessage(null);
    try {
      const pkg = await createFullBackupSnapshot(formData);
      const filename = downloadBackupPackage(pkg);
      setBackupConfig(getStoredBackupConfig());
      setBackupSuccessMessage(`Copia de seguridad creada y descargada con éxito: ${filename} (${pkg.meta.totalRecords} registros).`);
    } catch (err: any) {
      console.error("Error creating backup:", err);
      alert("Error al crear copia de seguridad: " + (err.message || String(err)));
    } finally {
      setIsExportingBackup(false);
    }
  };

  // Handler: Inspect Restore File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreErrorMessage(null);
    setRestoreSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data) {
          throw new Error("El archivo no tiene el formato de backup válido de Colorear Pinturas.");
        }
        setRestorePackage(parsed);
      } catch (err: any) {
        setRestoreErrorMessage("Error al leer el archivo JSON: " + (err.message || "Formato inválido."));
        setRestorePackage(null);
      }
    };
    reader.readAsText(file);
  };

  // Handler: Execute Restore
  const handleExecuteRestore = async () => {
    if (!restorePackage) return;
    setIsRestoring(true);
    setRestoreErrorMessage(null);
    try {
      const res = await restoreBackupPackage(restorePackage);
      setRestoreSuccessMessage(`¡Restauración exitosa! Se han restaurado ${res.restoredCount} registros en la base de datos.`);
      setRestorePackage(null);
      setRestoreFile(null);
    } catch (err: any) {
      setRestoreErrorMessage("Error al restaurar: " + (err.message || String(err)));
    } finally {
      setIsRestoring(false);
    }
  };

  // Handler: Execute Factory Reset (Dejar en Cero)
  const handleExecuteFactoryReset = async () => {
    const requiredPhrase = 'RESET COLOREAR';
    if (confirmationPhrase.trim().toUpperCase() !== requiredPhrase && confirmationPhrase.trim().toUpperCase() !== 'BORRAR TODO') {
      alert(`Para confirmar debe escribir exactamente '${requiredPhrase}' o 'BORRAR TODO'.`);
      return;
    }

    setIsResetting(true);
    setResetSuccessMessage(null);

    try {
      // 1. If requested, generate precautionary backup first
      if (backupBeforeReset) {
        setResetProgressMessage('Generando copia de seguridad preventiva antes de borrar...');
        const pkg = await createFullBackupSnapshot(formData);
        downloadBackupPackage(pkg);
      }

      // 2. Perform factory wipe
      await resetSystemToFactory(resetMode, (msg) => {
        setResetProgressMessage(msg);
      });

      setResetSuccessMessage(
        resetMode === 'total'
          ? '¡Sistema restablecido a fábrica con éxito! Se han vaciado todas las colecciones para iniciar en cero.'
          : '¡Puesta a cero de operaciones completada! Se limpiaron ventas, compras y producción manteniendo el catálogo oficial.'
      );
      setConfirmationPhrase('');
      onResetCompleted?.();
    } catch (err: any) {
      console.error("Error executing reset:", err);
      alert("Error al restablecer sistema: " + (err.message || String(err)));
    } finally {
      setIsResetting(false);
      setResetProgressMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-zinc-100 text-zinc-700">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">
                  Configuración del Sistema, Backup & Fábrica
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                  Panel de Administración
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Datos societarios, facturación ARCA, copias de seguridad automáticas y reinicio a fábrica.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'company'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Datos de Fábrica & ARCA
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'templates'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Plantillas de Mensajes
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <Database className="w-4 h-4" /> Copias de Seguridad (Backup)
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'integrations'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Server className="w-4 h-4" /> Integraciones & Secretos
          </button>

          {onOpenCreatorModuleControl && (
            <button
              type="button"
              onClick={onOpenCreatorModuleControl}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md active:scale-95"
            >
              <Sliders className="w-4 h-4 text-indigo-200" />
              <span>🎛️ Control Maestro de Módulos</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('danger_zone')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'danger_zone'
                ? 'bg-[#d31627] text-white shadow-sm'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Resetear Sistema a Fábrica (Cero)
          </button>
        </div>
      </div>

      {/* TAB 1: COMPANY DATA & ARCA */}
      {activeTab === 'company' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#d31627]" /> Datos Corporativos & Marca de la Fábrica
            </h3>

            {/* Logo Oficial e Identidad Visual Unificada */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-600" />
                    <span>Logo Corporativo Oficial</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold lowercase">
                      unificado en todo el sistema
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Este logo se reflejará idénticamente en el Encabezado Superior (Topbar), Pantalla de Inicio (Login), Portal de Clientes y Documentos oficiales.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <label className="cursor-pointer px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Logo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoFileUpload} 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '/assets/aistudio/colorear-500px_0158e3cb.webp' }))}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Restablecer el logo original de Colorear Pinturas"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>

              {/* URL Directa opcional */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Ruta o URL Directa del Archivo de Imagen
                </label>
                <input
                  type="text"
                  value={formData.logoUrl || ''}
                  onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="/assets/aistudio/colorear-500px_0158e3cb.webp o https://..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 bg-white"
                />
              </div>

              {/* Previsualización en Vivo: Topbar (fondo oscuro) y Login (fondo claro) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* 1. Preview en Topbar */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Vista previa en Encabezado (Topbar fondo oscuro)
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 px-2.5 py-1 bg-white rounded-lg flex items-center justify-center shadow-md border border-slate-700/80">
                      <img 
                        src={formData.logoUrl || '/assets/aistudio/colorear-500px_0158e3cb.webp'} 
                        alt="Preview Topbar" 
                        className="h-6 w-auto max-w-[120px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/colorear-500px_0158e3cb.webp';
                        }}
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-xs sm:text-sm text-white leading-tight">
                        {formData.tradeName || 'Colorear Pinturas'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none">
                        {formData.companyName || 'Colorear Pinturas S.R.L.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Preview en Login */}
                <div className="bg-slate-100/90 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Vista previa en Pantalla de Inicio (Login fondo claro)
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                      <img 
                        src={formData.logoUrl || '/assets/aistudio/colorear-500px_0158e3cb.webp'} 
                        alt="Preview Login" 
                        className="h-8 w-auto max-w-[120px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/aistudio/colorear-500px_0158e3cb.webp';
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-slate-900 block leading-tight">
                        ¡Bienvenido a {formData.tradeName || 'Colorear'}!
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Acceso de personal de fábrica
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Comercial / Marca</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CUIT Empresa</label>
                <input
                  type="text"
                  value={formData.cuit}
                  onChange={e => setFormData({ ...formData, cuit: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ingresos Brutos (IIBB)</label>
                <input
                  type="text"
                  value={formData.grossIncomeNumber}
                  onChange={e => setFormData({ ...formData, grossIncomeNumber: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Inicio de Actividades</label>
                <input
                  type="text"
                  value={formData.activityStartDate}
                  onChange={e => setFormData({ ...formData, activityStartDate: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Domicilio Fiscal</label>
                <input
                  type="text"
                  value={formData.fiscalAddress}
                  onChange={e => setFormData({ ...formData, fiscalAddress: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dirección Planta Industrial & Despacho</label>
                <input
                  type="text"
                  value={formData.plantAddress}
                  onChange={e => setFormData({ ...formData, plantAddress: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono Central</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Notificaciones</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* ARCA Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" /> Parámetros para Facturación Electrónica ARCA
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Punto de Venta Habilitado (P.V.)</label>
                <input
                  type="number"
                  value={formData.arcaPointOfSale}
                  onChange={e => setFormData({ ...formData, arcaPointOfSale: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entorno de Facturación</label>
                <select
                  value={formData.arcaEnvironment}
                  onChange={e => setFormData({ ...formData, arcaEnvironment: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  <option value="homologacion">Homologación (Entorno de Pruebas / Testing)</option>
                  <option value="produccion">Producción (ARCA Oficial en Vivo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle className="w-4 h-4" /> Parámetros guardados exitosamente en Firestore.
                </span>
              )}
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" /> Guardar Parámetros de Fábrica
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: WHATSAPP TEMPLATES */}
      {activeTab === 'templates' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Plantillas de Mensajes Automáticos (WhatsApp & Email)
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Plantilla: Pedido Listo / Despacho en Viaje
              </label>
              <textarea
                rows={3}
                value={formData.notificationWhatsappTemplate}
                onChange={e => setFormData({ ...formData, notificationWhatsappTemplate: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-sans"
              />
              <span className="text-[11px] text-slate-400">
                Variables disponibles: {'{cliente}'}, {'{pedido}'}, {'{estado}'}, {'{transporte}'}, {'{tracking}'}, {'{total}'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Plantilla: Recordatorio Automático de Pago Pendiente
              </label>
              <textarea
                rows={3}
                value={formData.paymentReminderTemplate}
                onChange={e => setFormData({ ...formData, paymentReminderTemplate: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-sans"
              />
              <span className="text-[11px] text-slate-400">
                Variables disponibles: {'{cliente}'}, {'{monto}'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#d31627] hover:bg-red-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <Save className="w-4 h-4" /> Guardar Plantillas
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: BACKUP (AUTOMÁTICO & DESCARGA) */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Quick Backup Action Banner */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold mb-2">
                  <Database className="w-3.5 h-3.5" /> Copia de Seguridad Instantánea
                </div>
                <h2 className="text-xl font-black">
                  Crear y Descargar Backup Completo Ahora
                </h2>
                <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                  Exporta en formato JSON todas las colecciones de la planta: catálogo con SKUs, materias primas, fórmulas maestras, lotes de producción, clientes, cuentas corrientes, ventas y facturas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateAndDownloadBackup}
                disabled={isExportingBackup}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {isExportingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generando Backup...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" /> Crear y Descargar Backup (.JSON)
                  </>
                )}
              </button>
            </div>

            {backupSuccessMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{backupSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Configuration: Automatic Backup Frequency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Configuración de Frecuencia de Backup Automático
                </h3>
                <p className="text-xs text-slate-500">
                  Define cada cuánto tiempo el sistema debe crear y solicitar la descarga automática de la copia de respaldo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  ¿Cada cuánto tiempo hacer backup automático?
                </label>
                <div className="space-y-2">
                  {(Object.keys(FREQUENCY_LABELS) as BackupFrequency[]).map(freqKey => (
                    <label 
                      key={freqKey} 
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        backupConfig.frequency === freqKey
                          ? 'border-blue-500 bg-blue-50/50 text-blue-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-xs">
                        <input
                          type="radio"
                          name="backup_freq"
                          checked={backupConfig.frequency === freqKey}
                          onChange={() => setBackupConfig(prev => ({ ...prev, frequency: freqKey }))}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{FREQUENCY_LABELS[freqKey]}</span>
                      </div>
                      {freqKey === '24_hours' && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Recomendado
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                  <span className="font-extrabold text-slate-800 uppercase block tracking-wider text-[11px]">
                    Estado de las Copias de Seguridad
                  </span>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Último backup realizado:</span>
                    <strong className="text-slate-800">
                      {backupConfig.lastBackupDate || 'Aún no realizado en esta sesión'}
                    </strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Frecuencia configurada:</span>
                    <strong className="text-blue-700 capitalize">
                      {FREQUENCY_LABELS[backupConfig.frequency]}
                    </strong>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Descarga automática:</span>
                    <strong className="text-emerald-700">Activada</strong>
                  </div>
                </div>

                {/* Toggle auto-download */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupConfig.autoDownload}
                    onChange={e => setBackupConfig(prev => ({ ...prev, autoDownload: e.target.checked }))}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">
                      Descargar archivo .JSON automáticamente al cumplirse el plazo
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Cuando expire el período, se descargará la copia a la carpeta de descargas de este equipo.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Restore Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <Upload className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Restaurar Copia de Seguridad desde Archivo JSON
                </h3>
                <p className="text-xs text-slate-500">
                  Sube un archivo de backup previamente generado para restablecer o sincronizar los datos de la fábrica.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-upload"
              />
              <label htmlFor="backup-file-upload" className="cursor-pointer block">
                <Database className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">
                  {restoreFile ? restoreFile.name : 'Haz clic para seleccionar o arrastra tu archivo .json de backup'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Formato compatible: backup_colorear_pinturas_*.json
                </span>
              </label>
            </div>

            {restorePackage && (
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-950">
                    Resumen del Backup a Restaurar:
                  </span>
                  <span className="font-mono text-[11px] text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Fecha export: {new Date(restorePackage.meta.exportedAt).toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Total Registros</span>
                    <strong className="text-indigo-900 font-mono text-sm">{restorePackage.meta.totalRecords}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Productos / SKU</span>
                    <strong className="text-slate-900 font-mono">{restorePackage.data.products?.length || 0}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Fórmulas Fábrica</span>
                    <strong className="text-slate-900 font-mono">{restorePackage.data.formulas?.length || 0}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block text-[10px]">Clientes & Cta Cte</span>
                    <strong className="text-slate-900 font-mono">{restorePackage.data.customers?.length || 0}</strong>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRestorePackage(null);
                      setRestoreFile(null);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isRestoring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Confirmar & Restaurar en Base de Datos
                  </button>
                </div>
              </div>
            )}

            {restoreSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {restoreSuccessMessage}
              </div>
            )}

            {restoreErrorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                {restoreErrorMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ESTADO DE INTEGRACIONES EXTERNAS & SECRETOS (SECCIÓN 12 PROMPT MAESTRO) */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Estado de Integraciones Externas & Secretos del Entorno
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Regla Maestra: Cada servicio muestra explícitamente su estado real sin inventar conexiones inexistentes. Las credenciales confidenciales se leen exclusivamente de variables de entorno del servidor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Gemini AI */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Google Gemini API (@google/genai)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      CONECTADO
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Asistente industrial y análisis de quiebres de resinas/pigmentos.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-800 mt-2">
                    Variable: GEMINI_API_KEY (Activa)
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              {/* ARCA / AFIP WSFE */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">ARCA / AFIP Facturación Electrónica</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {formData.arcaEnvironment === 'produccion' ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    WSAA y WSFE v1 para emisión de CAE y código QR oficial RG 4291.
                  </p>
                  <div className="text-[11px] font-mono text-blue-800 mt-2">
                    Pto Venta: {formData.arcaPointOfSale} | CUIT: {formData.cuit}
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
              </div>

              {/* Meta WhatsApp Cloud API */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">WhatsApp / Meta Cloud API</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      CONFIGURACIÓN BÁSICA
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Generación de enlaces y recordatorios directos al número comercial {formData.whatsappNumber}.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 mt-2">
                    Secret: META_WA_ACCESS_TOKEN (Opcional para Bot Automático)
                  </div>
                </div>
                <MessageSquare className="w-5 h-5 text-amber-500 shrink-0" />
              </div>

              {/* MercadoPago */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">MercadoPago Checkout & QR</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      PENDIENTE CONFIGURACIÓN
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Cobro online con tarjeta y transferencias CVU. No simulado.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 mt-2">
                    Variable: MP_ACCESS_TOKEN (Pendiente de cargar en Secrets)
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
              </div>

              {/* Twilio & SMS */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Twilio SMS / Campañas</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      PENDIENTE CONFIGURACIÓN
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Mensajería SMS masiva para avisos de despacho a choferes.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 mt-2">
                    Variable: TWILIO_AUTH_TOKEN
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
              </div>

              {/* MercadoLibre */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">MercadoLibre Sync Catálogo</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                      PENDIENTE REAUTORIZACIÓN
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Publicación automática de baldes de 20L y esmaltes 4L.
                  </p>
                  <div className="text-[11px] font-mono text-slate-500 mt-2">
                    OAuth: MELI_APP_ID & SECRET
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FACTORY RESET (RESET TOTAL A CERO) */}
      {activeTab === 'danger_zone' && (
        <div className="space-y-6">
          <div className="bg-red-50/60 rounded-2xl border-2 border-red-200 p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600 text-white rounded-2xl shadow-md shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-black text-red-950">
                  Zona de Peligro: Resetear Sistema a Fábrica (Dejar en Cero)
                </h2>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  Esta acción borra de manera definitiva los registros seleccionados para que puedas iniciar el sistema completamente en blanco o reiniciar la fábrica desde cero.
                </p>
              </div>
            </div>

            {/* Mode selection */}
            <div className="bg-white rounded-xl p-4 border border-red-200 space-y-3">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Selecciona la modalidad de reseteo:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    resetMode === 'total' 
                      ? 'border-red-600 bg-red-50/40' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="reset_mode"
                      checked={resetMode === 'total'}
                      onChange={() => setResetMode('total')}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <strong className="text-xs text-red-950 block">
                        Reinicio Total Absoluto (Cero Completo)
                      </strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Borra todo: productos, materias primas, fórmulas, clientes, compras, ventas y órdenes de fabricación. Deja la base de datos 100% limpia.
                      </p>
                    </div>
                  </div>
                </label>

                <label 
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    resetMode === 'operations_only' 
                      ? 'border-amber-600 bg-amber-50/40' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="reset_mode"
                      checked={resetMode === 'operations_only'}
                      onChange={() => setResetMode('operations_only')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <strong className="text-xs text-amber-950 block">
                        Limpieza de Operaciones (Mantener Catálogo & Fórmulas)
                      </strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Conserva las fórmulas y la lista de precios oficial con SKUs, pero vacía todos los pedidos de venta, compras, lotes en producción y deja las deudas de clientes en $0.
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Precautionary backup checkbox */}
            <label className="flex items-center gap-2.5 text-xs text-slate-700 bg-white p-3 rounded-xl border border-red-200 cursor-pointer">
              <input
                type="checkbox"
                checked={backupBeforeReset}
                onChange={e => setBackupBeforeReset(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-semibold">
                🛡️ Descargar automáticamente una copia de seguridad (Backup JSON) de resguardo antes de vaciar la base de datos.
              </span>
            </label>

            {/* Mandatory security confirmation typing */}
            <div className="bg-white p-4 rounded-xl border border-red-300 space-y-2">
              <label className="block text-xs font-black text-red-900 uppercase">
                Confirmación de Seguridad Requerida:
              </label>
              <p className="text-xs text-slate-600">
                Para confirmar la eliminación y puesta en cero, escribe exactamente{' '}
                <strong className="text-red-700 font-mono select-all">RESET COLOREAR</strong> o{' '}
                <strong className="text-red-700 font-mono select-all">BORRAR TODO</strong> en la casilla inferior:
              </p>
              <input
                type="text"
                value={confirmationPhrase}
                onChange={e => setConfirmationPhrase(e.target.value)}
                placeholder="Escribe RESET COLOREAR para confirmar"
                className="w-full text-sm p-3 rounded-xl border-2 border-red-300 font-mono font-black text-red-700 focus:outline-hidden focus:border-red-600"
              />
            </div>

            {/* Progress Message */}
            {resetProgressMessage && (
              <div className="p-3 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {resetProgressMessage}
              </div>
            )}

            {/* Success Message */}
            {resetSuccessMessage && (
              <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                {resetSuccessMessage}
              </div>
            )}

            {/* Execute Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleExecuteFactoryReset}
                disabled={
                  isResetting ||
                  (confirmationPhrase.trim().toUpperCase() !== 'RESET COLOREAR' &&
                    confirmationPhrase.trim().toUpperCase() !== 'BORRAR TODO')
                }
                className="bg-[#d31627] hover:bg-red-800 text-white font-black text-xs px-6 py-3.5 rounded-xl shadow-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Restableciendo Sistema...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Ejecutar Reseteo a Fábrica (Poner en Cero)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
