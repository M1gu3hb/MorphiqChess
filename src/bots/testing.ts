/**
 * Un «Stockfish» de mentira para las pruebas: habla UCI por un transporte falso, entiende
 * `position` y `go`, y responde con jugadas legales (calculadas con el motor de reglas de la app).
 * Solo se importa desde pruebas.
 */
import {
  applyMove,
  findLegalMove,
  generateLegalMoves,
  initialPosition,
  parseFen,
  parseSquare,
  type Move,
  type Position,
  type PromotionPiece,
} from '../engine';
import type { EngineTransport } from './engine';
import { moveToUci } from './uci';

export interface FakeSearch {
  readonly position: Position;
  readonly moves: readonly string[];
  readonly options: ReadonlyMap<string, string>;
  readonly go: string;
  readonly legal: readonly Move[];
}

export interface FakeAnswer {
  readonly bestmove: string | null;
  /** Variantes (MultiPV): jugada y puntuación en centipeones, de mejor a peor. */
  readonly lines: readonly { readonly move: string; readonly score: number }[];
  /** Líneas `info` escritas tal cual, en lugar de las generadas a partir de `lines`. */
  readonly raw?: readonly string[];
}

export interface FakeEngineOptions {
  /** Cuántos milisegundos «piensa» antes de contestar (con temporizadores reales o simulados). */
  readonly delayMs?: number;
  /** Elige la respuesta; por omisión, la primera jugada legal con puntuación 0. */
  readonly answer?: (search: FakeSearch) => FakeAnswer;
  /** No responde a `uci` (para probar el tiempo de espera de arranque). */
  readonly mute?: boolean;
  /** No hace caso de `stop` (para probar el tiempo de espera tras detener una búsqueda). */
  readonly ignoreStop?: boolean;
  /** Tarda este tiempo en contestar a `stop` (por omisión contesta al instante). */
  readonly stopDelayMs?: number;
}

export interface FakeEngine {
  /** Todo lo que recibió el motor, en orden. */
  readonly received: string[];
  /** Lo recibido (`>línea`) y lo escrito por el motor (`<línea`), mezclado y en orden. */
  readonly log: string[];
  readonly searches: FakeSearch[];
  readonly factory: () => EngineTransport;
  /** Cuántos transportes se crearon y cuántos se cerraron. */
  readonly stats: { created: number; terminated: number };
  /** Hace que el motor falle como si el Worker se cayera. */
  crash(message?: string): void;
}

function replay(command: string): { position: Position; moves: string[] } {
  const tokens = command.split(/\s+/);
  let at = 1;
  let position: Position;
  if (tokens[at] === 'startpos') {
    position = initialPosition();
    at++;
  } else {
    const end = tokens.indexOf('moves');
    position = parseFen(tokens.slice(at + 1, end === -1 ? tokens.length : end).join(' '));
    at = end === -1 ? tokens.length : end;
  }
  const moves = tokens[at] === 'moves' ? tokens.slice(at + 1) : [];
  for (const text of moves) {
    const from = parseSquare(text.slice(0, 2));
    const to = parseSquare(text.slice(2, 4));
    if (from === null || to === null) throw new Error(`Jugada UCI inválida: ${text}`);
    const move = findLegalMove(position, from, to, text[4] as PromotionPiece | undefined);
    if (!move) throw new Error(`Jugada ilegal en la partida falsa: ${text}`);
    position = applyMove(position, move);
  }
  return { position, moves };
}

export function createFakeEngine(settings: FakeEngineOptions = {}): FakeEngine {
  const received: string[] = [];
  const log: string[] = [];
  const searches: FakeSearch[] = [];
  const stats = { created: 0, terminated: 0 };
  let live: EngineTransport | null = null;

  const factory = (): EngineTransport => {
    stats.created++;
    const options = new Map<string, string>();
    let current: { position: Position; moves: string[] } = { position: initialPosition(), moves: [] };
    let pending: { timer: ReturnType<typeof setTimeout>; finish: () => void } | null = null;
    let dead = false;

    const transport: EngineTransport = {
      onLine: null,
      onFail: null,
      terminate: () => {
        dead = true;
        stats.terminated++;
        if (pending) clearTimeout(pending.timer);
        pending = null;
      },
      send: (line) => {
        received.push(line);
        log.push(`>${line}`);
        const say = (text: string) => {
          if (dead) return;
          log.push(`<${text}`);
          transport.onLine?.(text);
        };
        if (line === 'uci') {
          if (settings.mute) return;
          say('id name FakeFish');
          say('uciok');
        } else if (line === 'isready') {
          say('readyok');
        } else if (line.startsWith('setoption name ')) {
          const match = /^setoption name (.+?) value (.*)$/.exec(line);
          if (match) options.set(match[1]!, match[2]!);
        } else if (line.startsWith('position ')) {
          current = replay(line);
        } else if (line === 'stop') {
          if (settings.ignoreStop) return;
          const target = pending;
          if (settings.stopDelayMs) setTimeout(() => target?.finish(), settings.stopDelayMs);
          else target?.finish();
        } else if (line.startsWith('go')) {
          const legal = generateLegalMoves(current.position);
          const search: FakeSearch = { ...current, options: new Map(options), go: line, legal };
          searches.push(search);
          const answer: FakeAnswer = settings.answer
            ? settings.answer(search)
            : {
                bestmove: legal[0] ? moveToUci(legal[0]) : null,
                lines: legal.slice(0, Number(options.get('MultiPV') ?? 1)).map((move) => ({ move: moveToUci(move), score: 0 })),
              };
          const finish = () => {
            if (!pending) return;
            clearTimeout(pending.timer);
            pending = null;
            if (answer.raw) {
              for (const text of answer.raw) say(text);
            } else {
              answer.lines.forEach((entry, index) => {
                say(`info depth 5 seldepth 7 multipv ${index + 1} score cp ${entry.score} nodes 1000 nps 100000 time 10 pv ${entry.move}`);
              });
            }
            say(`bestmove ${answer.bestmove ?? '(none)'}`);
          };
          pending = { timer: setTimeout(finish, settings.delayMs ?? 0), finish };
        }
      },
    };
    live = transport;
    return transport;
  };

  return {
    received,
    log,
    searches,
    factory,
    stats,
    crash: (message = 'worker caído') => live?.onFail?.(new Error(message)),
  };
}

/** `Storage` en memoria para probar el guardado sin navegador. */
export class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  /** Si es verdadero, escribir falla (disco lleno, modo privado…). */
  failWrites = false;
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('almacenamiento lleno');
    this.data.set(key, value);
  }
}
