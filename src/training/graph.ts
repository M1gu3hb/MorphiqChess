import { applyMove, initialPosition, moveToSan, sanToMove, toFen, type Color, type Position } from '../engine';

/**
 * Las variantes de una apertura forman un grafo de posiciones: cada nodo es una posición y cada
 * arista una jugada. Se identifica por la posición (no por el camino) para que las
 * transposiciones —llegar a lo mismo con otro orden de jugadas— compartan progreso.
 */

/** Clave de una posición: piezas, turno y enroques. La casilla de «al paso» y los contadores se ignoran. */
export const positionKey = (position: Position): string => toFen(position).split(' ').slice(0, 3).join(' ');

/** Lo mismo, a partir de un FEN escrito por otra persona o programa. */
export const fenKey = (fen: string): string => fen.trim().split(/\s+/).slice(0, 3).join(' ');

/** SAN sin «+», «#», «!» ni «?»: así se comparan las jugadas de distintas fuentes. */
export const normalizeSan = (san: string): string => san.replace(/[+#!?]/g, '');

export interface GraphNode {
  readonly key: string;
  readonly turn: Color;
  /** Jugada (SAN normalizado) → clave de la posición a la que lleva, en el orden en que aparecen las líneas. */
  readonly next: ReadonlyMap<string, string>;
  /** Índices de las líneas que terminan exactamente aquí. */
  readonly ends: readonly number[];
  /** Índices de todas las líneas que pasan por esta posición (las que aún son posibles al llegar aquí). */
  readonly through: readonly number[];
}

export interface OpeningGraph {
  readonly root: string;
  readonly nodes: ReadonlyMap<string, GraphNode>;
  /** Posiciones donde le toca mover a la persona y hay respuesta en alguna línea: una tarjeta cada una. */
  readonly cards: readonly string[];
  readonly userSide: Color;
}

interface MutableNode {
  key: string;
  turn: Color;
  next: Map<string, string>;
  ends: number[];
  through: number[];
}

/** Separa «e4 e5 Nf3» en jugadas. */
export const splitMoves = (moves: string): string[] => moves.split(/\s+/).filter(Boolean);

/**
 * Arma el grafo reproduciendo cada línea con el motor. Una jugada ilegal es un error de los datos
 * y se lanza con la línea y la jugada para encontrarla rápido.
 */
export function buildGraph(
  lines: readonly { readonly moves: string; readonly name?: string }[],
  userSide: Color,
  start: Position = initialPosition(),
): OpeningGraph {
  const nodes = new Map<string, MutableNode>();
  const nodeFor = (position: Position): MutableNode => {
    const key = positionKey(position);
    let node = nodes.get(key);
    if (!node) {
      node = { key, turn: position.turn, next: new Map(), ends: [], through: [] };
      nodes.set(key, node);
    }
    return node;
  };

  const root = nodeFor(start).key;
  lines.forEach((line, index) => {
    // Una línea pasa una sola vez por cada posición, aunque la repita.
    const visited = new Set<string>();
    const visit = (node: MutableNode) => {
      if (visited.has(node.key)) return;
      visited.add(node.key);
      node.through.push(index);
    };
    let position = start;
    visit(nodeFor(position));
    for (const token of splitMoves(line.moves)) {
      const move = sanToMove(position, token);
      if (!move) throw new Error(`Jugada ilegal «${token}» en la línea ${index + 1} (${line.name ?? line.moves})`);
      const san = normalizeSan(moveToSan(position, move));
      const from = nodeFor(position);
      const after = applyMove(position, move);
      const to = nodeFor(after);
      from.next.set(san, to.key);
      visit(to);
      position = after;
    }
    nodeFor(position).ends.push(index);
  });

  const cards: string[] = [];
  for (const node of nodes.values()) {
    if (node.turn === userSide && node.next.size > 0) cards.push(node.key);
  }
  return { root, nodes, cards, userSide };
}

/** Jugadas que la persona puede hacer en una posición (las que alguna línea contempla). */
export function acceptedMoves(graph: OpeningGraph, key: string): string[] {
  const node = graph.nodes.get(key);
  return node ? [...node.next.keys()] : [];
}
