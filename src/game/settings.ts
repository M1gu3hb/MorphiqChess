/**
 * Preferencias de la persona (no de la partida): se guardan en localStorage y se leen con
 * `useSyncExternalStore`. Toda lectura/escritura va protegida: el almacenamiento puede no existir.
 */
export type MotionPreference = 'full' | 'reduced';

export interface Settings {
  /** 'reduced' = sin giros ni efectos grandes (se activa solo con prefers-reduced-motion). */
  readonly motion: MotionPreference;
  /** Girar todas las piezas 180° en cada turno para dejarlas derechas frente a quien juega. */
  readonly rotatePieces: boolean;
  /** Pasar a pantalla completa al empezar o continuar una partida (donde el navegador lo permite). */
  readonly autoFullscreen: boolean;
}

const STORAGE_KEY = 'morphiqchess:settings:v1';

function systemMotion(): MotionPreference {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'reduced'
      : 'full';
  } catch {
    return 'full';
  }
}

/** En pantallas táctiles lo normal es jugar a pantalla completa; con ratón se activa a mano. */
function touchFirst(): boolean {
  try {
    return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

function load(): Settings {
  const defaults: Settings = { motion: systemMotion(), rotatePieces: true, autoFullscreen: touchFirst() };
  try {
    const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const data = JSON.parse(raw) as Partial<Settings>;
    return {
      motion: data.motion === 'full' || data.motion === 'reduced' ? data.motion : defaults.motion,
      rotatePieces: typeof data.rotatePieces === 'boolean' ? data.rotatePieces : defaults.rotatePieces,
      autoFullscreen: typeof data.autoFullscreen === 'boolean' ? data.autoFullscreen : defaults.autoFullscreen,
    };
  } catch {
    return defaults;
  }
}

export class SettingsStore {
  private current: Settings = load();
  private readonly listeners = new Set<() => void>();

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): Settings => this.current;

  update(patch: Partial<Settings>): void {
    this.current = { ...this.current, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.current));
    } catch {
      /* sin almacenamiento: el cambio vale solo para esta sesión */
    }
    for (const listener of this.listeners) listener();
  }
}
