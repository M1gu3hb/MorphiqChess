import { useEffect, useState, useSyncExternalStore } from 'react';
import type { TrainingProgress, TrainingStore } from '../../training/progress';

/** Suscribe un componente al progreso guardado. */
export const useTraining = (store: TrainingStore): TrainingProgress =>
  useSyncExternalStore(store.subscribe, store.getSnapshot);

export type Loaded<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly value: T }
  | { readonly status: 'error' };

interface Settled<T> {
  readonly key: string;
  readonly result: { readonly ok: true; readonly value: T } | { readonly ok: false };
}

/** Carga algo asíncrono (lecciones, variantes) y vuelve a cargarlo solo cuando cambia `key`. */
export function useLoaded<T>(load: () => Promise<T>, key: string): Loaded<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (value) => {
        if (!cancelled) setSettled({ key, result: { ok: true, value } });
      },
      () => {
        if (!cancelled) setSettled({ key, result: { ok: false } });
      },
    );
    return () => {
      cancelled = true;
    };
    // `load` es una función nueva en cada render: lo que decide cuándo volver a cargar es `key`.
  }, [key]);

  if (settled?.key !== key) return { status: 'loading' };
  return settled.result.ok ? { status: 'ready', value: settled.result.value } : { status: 'error' };
}
