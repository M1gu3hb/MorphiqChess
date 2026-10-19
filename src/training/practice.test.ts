import { describe, expect, it } from 'vitest';
import { parseFen } from '../engine';
import { createGame, playMove, positionAt } from '../game';
import { buildGraph, fenKey, positionKey } from './graph';
import {
  advanceTo,
  cardPriority,
  hintSquares,
  isAccepted,
  moveFromSan,
  pickWeighted,
  replyChoices,
  sanOf,
} from './practice';
import { DAY_MS, type CardState } from './progress';

const NOW = 1_700_000_000_000;
const card = (box: number, due = NOW + DAY_MS): CardState => ({ box, due, ok: 1, bad: 0, last: NOW });
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('jugadas', () => {
  const position = parseFen(START);

  it('compara el SAN sin «+» ni «#»', () => {
    const move = moveFromSan(position, 'e4')!;
    expect(sanOf(position, move)).toBe('e4');
    expect(isAccepted(position, move, ['d4', 'e4'])).toBe(true);
    expect(isAccepted(position, move, ['d4'])).toBe(false);
  });

  it('da las casillas de la pista', () => {
    expect(hintSquares(position, ['Nf3'])).toEqual({ from: 6, to: 21 });
    expect(hintSquares(position, ['Qh5'])).toBeNull();
  });
});

describe('advanceTo', () => {
  const afterE4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
  const afterE4E5 = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2';

  it('no hace nada si ya está en esa posición', () => {
    const game = playMove(createGame(), moveFromSan(parseFen(START), 'e4')!);
    expect(advanceTo(game, afterE4)).toBe(game);
  });

  it('juega la respuesta del rival cuando basta una jugada', () => {
    const game = playMove(createGame(), moveFromSan(parseFen(START), 'e4')!);
    const next = advanceTo(game, afterE4E5);
    expect(next.gameId).toBe(game.gameId);
    expect(next.plies.map((ply) => ply.san)).toEqual(['e4', 'e5']);
    expect(positionKey(positionAt(next))).toBe(fenKey(afterE4E5));
  });

  it('empieza de nuevo cuando la posición no se alcanza con una jugada', () => {
    const next = advanceTo(createGame(), afterE4E5);
    expect(next.plies).toHaveLength(0);
    expect(positionKey(positionAt(next))).toBe(fenKey(afterE4E5));
  });
});

describe('qué responde el rival', () => {
  // Negras (rival) eligen entre 1...e5 y 1...c5; la persona (Blancas) decide después de cada una.
  const graph = buildGraph([{ moves: 'e4 e5 Nf3' }, { moves: 'e4 c5 Nf3' }], 'w');
  const afterE4 = [...graph.nodes.values()].find((node) => node.turn === 'b')!.key;
  const children = (cards: Record<string, CardState>) => replyChoices(graph, afterE4, cards, NOW);

  it('pesa más la rama con tarjetas sin aprender', () => {
    const [afterE5, afterC5] = [...graph.nodes.get(afterE4)!.next.values()];
    const choices = children({ [afterE5!]: card(5), [afterC5!]: card(0, NOW) });
    const e5 = choices.find((c) => c.san === 'e5')!;
    const c5 = choices.find((c) => c.san === 'c5')!;
    expect(c5.weight).toBeGreaterThan(e5.weight);
  });

  it('prioridad: nuevas y falladas > vencidas > en curso > dominadas', () => {
    expect(cardPriority(undefined, NOW)).toBeGreaterThan(cardPriority(card(2, NOW - 1), NOW));
    expect(cardPriority(card(2, NOW - 1), NOW)).toBeGreaterThan(cardPriority(card(2), NOW));
    expect(cardPriority(card(2), NOW)).toBeGreaterThan(cardPriority(card(5), NOW));
  });

  it('elige según los pesos', () => {
    const choices = [
      { san: 'a', weight: 1 },
      { san: 'b', weight: 3 },
    ];
    expect(pickWeighted(choices, () => 0)?.san).toBe('a');
    expect(pickWeighted(choices, () => 0.3)?.san).toBe('b');
    expect(pickWeighted(choices, () => 0.999)?.san).toBe('b');
    expect(pickWeighted([], () => 0.5)).toBeUndefined();
  });
});
