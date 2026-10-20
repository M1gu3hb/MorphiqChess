/**
 * Comunicación con el motor (Stockfish en un Web Worker) por el protocolo UCI.
 *
 * `UciEngine` no sabe de Workers: recibe una «transporte» (enviar una línea / recibir líneas), así se
 * prueba con un motor falso y, en el navegador, con `workerTransport`. Solo hay una búsqueda a la vez:
 * las demás esperan su turno, y una búsqueda cancelada deja terminar a la anterior antes de empezar
 * la siguiente (si no, su `bestmove` se confundiría con el de la nueva).
 */
import { parseBestMove, parseInfoLine, type InfoLine } from './uci';

/** Dónde vive el motor. El nombre lleva la versión: los archivos se guardan en caché por un año. */
export const ENGINE_URL = '/engine/stockfish-19-lite-single.js';

export interface EngineTransport {
  send(line: string): void;
  /** Se llama con cada línea que escribe el motor. */
  onLine: ((line: string) => void) | null;
  /** Se llama si el motor se cae o no carga. */
  onFail: ((reason: Error) => void) | null;
  terminate(): void;
}

export type TransportFactory = () => EngineTransport;

let prefetched = false;

/**
 * Pide con tiempo los archivos del motor (unos 2 MB) para que, al empezar la partida, ya estén en la caché
 * del navegador. Si falla no pasa nada: se descargan al arrancar el motor.
 */
