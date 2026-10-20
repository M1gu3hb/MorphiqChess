import { describe, expect, it } from 'vitest';
import { applyMove, generateLegalMoves, initialPosition, parseFen, toFen, type Position } from '../engine';
import { UciEngine } from './engine';
import type { Persona } from './personas';
import {
  acceptsDraw,
  answerDrawOffer,
  chooseMove,
  DRAW_ACCEPT_CP,
  evaluate,
  MIN_PLIES_FOR_DRAW,
  suggestMove,
  thinkTime,
  type Situation,
} from './player';
import { createFakeEngine, type FakeEngineOptions } from './testing';
import { findMoveByUci, moveToUci } from './uci';

const persona = (patch: Partial<Persona> = {}): Persona => ({
  id: 'prueba',
  piece: 'n',
  color: 'w',
  name: 'Prueba',
  elo: 1500,
  tagline: 'Rival de prueba.',
  strength: { kind: 'elo', elo: 1500, movetime: 300 },
  ...patch,
});

/** La situación tras jugar estas jugadas (UCI) desde la posición de salida o desde un FEN. */
function situation(moves: string[] = [], fen?: string): Situation {
  let position: Position = fen ? parseFen(fen) : initialPosition();
  for (const text of moves) {
    const move = findMoveByUci(generateLegalMoves(position), text);
    if (!move) throw new Error(`jugada ilegal: ${text}`);
    position = applyMove(position, move);
  }
  return { startFen: fen ?? null, moves, legal: generateLegalMoves(position) };
}

function engineWith(options?: FakeEngineOptions) {
  const fake = createFakeEngine(options);
  return { fake, engine: new UciEngine(fake.factory) };
}

describe('chooseMove', () => {
  it('con una sola jugada legal no piensa', async () => {
    const { fake, engine } = engineWith();
    const only = situation([], 'k7/8/1K6/8/8/8/8/7R b - - 0 1');
    expect(only.legal).toHaveLength(1);
    const move = await chooseMove(engine, persona(), only);
    expect(move).toBe(only.legal[0]);
    expect(fake.searches).toHaveLength(0);
    expect(fake.stats.created).toBe(0);
  });

  it('pide a Stockfish lo que dice la fuerza del rival y juega lo que este elige', async () => {
    const { fake, engine } = engineWith({ answer: () => ({ bestmove: 'd2d4', lines: [] }) });
    const move = await chooseMove(engine, persona(), situation());
    expect(moveToUci(move)).toBe('d2d4');
    expect(fake.received).toContain('setoption name UCI_LimitStrength value true');
    expect(fake.received).toContain('setoption name UCI_Elo value 1500');
    expect(fake.received).toContain('go movetime 300');
  });

  it('le cuenta la partida entera, desde el FEN si no empezó en la posición de siempre', async () => {
    const fen = '4k3/8/8/8/8/8/4P3/4K2R w K - 0 1';
    const { fake, engine } = engineWith();
    await chooseMove(engine, persona(), situation(['e2e4', 'e8d8'], fen));
    expect(fake.received).toContain(`position fen ${fen} moves e2e4 e8d8`);
    expect(fake.searches[0]!.moves).toEqual(['e2e4', 'e8d8']);
  });

  it('un rival de nivel bajo mira varias variantes y a veces se despista', async () => {
    const sampler = persona({ strength: { kind: 'sampler', depth: 2, lines: 5, temperature: 100, blunder: 0 } });
    const { fake, engine } = engineWith({
      answer: () => ({
        bestmove: 'e2e4',
        lines: [
          { move: 'e2e4', score: 30 },
          { move: 'd2d4', score: 25 },
        ],
      }),
    });
    const move = await chooseMove(engine, sampler, situation(), { random: () => 0.01 });
    expect(moveToUci(move)).toBe('e2e4');
    expect(fake.received).toContain('setoption name MultiPV value 5');
    expect(fake.received).toContain('go depth 2');
  });

  it('si el motor devuelve algo ilegal, igual juega una jugada legal', async () => {
    const { engine } = engineWith({ answer: () => ({ bestmove: 'a1a8', lines: [] }) });
    const current = situation();
    const move = await chooseMove(engine, persona(), current, { random: () => 0.3 });
    expect(current.legal).toContain(move);
  });

  it('se puede cancelar', async () => {
    const { engine } = engineWith();
    const controller = new AbortController();
    controller.abort();
    await expect(chooseMove(engine, persona(), situation(), { signal: controller.signal })).rejects.toMatchObject({
      kind: 'aborted',
    });
  });
});

