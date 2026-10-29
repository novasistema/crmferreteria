import React, { useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';

interface InitialSetupScreenProps {
  /** Crea el usuario dueño y la empresa. Devuelve un mensaje de error o null. */
  onSetup: (params: { name: string; email: string; password: string; companyName: string }) => Promise<string | null>;
}

/**
 * Se muestra una sola vez, en una instalación nueva (modo producción), cuando todavía
 * no existe ningún usuario. Crea la cuenta del dueño del sistema (rol "creador").
 */
export const InitialSetupScreen: React.FC<InitialSetupScreenProps> = ({ onSetup }) => {
  const [companyName, setCompanyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !name.trim() || !email.trim()) {
      setError('Completá todos los campos.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsSubmitting(true);
    const err = await onSetup({ name, email, password, companyName });
    setIsSubmitting(false);
    if (err) setError(err);
  };

  const inputCls =
    'w-full px-4 py-3 rounded-2xl bg-[#eff4fc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 border border-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-[#fafbfe] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[460px] bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Configuración inicial</h1>
        </div>
        <p className="text-xs text-slate-500 mb-6">
          Esta pantalla aparece una sola vez. Creá la cuenta del dueño del sistema; después vas a poder
          dar de alta a los demás usuarios desde el módulo Usuarios.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de la empresa</label>
            <input className={inputCls} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ej: Ferretería San Martín" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tu nombre</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre y apellido" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Tu email</label>
            <input type="email" autoComplete="username" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Contraseña (mínimo 8 caracteres)</label>
            <input type="password" autoComplete="new-password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Repetir contraseña</label>
            <input type="password" autoComplete="new-password" className={inputCls} value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-[#1e2329] hover:bg-black disabled:opacity-60 text-white font-bold text-sm rounded-2xl"
          >
            {isSubmitting ? 'Creando…' : 'Crear cuenta y empezar'}
          </button>
        </form>
      </div>
    </div>
  );
};
