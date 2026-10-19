import type { Move, Outcome, Position } from '../engine';

/** Una jugada ya realizada, con todo lo necesario para mostrarla y animarla. */
export interface Ply {
  readonly move: Move;
  /** SAN canónico (letras inglesas); la interfaz lo localiza. */
  readonly san: string;
  readonly after: Position;
  /** Casilla -> id estable de pieza tras la jugada (-1 = vacía). */
  readonly idsAfter: Int16Array;
  /** Id de la pieza capturada, o -1. */
  readonly capturedId: number;
  readonly check: boolean;
  readonly mate: boolean;
}

/** Qué pasó entre el estado anterior y el actual: lo usa el director de animaciones. */
export type Transition =
  | { readonly type: 'none' }
  | { readonly type: 'reset' }
  | { readonly type: 'forward'; readonly ply: Ply; readonly index: number; readonly source: 'play' | 'nav' }
  | { readonly type: 'backward'; readonly ply: Ply; readonly index: number; readonly source: 'undo' | 'nav' }
  | { readonly type: 'jump' };

export type ClaimableDraw = 'threefold' | 'fifty-move';

export interface GameSnapshot {
  /** Cambia con cada partida nueva. */
  readonly gameId: number;
  /** Aumenta con cada cambio de estado. */
  readonly revision: number;
  readonly start: Position;
  readonly startIds: Int16Array;
  readonly plies: readonly Ply[];
  /** Jugada que se está viendo: 0 = posición inicial, N = tras la jugada N. */
  readonly cursor: number;
  /** Claves de repetición de las posiciones 0..plies.length. */
  readonly keys: readonly string[];
  readonly manualOutcome: Outcome | null;
  readonly outcome: Outcome | null;
  readonly claimable: ClaimableDraw | null;
  readonly transition: Transition;
}

/** Formato guardado en localStorage (versionado para poder migrar). */
export interface SavedGame {
  readonly v: 1;
  readonly startFen: string;
  /** Jugadas en notación de coordenadas: "e2e4", "e7e8q". */
  readonly moves: readonly string[];
  readonly manualOutcome: Outcome | null;
  readonly cursor: number;
}
