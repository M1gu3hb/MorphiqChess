import { applyMove, initialPosition, moveToSan, sanToMove, toFen, type Move, type Position } from '../engine';
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

/** Las últimas jugadas de la partida con su numeración: «… 3.Ac4 Ac5 4.c3». `display` traduce cada jugada. */
export function movesLine(game: GameSnapshot, display: (san: string) => string, limit = 8): string {
  let number = game.start.fullmove;
  let turn = game.start.turn;
  const parts = game.plies.map((ply, index) => {
    const san = display(ply.san);
    let text = san;
    if (turn === 'w') text = `${number}.${san}`;
    else if (index === 0) text = `${number}...${san}`;
    if (turn === 'b') number++;
    turn = turn === 'w' ? 'b' : 'w';
    return text;
  });
  const shown = parts.slice(-limit);
  // Si no se ven todas las jugadas (se saltó parte del camino o hay más del límite), se avisa con «…».
  const hidden = parts.length > shown.length || game.start.fullmove > 1 || game.start.turn === 'b';
  return `${hidden && shown.length > 0 ? '… ' : ''}${shown.join(' ')}`;
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
export function pickWeighted<T extends { readonly weight: number }>(choices: readonly T[], random: () => number): T | undefined {
  const total = choices.reduce((sum, choice) => sum + choice.weight, 0);
  let roll = random() * total;
  for (const choice of choices) {
    roll -= choice.weight;
    if (roll < 0) return choice;
  }
  return choices[choices.length - 1];
}

/** La jugada que conviene sugerir: de las aceptadas, la de la rama que más falta afianzar. */
export function suggestMove(
  graph: OpeningGraph,
  key: string,
  cards: Readonly<Record<string, CardState>>,
  now: number,
): string | null {
  let best: Choice | null = null;
  for (const choice of replyChoices(graph, key, cards, now)) {
    if (!best || choice.weight > best.weight) best = choice;
  }
  return best?.san ?? null;
}

/* ---------- qué preguntar ---------- */

interface Step {
  readonly parent: string | null;
  readonly san: string | null;
}

/** Caminos más cortos desde la posición inicial: de cada posición, la anterior y la jugada que llegó a ella. */
function shortestPaths(graph: OpeningGraph): Map<string, Step> {
  const tree = new Map<string, Step>([[graph.root, { parent: null, san: null }]]);
  const queue = [graph.root];
  for (let head = 0; head < queue.length; head++) {
    const key = queue[head]!;
    for (const [san, child] of graph.nodes.get(key)?.next ?? []) {
      if (tree.has(child)) continue;
      tree.set(child, { parent: key, san });
      queue.push(child);
    }
  }
  return tree;
}

function pathFrom(tree: ReadonlyMap<string, Step>, target: string): string[] | null {
  if (!tree.has(target)) return null;
  const path: string[] = [];
  let at: string | null = target;
  while (at !== null) {
    const step: Step = tree.get(at)!;
    if (step.san !== null) path.push(step.san);
    at = step.parent;
  }
  return path.reverse();
}

/** Jugadas (SAN) del camino más corto desde la posición inicial hasta una posición del grafo. */
export const pathTo = (graph: OpeningGraph, target: string): string[] | null => pathFrom(shortestPaths(graph), target);

/** Prioridad mínima de una tarjeta para que valga la pena preguntarla ya: nueva, fallada o vencida. */
export const NEEDY_PRIORITY = 2;

export interface Drill {
  /** Posición en la que se pregunta. */
  readonly target: string;
  /** Jugadas (SAN) desde la posición inicial hasta ella. */
  readonly path: readonly string[];
}

/**
 * Elige la próxima tarjeta a preguntar: una nueva, fallada o vencida, al azar según su prioridad.
 * Una tarjeta nueva solo se pregunta cuando ya se acertaron las que vienen antes en su camino, así
 * se aprende cada apertura en orden y nadie se topa de golpe con una posición a 15 jugadas de la salida.
 * Si no hay nada pendiente, repasa al azar lo ya aprendido (lo que está en curso más que lo dominado).
 */
export function pickDrill(
  graph: OpeningGraph,
  cards: Readonly<Record<string, CardState>>,
  now: number,
  random: () => number,
): Drill | null {
  const tree = shortestPaths(graph);
  const learned = (key: string) => (cards[key]?.box ?? 0) > 0;
  const unlocked = (key: string): boolean => {
    for (let at = tree.get(key)?.parent ?? null; at !== null; at = tree.get(at)?.parent ?? null) {
      const node = graph.nodes.get(at);
      if (node && node.turn === graph.userSide && node.next.size > 0 && !learned(at)) return false;
    }
    return true;
  };

  const reachable = graph.cards
    .filter((key) => tree.has(key))
    .map((key) => ({ key, weight: cardPriority(cards[key], now) }));
  const needy = reachable.filter((entry) => entry.weight >= NEEDY_PRIORITY && unlocked(entry.key));
  const chosen = pickWeighted(needy.length > 0 ? needy : reachable, random);
  if (!chosen) return null;
  return { target: chosen.key, path: pathFrom(tree, chosen.key)! };
}

/** Posición tras jugar `moves` desde `start`; null si alguna jugada no es legal. */
export function replay(moves: readonly string[], start: Position = initialPosition()): Position | null {
  let position = start;
  for (const san of moves) {
    const move = sanToMove(position, san);
    if (!move) return null;
    position = applyMove(position, move);
  }
  return position;
}

/** Cuántas jugadas del camino se ven animadas; las anteriores se saltan de golpe. */
export const SETUP_PLIES = 6;

export interface SetupPlan {
  /** FEN desde el que empieza la animación (sin definir = posición inicial). */
  readonly fen: string | undefined;
  /** Jugadas (SAN) que se juegan a la vista antes de preguntar. */
  readonly moves: readonly string[];
}

/** Un camino largo no se anima entero: se salta a unas pocas jugadas antes de la pregunta. */
export function planSetup(path: readonly string[], animated: number = SETUP_PLIES): SetupPlan {
  const skip = Math.max(0, path.length - animated);
  if (skip === 0) return { fen: undefined, moves: path };
  const position = replay(path.slice(0, skip));
  return position ? { fen: toFen(position), moves: path.slice(skip) } : { fen: undefined, moves: path };
}
