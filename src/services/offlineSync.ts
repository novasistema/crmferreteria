// Guardado tolerante a cortes de internet.
// Firestore aplica cada cambio en la base local (IndexedDB) al instante y lo envía al servidor
// cuando hay conexión. Estas funciones reemplazan a setDoc/updateDoc/deleteDoc/writeBatch para que
// la pantalla NO quede esperando la confirmación del servidor cuando no hay internet.
import {
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  writeBatch as fsWriteBatch,
  waitForPendingWrites,
  Firestore,
  WriteBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Si el servidor no confirma en este tiempo, damos el cambio por guardado localmente
const ACK_TIMEOUT_MS = 2500;

export type SyncState = 'online' | 'offline' | 'syncing';

export interface SyncSnapshot {
  state: SyncState;
  pending: number; // cambios de esta sesión todavía no confirmados por el servidor
  lastSyncedAt?: string;
  lastError?: string;
}

let snapshot: SyncSnapshot = {
  state: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'online',
  pending: 0
};
const listeners = new Set<(s: SyncSnapshot) => void>();

const emit = (patch: Partial<SyncSnapshot>) => {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach(l => l(snapshot));
};

export const getSyncSnapshot = () => snapshot;

export const subscribeSync = (fn: (s: SyncSnapshot) => void) => {
  listeners.add(fn);
  fn(snapshot);
  return () => {
    listeners.delete(fn);
  };
};

export const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

const describeError = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Sigue la escritura en segundo plano y libera a la pantalla rápido
const track = (p: Promise<void>): Promise<void> => {
  emit({ pending: snapshot.pending + 1 });
  let settled = false;
  const done = p.then(
    () => {
      settled = true;
      emit({ pending: Math.max(0, snapshot.pending - 1), lastSyncedAt: new Date().toISOString() });
    },
    err => {
      settled = true;
      emit({ pending: Math.max(0, snapshot.pending - 1), lastError: describeError(err) });
      throw err;
    }
  );
  if (isOffline()) {
    done.catch(err => console.error('Cambio rechazado al sincronizar:', err));
    return Promise.resolve();
  }
  // Con conexión: los errores rápidos (datos inválidos, permisos) se informan a la pantalla
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (!settled) {
        done.catch(err => console.error('Cambio rechazado al sincronizar:', err));
        resolve();
      }
    }, ACK_TIMEOUT_MS);
    done.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      err => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
};

export function setDoc(ref: any, data: any, options?: any): Promise<void> {
  return track(options ? fsSetDoc(ref, data, options) : fsSetDoc(ref, data));
}

export function updateDoc(ref: any, ...rest: any[]): Promise<void> {
  return track((fsUpdateDoc as any)(ref, ...rest));
}

export function deleteDoc(ref: any): Promise<void> {
  return track(fsDeleteDoc(ref));
}

export function writeBatch(firestore: Firestore): WriteBatch {
  const batch = fsWriteBatch(firestore);
  const originalCommit = batch.commit.bind(batch);
  (batch as any).commit = () => track(originalCommit());
  return batch;
}

// --- Estado de conexión ---
let started = false;

const syncNow = async () => {
  emit({ state: 'syncing' });
  try {
    // Incluye cambios que quedaron en la base local de una sesión anterior (recarga sin internet)
    await waitForPendingWrites(db);
    emit({ state: isOffline() ? 'offline' : 'online', lastSyncedAt: new Date().toISOString() });
  } catch (err) {
    emit({ state: isOffline() ? 'offline' : 'online', lastError: describeError(err) });
  }
};

export const startConnectionMonitor = () => {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('offline', () => emit({ state: 'offline' }));
  window.addEventListener('online', () => {
    syncNow();
  });
  if (!isOffline()) syncNow();
};
