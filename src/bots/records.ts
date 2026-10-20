/**
 * Lo que recuerda el modo Práctica entre visitas: contra quién se está jugando y los resultados de
 * cada rival. La partida en sí se guarda aparte (otro `GameStore` con su propia clave).
 */
import type { Color, Outcome } from '../engine';

export interface Tally {
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
}

export interface BotSession {
  /** Id del rival (ver `personas.ts`). */
  readonly bot: string;
  /** Bando de la persona; el rival juega el otro. */
  readonly side: Color;
  /** Ya se contó el resultado de esta partida (para no contarlo dos veces al volver a abrirla). */
  readonly recorded: boolean;
}

export interface BotsState {
  readonly session: BotSession | null;
  readonly records: Readonly<Record<string, Tally>>;
}

export type Result = 'win' | 'draw' | 'loss';

export const EMPTY_TALLY: Tally = { wins: 0, draws: 0, losses: 0 };

/** Resultado para quien juega con `side`. */
export function resultFor(outcome: Outcome, side: Color): Result {
  if (outcome.type === 'draw') return 'draw';
  return outcome.winner === side ? 'win' : 'loss';
}

export const BOTS_STORAGE_KEY = 'morphiqchess:bots:v1';
const MAX_COUNT = 1_000_000;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;

/** Lee lo guardado con cuidado: lo que no cuadra se descarta, nunca rompe la pantalla. */
export function parseBotsState(raw: unknown): BotsState {
  const empty: BotsState = { session: null, records: {} };
  if (typeof raw !== 'object' || raw === null) return empty;
  const data = raw as Record<string, unknown>;
  if (data.v !== 1) return empty;

  let session: BotSession | null = null;
  const s = data.session;
  if (typeof s === 'object' && s !== null) {
    const { bot, side, recorded } = s as Record<string, unknown>;
    if (typeof bot === 'string' && ID.test(bot) && (side === 'w' || side === 'b') && typeof recorded === 'boolean') {
      session = { bot, side, recorded };
    }
  }

  const records: Record<string, Tally> = {};
  if (typeof data.records === 'object' && data.records !== null) {
    for (const [id, value] of Object.entries(data.records)) {
      if (!ID.test(id) || typeof value !== 'object' || value === null) continue;
      const { wins, draws, losses } = value as Record<string, unknown>;
      if (isCount(wins) && isCount(draws) && isCount(losses)) records[id] = { wins, draws, losses };
    }
  }
  return { session, records };
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Estado del modo Práctica con suscripción (para `useSyncExternalStore`) y guardado automático. */
export class BotsStore {
  private state: BotsState;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: Storage | null = safeStorage(),
    private readonly key: string = BOTS_STORAGE_KEY,
  ) {
    this.state = this.load();
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): BotsState => this.state;

  /** Empieza una partida contra `bot`: el resultado todavía no está contado. */
  startSession(bot: string, side: Color): void {
    this.commit({ ...this.state, session: { bot, side, recorded: false } });
  }

  /** Cuenta el resultado de la partida en curso, una sola vez. */
  record(result: Result): void {
    const { session, records } = this.state;
    if (!session || session.recorded) return;
    const before = records[session.bot] ?? EMPTY_TALLY;
    const after: Tally = {
      wins: Math.min(MAX_COUNT, before.wins + (result === 'win' ? 1 : 0)),
      draws: Math.min(MAX_COUNT, before.draws + (result === 'draw' ? 1 : 0)),
      losses: Math.min(MAX_COUNT, before.losses + (result === 'loss' ? 1 : 0)),
    };
    this.commit({ session: { ...session, recorded: true }, records: { ...records, [session.bot]: after } });
  }

  /** Borra los resultados de todos los rivales. */
  resetRecords(): void {
    this.commit({ ...this.state, records: {} });
  }

  private load(): BotsState {
    if (!this.storage) return { session: null, records: {} };
    try {
      return parseBotsState(JSON.parse(this.storage.getItem(this.key) ?? 'null'));
    } catch {
      return { session: null, records: {} };
    }
  }

  private commit(next: BotsState): void {
    this.state = next;
    try {
      this.storage?.setItem(this.key, JSON.stringify({ v: 1, ...next }));
    } catch {
      /* sin espacio o bloqueado: sigue funcionando sin guardado */
    }
    for (const listener of this.listeners) listener();
  }
}
