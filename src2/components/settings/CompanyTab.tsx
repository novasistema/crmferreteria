import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../../types';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  MessageSquare,
  Layout,
} from 'lucide-react';

const PROVINCIAS_ARG = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires (CABA)',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export const CompanyTab: React.FC = () => {
  const { store, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CompanySettings>({
    name: store.settings.name || 'SERASSIO MAURICIO',
    tradeName: store.settings.tradeName || 'Ferretería Bruzzone',
    businessName: store.settings.businessName || 'SERASSIO MAURICIO',
    cuit: store.settings.cuit || '20-30800287-0',
    taxCategory: store.settings.taxCategory || 'Responsable Inscripto',
    grossIncomeTax: store.settings.grossIncomeTax || '0284537847',
    address: store.settings.address || 'Doctor Carlos I. Rovira 106 / Bv. Duffy 29',
    city: store.settings.city || '2686, ALEJANDRO ROCA, CORDOBA',
    province: store.settings.province || 'Córdoba',
    postalCode: store.settings.postalCode || 'X2686',
    phone: store.settings.phone || '3584161006',
    whatsapp: store.settings.whatsapp || '+54 9 358 435-4998',
    email: store.settings.email || 'bruzzoneferreteria@gmail.com',
    website: store.settings.website || 'www.ejemplo.com',
    logoUrl: store.settings.logoUrl || '',
    menuLayout: store.settings.menuLayout || 'horizontal',
    emailLegend: store.settings.emailLegend || 'Horario de atención: Lunes a Viernes de 8 a 17hs. Sábados de 8 a 13hs.',
    whatsappLegend: store.settings.whatsappLegend || 'Horario de atención: Lunes a Viernes de 8 a 17hs. Sábados de 8 a 13hs.',
    allowNegativeStock: store.settings.allowNegativeStock ?? true,
    defaultMarginPercent: store.settings.defaultMarginPercent ?? 60.0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('El archivo supera los 5MB permitidos', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setForm((prev) => ({ ...prev, logoUrl: base64 }));
        showToast('Logo cargado correctamente', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Logo eliminado', 'info');
  };

  const handleUseDefaultLogo = () => {
    setForm((prev) => ({ ...prev, logoUrl: '/assets/aistudio/image_1ec283c6.png' }));
    showToast('Logo predeterminado del sistema cargado', 'success');
  };

  const handleSaveCompanyData = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveSettings(form);
    showToast('Datos de la empresa guardados correctamente', 'success');
  };

  const handleSaveSalesConfig = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveSettings({
      allowNegativeStock: form.allowNegativeStock,
      defaultMarginPercent: Number(form.defaultMarginPercent) || 50,
    });
    showToast('Configuración de ventas guardada con éxito', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Box 1: Datos de la Empresa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Datos de la Empresa</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Información fiscal y de contacto de tu negocio
          </p>
        </div>

        <form onSubmit={handleSaveCompanyData} className="space-y-5 text-xs">
          {/* Row 1: Razón Social y Nombre de Fantasía */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Razón Social *
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Ej: SERASSIO MAURICIO"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none uppercase"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nombre de Fantasía
              </label>
              <input
                type="text"
                name="tradeName"
                value={form.tradeName}
                onChange={handleChange}
                placeholder="Ej: FERRETERIA BELLEZZE"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Row 2: CUIT, Condición IVA, Ingresos Brutos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                CUIT *
              </label>
              <input
                type="text"
                name="cuit"
                required
                value={form.cuit}
                onChange={handleChange}
                placeholder="20-35804387-0"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Condición IVA
              </label>
              <select
                name="taxCategory"
                value={form.taxCategory}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-semibold focus:border-blue-500 focus:outline-none"
              >
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="Consumidor Final">Consumidor Final</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Ingresos Brutos
              </label>
              <input
                type="text"
                name="grossIncomeTax"
                value={form.grossIncomeTax}
                onChange={handleChange}
                placeholder="0284537847"
                className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Subheading: Dirección */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>Dirección</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Doctor Carlos I. Rovira 106"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-6">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="2686, ALEJANDRO ROCA, CORDOBA"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 uppercase focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-3">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Provincia
                </label>
                <select
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  {PROVINCIAS_ARG.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="X2686"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 uppercase font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Subheading: Contacto */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center space-x-1.5">
              <Phone className="w-4 h-4 text-blue-500" />
              <span>Contacto</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="3584161006"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="novasystemserpfe@gmail.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Sitio Web
                </label>
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="www.ejemplo.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Logo de la Empresa */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span>Logo de la Empresa</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              El logo se mostrará en los comprobantes impresos (remitos, facturas, presupuestos)
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-5 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70">
              {/* Logo Preview Box */}
              <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo Empresa"
                    className="max-h-full max-w-full object-contain p-1"
                  />
                ) : (
                  <div className="text-center p-2">
                    <span className="text-xs font-black text-slate-400 block">FB</span>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">FERRETERIA BELLEZZE</span>
                  </div>
                )}
              </div>

              {/* Logo actions */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir Logo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleUseDefaultLogo}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1 border border-slate-700 shadow-sm transition-colors"
                  >
                    <span>Usar Logo Predeterminado</span>
                  </button>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs flex items-center space-x-1 border border-rose-200 dark:border-rose-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Logo</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Formatos: PNG, JPG, GIF, WEBP. Máximo 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Leyendas para Comunicaciones */}
          <div className="pt-2">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span>Leyendas para Comunicaciones</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Textos personalizados que se incluyen automáticamente al final de los emails y mensajes de WhatsApp enviados a clientes.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Leyenda para Emails
                </label>
                <textarea
                  name="emailLegend"
                  rows={2}
                  value={form.emailLegend}
                  onChange={handleChange}
                  placeholder="Ej: Horario de atención: Lunes a Viernes de 8 a 17hs. Sábados de 8 a 13hs."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Leyenda para WhatsApp
                </label>
                <textarea
                  name="whatsappLegend"
                  rows={2}
                  value={form.whatsappLegend}
                  onChange={handleChange}
                  placeholder="Ej: Horario de atención: Lunes a Viernes de 8 a 17hs. Sábados de 8 a 13hs."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Save Button for Company Data */}
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Datos</span>
            </button>
          </div>
        </form>
      </div>

      {/* Box: Orientación del Menú de Navegación */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Layout className="w-5 h-5 text-amber-500" />
            <span>Diseño de la Barra de Menú (Navegación)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Elige cómo prefieres visualizar el menú principal del sistema (Horizontal superior o Vertical lateral izquierdo)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
            form.menuLayout === 'horizontal' || !form.menuLayout
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <input
              type="radio"
              name="menuLayout"
              value="horizontal"
              checked={form.menuLayout === 'horizontal' || !form.menuLayout}
              onChange={() => setForm(prev => ({ ...prev, menuLayout: 'horizontal' }))}
              className="mt-1 mr-3 accent-amber-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm">Menú Horizontal (Superior)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                Barra de navegación desplegable en la parte superior de la pantalla. Clásico y compacto.
              </span>
            </div>
          </label>

          <label className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
            form.menuLayout === 'vertical'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}>
            <input
              type="radio"
              name="menuLayout"
              value="vertical"
              checked={form.menuLayout === 'vertical'}
              onChange={() => setForm(prev => ({ ...prev, menuLayout: 'vertical' }))}
              className="mt-1 mr-3 accent-amber-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-sm">Menú Vertical (Lateral Izquierdo)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                Panel lateral izquierdo fijo con secciones y accesos directos visibles en todo momento. Estilo ERP avanzado.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-4 mt-5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              store.saveSettings(form);
              showToast('Preferencia de menú guardada correctamente', 'success');
            }}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Preferencia de Menú</span>
          </button>
        </div>
      </div>

      {/* Box 2: Configuración de Ventas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Configuración de Ventas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Opciones para el punto de venta y gestión de stock
          </p>
        </div>

        <form onSubmit={handleSaveSalesConfig} className="space-y-5 text-xs">
          {/* Permitir Ventas Sin Stock */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                Permitir Ventas Sin Stock
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Habilita la venta de productos aunque no tengan stock disponible
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="allowNegativeStock"
                checked={form.allowNegativeStock}
                onChange={(e) => setForm((prev) => ({ ...prev, allowNegativeStock: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* % Ganancia Predeterminada */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
              % Ganancia Predeterminada
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Porcentaje de ganancia que se carga automáticamente al crear un producto nuevo
            </p>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="0.01"
                name="defaultMarginPercent"
                value={form.defaultMarginPercent}
                onChange={handleChange}
                className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg p-2.5 pr-8 border border-slate-300 dark:border-slate-700 font-mono font-bold focus:border-blue-500 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
            </div>
          </div>

          {/* Landing Page Mode Selector */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
            <label className="font-bold text-slate-800 dark:text-slate-200 block">
              Modo de Página Principal (Landing Page)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Elige cómo se presenta la página de inicio al abrir el sistema (Página de bienvenida).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label
                onClick={() => setForm({ ...form, landingMode: 'ecommerce' })}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition-all ${
                  (form.landingMode || 'ecommerce') === 'ecommerce'
                    ? 'bg-blue-600/10 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="landingMode"
                  checked={(form.landingMode || 'ecommerce') === 'ecommerce'}
                  onChange={() => setForm({ ...form, landingMode: 'ecommerce' })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs block font-bold">1. Presentación con E-Commerce</span>
                  <span className="text-[10px] text-slate-500 font-normal">Tienda online con catálogo y carrito</span>
                </div>
              </label>

              <label
                onClick={() => setForm({ ...form, landingMode: 'institutional' })}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition-all ${
                  form.landingMode === 'institutional'
                    ? 'bg-purple-600/10 border-purple-500 text-purple-700 dark:text-purple-300 font-bold'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <input
                  type="radio"
                  name="landingMode"
                  checked={form.landingMode === 'institutional'}
                  onChange={() => setForm({ ...form, landingMode: 'institutional' })}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs block font-bold">2. Presentación Institucional</span>
                  <span className="text-[10px] text-slate-500 font-normal">Solo información de empresa (Sin tienda)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button for Sales Config */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
