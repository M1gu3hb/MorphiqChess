/**
 * Lo mínimo del protocolo UCI que necesitan los rivales: jugadas en coordenadas y lectura de las
 * líneas `info` y `bestmove` que escribe el motor. Sin DOM ni Worker: se prueba con texto.
 */
import { squareName, type Move } from '../engine';

/** Jugada en coordenadas, como la entiende UCI: «e2e4», «e7e8q». El enroque es la jugada del rey (e1g1). */
export function moveToUci(move: Pick<Move, 'from' | 'to' | 'promotion'>): string {
  return `${squareName(move.from)}${squareName(move.to)}${move.promotion ?? ''}`;
}

/** La jugada legal que corresponde a un texto UCI, o `null` si el motor devolvió algo que no es legal aquí. */
export function findMoveByUci(legal: readonly Move[], uci: string): Move | null {
  return legal.find((move) => moveToUci(move) === uci) ?? null;
}

/** Valor con el que se cuenta un mate al ordenar jugadas (un mate más corto vale más). */
export const MATE_CP = 100_000;

/** Una línea de análisis (`info … multipv … score … pv …`) ya interpretada. */
export interface InfoLine {
  readonly depth: number;
  /** Posición de esta línea entre las mejores (1 = la mejor). */
  readonly multipv: number;
  /** Centipeones desde quien mueve; un mate se lleva a ±(MATE_CP − jugadas). */
  readonly score: number;
  /** Jugadas hasta el mate (positivo: mueve quien da mate), o `null` si no hay mate a la vista. */
  readonly mate: number | null;
  /** Jugadas de la variante principal, en UCI. */
  readonly pv: readonly string[];
}

const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/**
 * Interpreta una línea `info`. Devuelve `null` si no trae puntuación y variante (por ejemplo
 * `info string …` o `info currmove …`) o si es una cota (`lowerbound`/`upperbound`), que no sirve
 * para comparar jugadas.
 */
export function parseInfoLine(line: string): InfoLine | null {
  if (!line.startsWith('info ')) return null;
  const tokens = line.trim().split(/\s+/);
  let depth = 0;
  let multipv = 1;
  let score: number | null = null;
  let mate: number | null = null;
  let bound = false;
  let pv: string[] = [];
  for (let i = 1; i < tokens.length; i++) {
    switch (tokens[i]) {
      case 'depth':
        depth = Number(tokens[++i]);
        break;
      case 'multipv':
        multipv = Number(tokens[++i]);
        break;
      case 'score': {
        const kind = tokens[++i];
        const value = Number(tokens[++i]);
        if (kind === 'cp') score = value;
        else if (kind === 'mate') {
          mate = value;
          score = (value >= 0 ? 1 : -1) * (MATE_CP - Math.min(Math.abs(value), 1000));
        }
        break;
      }
      case 'lowerbound':
      case 'upperbound':
        bound = true;
        break;
      case 'pv':
        pv = tokens.slice(i + 1).filter((token) => UCI_MOVE.test(token));
        i = tokens.length;
        break;
      case 'string':
        return null;
    }
  }
  if (bound || score === null || pv.length === 0 || !Number.isFinite(depth) || !Number.isFinite(multipv)) return null;
  return { depth, multipv, score, mate, pv };
}

/** `bestmove e2e4 ponder e7e5` → `{ move: 'e2e4' }`; `bestmove (none)` → `{ move: null }`; otra línea → `null`. */
export function parseBestMove(line: string): { readonly move: string | null } | null {
  const match = /^bestmove\s+(\S+)/.exec(line);
  if (!match) return null;
  const text = match[1]!;
  return { move: UCI_MOVE.test(text) ? text : null };
}
