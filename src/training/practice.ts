import { applyMove, moveToSan, sanToMove, type Move, type Position } from '../engine';
import { createGame, isAtEnd, legalMovesOf, playMove, positionAt, type GameSnapshot } from '../game';
import { fenKey, normalizeSan, positionKey, type OpeningGraph } from './graph';
import { MAX_BOX, type CardState } from './progress';

/* ---------- jugadas ---------- */

/** SAN normalizado de una jugada en su posición. */
export const sanOf = (position: Position, move: Move): string => normalizeSan(moveToSan(position, move));

/** La jugada de esa posición que se escribe `san` (o null si no es legal). */
export const moveFromSan = (position: Position, san: string): Move | null => sanToMove(position, san);

/** ¿La jugada hecha es una de las aceptadas? */
export const isAccepted = (position: Position, move: Move, accepted: readonly string[]): boolean =>
  accepted.includes(sanOf(position, move));

/** Casillas de origen y destino de la primera jugada aceptada (para la pista). */
export function hintSquares(position: Position, accepted: readonly string[]): { from: number; to: number } | null {
  for (const san of accepted) {
    const move = moveFromSan(position, san);
    if (move) return { from: move.from, to: move.to };
  }
  return null;
}

/**
 * Lleva la partida hasta `fen`. Si esa posición se alcanza con una sola jugada desde la actual (la
 * respuesta del rival, típicamente) la juega, para que se vea la animación; si no, empieza de nuevo.
 */
export function advanceTo(game: GameSnapshot, fen: string): GameSnapshot {
  const want = fenKey(fen);
  if (isAtEnd(game)) {
    const position = positionAt(game);
    if (positionKey(position) === want) return game;
    for (const move of legalMovesOf(position)) {
      if (positionKey(applyMove(position, move)) === want) {
        const played = playMove(game, move);
        if (played !== game) return played;
      }
    }
  }
  return createGame(fen);
}

/* ---------- qué responde el rival ---------- */

/** Cuánto «urge» repasar una tarjeta: las nuevas y las falladas primero, las dominadas casi nunca. */
export function cardPriority(card: CardState | undefined, now: number): number {
  if (!card || card.box === 0) return 3;
  if (now >= card.due) return 2;
  return card.box < MAX_BOX ? 1 : 0.25;
}

export interface Choice {
  readonly san: string;
  readonly weight: number;
}

/**
 * Respuestas posibles del rival en una posición, con un peso mayor para las ramas donde quedan más
 * tarjetas por afianzar: así la práctica insiste donde la persona más lo necesita.
 */
export function replyChoices(
  graph: OpeningGraph,
  key: string,
  cards: Readonly<Record<string, CardState>>,
  now: number,
): Choice[] {
  const node = graph.nodes.get(key);
  if (!node) return [];
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const score = (at: string): number => {
    const known = memo.get(at);
    if (known !== undefined) return known;
    if (visiting.has(at)) return 0;
    visiting.add(at);
    const current = graph.nodes.get(at);
    let total = 0;
    if (current) {
      if (current.turn === graph.userSide && current.next.size > 0) total += cardPriority(cards[at], now);
      for (const child of current.next.values()) total += score(child);
    }
    visiting.delete(at);
    memo.set(at, total);
    return total;
  };
  return [...node.next].map(([san, child]) => ({ san, weight: 1 + score(child) }));
}

/** Elige al azar según los pesos. `random` devuelve un número en [0, 1). */
export function pickWeighted(choices: readonly Choice[], random: () => number): Choice | undefined {
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let roll = random() * total;
  for (const choice of choices) {
    roll -= choice.weight;
    if (roll < 0) return choice;
  }
  return choices[choices.length - 1];
}
