import { describe, expect, it } from 'vitest';
import { generateLegalMoves, initialPosition, type Move } from '../engine';
import type { SearchResult } from './engine';
import { pickMove, planAnalysis, planSearch, VARIETY_PLIES, VARIETY_WINDOW_CP, type Strength } from './strength';
import { MATE_CP, moveToUci, type InfoLine } from './uci';

const legal = generateLegalMoves(initialPosition());

const line = (move: string, score: number, multipv: number): InfoLine => ({ depth: 6, multipv, score, mate: null, pv: [move] });

/** Una búsqueda con cuatro variantes: tres parecidas y una mala. */
const result: SearchResult = {
  bestmove: 'e2e4',
  lines: [line('e2e4', 30, 1), line('d2d4', 20, 2), line('g1f3', 10, 3), line('a2a3', -150, 4)],
};

/** Generador de azar repetible (mulberry32). */
function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sequence = (...values: number[]): (() => number) => {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)]!;
};

const uci = (move: Move): string => moveToUci(move);

describe('qué se le pide al motor', () => {
  it('el nivel bajo mira poco y varias variantes, sin límite de Elo', () => {
    const plan = planSearch({ kind: 'sampler', depth: 2, lines: 6, temperature: 100, blunder: 0 }, 0);
    expect(plan.go).toEqual({ depth: 2 });
    expect(plan.options).toMatchObject({ MultiPV: 6, UCI_LimitStrength: false });
  });

  it('el nivel medio usa la fuerza limitada de Stockfish', () => {
    const plan = planSearch({ kind: 'elo', elo: 1700, movetime: 500 }, 12);
    expect(plan.go).toEqual({ movetime: 500 });
    expect(plan.options).toMatchObject({ UCI_LimitStrength: true, UCI_Elo: 1700, MultiPV: 1 });
  });

  it('el nivel máximo varía solo al abrir y después juega lo mejor', () => {
    const max: Strength = { kind: 'max', movetime: 1500 };
    const opening = planSearch(max, 0);
    expect(opening.options).toMatchObject({ UCI_LimitStrength: false, MultiPV: 4 });
    expect(opening.go.movetime).toBeLessThanOrEqual(450);
    const later = planSearch(max, VARIETY_PLIES);
    expect(later.options).toMatchObject({ UCI_LimitStrength: false, MultiPV: 1 });
    expect(later.go).toEqual({ movetime: 1500 });
  });

  it('el análisis de pistas va sin límites', () => {
    const plan = planAnalysis(900);
    expect(plan.go).toEqual({ movetime: 900 });
    expect(plan.options).toMatchObject({ UCI_LimitStrength: false, MultiPV: 1 });
  });
});

describe('la jugada del nivel medio', () => {
  const strength: Strength = { kind: 'elo', elo: 1600, movetime: 400 };

  it('juega lo que el motor eligió', () => {
    expect(uci(pickMove(strength, result, legal, 10, () => 0.5))).toBe('e2e4');
  });

  it('si no hay bestmove, usa la primera variante legal', () => {
    expect(uci(pickMove(strength, { bestmove: null, lines: result.lines }, legal, 10, () => 0.5))).toBe('e2e4');
  });

  it('si el motor dice algo ilegal, no se rompe: juega alguna legal', () => {
    const bogus: SearchResult = { bestmove: 'a1a8', lines: [] };
    const move = pickMove(strength, bogus, legal, 10, () => 0);
    expect(legal).toContain(move);
  });

  it('sin jugadas legales avisa', () => {
    expect(() => pickMove(strength, result, [], 0)).toThrow();
  });
});

