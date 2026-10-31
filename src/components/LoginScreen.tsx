import React, { useRef, useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Users,
  KeyRound,
  ExternalLink,
  Compass,
  Crown,
  Sliders
} from 'lucide-react';
import { AppUser, CompanyConfig } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  onOpenCustomerPortal: () => void;
  onOpenMobileSellerApp?: () => void;
  config?: CompanyConfig | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  onOpenCustomerPortal,
  onOpenMobileSellerApp,
  config
}) => {
  const [emailOrUser, setEmailOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [selectedUserForForgot, setSelectedUserForForgot] = useState<AppUser | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const term = emailOrUser.trim().toLowerCase();
    if (!term) {
      setError('Por favor ingrese su email o nombre de usuario.');
      return;
    }

    if (!password) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    // Find user by email or name
    const found = users.find(u => 
      u.email.toLowerCase() === term || 
      u.name.toLowerCase().includes(term) ||
      u.role.toLowerCase() === term
    );

    if (!found) {
      setError('Usuario o email no registrado en el sistema de la fábrica.');
      return;
    }

    if (!found.active) {
      setError('El usuario se encuentra inactivo. Comuníquese con Administración.');
      return;
    }

    // La contraseña tiene que coincidir exactamente con la del usuario (sin claves maestras)
    if (!found.password) {
      setError('Este usuario no tiene contraseña asignada. Pedile al administrador que le asigne una desde Usuarios.');
      return;
    }
    if (password !== found.password) {
      setError('Contraseña incorrecta.');
      setPassword('');
      return;
    }

    // Success login
    onLogin(found);
  };

  // Elegir un usuario de la lista solo completa el usuario: la contraseña siempre se escribe
  const handleSelectUser = (u: AppUser) => {
    setEmailOrUser(u.email);
    setPassword('');
    setError(null);
    setTimeout(() => passwordInputRef.current?.focus(), 0);
  };

  const brandLogo = config?.logoUrl || '/assets/aistudio/colorear-500px_0158e3cb.webp';
  const brandTradeName = config?.tradeName || config?.companyName || 'Colorear Pinturas';
  const brandLegalName = config?.companyName || 'Colorear Pinturas S.R.L.';

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#fafbfe] flex flex-col justify-between items-center px-4 py-8 select-none">
      {/* Background Soft Organic Waves (matching reference image style with Colorear tones) */}
      <div 
        className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(167, 243, 208, 0.7) 0%, rgba(254, 202, 202, 0.5) 50%, rgba(254, 240, 138, 0.3) 100%)'
        }}
      />
      <div 
        className="pointer-events-none absolute -bottom-40 -left-40 w-[550px] h-[550px] rounded-full blur-3xl opacity-35"
        style={{
          background: 'radial-gradient(circle, rgba(191, 219, 254, 0.6) 0%, rgba(254, 215, 170, 0.4) 70%, transparent 100%)'
        }}
      />

      {/* Decorative subtle curve top right (like Fidel layout in image) */}
      <svg 
        className="pointer-events-none absolute top-0 right-0 w-2/5 h-auto max-w-[550px] text-emerald-100/40 opacity-70"
        viewBox="0 0 500 500" 
        fill="currentColor"
      >
        <path d="M0,0 C150,90 350,-50 500,80 L500,0 Z" />
      </svg>
      <svg 
        className="pointer-events-none absolute bottom-0 left-0 w-1/3 h-auto max-w-[400px] text-lime-100/40 opacity-70"
        viewBox="0 0 500 500" 
        fill="currentColor"
      >
        <path d="M0,500 C180,450 320,520 400,380 L0,500 Z" />
      </svg>

      {/* Spectrum brand line at very top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1 bg-[#4b0082]"></div>
        <div className="flex-1 bg-[#003399]"></div>
        <div className="flex-1 bg-[#0099cc]"></div>
        <div className="flex-1 bg-[#33cc33]"></div>
        <div className="flex-1 bg-[#f5c800]"></div>
        <div className="flex-1 bg-[#ff7800]"></div>
        <div className="flex-1 bg-[#d31627]"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] my-auto relative z-10">
        <div className="text-center mb-6">
          {/* Logo Squircle Badge */}
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100/80 mb-5 transition-transform hover:scale-105">
            <img 
              src={brandLogo} 
              alt={brandTradeName} 
              className="h-12 w-auto max-w-[220px] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/aistudio/colorear-500px_0158e3cb.webp';
              }}
            />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ¡Bienvenido a {brandTradeName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            ¿Todavía no tienes cuenta? <span className="text-slate-900 font-semibold cursor-pointer hover:underline" onClick={() => setShowForgotModal(true)}>Contactá al Administrador.</span>
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          {/* Divider Iniciar Sesión */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Iniciar sesión
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <input 
                  type="text"
                  value={emailOrUser}
                  onChange={e => setEmailOrUser(e.target.value)}
                  placeholder="demo@colorearpinturas.com.ar"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#eff4fc] hover:bg-[#e8f0fe] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 border border-transparent focus:border-slate-300 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input 
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-[#eff4fc] hover:bg-[#e8f0fe] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 border border-transparent focus:border-slate-300 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1"
                  title={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button (matching dark bold button in reference image) */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 px-4 bg-[#1e2329] hover:bg-black text-white font-bold text-sm rounded-2xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Ingresar</span>
            </button>
          </form>

          {/* Creator Master Quick Login Card */}
          {(() => {
            const creator = users.find(u => u.role === 'creador' || u.id === 'user-creador');
            if (!creator) return null;
            return (
              <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-400/40 text-white shadow-lg shadow-indigo-950/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200">
                      Acceso Maestro Creador
                    </span>
                  </div>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-extrabold px-2 py-0.5 rounded-full border border-indigo-400/30">
                    Control Total
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-indigo-800/40">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                      <span>{creator.name}</span>
                    </div>
                    <div className="text-[10px] text-indigo-300 font-mono truncate">
                      {creator.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectUser(creator)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all active:scale-95 shadow-xs shrink-0 flex items-center gap-1 border border-indigo-400/30"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Seleccionar</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* User selector list (requested: "debemos tener listado de usuarios y cada uno ingresar con contraseña") */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Elegí tu usuario y escribí tu contraseña
              </span>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                {users.length} Registrados
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {users.map(u => {
                const isSelected = emailOrUser === u.email;
                const isCreator = u.role === 'creador';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between border transition-all text-xs ${
                      isSelected 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : isCreator
                          ? 'bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200 text-indigo-950 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: u.avatarColor || '#d31627' }}
                      >
                        {isCreator ? '👑' : u.name.charAt(0)}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="font-bold truncate flex items-center gap-1">
                          <span>{u.name}</span>
                          {isCreator && (
                            <span className="text-[9px] bg-indigo-600 text-white font-extrabold px-1 rounded-sm">
                              CREADOR
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : isCreator ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {u.roleLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'text-slate-400'
                      }`}>
                        {isSelected ? '🔒 Ingresá la clave' : 'Elegir'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portal de Clientes Button */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onOpenCustomerPortal}
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 mx-auto py-1 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>¿Sos cliente? Ingresá al <strong>Portal con CUIT o DNI</strong></span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Direct Access for Street Traveling Salesmen / Preventistas */}
          {onOpenMobileSellerApp && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onOpenMobileSellerApp}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-900/10 transition-all active:scale-[0.99] group"
              >
                <Compass className="w-4 h-4 text-emerald-200 group-hover:rotate-45 transition-transform" />
                <span>📱 Acceso Preventistas (Vendedores de Calle)</span>
                <span className="text-[10px] bg-white/20 text-white font-extrabold px-1.5 py-0.5 rounded-full">
                  App Celular
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 font-medium">
          © {new Date().getFullYear()} {brandLegalName}. {config?.plantAddress || config?.fiscalAddress || 'Planta Industrial Parque Industrial Pilar.'}
        </div>
      </div>

      {/* MODAL: FORGOT PASSWORD / USERS INFO */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-red-50 text-[#d31627]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Acceso & Credenciales de Usuarios
                </h3>
                <p className="text-xs text-slate-500">
                  Cómo recuperar el acceso
                </p>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-2">
              <p>Por seguridad, las contraseñas no se muestran en esta pantalla.</p>
              <p>Si olvidaste tu contraseña, pedile al <strong>administrador</strong> o al <strong>creador del sistema</strong> que te asigne una nueva desde el módulo <strong>Usuarios</strong>.</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
