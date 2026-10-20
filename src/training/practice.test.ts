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
  movesLine,
  pathTo,
  pickDrill,
  pickWeighted,
  planSetup,
  replay,
  replyChoices,
  sanOf,
  suggestMove,
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

describe('qué preguntar', () => {
  // Blancas: e4 → (e5 | c5) → Nf3; tras 1...e5 2.Nf3 hay una bifurcación (Nc6 | d6) y luego Bc4.
  const graph = buildGraph(
    [
      { moves: 'e4 e5 Nf3 Nc6 Bc4' },
      { moves: 'e4 e5 Nf3 d6 d4' },
      { moves: 'e4 c5 Nf3' },
    ],
    'w',
  );
  const keyAfter = (moves: string[]) => positionKey(replay(moves)!);
  const root = graph.root;
  const afterE4E5 = keyAfter(['e4', 'e5']);
  const afterNf3Nc6 = keyAfter(['e4', 'e5', 'Nf3', 'Nc6']);
  const first = () => 0; // siempre el primero

  it('el camino más corto parte de la posición inicial', () => {
    expect(pathTo(graph, root)).toEqual([]);
    expect(pathTo(graph, afterNf3Nc6)).toEqual(['e4', 'e5', 'Nf3', 'Nc6']);
    expect(pathTo(graph, 'no existe')).toBeNull();
  });

  it('con todo nuevo solo pregunta la primera tarjeta', () => {
    for (const roll of [0, 0.5, 0.99]) {
      expect(pickDrill(graph, {}, NOW, () => roll)).toEqual({ target: root, path: [] });
    }
  });

  it('desbloquea las siguientes al acertar las anteriores', () => {
    const cards = { [root]: card(1) };
    // Ahora toca la tarjeta tras 1.e4 e5 (la de 1...c5 también es de Blancas: Nf3).
    const targets = new Set([0, 0.4, 0.8, 0.99].map((roll) => pickDrill(graph, cards, NOW, () => roll)!.target));
    expect(targets).toEqual(new Set([afterE4E5, keyAfter(['e4', 'c5'])]));
    const drill = pickDrill(graph, cards, NOW, first)!;
    expect(drill.path).toEqual(pathTo(graph, drill.target));
  });

  it('una tarjeta fallada vuelve a bloquear las de después', () => {
    const failed: CardState = { box: 0, due: NOW, ok: 1, bad: 1, last: NOW };
    const cards = { [root]: card(3), [afterE4E5]: failed, [afterNf3Nc6]: card(2, NOW - 1) };
    // La vencida de Nc6 depende de la de e5, que está fallada: se vuelve a preguntar primero la fallada.
    for (const roll of [0, 0.3, 0.6, 0.99]) {
      const target = pickDrill(graph, cards, NOW, () => roll)!.target;
      expect(target).not.toBe(afterNf3Nc6);
    }
  });

  it('con todo al día repasa lo aprendido, más lo que está en curso que lo dominado', () => {
    const cards: Record<string, CardState> = {};
    for (const key of graph.cards) cards[key] = card(5);
    cards[afterE4E5] = card(2);
    const counts = new Map<string, number>();
    for (let i = 0; i < 400; i++) {
      const target = pickDrill(graph, cards, NOW, () => (i + 0.5) / 400)!.target;
      counts.set(target, (counts.get(target) ?? 0) + 1);
    }
    const inProgress = counts.get(afterE4E5) ?? 0;
    const mastered = counts.get(root) ?? 0;
    expect(inProgress).toBeGreaterThan(mastered * 2);
    expect(mastered).toBeGreaterThan(0);
  });

  it('sugiere la jugada de la rama que más falta', () => {
    const afterNf3 = keyAfter(['e4', 'e5', 'Nf3']);
    const afterNf3d6 = keyAfter(['e4', 'e5', 'Nf3', 'd6']);
    const cards = { [afterNf3Nc6]: card(5), [afterNf3d6]: { box: 0, due: NOW, ok: 0, bad: 1, last: NOW } };
    expect(suggestMove(graph, afterNf3, cards, NOW)).toBe('d6');
    expect(suggestMove(graph, 'no existe', cards, NOW)).toBeNull();
  });

  it('juega el camino a la vista y salta lo que es muy largo', () => {
    const path = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6'];
    expect(planSetup(path.slice(0, 4))).toEqual({ fen: undefined, moves: path.slice(0, 4) });
    const plan = planSetup(path, 3);
    expect(plan.moves).toEqual(path.slice(5));
    expect(fenKey(plan.fen!)).toBe(positionKey(replay(path.slice(0, 5))!));
    expect(replay(['e4', 'e9'])).toBeNull();
  });
});

describe('movesLine', () => {
  const play = (game: ReturnType<typeof createGame>, sans: string[]) =>
    sans.reduce((current, san) => playMove(current, moveFromSan(positionAt(current), san)!), game);
  const same = (san: string) => san;

  it('numera las jugadas', () => {
    expect(movesLine(play(createGame(), ['e4', 'e5', 'Nf3']), same)).toBe('1.e4 e5 2.Nf3');
    expect(movesLine(createGame(), same)).toBe('');
  });

  it('empieza con puntos suspensivos si el turno es de Azules', () => {
    const black = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    expect(movesLine(play(createGame(black), ['e5', 'Nf3']), same)).toBe('… 1...e5 2.Nf3');
  });

  it('avisa si se saltó parte del camino o hay más jugadas de las que caben', () => {
    const later = 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3';
    expect(movesLine(play(createGame(later), ['Bc4']), same)).toBe('… 3.Bc4');
    const long = play(createGame(), ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
    expect(movesLine(long, same, 3)).toBe('… Nc6 3.Bc4 Bc5');
  });

  it('conserva el jaque y el mate de cada jugada', () => {
    const mate = play(createGame(), ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7']);
    expect(movesLine(mate, same, 2)).toBe('… Nf6 4.Qxf7#');
  });

  it('traduce cada jugada con la función dada', () => {
    expect(movesLine(play(createGame(), ['e4', 'e5', 'Nf3']), (san) => san.replace('N', 'C'))).toBe('1.e4 e5 2.Cf3');
  });
});
