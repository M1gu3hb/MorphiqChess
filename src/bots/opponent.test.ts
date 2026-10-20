import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseFen, sanToMove, toFen, type Color } from '../engine';
import { createGame, GameStore, positionAt } from '../game';
import { UciEngine } from './engine';
import { BotOpponent, situationOf, type OpponentStatus } from './opponent';
import type { Persona } from './personas';
import { thinkTime } from './player';
import { createFakeEngine, MemoryStorage, type FakeAnswer, type FakeEngine, type FakeSearch } from './testing';

const PERSONA: Persona = {
  id: 'prueba',
  piece: 'n',
  color: 'w',
  name: 'Prueba',
  elo: 1500,
  tagline: 'Rival de prueba.',
  strength: { kind: 'elo', elo: 1500, movetime: 300 },
};

interface SetupOptions {
  readonly side: Color;
  readonly delayMs?: number;
  readonly answer?: (search: FakeSearch) => FakeAnswer;
  readonly startFen?: string;
  readonly factory?: () => never;
  /** Reloj simulado: tiempo (ms) que se considera transcurrido al terminar de pensar. */
  readonly elapsed?: number;
}

function setup(options: SetupOptions) {
  const fake = createFakeEngine({
    delayMs: options.delayMs ?? 0,
    ...(options.answer ? { answer: options.answer } : {}),
  });
  const engine = new UciEngine(options.factory ?? fake.factory);
  const storage = new MemoryStorage();
  const store = new GameStore(createGame(options.startFen), storage, 'prueba:partida');
  const statuses: string[] = [];
  const sleeps: number[] = [];
  let calls = 0;
  const opponent = new BotOpponent({
    store,
    engine,
    persona: PERSONA,
    side: options.side,
    onStatus: (status: OpponentStatus, error?: Error) => statuses.push(error ? `${status}:${error.message}` : status),
    random: () => 0.5,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    now: () => (calls++ === 0 ? 0 : (options.elapsed ?? 0)),
  });
  return { fake, engine, store, storage, statuses, sleeps, opponent };
}

function playSan(store: GameStore, san: string): void {
  const move = sanToMove(positionAt(store.getSnapshot()), san);
  if (!move) throw new Error(`jugada ilegal: ${san}`);
  store.play(move);
}

const plies = (store: GameStore): number => store.getSnapshot().plies.length;
const turnOf = (store: GameStore): Color => positionAt(store.getSnapshot()).turn;
const waitForPlies = (store: GameStore, count: number): Promise<void> =>
  vi.waitFor(() => expect(plies(store)).toBe(count), { interval: 1, timeout: 3000 });
const started = (fake: FakeEngine, count = 1): Promise<void> =>
  vi.waitFor(() => expect(fake.searches).toHaveLength(count), { interval: 1, timeout: 3000 });
const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const opponents: BotOpponent[] = [];
afterEach(() => {
  for (const opponent of opponents.splice(0)) opponent.stop();
});
const track = <T extends { opponent: BotOpponent }>(value: T): T => {
  opponents.push(value.opponent);
  return value;
};

