import { afterEach, describe, expect, it, vi } from 'vitest';
import { EngineError, isAbort, UciEngine, type SearchRequest } from './engine';
import { createFakeEngine, type FakeEngine } from './testing';

/** Espera (sin dormirse entre comprobaciones) a que el motor haya recibido `count` órdenes `go`. */
const started = (fake: FakeEngine, count = 1): Promise<void> =>
  vi.waitFor(() => expect(fake.searches).toHaveLength(count), { interval: 1, timeout: 2000 });

const request = (moves: string[] = [], patch: Partial<SearchRequest> = {}): SearchRequest => ({
  startFen: null,
  moves,
  options: {},
  go: { depth: 1 },
  ...patch,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('arranque', () => {
  it('saluda con uci e isready, una sola vez', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    await engine.ready();
    await engine.ready();
    expect(fake.received).toEqual(['uci', 'isready']);
    expect(fake.stats.created).toBe(1);
    expect(engine.usable).toBe(true);
  });

  it('no abre nada hasta que hace falta', () => {
    const fake = createFakeEngine();
    new UciEngine(fake.factory);
    expect(fake.stats.created).toBe(0);
  });

  it('si el motor no contesta, falla por tiempo y no se reutiliza', async () => {
    vi.useFakeTimers();
    const fake = createFakeEngine({ mute: true });
    const engine = new UciEngine(fake.factory, { startMs: 1000, slackMs: 100, stopMs: 100 });
    const failure = engine.ready().catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1001);
    const error = await failure;
    expect(error).toBeInstanceOf(EngineError);
    expect(error).toMatchObject({ kind: 'timeout' });
    expect(engine.usable).toBe(false);
    expect(fake.stats.terminated).toBe(1);
    await expect(engine.search(request())).rejects.toMatchObject({ kind: 'timeout' });
    await expect(engine.ready()).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('si no se puede abrir el Worker, lo dice', async () => {
    const engine = new UciEngine(() => {
      throw new Error('sin Worker');
    });
    await expect(engine.ready()).rejects.toMatchObject({ kind: 'failed', message: 'sin Worker' });
    expect(engine.usable).toBe(false);
    await expect(engine.search(request())).rejects.toMatchObject({ kind: 'failed' });
  });
});

describe('búsqueda', () => {
  it('manda las opciones, la posición y el límite, y devuelve la jugada con sus variantes', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    const result = await engine.search(
      request(['e2e4'], { options: { MultiPV: 3, UCI_LimitStrength: false }, go: { depth: 6 } }),
    );
    expect(fake.received).toEqual([
      'uci',
      'isready',
      'setoption name MultiPV value 3',
      'setoption name UCI_LimitStrength value false',
      'position startpos moves e2e4',
      'go depth 6',
    ]);
    expect(result.bestmove).toMatch(/^[a-h][1-8][a-h][1-8]/);
    expect(result.lines.map((line) => line.multipv)).toEqual([1, 2, 3]);
  });

  it('solo reenvía las opciones que cambian', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    await engine.search(request([], { options: { MultiPV: 2, UCI_Elo: 1500 } }));
    fake.received.length = 0;
    await engine.search(request(['e2e4'], { options: { MultiPV: 2, UCI_Elo: 1600 } }));
    expect(fake.received.filter((line) => line.startsWith('setoption'))).toEqual(['setoption name UCI_Elo value 1600']);
    fake.received.length = 0;
    await engine.search(request(['e2e4', 'e7e5'], { options: { MultiPV: 2, UCI_Elo: 1600 } }));
    expect(fake.received.filter((line) => line.startsWith('setoption'))).toEqual([]);
  });

  it('parte de un FEN si no es la posición de siempre', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    await engine.search(
      request([], { startFen: '8/P6k/8/8/8/8/8/K7 w - - 0 1', go: { movetime: 50 } }),
    );
    expect(fake.received).toContain('position fen 8/P6k/8/8/8/8/8/K7 w - - 0 1');
    expect(fake.received).toContain('go movetime 50');
  });

  it('sin límite, no se queda pensando para siempre', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    await engine.search(request([], { go: {} }));
    expect(fake.received.at(-1)).toBe('go depth 8');
  });

  it('de cada variante se queda con la línea más profunda y descarta cotas y avisos', async () => {
    const fake = createFakeEngine({
      answer: () => ({
        bestmove: 'e7e5',
        lines: [],
        raw: [
          'info depth 1 multipv 1 score cp 10 pv e7e5',
          'info depth 2 multipv 1 score cp 25 pv e7e5 g1f3',
          'info depth 1 multipv 1 score cp -99 pv a7a6',
          'info depth 2 multipv 2 score cp 5 pv d7d5',
          'info string NNUE cargada',
          'info depth 3 multipv 1 score cp 40 lowerbound pv e7e5',
        ],
      }),
    });
    const engine = new UciEngine(fake.factory);
    const result = await engine.search(request(['e2e4'], { options: { MultiPV: 2 } }));
    expect(result.bestmove).toBe('e7e5');
    expect(result.lines).toEqual([
      { depth: 2, multipv: 1, score: 25, mate: null, pv: ['e7e5', 'g1f3'] },
      { depth: 2, multipv: 2, score: 5, mate: null, pv: ['d7d5'] },
    ]);
  });

  it('«bestmove (none)» llega como jugada nula', async () => {
    const fake = createFakeEngine({ answer: () => ({ bestmove: null, lines: [] }) });
    const engine = new UciEngine(fake.factory);
    const result = await engine.search(request());
    expect(result).toEqual({ bestmove: null, lines: [] });
  });

  it('las búsquedas se atienden en el orden en que llegan, una por una', async () => {
    const fake = createFakeEngine({ delayMs: 5 });
    const engine = new UciEngine(fake.factory);
    const order: string[] = [];
    const run = (name: string, moves: string[]) => engine.search(request(moves)).then(() => order.push(name));
    await Promise.all([run('a', []), run('b', ['e2e4']), run('c', ['e2e4', 'e7e5'])]);
    expect(order).toEqual(['a', 'b', 'c']);
    expect(fake.searches.map((search) => search.moves.length)).toEqual([0, 1, 2]);
    // Nunca hay dos `go` sin un `bestmove` entre medias.
    let open = 0;
    for (const entry of fake.log) {
      if (entry.startsWith('>go')) open++;
      if (entry.startsWith('<bestmove')) open--;
      expect(open).toBeLessThanOrEqual(1);
    }
  });
});

