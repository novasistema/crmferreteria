import React, { useEffect, useRef, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { subscribeSync, SyncSnapshot } from '../services/offlineSync';

// Aviso flotante del estado de conexión y sincronización
export const ConnectionStatus: React.FC = () => {
  const [s, setS] = useState<SyncSnapshot | null>(null);
  const [showSynced, setShowSynced] = useState(false);
  const [showSyncing, setShowSyncing] = useState(false);
  const [errorDismissed, setErrorDismissed] = useState<string | undefined>();
  const wasOffline = useRef(false);
  const syncingTimer = useRef<number | undefined>(undefined);

  useEffect(() => subscribeSync(setS), []);

  useEffect(() => {
    if (!s) return;
    if (s.state === 'offline') {
      wasOffline.current = true;
      setShowSynced(false);
    }
    // Evita parpadeos: "Sincronizando" solo si tarda más de medio segundo
    if (s.state === 'syncing' || (s.state === 'online' && s.pending > 0)) {
      if (syncingTimer.current === undefined) {
        syncingTimer.current = window.setTimeout(() => setShowSyncing(true), s.state === 'syncing' ? 500 : 3000);
      }
    } else {
      if (syncingTimer.current !== undefined) window.clearTimeout(syncingTimer.current);
      syncingTimer.current = undefined;
      setShowSyncing(false);
    }
    if (s.state === 'online' && s.pending === 0 && wasOffline.current) {
      wasOffline.current = false;
      setShowSynced(true);
    }
  }, [s]);

  useEffect(() => {
    if (!showSynced) return;
    const t = window.setTimeout(() => setShowSynced(false), 4000);
    return () => window.clearTimeout(t);
  }, [showSynced]);

  if (!s) return null;

  const pill = 'fixed z-[70] left-3 bottom-20 sm:bottom-24 max-w-[calc(100vw-24px)] sm:max-w-sm rounded-2xl shadow-2xl px-4 py-3 text-xs font-semibold flex items-start gap-2.5 border';

  if (s.state === 'offline') {
    return (
      <div className={`${pill} bg-rose-600 text-white border-rose-500`} role="status">
        <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-black text-sm">Sin internet</div>
          <div className="opacity-90">
            Podés seguir trabajando. Los cambios se guardan en este equipo y se sincronizan solos cuando vuelva la conexión.
            {s.pending > 0 && <> <b>{s.pending}</b> {s.pending === 1 ? 'cambio pendiente' : 'cambios pendientes'}.</>}
          </div>
          <div className="opacity-75 mt-1">La facturación con ARCA queda pendiente hasta que vuelva internet.</div>
        </div>
      </div>
    );
  }

  if (showSyncing) {
    return (
      <div className={`${pill} bg-amber-500 text-white border-amber-400`} role="status">
        <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
        <div>
          <div className="font-black text-sm">Sincronizando…</div>
          <div className="opacity-90">Enviando los cambios hechos sin conexión{s.pending > 0 ? ` (${s.pending})` : ''}.</div>
        </div>
      </div>
    );
  }

  if (s.lastError && s.lastError !== errorDismissed) {
    return (
      <div className={`${pill} bg-white text-rose-700 border-rose-200`} role="alert">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-black text-sm">Un cambio no se pudo sincronizar</div>
          <div className="text-slate-600 break-words">{s.lastError}</div>
        </div>
        <button onClick={() => setErrorDismissed(s.lastError)} className="p-0.5 rounded hover:bg-rose-50"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  if (showSynced) {
    return (
      <div className={`${pill} bg-emerald-600 text-white border-emerald-500`} role="status">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <div className="font-black text-sm">Conexión recuperada</div>
          <div className="opacity-90">Todo lo hecho sin internet ya está sincronizado.</div>
        </div>
      </div>
    );
  }

  return null;
};
