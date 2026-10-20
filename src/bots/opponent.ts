/**
 * El rival «sentado» frente al tablero: mira la partida y, cuando le toca, piensa y juega.
 *
 * Es un observador del `GameStore`, no un efecto de React: así las carreras (deshacer mientras piensa,
 * recorrer el historial, empezar otra partida) se resuelven en un solo lugar y se prueban sin interfaz.
 * Cada vez que cambia la partida se pregunta «¿me toca, y es una posición nueva?»; si la posición que
 * estaba pensando ya no existe, cancela la búsqueda y descarta su jugada.
 */
import { toFen, START_FEN, type Color } from '../engine';
import { canPlay, legalMovesOf, positionAt, type GameSnapshot, type GameStore } from '../game';
import { isAbort, type UciEngine } from './engine';
import { chooseMove, thinkTime, type Situation } from './player';
import type { Persona } from './personas';
import { moveToUci } from './uci';

export type OpponentStatus = 'idle' | 'loading' | 'thinking' | 'error';

/** La partida vista desde el motor. */
export function situationOf(game: GameSnapshot): Situation {
  const fen = toFen(game.start);
  return {
    startFen: fen === START_FEN ? null : fen,
    moves: game.plies.map((ply) => moveToUci(ply.move)),
    legal: legalMovesOf(positionAt(game)),
  };
}

export interface OpponentOptions {
  readonly store: GameStore;
  readonly engine: UciEngine;
  readonly persona: Persona;
  /** Bando que juega el rival. */
  readonly side: Color;
  readonly onStatus: (status: OpponentStatus, error?: Error) => void;
  readonly random?: () => number;
  /** Espera `ms` (se corta si se cancela); las pruebas lo sustituyen para no esperar de verdad. */
  readonly sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  readonly now?: () => number;
}

const realSleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

const keyOf = (game: GameSnapshot): string => `${game.gameId}:${game.revision}`;

export class BotOpponent {
  private unsubscribe: (() => void) | null = null;
  private controller: AbortController | null = null;
  private key: string | null = null;
  private lastGameId = -1;
  private status: OpponentStatus = 'idle';
  private started = false;

  constructor(private readonly options: OpponentOptions) {}

  start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.options.store.subscribe(() => this.sync());
    this.sync();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.cancel();
  }

  private setStatus(status: OpponentStatus, error?: Error): void {
    if (this.status === status && !error) return;
    this.status = status;
    this.options.onStatus(status, error);
  }

  private cancel(): void {
    this.controller?.abort();
    this.controller = null;
    this.key = null;
    if (this.status === 'thinking' || this.status === 'loading') this.setStatus('idle');
  }

  /** ¿Me toca jugar? Solo con la partida en curso, vista en su última jugada y con mi turno. */
  private sync(): void {
    const game = this.options.store.getSnapshot();
    if (this.status === 'error') return;
    if (!canPlay(game) || positionAt(game).turn !== this.options.side) {
      this.cancel();
      return;
    }
    const key = keyOf(game);
    if (this.key === key) return;
    this.cancel();
    this.key = key;
    void this.think(game, key);
  }

  private async think(game: GameSnapshot, key: string): Promise<void> {
    const { engine, persona, store, random = Math.random } = this.options;
    const sleep = this.options.sleep ?? realSleep;
    const now = this.options.now ?? (() => performance.now());
    const controller = new AbortController();
    this.controller = controller;
    const { signal } = controller;
    const began = now();
    try {
      this.setStatus(this.started ? 'thinking' : 'loading');
      await engine.ready();
      if (signal.aborted) return;
      this.started = true;
      this.setStatus('thinking');
      if (game.gameId !== this.lastGameId) {
        this.lastGameId = game.gameId;
        engine.newGame();
      }
      const move = await chooseMove(engine, persona, situationOf(game), { random, signal });
      const wait = thinkTime(persona, random) - (now() - began);
      if (wait > 0) await sleep(wait, signal);
      if (signal.aborted) return;
      // Si la partida cambió mientras pensaba (deshacer, otra partida), esa jugada ya no vale.
      if (keyOf(store.getSnapshot()) !== key) return;
      this.controller = null;
      this.key = null;
      this.setStatus('idle');
      store.play(move);
    } catch (error) {
      if (signal.aborted || isAbort(error)) return;
      this.controller = null;
      this.setStatus('error', error instanceof Error ? error : new Error(String(error)));
    }
  }
}