describe('cancelar', () => {
  it('una búsqueda que sigue en la cola se cancela sin molestar al motor', async () => {
    const fake = createFakeEngine({ delayMs: 20 });
    const engine = new UciEngine(fake.factory);
    const controller = new AbortController();
    const first = engine.search(request());
    const second = engine.search(request(['e2e4']), controller.signal);
    const failure = second.catch((error: unknown) => error);
    controller.abort();
    const error = await failure;
    expect(isAbort(error)).toBe(true);
    await first;
    expect(fake.searches).toHaveLength(1);
    expect(engine.usable).toBe(true);
  });

  it('una búsqueda en marcha se detiene y la siguiente espera su bestmove', async () => {
    const fake = createFakeEngine({
      delayMs: 100,
      stopDelayMs: 15,
      answer: (search) => ({ bestmove: search.moves.length === 0 ? 'a2a3' : 'h7h6', lines: [] }),
    });
    const engine = new UciEngine(fake.factory);
    const controller = new AbortController();
    const first = engine.search(request([]), controller.signal);
    const firstFailure = first.catch((error: unknown) => error);
    await started(fake);

    controller.abort();
    expect(isAbort(await firstFailure)).toBe(true);

    const second = await engine.search(request(['e2e4']));
    // La respuesta es la de la segunda posición, no la que el motor aún debía de la primera.
    expect(second.bestmove).toBe('h7h6');
    const log = fake.log;
    const stale = log.indexOf('<bestmove a2a3');
    const secondGo = log.lastIndexOf('>go depth 1');
    expect(stale).toBeGreaterThan(-1);
    expect(log.indexOf('>stop')).toBeGreaterThan(-1);
    expect(stale).toBeLessThan(secondGo);
  });

  it('con la señal ya cancelada ni siquiera abre el motor', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    const controller = new AbortController();
    controller.abort();
    await expect(engine.search(request(), controller.signal)).rejects.toMatchObject({ kind: 'aborted' });
    expect(fake.stats.created).toBe(0);
  });

  it('una búsqueda terminada ya no escucha a su señal', async () => {
    const fake = createFakeEngine();
    const engine = new UciEngine(fake.factory);
    const controller = new AbortController();
    await engine.search(request(), controller.signal);
    controller.abort();
    expect(fake.received).not.toContain('stop');
  });
});

