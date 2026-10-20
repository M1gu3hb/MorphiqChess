/**
 * Lo que hace un rival con el motor: pensar su jugada, dar una pista y decidir si acepta tablas.
 * Funciones puras sobre un `UciEngine` (que puede ser uno falso en las pruebas).
 */
import type { Move } from '../engine';
import type { UciEngine } from './engine';
import type { Persona } from './personas';
import { pickMove, planAnalysis, planSearch } from './strength';
import { findMoveByUci } from './uci';

/** La partida hasta ahora, vista desde el motor. */
export interface Situation {
  /** FEN de la posición de salida; `null` es la de siempre. */
  readonly startFen: string | null;
  /** Jugadas hechas, en UCI (para que el motor cuente las repeticiones). */
  readonly moves: readonly string[];
  /** Jugadas legales de la posición actual. */
  readonly legal: readonly Move[];
}

interface Options {
  readonly random?: () => number;
  readonly signal?: AbortSignal;
}

/** La jugada del rival. Siempre es una de `legal`. */
export async function chooseMove(
  engine: UciEngine,
  persona: Persona,
  situation: Situation,
  { random = Math.random, signal }: Options = {},
): Promise<Move> {
  const { legal } = situation;
  const only = legal.length === 1 ? legal[0] : undefined;
  // Con una sola jugada legal no hay nada que pensar.
  if (only) return only;
  const ply = situation.moves.length;
  const result = await engine.search(
    { startFen: situation.startFen, moves: situation.moves, ...planSearch(persona.strength, ply) },
    signal,
  );
  return pickMove(persona.strength, result, legal, ply, random);
}

/** Tiempo de análisis de una pista y de la evaluación para las tablas. */
const HINT_MS = 900;
const DRAW_EVAL_MS = 450;

/** La mejor jugada según Stockfish sin límites (para la pista). `null` si el motor no encuentra ninguna. */
export async function suggestMove(engine: UciEngine, situation: Situation, signal?: AbortSignal): Promise<Move | null> {
  const result = await engine.search(
    { startFen: situation.startFen, moves: situation.moves, ...planAnalysis(HINT_MS) },
    signal,
  );
  return result.bestmove === null ? null : findMoveByUci(situation.legal, result.bestmove);
}

/** Valoración (centipeones) de la posición desde quien tiene el turno, o `null` si no hay datos. */
export async function evaluate(engine: UciEngine, situation: Situation, signal?: AbortSignal): Promise<number | null> {
  const result = await engine.search(
    { startFen: situation.startFen, moves: situation.moves, ...planAnalysis(DRAW_EVAL_MS) },
    signal,
  );
  return result.lines[0]?.score ?? null;
}

/**
 * El rival acepta unas tablas si no está mejor: su valoración (desde su lado) no pasa de este
 * margen. Así no regala la victoria, pero tampoco se aferra a una posición perdida o igualada.
 */
export const DRAW_ACCEPT_CP = 40;

export const acceptsDraw = (botScore: number | null): boolean => botScore !== null && botScore <= DRAW_ACCEPT_CP;

/**
 * Cuánto «piensa» como mínimo antes de mover (ms). Da tiempo a que termine la animación de la jugada de
 * quien juega y hace que los rivales fuertes parezcan pensar más que los novatos.
 */
export function thinkTime(persona: Persona, random: () => number = Math.random): number {
  const base = 600 + persona.elo * 0.2;
  return Math.round(base * (0.85 + random() * 0.3));
}
