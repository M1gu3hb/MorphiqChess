import type { Color, Move } from '../engine';
import {
  agreeDraw,
  claimDraw,
  createGame,
  deserializeGame,
  goTo,
  playMove,
  resign,
  serializeGame,
  truncateAtCursor,
  undo,
  undoPlies,
} from './game';
import type { GameSnapshot } from './types';

/** Dónde se guarda la partida de dos jugadores; la de cada modo lleva su propia clave. */
export const GAME_STORAGE_KEY = 'morphiqchess:game:v1';

/** localStorage puede fallar o no existir (modo privado, bloqueo de datos): siempre con try/catch. */
function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Estado de la partida con suscripción para `useSyncExternalStore` y guardado automático. */
export class GameStore {
  private snapshot: GameSnapshot;
  private readonly listeners = new Set<() => void>();
  private readonly storage: Storage | null;

  constructor(
    initial: GameSnapshot = createGame(),
    storage: Storage | null = safeStorage(),
    private readonly storageKey: string = GAME_STORAGE_KEY,
  ) {
    this.snapshot = initial;
    this.storage = storage;
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): GameSnapshot => this.snapshot;

  private commit(next: GameSnapshot): void {
    if (next === this.snapshot) return;
    this.snapshot = next;
    this.persist();
    for (const listener of this.listeners) listener();
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      const game = this.snapshot;
      if (game.plies.length === 0 && !game.manualOutcome) this.storage.removeItem(this.storageKey);
      else this.storage.setItem(this.storageKey, JSON.stringify(serializeGame(game)));
    } catch {
      /* sin espacio o bloqueado: la partida sigue funcionando sin guardado */
    }
  }

  /** ¿Hay una partida guardada para continuar? */
  hasSavedGame(): boolean {
    if (!this.storage) return false;
    try {
      return deserializeGame(JSON.parse(this.storage.getItem(this.storageKey) ?? 'null')) !== null;
    } catch {
      return false;
    }
  }

  /** Carga la partida guardada; si falta o está dañada, no cambia nada y devuelve false. */
  loadSaved(): boolean {
    if (!this.storage) return false;
    try {
      const saved = deserializeGame(JSON.parse(this.storage.getItem(this.storageKey) ?? 'null'));
      if (!saved) return false;
      this.commit(saved);
      return true;
    } catch {
      return false;
    }
  }

  newGame(): void {
    this.commit(createGame());
  }

  play(move: Move): void {
    this.commit(playMove(this.snapshot, move));
  }

  goTo(cursor: number): void {
    this.commit(goTo(this.snapshot, cursor));
  }

  back(): void {
    this.goTo(this.snapshot.cursor - 1);
  }

  forward(): void {
    this.goTo(this.snapshot.cursor + 1);
  }

  first(): void {
    this.goTo(0);
  }

  last(): void {
    this.goTo(this.snapshot.plies.length);
  }

  undo(): void {
    this.commit(undo(this.snapshot));
  }

  /** Deshace varias jugadas de una vez, con un solo cambio de estado. */
  undoPlies(count: number): void {
    this.commit(undoPlies(this.snapshot, count));
  }

  resumeFromCursor(): void {
    this.commit(truncateAtCursor(this.snapshot));
  }

  resign(loser: Color): void {
    this.commit(resign(this.snapshot, loser));
  }

  agreeDraw(): void {
    this.commit(agreeDraw(this.snapshot));
  }

  claimDraw(): void {
    this.commit(claimDraw(this.snapshot));
  }
}
