import { describe, expect, it } from 'vitest';
import { fitRatings, parseDuels, type Duel } from './fit';

const expectedScore = (a: number, b: number): number => 1 / (1 + 10 ** ((b - a) / 400));
const duel = (a: string, b: string, trueA: number, trueB: number, games = 1000): Duel => ({ a, b, games, score: expectedScore(trueA, trueB) });
const eloOf = (ratings: ReturnType<typeof fitRatings>, name: string): number => ratings.find((rating) => rating.name === name)?.elo ?? NaN;

describe('ajuste de Elo', () => {
  it('recupera los Elo de los que se enfrentaron, respecto del ancla', () => {
    const truth = { peon: 400, caballo: 800, alfil: 1200, torre: 1600 };
    const duels = [
      duel('peon', 'caballo', truth.peon, truth.caballo),
      duel('caballo', 'alfil', truth.caballo, truth.alfil),
      duel('alfil', 'torre', truth.alfil, truth.torre),
      duel('peon', 'alfil', truth.peon, truth.alfil),
    ];
    const ratings = fitRatings(duels, { name: 'alfil', elo: 1200 });
    for (const [name, elo] of Object.entries(truth)) expect(eloOf(ratings, name)).toBeCloseTo(elo, 0);
  });

  it('enlaza por cadenas a los que nunca se enfrentaron', () => {
    const ratings = fitRatings([duel('a', 'b', 500, 900), duel('b', 'c', 900, 1500)], { name: 'a', elo: 500 });
    expect(eloOf(ratings, 'c')).toBeCloseTo(1500, 0);
  });

  it('sale ordenado de menor a mayor y con el ancla fija', () => {
    const ratings = fitRatings([duel('x', 'y', 1000, 700), duel('y', 'z', 700, 300)], { name: 'y', elo: 1320 });
    expect(ratings.map((rating) => rating.name)).toEqual(['z', 'y', 'x']);
    expect(eloOf(ratings, 'y')).toBe(1320);
  });

  it('una paliza no manda el Elo al infinito', () => {
    const ratings = fitRatings([{ a: 'fuerte', b: 'debil', games: 40, score: 1 }], { name: 'debil', elo: 400 });
    const strong = eloOf(ratings, 'fuerte');
    expect(Number.isFinite(strong)).toBe(true);
    expect(strong).toBeGreaterThan(400 + 500);
    expect(strong).toBeLessThan(400 + 1500);
  });

  it('el margen baja con más partidas', () => {
    const few = fitRatings([duel('a', 'b', 600, 800, 20)], { name: 'a', elo: 600 });
    const many = fitRatings([duel('a', 'b', 600, 800, 400)], { name: 'a', elo: 600 });
    const marginOf = (ratings: typeof few): number => ratings.find((rating) => rating.name === 'b')?.margin ?? NaN;
    expect(marginOf(many)).toBeLessThan(marginOf(few));
  });

  it('pide que el ancla haya jugado', () => {
    expect(() => fitRatings([duel('a', 'b', 1, 2)], { name: 'c', elo: 1000 })).toThrow(/ancla/);
  });
});

describe('lectura de resultados', () => {
  it('toma las líneas de resultado y se salta el resto', () => {
    const text = [
      '5/100 partidas',
      '{"a":"persona:peon-azul","b":"elo:1320","games":100,"wins":20,"draws":10,"losses":70,"score":0.25,"elo":-191}',
      '',
      '{"nota":"no es un resultado"}',
      '{"a":"x","b":"y","games":40,"score":0.5}',
    ].join('\n');
    expect(parseDuels(text)).toEqual([
      { a: 'persona:peon-azul', b: 'elo:1320', games: 100, score: 0.25 },
      { a: 'x', b: 'y', games: 40, score: 0.5 },
    ]);
  });
});