describe('cuando algo sale mal', () => {
  it('si el Worker se cae a media búsqueda, la búsqueda falla y el motor no se reutiliza', async () => {
    const fake = createFakeEngine({ delayMs: 10_000 });
    const engine = new UciEngine(fake.factory);
    const failure = engine.search(request()).catch((error: unknown) => error);
    await started(fake);
    fake.crash('boom');
    expect(await failure).toMatchObject({ kind: 'failed', message: 'boom' });
    expect(engine.usable).toBe(false);
    expect(fake.stats.terminated).toBe(1);
    await expect(engine.search(request())).rejects.toMatchObject({ kind: 'failed' });
  });

  it('también avisa a las búsquedas que esperaban turno', async () => {
    const fake = createFakeEngine({ delayMs: 10_000 });
    const engine = new UciEngine(fake.factory);
    const first = engine.search(request()).catch((error: unknown) => error);
    const second = engine.search(request(['e2e4'])).catch((error: unknown) => error);
    await started(fake);
    fake.crash();
    expect(await first).toMatchObject({ kind: 'failed' });
    expect(await second).toMatchObject({ kind: 'failed' });
  });

  it('si una búsqueda se pasa de tiempo, la detiene y se queda con lo que el motor tenga', async () => {
    vi.useFakeTimers();
    const fake = createFakeEngine({ delayMs: 1_000_000 });
    const engine = new UciEngine(fake.factory, { startMs: 1000, slackMs: 50, stopMs: 100 });
    const search = engine.search(request([], { go: { movetime: 100 } }));
    await vi.advanceTimersByTimeAsync(0);
    expect(fake.searches).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(149);
    expect(fake.received).not.toContain('stop');
    await vi.advanceTimersByTimeAsync(2);
    expect(fake.received).toContain('stop');
    const result = await search;
    expect(result.bestmove).not.toBeNull();
    expect(engine.usable).toBe(true);
  });

  it('si ni siquiera obedece a `stop`, se da por caído', async () => {
    vi.useFakeTimers();
    const fake = createFakeEngine({ delayMs: 1_000_000, ignoreStop: true });
    const engine = new UciEngine(fake.factory, { startMs: 1000, slackMs: 50, stopMs: 100 });
    const failure = engine.search(request([], { go: { movetime: 100 } })).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(150 + 101);
    expect(await failure).toMatchObject({ kind: 'timeout' });
    expect(engine.usable).toBe(false);
    expect(fake.stats.terminated).toBe(1);
  });

  it('al cerrarlo, lo pendiente se cancela y el motor se apaga', async () => {
    const fake = createFakeEngine({ delayMs: 10_000 });
    const engine = new UciEngine(fake.factory);
    const failure = engine.search(request()).catch((error: unknown) => error);
    await started(fake);
    engine.dispose();
    expect(await failure).toMatchObject({ kind: 'disposed' });
    expect(fake.stats.terminated).toBe(1);
    expect(engine.usable).toBe(false);
    await expect(engine.ready()).rejects.toMatchObject({ kind: 'disposed' });
    await expect(engine.search(request())).rejects.toMatchObject({ kind: 'disposed' });
    engine.dispose();
    expect(fake.stats.terminated).toBe(1);
  });
});

describe('partida nueva', () => {
  it('manda ucinewgame solo con el motor libre', async () => {
    const fake = createFakeEngine({ delayMs: 200 });
    const engine = new UciEngine(fake.factory);
    engine.newGame();
    expect(fake.received).toEqual([]);
    await engine.ready();
    engine.newGame();
    expect(fake.received.filter((line) => line === 'ucinewgame')).toHaveLength(1);

    const search = engine.search(request());
    await started(fake);
    engine.newGame();
    expect(fake.received.filter((line) => line === 'ucinewgame')).toHaveLength(1);
    await search;
  });
});

describe('precarga del motor', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  // La precarga recuerda si ya se hizo: cada prueba necesita el módulo «limpio».
  const fresh = () => import('./engine');

  it('pide el programa y su .wasm, una sola vez', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('')));
    vi.stubGlobal('fetch', fetchMock);
    const { prefetchEngine, ENGINE_URL } = await fresh();
    prefetchEngine();
    prefetchEngine();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => (call as unknown[])[0])).toEqual([
      ENGINE_URL,
      ENGINE_URL.replace(/\.js$/, '.wasm'),
    ]);
  });

  it('con el ahorro de datos activado no descarga nada por adelantado', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('')));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('navigator', { connection: { saveData: true } });
    const { prefetchEngine } = await fresh();
    prefetchEngine();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si la petición falla no pasa nada: se descargará al arrancar el motor', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new TypeError('sin conexión')));
    vi.stubGlobal('fetch', fetchMock);
    const { prefetchEngine } = await fresh();
    expect(() => prefetchEngine()).not.toThrow();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
