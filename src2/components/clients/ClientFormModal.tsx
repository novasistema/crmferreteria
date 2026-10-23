import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { consultarPadronArca, formatearCuit, validarCuit } from '../../lib/arcaService';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Building,
  Mail,
  Phone,
  Calendar,
  MapPin,
  X,
  CreditCard,
  Sparkles,
  Loader2,
  Layers,
} from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onSuccess?: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  onSuccess,
}) => {
  const { store, showToast } = useApp();

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [taxCondition, setTaxCondition] = useState<'Consumidor Final' | 'Responsable Inscripto' | 'Monotributo' | 'Exento'>('Consumidor Final');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [birthday, setBirthday] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmailInput, setCurrentEmailInput] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Alejandro Roca');
  const [province, setProvince] = useState('Córdoba');
  const [postalCode, setPostalCode] = useState('X2686');
  const [priceListId, setPriceListId] = useState('pl-minorista');
  const [hasCurrentAccount, setHasCurrentAccount] = useState(false);
  const [creditLimit, setCreditLimit] = useState(0);
  const [loyaltyEligible, setLoyaltyEligible] = useState(true);
  const [notes, setNotes] = useState('');

  // ARCA lookup state
  const [isSearchingArca, setIsSearchingArca] = useState(false);
  const [arcaSuccessBanner, setArcaSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setCode(clientToEdit.code);
        setName(clientToEdit.name);
        setBusinessName(clientToEdit.businessName || clientToEdit.name);
        setTaxId(clientToEdit.taxId);
        setTaxCondition(clientToEdit.taxCondition);
        setPhone(clientToEdit.phone || '');
        setWhatsapp(clientToEdit.whatsapp || clientToEdit.phone || '');
        setBirthday(clientToEdit.birthday || '');
        setEmails(clientToEdit.emails && clientToEdit.emails.length > 0 ? clientToEdit.emails : clientToEdit.email ? [clientToEdit.email] : []);
        setCurrentEmailInput('');
        setAddress(clientToEdit.address || '');
        setCity(clientToEdit.city || 'Alejandro Roca');
        setProvince(clientToEdit.province || 'Córdoba');
        setPostalCode(clientToEdit.postalCode || 'X2686');
        setPriceListId(clientToEdit.priceListId || 'pl-minorista');
        setHasCurrentAccount(clientToEdit.hasCurrentAccount);
        setCreditLimit(clientToEdit.creditLimit || 0);
        setLoyaltyEligible(clientToEdit.loyaltyEligible);
        setNotes(clientToEdit.notes || '');
      } else {
        const nextCode = `CLI-${String(store.clients.length + 1).padStart(4, '0')}`;
        setCode(nextCode);
        setName('');
        setBusinessName('');
        setTaxId('');
        setTaxCondition('Consumidor Final');
        setPhone('');
        setWhatsapp('');
        setBirthday('');
        setEmails([]);
        setCurrentEmailInput('');
        setAddress('');
        setCity('Alejandro Roca');
        setProvince('Córdoba');
        setPostalCode('X2686');
        setPriceListId('pl-minorista');
        setHasCurrentAccount(false);
        setCreditLimit(0);
        setLoyaltyEligible(true);
        setNotes('');
      }
      setArcaSuccessBanner(null);
    }
  }, [isOpen, clientToEdit, store.clients.length]);

  if (!isOpen) return null;

  // Handle ARCA Lookup
  const handleConsultarArca = async (cuitValue?: string) => {
    const targetCuit = cuitValue || taxId;
    const clean = targetCuit.replace(/[^0-9]/g, '');

    if (clean.length < 8) {
      showToast('Ingrese un CUIT (11 dígitos) o DNI (8 dígitos) para consultar en ARCA.', 'error');
      return;
    }

    setIsSearchingArca(true);
    setArcaSuccessBanner(null);

    try {
      const data = await consultarPadronArca(clean);

      if (data) {
        setTaxId(data.cuit);
        setName(data.nombreFantasia || data.razonSocial);
        setBusinessName(data.razonSocial);
        setTaxCondition(data.condicionFiscal);
        if (data.direccion) setAddress(data.direccion);
        if (data.ciudad) setCity(data.ciudad);
        if (data.provincia) setProvince(data.provincia);
        if (data.codigoPostal) setPostalCode(data.codigoPostal);

        // Set higher credit limit default for juridicas or companies
        if (data.tipoPersona === 'JURIDICA') {
          setHasCurrentAccount(true);
          setLoyaltyEligible(false);
          if (creditLimit === 0) setCreditLimit(1500000);
        }

        setArcaSuccessBanner(
          `✓ Datos fiscales extraídos de ARCA: ${data.razonSocial} • ${data.condicionFiscal} • ${data.direccion}, ${data.ciudad}`
        );
        showToast('Datos fiscales cargados exitosamente desde ARCA', 'success');
      } else {
        showToast('No se encontraron registros en ARCA para este número.', 'warning');
      }
    } catch (err) {
      showToast('Error al consultar ARCA.', 'error');
    } finally {
      setIsSearchingArca(false);
    }
  };

  // CUIT input change handler with auto-trigger at 11 digits
  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTaxId(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length === 11 && !clientToEdit) {
      handleConsultarArca(val);
    }
  };

  // Emails tag input
  const handleAddEmail = () => {
    const trimmed = currentEmailInput.trim().toLowerCase();
    if (trimmed && trimmed.includes('@')) {
      if (!emails.includes(trimmed)) {
        setEmails([...emails, trimmed]);
      }
      setCurrentEmailInput('');
    }
  };

  const handleRemoveEmail = (em: string) => {
    setEmails(emails.filter((e) => e !== em));
  };

  const handleKeyDownEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  // Handle Save Client
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Por favor ingrese el Nombre o Razón Social del cliente.', 'error');
      return;
    }

    if (!taxId.trim()) {
      showToast('Por favor ingrese el CUIT/CUIL o DNI del cliente.', 'error');
      return;
    }

    // Combine primary email
    const primaryEmail = emails[0] || '';

    const newClientData: Client = {
      id: clientToEdit ? clientToEdit.id : `cli-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      businessName: businessName.trim() || name.trim(),
      taxId: formatearCuit(taxId.trim()),
      taxCondition,
      email: primaryEmail,
      emails,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      birthday: birthday || undefined,
      address: address.trim(),
      city: city.trim(),
      province: province.trim(),
      postalCode: postalCode.trim(),
      priceListId,
      hasCurrentAccount,
      creditLimit: hasCurrentAccount ? Number(creditLimit) || 0 : 0,
      currentBalance: clientToEdit ? clientToEdit.currentBalance : 0,
      // STRICT ERP RULE: if hasCurrentAccount is true, loyaltyEligible MUST be false
      loyaltyEligible: hasCurrentAccount ? false : loyaltyEligible,
      loyaltyPoints: clientToEdit ? clientToEdit.loyaltyPoints : 0,
      loyaltyTier: clientToEdit ? clientToEdit.loyaltyTier : 'Bronce',
      notes: notes.trim(),
      active: true,
      createdAt: clientToEdit ? clientToEdit.createdAt : new Date().toISOString(),
    };

    store.saveClient(newClientData);
    showToast(
      clientToEdit ? 'Cliente actualizado correctamente' : 'Nuevo cliente registrado exitosamente',
      'success'
    );

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Alta y modificación en padrón con validación fiscal ARCA
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
          {/* CUIT / ARCA Search Row */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>CUIT / CUIL / DNI *</span>
              </label>
              <button
                type="button"
                onClick={() => handleConsultarArca()}
                disabled={isSearchingArca}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                {isSearchingArca ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Consultar ARCA</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ej: 30-50287435-3 ó 20-30800287-0"
                value={taxId}
                onChange={handleTaxIdChange}
                className="w-full bg-slate-900 text-white font-mono text-sm pl-3 pr-10 py-2.5 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => handleConsultarArca()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-amber-400"
                title="Buscar en ARCA"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Al completar 11 dígitos se consulta ARCA automáticamente. También podés usar la lupa o completar los datos manualmente.
            </p>

            {/* ARCA Success Banner */}
            {arcaSuccessBanner && (
              <div className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-start space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{arcaSuccessBanner}</span>
              </div>
            )}
          </div>

          {/* Nombre / Fantasía & Razón Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Nombre / Fantasía *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Ferretería Bruzzone"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Razón Social
              </label>
              <input
                type="text"
                placeholder="Ej: Bruzzone Mauricio Oscar"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Condición Fiscal & Lista de Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Condición Fiscal *
              </label>
              <select
                value={taxCondition}
                onChange={(e) => setTaxCondition(e.target.value as any)}
                className="w-full bg-slate-950 text-white text-xs font-semibold rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              >
                <option value="Consumidor Final">Consumidor Final</option>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Lista de Precios Predeterminada
              </label>
              <select
                value={priceListId}
                onChange={(e) => setPriceListId(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs font-semibold rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              >
                {store.priceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} {pl.isDefault ? '(Predeterminada)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Teléfono, WhatsApp & Cumpleaños */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="358-4980503"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                WhatsApp
              </label>
              <div className="relative">
                <span className="text-[10px] text-emerald-400 font-bold absolute left-2.5 top-2.5">
                  +549
                </span>
                <input
                  type="text"
                  placeholder="3584354998"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs rounded-xl pl-12 pr-3 py-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Fecha de Cumpleaños
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Emails Tag List */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Emails (Presione Enter para agregar múltiples)
            </label>
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-700 flex flex-wrap items-center gap-1.5 min-h-[42px]">
              {emails.map((em) => (
                <span
                  key={em}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-800 text-slate-200 text-xs rounded-lg border border-slate-700"
                >
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span>{em}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(em)}
                    className="text-slate-400 hover:text-rose-400 ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                type="email"
                placeholder="Agregar email y presionar Enter..."
                value={currentEmailInput}
                onChange={(e) => setCurrentEmailInput(e.target.value)}
                onKeyDown={handleKeyDownEmail}
                onBlur={handleAddEmail}
                className="flex-1 min-w-[200px] bg-transparent text-white text-xs p-1 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Dirección, Localidad, Provincia, CP */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Bv. Duffy 29"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs rounded-xl pl-8 pr-3 py-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Ciudad / Localidad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Código Postal
              </label>
              <input
                type="text"
                placeholder="X2686"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Cuenta Corriente & Límite de Crédito */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Cuenta Corriente & Crédito
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCurrentAccount}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasCurrentAccount(checked);
                    if (checked) {
                      setLoyaltyEligible(false);
                      if (creditLimit === 0) setCreditLimit(500000);
                    } else {
                      setLoyaltyEligible(true);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-2 text-xs font-bold text-slate-300">
                  {hasCurrentAccount ? 'Habilitada' : 'Deshabilitada'}
                </span>
              </label>
            </div>

            {hasCurrentAccount && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Límite de Crédito Autorizado ($)
                  </label>
                  <input
                    type="number"
                    value={creditLimit || ''}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-amber-400 font-black text-right rounded-xl p-2.5 border border-slate-700 focus:border-amber-500 font-mono text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center">
                  <p className="text-[11px] text-slate-400 italic">
                    * Al habilitar Cuenta Corriente, este cliente puede registrar ventas a plazo. Queda excluido del club de puntos de mostrador.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Notas / Observaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre entrega en obra, encargado de compras, etc."
              className="w-full bg-slate-950 text-white text-xs rounded-xl p-3 border border-slate-700 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-slate-800 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{clientToEdit ? 'Guardar Cambios' : 'Registrar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
