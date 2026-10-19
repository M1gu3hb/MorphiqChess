import { useEffect } from 'react';

/**
 * Mantiene la pantalla encendida mientras `enabled`: con el teléfono en la mesa entre dos personas,
 * si se apagara cada 30 s habría que desbloquearlo en medio de la partida. Si el navegador no lo
 * permite, simplemente no hace nada.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void lock.release();
          return;
        }
        sentinel = lock;
        lock.addEventListener('release', () => {
          if (sentinel === lock) sentinel = null;
        });
      } catch {
        /* sin permiso o con batería baja: no pasa nada */
      }
    };

    // Al volver a la pestaña el sistema ya soltó el bloqueo: se pide otra vez.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
      sentinel = null;
    };
  }, [enabled]);
}