export function prefetchEngine(): void {
  if (prefetched || typeof fetch === 'undefined') return;
  // Con el ahorro de datos activado no se gasta ancho de banda por adelantado.
  const connection = typeof navigator === 'undefined' ? undefined : (navigator as { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return;
  prefetched = true;
  for (const url of [ENGINE_URL, ENGINE_URL.replace(/\.js$/, '.wasm')]) {
    void fetch(url, { priority: 'low' }).catch(() => undefined);
  }
}

/** Transporte real: un Web Worker que ejecuta Stockfish y habla UCI con mensajes de texto. */
export function workerTransport(url: string = ENGINE_URL): EngineTransport {
  const worker = new Worker(url);
  const transport: EngineTransport = {
    send: (line) => worker.postMessage(line),
    onLine: null,
    onFail: null,
    terminate: () => worker.terminate(),
  };
  worker.onmessage = (event: MessageEvent<unknown>) => {
    if (typeof event.data === 'string') transport.onLine?.(event.data);
  };
  worker.onerror = (event) => transport.onFail?.(new Error(event.message || 'No se pudo ejecutar el motor.'));
  worker.onmessageerror = () => transport.onFail?.(new Error('El motor envió un mensaje ilegible.'));
  return transport;
}

export type OptionValue = string | number | boolean;

export interface SearchRequest {
  /** FEN de la posición inicial; `null` es la posición de salida de siempre. */
  readonly startFen: string | null;
  /** Jugadas desde esa posición, en UCI. */
  readonly moves: readonly string[];
  /** Opciones UCI que deben valer en esta búsqueda (solo se envían las que cambian). */
  readonly options: Readonly<Record<string, OptionValue>>;
  /** Límites: lo que se cumpla primero detiene la búsqueda. */
  readonly go: { readonly depth?: number; readonly movetime?: number; readonly nodes?: number };
}

export interface SearchResult {
  /** Jugada elegida por el motor (UCI), o `null` si no hay jugadas legales. */
  readonly bestmove: string | null;
  /** La última línea completa de cada variante (MultiPV), de mejor a peor. */
  readonly lines: readonly InfoLine[];
}

export class EngineError extends Error {
  constructor(
    message: string,
    readonly kind: 'failed' | 'timeout' | 'disposed' | 'aborted',
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

export const isAbort = (error: unknown): boolean => error instanceof EngineError && error.kind === 'aborted';

export interface EngineTimeouts {
  /** Tiempo máximo para arrancar (`uci` + `isready`). */
  readonly startMs: number;
  /** Margen que se suma al límite de cada búsqueda antes de mandar `stop`. */
  readonly slackMs: number;
  /** Tiempo que se espera la respuesta tras `stop` antes de dar el motor por caído. */
  readonly stopMs: number;
}

const DEFAULT_TIMEOUTS: EngineTimeouts = { startMs: 25_000, slackMs: 8_000, stopMs: 4_000 };

/** Alguien espera una línea concreta del motor (p. ej. `uciok`). */
interface Waiter {
  readonly match: (line: string) => boolean;
  readonly resolve: () => void;
  readonly reject: (error: unknown) => void;
}

interface Job {
  readonly request: SearchRequest;
  readonly resolve: (result: SearchResult) => void;
  readonly reject: (error: unknown) => void;
  readonly signal: AbortSignal | undefined;
  onAbort: (() => void) | null;
  /** Ya no interesa su resultado (se canceló): al llegar su `bestmove` se descarta. */
  abandoned: boolean;
}

export class UciEngine {
  private transport: EngineTransport | null = null;
  private starting: Promise<void> | null = null;
  private failure: EngineError | null = null;
  private disposed = false;
  private readonly applied = new Map<string, string>();
  private readonly queue: Job[] = [];
  private running: {
    readonly job: Job;
    readonly lines: Map<number, InfoLine>;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;
  private readonly waiters = new Set<Waiter>();

  constructor(
    private readonly factory: TransportFactory,
    private readonly timeouts: EngineTimeouts = DEFAULT_TIMEOUTS,
  ) {}

  /** Arranca el motor (una sola vez). Se puede llamar las veces que haga falta. */
  ready(): Promise<void> {
    if (this.disposed) return Promise.reject(new EngineError('El motor se cerró.', 'disposed'));
    if (this.failure) return Promise.reject(this.failure);
    this.starting ??= this.start();
    return this.starting;
  }

  /** ¿Falló o se cerró? Un motor así no se reutiliza: se crea otro. */
  get usable(): boolean {
    return !this.disposed && this.failure === null;
  }

  search(request: SearchRequest, signal?: AbortSignal): Promise<SearchResult> {
    if (this.disposed) return Promise.reject(new EngineError('El motor se cerró.', 'disposed'));
    if (this.failure) return Promise.reject(this.failure);
    if (signal?.aborted) return Promise.reject(new EngineError('Búsqueda cancelada.', 'aborted'));

    return new Promise<SearchResult>((resolve, reject) => {
      const job: Job = { request, resolve, reject, signal, onAbort: null, abandoned: false };
      if (signal) {
        job.onAbort = () => this.abandon(job);
        signal.addEventListener('abort', job.onAbort, { once: true });
      }
      this.queue.push(job);
      void this.ready().then(
        () => this.pump(),
        (error: unknown) => this.settleAll(error),
      );
    });
  }

  /** Empieza una partida nueva: el motor olvida lo aprendido (tabla de transposición). */
  newGame(): void {
    if (this.transport && this.running === null) this.transport.send('ucinewgame');
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.shutdown(new EngineError('El motor se cerró.', 'disposed'));
  }

  /* ------------------------------------------------------------------ */

  private async start(): Promise<void> {
    let transport: EngineTransport;
    try {
      transport = this.factory();
    } catch (error) {
      this.failure = new EngineError(messageOf(error, 'No se pudo abrir el motor.'), 'failed');
      throw this.failure;
    }
    this.transport = transport;
    transport.onLine = (line) => this.onLine(line);
    transport.onFail = (reason) => this.fail(new EngineError(reason.message, 'failed'));

    const timer = setTimeout(
      () => this.fail(new EngineError('El motor tardó demasiado en arrancar.', 'timeout')),
      this.timeouts.startMs,
    );
    try {
      const uciok = this.waitFor((line) => line === 'uciok');
      transport.send('uci');
      await uciok;
      const readyok = this.waitFor((line) => line === 'readyok');
      transport.send('isready');
      await readyok;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Una promesa que se cumple con la primera línea que cumpla `match` y falla si el motor se cae antes. */
  private waitFor(match: (line: string) => boolean): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.waiters.add({ match, resolve, reject });
    });
  }

  private onLine(line: string): void {
    for (const waiter of [...this.waiters]) {
      if (!waiter.match(line)) continue;
      this.waiters.delete(waiter);
      waiter.resolve();
    }
    const running = this.running;
    if (!running) return;
    const info = parseInfoLine(line);
    if (info) {
      const previous = running.lines.get(info.multipv);
      if (!previous || info.depth >= previous.depth) running.lines.set(info.multipv, info);
      return;
    }
    const best = parseBestMove(line);
    if (best) this.finish(running.job, best.move);
  }

  private pump(): void {
    if (this.running || !this.transport || this.disposed || this.failure) return;
    let job = this.queue.shift();
    while (job?.abandoned) job = this.queue.shift();
    if (!job) return;

    const { request } = job;
    const transport = this.transport;
    for (const [name, value] of Object.entries(request.options)) {
      const text = String(value);
      if (this.applied.get(name) === text) continue;
      transport.send(`setoption name ${name} value ${text}`);
      this.applied.set(name, text);
    }
    transport.send(
      `position ${request.startFen ? `fen ${request.startFen}` : 'startpos'}${
        request.moves.length > 0 ? ` moves ${request.moves.join(' ')}` : ''
      }`,
    );
    const limits: string[] = [];
    if (request.go.depth !== undefined) limits.push(`depth ${request.go.depth}`);
    if (request.go.movetime !== undefined) limits.push(`movetime ${request.go.movetime}`);
    if (request.go.nodes !== undefined) limits.push(`nodes ${request.go.nodes}`);

    const budget = (request.go.movetime ?? 0) + this.timeouts.slackMs;
    const timer = setTimeout(() => this.onSearchTimeout(), budget);
    this.running = { job, lines: new Map(), timer };
    transport.send(`go ${limits.length > 0 ? limits.join(' ') : 'depth 8'}`);
  }

  private onSearchTimeout(): void {
    const running = this.running;
    if (!running || !this.transport) return;
    this.transport.send('stop');
    running.timer = setTimeout(
      () => this.fail(new EngineError('El motor no respondió.', 'timeout')),
      this.timeouts.stopMs,
    );
  }

  private finish(job: Job, bestmove: string | null): void {
    const running = this.running;
    if (!running || running.job !== job) return;
    clearTimeout(running.timer);
    this.running = null;
    if (job.onAbort) job.signal?.removeEventListener('abort', job.onAbort);
    if (!job.abandoned) {
      const lines = [...running.lines.values()].sort((a, b) => a.multipv - b.multipv);
      job.resolve({ bestmove, lines });
    }
    this.pump();
  }

  /** Se canceló una búsqueda: avisa ya a quien esperaba y, si estaba en marcha, la detiene. */
  private abandon(job: Job): void {
    if (job.abandoned) return;
    job.abandoned = true;
    job.reject(new EngineError('Búsqueda cancelada.', 'aborted'));
    const index = this.queue.indexOf(job);
    if (index >= 0) this.queue.splice(index, 1);
    else if (this.running?.job === job) this.transport?.send('stop');
  }

  /** El motor se cayó: nada más funciona con esta instancia. */
  private fail(error: EngineError): void {
    if (this.failure || this.disposed) return;
    this.failure = error;
    this.shutdown(error);
  }

  private shutdown(error: EngineError): void {
    const transport = this.transport;
    this.transport = null;
    if (transport) {
      transport.onLine = null;
      transport.onFail = null;
      transport.terminate();
    }
    if (this.running) clearTimeout(this.running.timer);
    const running = this.running;
    this.running = null;
    if (running && !running.job.abandoned) running.job.reject(error);
    if (running?.job.onAbort) running.job.signal?.removeEventListener('abort', running.job.onAbort);
    for (const waiter of this.waiters) waiter.reject(error);
    this.waiters.clear();
    this.settleAll(error);
  }

  private settleAll(error: unknown): void {
    for (const job of this.queue.splice(0)) {
      if (job.onAbort) job.signal?.removeEventListener('abort', job.onAbort);
      if (!job.abandoned) job.reject(error);
    }
  }
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