describe('pista y evaluación', () => {
  it('la pista es la mejor jugada, sin límites de fuerza', async () => {
    const { fake, engine } = engineWith({ answer: () => ({ bestmove: 'g1f3', lines: [] }) });
    const current = situation();
    const hint = await suggestMove(engine, current);
    expect(hint && moveToUci(hint)).toBe('g1f3');
    expect(fake.received).toContain('setoption name UCI_LimitStrength value false');
  });

  it('sin jugada, o con una ilegal, no hay pista', async () => {
    expect(await suggestMove(engineWith({ answer: () => ({ bestmove: null, lines: [] }) }).engine, situation())).toBeNull();
    expect(await suggestMove(engineWith({ answer: () => ({ bestmove: 'a1a8', lines: [] }) }).engine, situation())).toBeNull();
  });

  it('la evaluación es la de la mejor variante', async () => {
    const { engine } = engineWith({
      answer: () => ({
        bestmove: 'e2e4',
        lines: [
          { move: 'e2e4', score: -85 },
          { move: 'd2d4', score: -90 },
        ],
      }),
    });
    expect(await evaluate(engine, situation())).toBe(-85);
  });

  it('sin variantes no hay evaluación', async () => {
    const { engine } = engineWith({ answer: () => ({ bestmove: 'e2e4', lines: [] }) });
    expect(await evaluate(engine, situation())).toBeNull();
  });
});

describe('tablas', () => {
  it('las acepta si no está mejor', () => {
    expect(acceptsDraw(-300)).toBe(true);
    expect(acceptsDraw(0)).toBe(true);
    expect(acceptsDraw(DRAW_ACCEPT_CP)).toBe(true);
  });

  it('las rechaza si está mejor, o si no sabe cómo está', () => {
    expect(acceptsDraw(DRAW_ACCEPT_CP + 1)).toBe(false);
    expect(acceptsDraw(250)).toBe(false);
    expect(acceptsDraw(null)).toBe(false);
  });
});

describe('oferta de tablas', () => {
  /** Una partida de `plies` jugadas (el caballo de g1 y el de b1 van y vienen) para pasar el umbral de «muy pronto». */
  const shuffle = (plies: number): string[] =>
    Array.from({ length: plies }, (_, i) => ['g1f3', 'g8f6', 'f3g1', 'f6g8'][i % 4]!);
  const scored = (score: number) => ({ answer: () => ({ bestmove: 'e2e4', lines: [{ move: 'e2e4', score }] }) });

  it('al principio de la partida es muy pronto y ni siquiera consulta al motor', async () => {
    const { fake, engine } = engineWith(scored(-500));
    const early = situation(shuffle(MIN_PLIES_FOR_DRAW - 1));
    expect(await answerDrawOffer(engine, early, 'b', 'w')).toBe('too-early');
    expect(fake.searches).toHaveLength(0);
  });

  it('las acepta si el rival no está mejor', async () => {
    const { engine } = engineWith(scored(-120));
    const current = situation(shuffle(MIN_PLIES_FOR_DRAW));
    // Le toca al rival (Azules) y su valoración es -120: va peor, acepta.
    expect(await answerDrawOffer(engine, current, 'b', 'b')).toBe('accept');
  });

  it('las rechaza si el rival está mejor', async () => {
    const { engine } = engineWith(scored(300));
    const current = situation(shuffle(MIN_PLIES_FOR_DRAW));
    expect(await answerDrawOffer(engine, current, 'b', 'b')).toBe('decline');
  });

  it('la valoración es de quien tiene el turno: si le toca a la persona, se invierte', async () => {
    const current = situation(shuffle(MIN_PLIES_FOR_DRAW));
    // Al turno está la persona (Blancas) y el motor le da +300: el rival (Azules) va peor y acepta.
    expect(await answerDrawOffer(engineWith(scored(300)).engine, current, 'b', 'w')).toBe('accept');
    // Y si el motor le da -300 a la persona, el rival está mejor y rechaza.
    expect(await answerDrawOffer(engineWith(scored(-300)).engine, current, 'b', 'w')).toBe('decline');
  });

  it('si no consigue valorar la posición, las rechaza', async () => {
    const { engine } = engineWith({ answer: () => ({ bestmove: 'e2e4', lines: [] }) });
    expect(await answerDrawOffer(engine, situation(shuffle(MIN_PLIES_FOR_DRAW)), 'b', 'b')).toBe('decline');
  });

  it('se puede cancelar', async () => {
    const { engine } = engineWith(scored(0));
    const controller = new AbortController();
    controller.abort();
    await expect(
      answerDrawOffer(engine, situation(shuffle(MIN_PLIES_FOR_DRAW)), 'b', 'b', controller.signal),
    ).rejects.toMatchObject({ kind: 'aborted' });
  });
});

describe('tiempo de pensar', () => {
  it('es mayor para los rivales fuertes y varía un poco', () => {
    const novice = persona({ elo: 400 });
    const master = persona({ elo: 3000 });
    expect(thinkTime(novice, () => 0.5)).toBe(680);
    expect(thinkTime(master, () => 0.5)).toBe(1200);
    expect(thinkTime(novice, () => 0)).toBe(578);
    expect(thinkTime(novice, () => 1)).toBe(782);
  });

  it('es razonable con cualquier azar', () => {
    for (const elo of [400, 1500, 3000]) {
      for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
        const ms = thinkTime(persona({ elo }), () => roll);
        expect(ms).toBeGreaterThanOrEqual(500);
        expect(ms).toBeLessThanOrEqual(1500);
      }
    }
  });
});

describe('situación auxiliar', () => {
  it('el FEN de prueba coincide con el que escribe el motor de reglas', () => {
    const fen = 'k7/8/1K6/8/8/8/8/7R b - - 0 1';
    expect(toFen(parseFen(fen))).toBe(fen);
  });
});
