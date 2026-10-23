import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Client, User } from '../../types';
import {
  ShieldCheck,
  CreditCard,
  Heart,
  Users,
  Building2,
  Search,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HardHat,
  Award,
  DollarSign,
  FileText,
  KeyRound,
  ChevronRight,
  Phone,
  UserCheck,
  ExternalLink,
  Info,
} from 'lucide-react';

interface AuthPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'staff' | 'ctacte' | 'loyalty';
}

export const AuthPortalModal: React.FC<AuthPortalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'staff',
}) => {
  const {
    store,
    currentUser,
    setCurrentUser,
    activeWarehouseId,
    setActiveWarehouseId,
    loginClient,
    switchToERP,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'ctacte' | 'loyalty'>(initialTab);

  // Sync tab whenever modal opens or initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Staff State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(currentUser.id);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeWarehouseId || '1');
  const [staffPin, setStaffPin] = useState('');

  // Client Cta Cte State
  const [ctacteDocInput, setCtacteDocInput] = useState('');
  const [ctacteError, setCtacteError] = useState<string | null>(null);

  // Client Loyalty State
  const [loyaltyDocInput, setLoyaltyDocInput] = useState('');
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to normalize DNI / CUIT strings by removing spaces, dots, hyphens, and slashes
  const normalizeDoc = (val: string) => val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().trim();

  // All active clients
  const ctacteClients = store.clients.filter((c) => c.active && c.hasCurrentAccount);
  const loyaltyClients = store.clients.filter((c) => c.active && !c.hasCurrentAccount && c.loyaltyEligible);

  // Live match for Cta Cte as user types
  const normalizedCtacteInput = normalizeDoc(ctacteDocInput);
  const matchedCtacteClient = normalizedCtacteInput.length >= 3
    ? store.clients.find((c) => {
        if (!c.active) return false;
        const normTaxId = normalizeDoc(c.taxId);
        const normCode = normalizeDoc(c.code);
        const normPhone = normalizeDoc(c.phone || '');
        const normName = c.name.toLowerCase();
        return (
          normTaxId === normalizedCtacteInput ||
          normTaxId.includes(normalizedCtacteInput) ||
          normCode === normalizedCtacteInput ||
          normPhone.includes(normalizedCtacteInput) ||
          normName.includes(ctacteDocInput.toLowerCase().trim())
        );
      })
    : null;

  // Live match for Loyalty as user types
  const normalizedLoyaltyInput = normalizeDoc(loyaltyDocInput);
  const matchedLoyaltyClient = normalizedLoyaltyInput.length >= 3
    ? store.clients.find((c) => {
        if (!c.active) return false;
        const normTaxId = normalizeDoc(c.taxId);
        const normCode = normalizeDoc(c.code);
        const normPhone = normalizeDoc(c.phone || '');
        const normName = c.name.toLowerCase();
        return (
          normTaxId === normalizedLoyaltyInput ||
          normTaxId.includes(normalizedLoyaltyInput) ||
          normCode === normalizedLoyaltyInput ||
          normPhone.includes(normalizedLoyaltyInput) ||
          normName.includes(loyaltyDocInput.toLowerCase().trim())
        );
      })
    : null;

  // Handler for Staff Login
  const handleStaffLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userToLogin = store.users.find((u) => u.id === selectedStaffId) || currentUser;
    setCurrentUser(userToLogin);
    setActiveWarehouseId(selectedBranchId);
    switchToERP();
    onClose();
    showToast(`Bienvenido al ERP, ${userToLogin.name}`, 'success');
  };

  // Handler for Client Cta Cte Login
  const handleClientCtacteLogin = (client: Client) => {
    if (!client.hasCurrentAccount) {
      showToast('Este cliente no posee Cuenta Corriente habilitada.', 'error');
      return;
    }
    setCtacteError(null);
    loginClient(client, 'ctacte');
    onClose();
    showToast(`Bienvenido al Portal de Cuenta Corriente, ${client.name}`, 'success');
  };

  // Handler for Client Loyalty Login
  const handleClientLoyaltyLogin = (client: Client) => {
    if (client.hasCurrentAccount) {
      showToast('Los clientes con Cuenta Corriente no acumulan puntos de fidelización.', 'info');
      return;
    }
    setLoyaltyError(null);
    loginClient(client, 'loyalty');
    onClose();
    showToast(`¡Bienvenido al Club Ferretero Bruzzone, ${client.name}!`, 'success');
  };

  // Direct submit for Cta Cte by DNI / CUIT
  const handleCtacteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCtacteError(null);

    const query = normalizeDoc(ctacteDocInput);
    if (!query) {
      setCtacteError('Por favor ingrese su DNI o CUIT.');
      return;
    }

    const found = store.clients.find((c) => {
      if (!c.active) return false;
      const normTaxId = normalizeDoc(c.taxId);
      const normCode = normalizeDoc(c.code);
      const normPhone = normalizeDoc(c.phone || '');
      const normName = c.name.toLowerCase();
      return (
        normTaxId === query ||
        normTaxId.includes(query) ||
        normCode === query ||
        normPhone.includes(query) ||
        normName.includes(ctacteDocInput.toLowerCase().trim())
      );
    });

    if (!found) {
      setCtacteError('No se encontró ningún cliente registrado con ese DNI o CUIT.');
      return;
    }

    if (!found.hasCurrentAccount) {
      setCtacteError(`El cliente ${found.name} no tiene activada Cuenta Corriente. Puede consultar sus puntos en el Club Ferretero.`);
      return;
    }

    handleClientCtacteLogin(found);
  };

  // Direct submit for Loyalty by DNI / CUIT
  const handleLoyaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoyaltyError(null);

    const query = normalizeDoc(loyaltyDocInput);
    if (!query) {
      setLoyaltyError('Por favor ingrese su DNI o CUIT.');
      return;
    }

    const found = store.clients.find((c) => {
      if (!c.active) return false;
      const normTaxId = normalizeDoc(c.taxId);
      const normCode = normalizeDoc(c.code);
      const normPhone = normalizeDoc(c.phone || '');
      const normName = c.name.toLowerCase();
      return (
        normTaxId === query ||
        normTaxId.includes(query) ||
        normCode === query ||
        normPhone.includes(query) ||
        normName.includes(loyaltyDocInput.toLowerCase().trim())
      );
    });

    if (!found) {
      setLoyaltyError('No se encontró socio registrado con ese DNI o CUIT. Podés solicitar tu adhesión en caja.');
      return;
    }

    if (found.hasCurrentAccount) {
      setLoyaltyError(`El cliente ${found.name} opera con Cuenta Corriente comercial.`);
      return;
    }

    handleClientLoyaltyLogin(found);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-slate-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white">Ingreso al Sistema & Portales</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase">
                  Ferretería Bruzzone
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Seleccione su tipo de acceso con DNI / CUIT o usuario del sistema
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Access Category Tabs */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 p-1.5 gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('ctacte')}
            className={`py-3 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition-all ${
              activeTab === 'ctacte'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="text-center sm:text-left">1. Cuenta Corriente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`py-3 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition-all ${
              activeTab === 'loyalty'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Heart className="w-4 h-4 shrink-0" />
            <span className="text-center sm:text-left">2. Mis Puntos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-2 rounded-xl flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition-all ${
              activeTab === 'staff'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-center sm:text-left">3. Personal / ERP</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
          {/* TAB 1: PORTAL CUENTA CORRIENTE (DNI/CUIT LOGIN) */}
          {activeTab === 'ctacte' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-amber-300">Portal de Autogestión de Cuenta Corriente</p>
                  <p className="text-slate-300 mt-0.5">
                    Ingrese el <strong>DNI o CUIT</strong> del titular o empresa para consultar saldos, facturas, remitos y crédito disponible.
                  </p>
                </div>
              </div>

              {/* DNI / CUIT Input Form */}
              <form onSubmit={handleCtacteSubmit} className="space-y-3 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ingresar DNI o CUIT del Cliente / Empresa:</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (con o sin guiones)
                    </span>
                  </label>

                  <div className="relative">
                    <Search className="w-5 h-5 text-amber-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ej: 30-71666451-0 ó 20334455667 ó DNI"
                      value={ctacteDocInput}
                      onChange={(e) => {
                        setCtacteDocInput(e.target.value);
                        setCtacteError(null);
                      }}
                      className="w-full bg-slate-900 text-white text-sm sm:text-base font-mono pl-11 pr-4 py-3 rounded-xl border-2 border-slate-700 focus:border-amber-500 focus:outline-none transition-colors shadow-inner"
                    />
                    {ctacteDocInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setCtacteDocInput('');
                          setCtacteError(null);
                        }}
                        className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {ctacteError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{ctacteError}</span>
                      {ctacteError.includes('Club Ferretero') && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('loyalty');
                            setLoyaltyDocInput(ctacteDocInput);
                            setCtacteError(null);
                          }}
                          className="block mt-1.5 text-amber-300 font-bold underline hover:text-amber-200"
                        >
                          Ir al Club de Puntos con este DNI/CUIT →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Match Preview Card if matched as typing */}
                {matchedCtacteClient && (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between animate-in zoom-in-95">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-300">
                          {matchedCtacteClient.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        CUIT: <span className="font-mono font-bold text-white">{matchedCtacteClient.taxId}</span> • Saldo Deudor: <span className="font-bold text-rose-400">${matchedCtacteClient.currentBalance.toLocaleString('es-AR')}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClientCtacteLogin(matchedCtacteClient)}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow flex items-center space-x-1 shrink-0"
                    >
                      <span>Ingresar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>INGRESAR A MI CUENTA CORRIENTE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CLUB DE PUNTOS (DNI/CUIT LOGIN) */}
          {activeTab === 'loyalty' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3.5 flex items-start space-x-3">
                <Award className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-rose-300">Club Ferretero de Puntos & Beneficios Bruzzone</p>
                  <p className="text-slate-300 mt-0.5">
                    Ingrese su <strong>DNI o CUIT</strong> para consultar los puntos acumulados en sus compras de mostrador y canjear premios.
                  </p>
                </div>
              </div>

              {/* DNI / CUIT Input Form */}
              <form onSubmit={handleLoyaltySubmit} className="space-y-3 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>Ingresar DNI o CUIT del Titular:</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      (con o sin guiones)
                    </span>
                  </label>

                  <div className="relative">
                    <Search className="w-5 h-5 text-rose-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ej: 20-33445566-7 ó 33445566 ó DNI"
                      value={loyaltyDocInput}
                      onChange={(e) => {
                        setLoyaltyDocInput(e.target.value);
                        setLoyaltyError(null);
                      }}
                      className="w-full bg-slate-900 text-white text-sm sm:text-base font-mono pl-11 pr-4 py-3 rounded-xl border-2 border-slate-700 focus:border-rose-500 focus:outline-none transition-colors shadow-inner"
                    />
                    {loyaltyDocInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setLoyaltyDocInput('');
                          setLoyaltyError(null);
                        }}
                        className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Banner */}
                {loyaltyError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{loyaltyError}</span>
                      {loyaltyError.includes('Cuenta Corriente') && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('ctacte');
                            setCtacteDocInput(loyaltyDocInput);
                            setLoyaltyError(null);
                          }}
                          className="block mt-1.5 text-amber-300 font-bold underline hover:text-amber-200"
                        >
                          Ir al Portal Cuenta Corriente con este DNI/CUIT →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Match Preview Card if matched as typing */}
                {matchedLoyaltyClient && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/40 rounded-xl flex items-center justify-between animate-in zoom-in-95">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-black text-rose-300">
                          {matchedLoyaltyClient.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          Nivel {matchedLoyaltyClient.loyaltyTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        DNI: <span className="font-mono font-bold text-white">{matchedLoyaltyClient.taxId}</span> • Puntos: <span className="font-black text-amber-400">{matchedLoyaltyClient.loyaltyPoints.toLocaleString('es-AR')} pts</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClientLoyaltyLogin(matchedLoyaltyClient)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow flex items-center space-x-1 shrink-0"
                    >
                      <span>Ver Puntos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4" />
                  <span>CONSULTAR Y VER MIS PUNTOS</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PERSONAL / ERP INTERNO */}
          {activeTab === 'staff' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3.5 flex items-start space-x-3">
                <HardHat className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-blue-300">Acceso a Gestión Central & Punto de Venta (POS)</p>
                  <p className="text-slate-400 mt-0.5">
                    Para operadores, cajeros, encargados de compras, administración y depósito.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select User */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    Seleccionar Usuario / Operador:
                  </label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {store.users.map((u) => {
                      const isSelected = u.id === selectedStaffId;
                      const wh = store.warehouses.find((w) => w.id === u.branchId);
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedStaffId(u.id);
                            if (u.branchId) setSelectedBranchId(u.branchId);
                          }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{u.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Rol: <span className="text-blue-400 font-semibold">{u.role.toUpperCase()}</span> •{' '}
                                {wh ? wh.name : 'Casa Central'}
                              </p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Select Branch & PIN */}
                <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Sucursal de Operación:
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs font-semibold rounded-lg p-2.5 border border-slate-700 focus:border-blue-500 focus:outline-none"
                    >
                      {store.warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} {w.isMain ? '(Casa Central)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      PIN / Contraseña de Acceso:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        placeholder="Contraseña o PIN (Opcional demo)"
                        value={staffPin}
                        onChange={(e) => setStaffPin(e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      * En modo demostración puede ingresar directamente haciendo clic en el botón inferior.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStaffLogin}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all mt-2 cursor-pointer"
                  >
                    <span>Ingresar al Sistema ERP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Ferretería Bruzzone • Alejandro Roca, Córdoba</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

