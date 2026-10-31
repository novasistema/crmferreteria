import React, { useEffect, useState } from 'react';
import { Lock, KeyRound, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export type CreatorLockMode = 'setup' | 'unlock' | 'change';

interface CreatorPanelLockProps {
  mode: CreatorLockMode;
  onClose: () => void;
  // Devuelve true si la contraseña es correcta
  onVerify: (password: string) => Promise<boolean>;
  // Guarda una contraseña nueva (setup o cambio)
  onSetPassword: (password: string) => Promise<void>;
  // Se llama cuando el acceso queda concedido
  onUnlocked: () => void;
}

const MIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

// SHA-256 con sal, en hexadecimal
export const hashCreatorPassword = async (password: string, salt: string): Promise<string> => {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const generateSalt = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

export const CreatorPanelLock: React.FC<CreatorPanelLockProps> = ({ mode, onClose, onVerify, onSetPassword, onUnlocked }) => {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [lockedUntil]);

  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  const registerFailure = () => {
    const next = attempts + 1;
    setAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
      setNow(Date.now());
      setAttempts(0);
      setError(`Demasiados intentos. Esperá ${LOCKOUT_SECONDS} segundos.`);
    } else {
      setError(`Contraseña incorrecta. Te quedan ${MAX_ATTEMPTS - next} intentos.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (secondsLeft > 0) return;
    setError(null);
    setBusy(true);
    try {
      if (mode === 'unlock') {
        if (await onVerify(current)) {
          onUnlocked();
        } else {
          registerFailure();
          setCurrent('');
        }
        return;
      }
      if (mode === 'change' && !(await onVerify(current))) {
        registerFailure();
        setCurrent('');
        return;
      }
      if (password.length < MIN_LENGTH) {
        setError(`La contraseña nueva debe tener al menos ${MIN_LENGTH} caracteres.`);
        return;
      }
      if (password !== confirm) {
        setError('Las contraseñas nuevas no coinciden.');
        return;
      }
      await onSetPassword(password);
      onUnlocked();
    } catch (err) {
      console.error(err);
      setError('No se pudo completar la operación. Revisá la conexión e intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const title = {
    setup: 'Crear contraseña del Creador',
    unlock: 'Acceso restringido al Creador',
    change: 'Cambiar contraseña del Creador'
  }[mode];

  const subtitle = {
    setup: 'Es la primera vez que se abre el Control Maestro. Definí la contraseña que se va a pedir cada vez que alguien quiera entrar.',
    unlock: 'Ingresá la contraseña del Creador para ver y modificar los módulos del sistema.',
    change: 'Ingresá la contraseña actual y la nueva.'
  }[mode];

  const inputCls = 'mt-1 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              {mode === 'unlock' ? <Lock className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">👑 Control Maestro</div>
              <h2 className="text-lg font-black">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600">{subtitle}</p>

          {(mode === 'unlock' || mode === 'change') && (
            <label className="block">
              <span className="text-xs font-bold text-slate-600">{mode === 'change' ? 'Contraseña actual' : 'Contraseña'}</span>
              <input type={show ? 'text' : 'password'} autoFocus value={current} onChange={e => setCurrent(e.target.value)} className={inputCls} autoComplete="current-password" />
            </label>
          )}

          {(mode === 'setup' || mode === 'change') && (
            <>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Contraseña nueva (mínimo {MIN_LENGTH} caracteres)</span>
                <input type={show ? 'text' : 'password'} autoFocus={mode === 'setup'} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} autoComplete="new-password" />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">Repetir contraseña nueva</span>
                <input type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" />
              </label>
            </>
          )}

          <button type="button" onClick={() => setShow(s => !s)} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {show ? 'Ocultar' : 'Mostrar'} contraseña
          </button>

          {error && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{secondsLeft > 0 ? `Demasiados intentos. Esperá ${secondsLeft} s.` : error}</div>}

          {mode === 'setup' && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              Anotala en un lugar seguro: sin ella no se puede volver a entrar al Control Maestro.
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200">Cancelar</button>
          <button type="submit" disabled={busy || secondsLeft > 0} className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> {mode === 'unlock' ? 'Entrar' : 'Guardar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
};