describe('la jugada del nivel bajo', () => {
  const careful: Strength = { kind: 'sampler', depth: 2, lines: 4, temperature: 1, blunder: 0 };

  it('con temperatura mínima y sin despistes juega la mejor', () => {
    for (const roll of [0, 0.3, 0.99]) {
      expect(uci(pickMove(careful, result, legal, 0, sequence(0.9, roll)))).toBe('e2e4');
    }
  });

  it('con despistes seguros juega una legal cualquiera', () => {
    const reckless: Strength = { ...careful, blunder: 1 };
    const move = pickMove(reckless, result, legal, 0, sequence(0, 0.55));
    expect(legal).toContain(move);
    // El segundo número decide cuál: 0.55 × 20 jugadas = la undécima.
    expect(move).toBe(legal[11]);
  });

  it('reparte la elección como un softmax sobre la pérdida', () => {
    const loose: Strength = { kind: 'sampler', depth: 2, lines: 4, temperature: 100, blunder: 0 };
    const random = seeded(7);
    const counts = new Map<string, number>();
    const draws = 20_000;
    for (let i = 0; i < draws; i++) {
      const move = uci(pickMove(loose, result, legal, 0, random));
      counts.set(move, (counts.get(move) ?? 0) + 1);
    }
    // Pesos exp(−pérdida/100): 1, 0.905, 0.819 y 0.165 → 34.6 %, 31.3 %, 28.3 % y 5.7 %.
    const share = (move: string) => (counts.get(move) ?? 0) / draws;
    expect(share('e2e4')).toBeCloseTo(0.346, 1);
    expect(share('d2d4')).toBeCloseTo(0.313, 1);
    expect(share('g1f3')).toBeCloseTo(0.283, 1);
    expect(share('a2a3')).toBeCloseTo(0.057, 1);
    expect(Math.abs(share('e2e4') - 0.346)).toBeLessThan(0.02);
    expect(Math.abs(share('a2a3') - 0.057)).toBeLessThan(0.02);
  });

  it('más temperatura, más variedad', () => {
    const entropyOf = (temperature: number): number => {
      const strength: Strength = { kind: 'sampler', depth: 1, lines: 4, temperature, blunder: 0 };
      const random = seeded(11);
      const top = (() => {
        let hits = 0;
        for (let i = 0; i < 4000; i++) if (uci(pickMove(strength, result, legal, 0, random)) === 'e2e4') hits++;
        return hits / 4000;
      })();
      return top;
    };
    expect(entropyOf(30)).toBeGreaterThan(entropyOf(400));
  });

  it('descarta variantes ilegales o repetidas', () => {
    const messy: SearchResult = {
      bestmove: 'e2e4',
      lines: [line('a1a8', 500, 1), line('e2e4', 30, 2), line('e2e4', 29, 3), line('d2d4', 20, 4)],
    };
    const strength: Strength = { kind: 'sampler', depth: 1, lines: 4, temperature: 1, blunder: 0 };
    expect(uci(pickMove(strength, messy, legal, 0, sequence(0.9, 0.5)))).toBe('e2e4');
  });

  it('un mate no aplasta por completo a las otras jugadas', () => {
    const mate: SearchResult = {
      bestmove: 'e2e4',
      lines: [
        { depth: 4, multipv: 1, score: MATE_CP - 3, mate: 3, pv: ['e2e4'] },
        { depth: 4, multipv: 2, score: 1400, mate: null, pv: ['d2d4'] },
      ],
    };
    const strength: Strength = { kind: 'sampler', depth: 1, lines: 2, temperature: 400, blunder: 0 };
    const picked = new Set<string>();
    const random = seeded(3);
    for (let i = 0; i < 400; i++) picked.add(uci(pickMove(strength, mate, legal, 0, random)));
    expect(picked.has('e2e4')).toBe(true);
  });

  it('sin variantes usa la mejor jugada conocida', () => {
    const strength: Strength = { kind: 'sampler', depth: 1, lines: 4, temperature: 100, blunder: 0 };
    expect(uci(pickMove(strength, { bestmove: 'g1f3', lines: [] }, legal, 0, sequence(0.9)))).toBe('g1f3');
    expect(legal).toContain(pickMove(strength, { bestmove: null, lines: [] }, legal, 0, sequence(0.9, 0.1)));
  });
});

describe('la jugada del nivel máximo', () => {
  const strength: Strength = { kind: 'max', movetime: 1000 };

  it('al abrir elige entre las jugadas casi iguales, nunca una mala', () => {
    const picked = new Set<string>();
    const random = seeded(5);
    for (let i = 0; i < 300; i++) picked.add(uci(pickMove(strength, result, legal, 0, random)));
    expect(picked).toEqual(new Set(['e2e4', 'd2d4', 'g1f3']));
    // La variante mala queda fuera de la ventana de equivalencia.
    expect(30 - -150).toBeGreaterThan(VARIETY_WINDOW_CP);
  });

  it('después de la apertura juega siempre la mejor', () => {
    const random = seeded(9);
    for (let i = 0; i < 50; i++) expect(uci(pickMove(strength, result, legal, VARIETY_PLIES, random))).toBe('e2e4');
  });

  it('con ventaja decisiva no varía', () => {
    const winning: SearchResult = {
      bestmove: 'e2e4',
      lines: [line('e2e4', 900, 1), line('d2d4', 895, 2)],
    };
    const random = seeded(2);
    for (let i = 0; i < 50; i++) expect(uci(pickMove(strength, winning, legal, 0, random))).toBe('e2e4');
  });
});