describe('el rival juega cuando le toca', () => {
  it('responde a la jugada de la persona', async () => {
    const t = track(setup({ side: 'b' }));
    t.opponent.start();
    expect(t.statuses).toEqual([]);
    expect(t.fake.stats.created).toBe(0);

    playSan(t.store, 'e4');
    await waitForPlies(t.store, 2);
    expect(turnOf(t.store)).toBe('w');
    expect(t.statuses).toEqual(['loading', 'thinking', 'idle']);
    expect(t.fake.searches[0]!.moves).toEqual(['e2e4']);
    expect(t.sleeps).toEqual([thinkTime(PERSONA, () => 0.5)]);

    // La siguiente vez el motor ya está listo: no vuelve a decir «cargando».
    playSan(t.store, 'd4');
    await waitForPlies(t.store, 4);
    expect(t.statuses).toEqual(['loading', 'thinking', 'idle', 'thinking', 'idle']);
  });

  it('abre la partida si le toca mover primero', async () => {
    const t = track(setup({ side: 'w' }));
    t.opponent.start();
    await waitForPlies(t.store, 1);
    expect(t.store.getSnapshot().plies[0]!.move.color).toBe('w');
    expect(turnOf(t.store)).toBe('b');
  });

  it('juega la jugada que elige el motor', async () => {
    const t = track(setup({ side: 'b', answer: () => ({ bestmove: 'c7c5', lines: [] }) }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await waitForPlies(t.store, 2);
    expect(t.store.getSnapshot().plies[1]!.san).toBe('c5');
  });

  it('no muestra su jugada antes de «pensar» el tiempo mínimo', async () => {
    const t = track(setup({ side: 'b', elapsed: 0 }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await waitForPlies(t.store, 2);
    expect(t.sleeps).toHaveLength(1);
    expect(t.sleeps[0]).toBeGreaterThan(500);
  });

  it('si ya pensó de sobra, no espera más', async () => {
    const t = track(setup({ side: 'b', elapsed: 10_000 }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await waitForPlies(t.store, 2);
    expect(t.sleeps).toEqual([]);
  });

  it('con una sola jugada legal la juega sin consultar al motor', async () => {
    const t = track(setup({ side: 'b', startFen: 'k7/8/1K6/8/8/8/8/7R b - - 0 1' }));
    t.opponent.start();
    await waitForPlies(t.store, 1);
    expect(t.fake.searches).toHaveLength(0);
    expect(t.store.getSnapshot().plies[0]!.san).toBe('Kb8');
  });

  it('parte del FEN si la partida no empezó en la posición de siempre', async () => {
    const fen = 'k7/8/1K6/8/8/8/8/7R w - - 0 1';
    const t = track(setup({ side: 'w', startFen: fen }));
    t.opponent.start();
    await waitForPlies(t.store, 1);
    expect(toFen(t.fake.searches[0]!.position)).toBe(toFen(parseFen(fen)));
  });

  it('aunque el motor diga algo ilegal, la partida sigue con una jugada legal', async () => {
    const t = track(setup({ side: 'w', answer: () => ({ bestmove: 'a1a8', lines: [] }) }));
    t.opponent.start();
    await waitForPlies(t.store, 1);
    expect(t.statuses.at(-1)).toBe('idle');
  });

  it('juega la partida entera contra otro jugador sin atascarse', async () => {
    const t = track(setup({ side: 'b' }));
    t.opponent.start();
    const script = ['e4', 'Nf3', 'Nc3', 'd3', 'h3', 'a3'];
    // La respuesta del motor falso es siempre su primera jugada legal: da igual cuál, mientras sea legal.
    for (const [index, san] of script.entries()) {
      if (turnOf(t.store) !== 'w') await vi.waitFor(() => expect(turnOf(t.store)).toBe('w'), { interval: 1 });
      const move = sanToMove(positionAt(t.store.getSnapshot()), san);
      if (!move) break;
      t.store.play(move);
      await waitForPlies(t.store, (index + 1) * 2);
    }
    expect(plies(t.store)).toBeGreaterThanOrEqual(8);
    expect(t.statuses).not.toContain('error');
  });
});

describe('el rival no juega cuando no debe', () => {
  it('mientras se revisa el historial, deja de pensar y descarta lo que pensaba', async () => {
    const t = track(setup({ side: 'b', delayMs: 40 }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await started(t.fake);
    t.store.back();
    await pause(90);
    expect(plies(t.store)).toBe(1);
    expect(t.statuses.at(-1)).toBe('idle');
    expect(t.fake.received).toContain('stop');

    // Al volver a la última jugada, retoma su turno.
    t.store.forward();
    await waitForPlies(t.store, 2);
  });

  it('si la persona deshace su jugada mientras piensa, la jugada pensada se descarta', async () => {
    const t = track(setup({ side: 'b', delayMs: 40 }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await started(t.fake);
    t.store.undo();
    await pause(90);
    expect(plies(t.store)).toBe(0);
    expect(turnOf(t.store)).toBe('w');
  });

  it('si empieza otra partida mientras piensa, no mueve en la nueva y avisa al motor', async () => {
    const t = track(setup({ side: 'w', delayMs: 40 }));
    t.opponent.start();
    await started(t.fake);
    const firstGame = t.store.getSnapshot().gameId;
    t.store.newGame();
    expect(t.store.getSnapshot().gameId).not.toBe(firstGame);
    await waitForPlies(t.store, 1);
    expect(t.fake.searches).toHaveLength(2);
    expect(t.fake.received).toContain('ucinewgame');
    // Solo mueve una vez en la partida nueva, no dos.
    await pause(80);
    expect(plies(t.store)).toBe(1);
  });

  it('con la partida terminada no piensa', async () => {
    const mated = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
    const t = track(setup({ side: 'w', startFen: mated }));
    expect(t.store.getSnapshot().outcome?.type).toBe('checkmate');
    t.opponent.start();
    await pause(30);
    expect(t.fake.stats.created).toBe(0);
    expect(plies(t.store)).toBe(0);
  });

  it('si la persona se rinde mientras piensa, no mueve', async () => {
    const t = track(setup({ side: 'b', delayMs: 40 }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await started(t.fake);
    t.store.resign('b');
    await pause(90);
    expect(plies(t.store)).toBe(1);
    expect(t.store.getSnapshot().outcome?.type).toBe('resignation');
  });

  it('al detenerlo deja de jugar', async () => {
    const t = track(setup({ side: 'b' }));
    t.opponent.start();
    t.opponent.stop();
    playSan(t.store, 'e4');
    await pause(40);
    expect(plies(t.store)).toBe(1);
    expect(t.fake.stats.created).toBe(0);
  });

  it('al detenerlo mientras piensa, cancela y no mueve', async () => {
    const t = track(setup({ side: 'b', delayMs: 40 }));
    t.opponent.start();
    playSan(t.store, 'e4');
    await started(t.fake);
    t.opponent.stop();
    await pause(90);
    expect(plies(t.store)).toBe(1);
    expect(t.statuses.at(-1)).toBe('idle');
  });

  it('puede reanudarse tras detenerlo, y empezar dos veces no duplica nada', async () => {
    const t = track(setup({ side: 'b', delayMs: 10 }));
    t.opponent.start();
    t.opponent.start();
    playSan(t.store, 'e4');
    await waitForPlies(t.store, 2);
    expect(t.fake.searches).toHaveLength(1);
    t.opponent.stop();
    playSan(t.store, 'd4');
    await pause(40);
    expect(plies(t.store)).toBe(3);
    t.opponent.start();
    await waitForPlies(t.store, 4);
  });
});

describe('cuando el motor falla', () => {
  it('avisa y no toca la partida', async () => {
    const t = track(setup({ side: 'w', delayMs: 10_000 }));
    t.opponent.start();
    await started(t.fake);
    t.fake.crash('motor caído');
    await vi.waitFor(() => expect(t.statuses.at(-1)).toBe('error:motor caído'), { interval: 1 });
    expect(plies(t.store)).toBe(0);
    // Con el motor caído no insiste: la interfaz decide si reintenta con otro motor.
    t.store.newGame();
    await pause(20);
    expect(t.fake.searches).toHaveLength(1);
  });

  it('si el motor ni siquiera arranca, lo dice', async () => {
    const t = track(
      setup({
        side: 'w',
        factory: () => {
          throw new Error('sin Worker');
        },
      }),
    );
    t.opponent.start();
    await vi.waitFor(() => expect(t.statuses.at(-1)).toBe('error:sin Worker'), { interval: 1 });
    expect(t.statuses[0]).toBe('loading');
    expect(plies(t.store)).toBe(0);
  });
});

describe('situationOf', () => {
  it('en la posición de siempre no manda FEN y cuenta las jugadas en UCI', () => {
    const store = new GameStore(createGame(), null);
    playSan(store, 'e4');
    playSan(store, 'e5');
    playSan(store, 'Nf3');
    const current = situationOf(store.getSnapshot());
    expect(current.startFen).toBeNull();
    expect(current.moves).toEqual(['e2e4', 'e7e5', 'g1f3']);
    expect(current.legal.length).toBeGreaterThan(0);
  });

  it('el enroque y la promoción se escriben como las espera el motor', () => {
    const store = new GameStore(createGame('r3k2r/P7/8/8/8/8/8/R3K2R w KQkq - 0 1'), null);
    playSan(store, 'O-O');
    playSan(store, 'O-O-O');
    playSan(store, 'a8=Q+');
    expect(situationOf(store.getSnapshot()).moves).toEqual(['e1g1', 'e8c8', 'a7a8q']);
  });

  it('con otra posición de salida manda su FEN', () => {
    const fen = 'k7/8/1K6/8/8/8/8/7R b - - 0 1';
    const current = situationOf(new GameStore(createGame(fen), null).getSnapshot());
    expect(current.startFen).toBe(fen);
    expect(current.legal).toHaveLength(1);
  });

  it('sigue la posición que se está viendo, no la última', () => {
    const store = new GameStore(createGame(), null);
    playSan(store, 'e4');
    playSan(store, 'e5');
    store.back();
    expect(situationOf(store.getSnapshot()).legal.length).toBeGreaterThan(0);
  });
});
