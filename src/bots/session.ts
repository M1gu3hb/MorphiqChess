/**
 * El ciclo de vida de una partida contra un rival: empezarla, retomarla desde el menú y deshacer jugadas.
 * Es lógica pura sobre los dos almacenes (resultados y partida), sin interfaz, para poder probarla.
 */
import type { Color } from '../engine';
import { isAtEnd, positionAt, type GameSnapshot, type GameStore } from '../game';
import type { BotsState, BotsStore } from './records';

/** Dónde se guarda la partida contra un rival (la de dos jugadores tiene su propia clave). */
export const BOT_GAME_STORAGE_KEY = 'morphiqchess:bots:game:v1';

/** Empieza de cero contra `bot`: partida nueva y resultado sin contar. */
export function beginSession(bots: BotsStore, game: GameStore, bot: string, side: Color): void {
  game.newGame();
  bots.startSession(bot, side);
}

/**
 * Deja lista la partida para abrir la pantalla de `bot` con `side`. Si es la que quedó a medias (o terminada)
 * se retoma; si es otra, o no queda nada, empieza una nueva. Se puede llamar más de una vez seguida.
 */
export function enterSession(bots: BotsStore, game: GameStore, bot: string, side: Color): void {
  const { session } = bots.getSnapshot();
  if (session?.bot !== bot || session.side !== side) {
    beginSession(bots, game, bot, side);
    return;
  }
  const live = game.getSnapshot();
  if (live.plies.length > 0 || live.manualOutcome) return;
  // Página recién abierta: lo jugado está en el almacenamiento. Si ya no está, la partida terminada
  // no se puede revisar y la siguiente debe contar como nueva.
  if (!game.loadSaved() && session.recorded) bots.startSession(bot, side);
}

/** La partida en curso: la que está en memoria o, si la página acaba de abrirse, la guardada. */
export function currentGame(game: GameStore): GameSnapshot | null {
  const live = game.getSnapshot();
  return live.plies.length > 0 || live.manualOutcome ? live : game.peekSaved();
}

export interface ResumableGame {
  readonly bot: string;
  readonly side: Color;
  readonly plies: number;
}

/** La partida que se puede retomar desde el menú: la que sigue sin terminar y ya tiene jugadas. */
export function resumable(state: BotsState, game: GameSnapshot | null): ResumableGame | null {
  const { session } = state;
  if (!session || session.recorded || !game || game.outcome !== null || game.plies.length === 0) return null;
  return { bot: session.bot, side: session.side, plies: game.plies.length };
}

/**
 * Cuántas jugadas hay que quitar para «deshacer tu última jugada» y que vuelva a ser tu turno: la tuya y la
 * respuesta del rival (o solo la tuya si él aún no ha respondido). 0 si no hay nada tuyo que deshacer.
 */
export function pliesToUndo(game: GameSnapshot, side: Color): number {
  if (game.outcome !== null || !isAtEnd(game)) return 0;
  const total = game.plies.length;
  if (positionAt(game).turn === side) return total >= 2 ? 2 : 0;
  return total >= 1 ? 1 : 0;
}
