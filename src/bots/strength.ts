/**
 * Cómo juega cada rival: qué le pide a Stockfish y cómo elige la jugada entre lo que este calcula.
 *
 * Tres maneras de jugar, de menos a más fuerte:
 *
 *  - `sampler` (Elo por debajo de 1320, el mínimo que admite Stockfish): busca poca profundidad,
 *    mira varias variantes y elige entre ellas al azar, con más probabilidad para las mejores
 *    (softmax sobre la pérdida en centipeones). Además, a veces «se despista» y juega cualquier jugada
 *    legal. Más temperatura y más despistes = menos Elo.
 *  - `elo` (1320–3190): la fuerza limitada de Stockfish (`UCI_LimitStrength` + `UCI_Elo`).
 *  - `max`: Stockfish sin límite, solo acotado por el tiempo por jugada.
 *
 * Todo esto es lógica pura: recibe el resultado de la búsqueda y un generador de azar, y devuelve una
 * jugada. Así se prueba sin motor y se calibra con partidas entre rivales (tools/bots).
 */
import type { Move } from '../engine';
import type { OptionValue, SearchRequest, SearchResult } from './engine';
import { findMoveByUci } from './uci';

export type Strength =
  | {
      readonly kind: 'sampler';
      /** Profundidad de la búsqueda (jugadas). */
      readonly depth: number;
      /** Cuántas variantes mira (MultiPV). */
      readonly lines: number;
      /** Temperatura (centipeones): cuanto mayor, más reparte la elección entre jugadas peores. */
      readonly temperature: number;
      /** Probabilidad de jugar una jugada legal cualquiera. */
      readonly blunder: number;
    }
  | {
      readonly kind: 'elo';
      /** Elo de la escala de Stockfish (1320–3190). */
      readonly elo: number;
      readonly movetime: number;
    }
  | { readonly kind: 'max'; readonly movetime: number };

/** Plazos de las jugadas de apertura con variedad (kind `max`). */
export const VARIETY_PLIES = 8;
/** Hasta cuántos centipeones peor que la mejor puede ser una jugada de apertura «equivalente». */
export const VARIETY_WINDOW_CP = 22;
/** Puntuación a partir de la cual se considera mate o ventaja decisiva: no se varía. */
const DECISIVE_CP = 600;
/** Las puntuaciones se acotan así antes de compararlas (un mate no «aplasta» a todas las demás). */
const SCORE_CLIP = 1500;

const BASE_OPTIONS = { 'Skill Level': 20, UCI_LimitStrength: false, MultiPV: 1 } as const;

type Plan = Pick<SearchRequest, 'options' | 'go'>;

/** Lo que se le pide a Stockfish para pensar la jugada número `ply` (0 = la primera de la partida). */
export function planSearch(strength: Strength, ply: number): Plan {
  switch (strength.kind) {
    case 'sampler':
      return {
        options: { ...BASE_OPTIONS, MultiPV: strength.lines },
        go: { depth: strength.depth },
      };
    case 'elo':
      return {
        options: { ...BASE_OPTIONS, UCI_LimitStrength: true, UCI_Elo: strength.elo },
        go: { movetime: strength.movetime },
      };
    case 'max': {
      const opening = ply < VARIETY_PLIES;
      return {
        options: { ...BASE_OPTIONS, MultiPV: opening ? 4 : 1 },
        go: { movetime: opening ? Math.min(strength.movetime, 450) : strength.movetime },
      };
    }
  }
}

/** Plan para analizar a fondo (pista, evaluar tablas): Stockfish sin límites. */
export function planAnalysis(movetime: number): Plan {
  return { options: { ...BASE_OPTIONS } as Record<string, OptionValue>, go: { movetime } };
}

const clip = (score: number): number => Math.max(-SCORE_CLIP, Math.min(SCORE_CLIP, score));

/** Elige una jugada con probabilidad ∝ exp(−pérdida / temperatura). */
function softmaxPick(lines: readonly { move: Move; score: number }[], temperature: number, random: () => number): Move {
  const top = Math.max(...lines.map((line) => clip(line.score)));
  const weights = lines.map((line) => Math.exp(-(top - clip(line.score)) / Math.max(1, temperature)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let i = 0; i < lines.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return lines[i]!.move;
  }
  return lines[lines.length - 1]!.move;
}

/** Las variantes de la búsqueda cuya primera jugada es legal en esta posición. */
function legalLines(result: SearchResult, legal: readonly Move[]): { move: Move; score: number }[] {
  const out: { move: Move; score: number }[] = [];
  for (const line of result.lines) {
    const first = line.pv[0];
    const move = first === undefined ? null : findMoveByUci(legal, first);
    if (move && !out.some((entry) => entry.move === move)) out.push({ move, score: line.score });
  }
  return out;
}

/**
 * La jugada que hace el rival. Siempre es legal: si el motor devuelve algo inesperado, o no hay
 * resultado, juega la mejor que se conozca o, en último caso, una legal cualquiera.
 */
export function pickMove(
  strength: Strength,
  result: SearchResult,
  legal: readonly Move[],
  ply: number,
  random: () => number = Math.random,
): Move {
  if (legal.length === 0) throw new Error('No hay jugadas legales.');
  const anyLegal = (): Move => legal[Math.floor(random() * legal.length)]!;
  const best = result.bestmove === null ? null : findMoveByUci(legal, result.bestmove);

  switch (strength.kind) {
    case 'sampler': {
      if (random() < strength.blunder) return anyLegal();
      const lines = legalLines(result, legal);
      if (lines.length === 0) return best ?? anyLegal();
      return softmaxPick(lines, strength.temperature, random);
    }
    case 'max': {
      const lines = legalLines(result, legal);
      const top = lines[0];
      if (ply < VARIETY_PLIES && top && lines.length > 1 && Math.abs(top.score) < DECISIVE_CP) {
        const close = lines.filter((line) => top.score - line.score <= VARIETY_WINDOW_CP);
        return close[Math.floor(random() * close.length)]!.move;
      }
      return best ?? top?.move ?? anyLegal();
    }
    case 'elo':
      return best ?? legalLines(result, legal)[0]?.move ?? anyLegal();
  }
}
