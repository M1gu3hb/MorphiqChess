/**
 * Partidas entre dos rivales para medir su fuerza relativa. Es la herramienta con la que se
 * calibraron los Elo de los personajes (ver docs/practica/calibracion.md).
 *
 *   npm run bots:duel -- --a persona:alfil-blanco --b elo:1400 --games 40 --lanes 2 --seed 7
 *
 * Un rival se escribe así:
 *   persona:<id>                                  uno de los doce del modo Práctica
 *   elo:<elo>[:<ms>]                              Stockfish con la fuerza limitada a ese Elo
 *   max[:<ms>]                                    Stockfish sin límite
 *   sampler:<profundidad>:<variantes>:<temperatura>:<despistes>
 *
 * Usa exactamente el mismo código que la app (`planSearch` y `pickMove`) con el mismo Stockfish de
 * `public/engine`, ejecutado por Node. Cada «carril» es un proceso de Stockfish aparte.
 */
import { spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { UciEngine, type EngineTransport } from '../../src/bots/engine';
import { personaById } from '../../src/bots/personas';
import { pickMove, planSearch, type Strength } from '../../src/bots/strength';
import { moveToUci } from '../../src/bots/uci';
import {
  applyMove,
  generateLegalMoves,
  getPositionOutcome,
  initialPosition,
  repetitionKey,
  type Color,
  type Position,
} from '../../src/engine';

const ENGINE_NAME = 'stockfish-19-lite-single';
/** Milisegundos por jugada de los rivales «elo» en las pruebas: basta para llegar a la profundidad que elige Stockfish. */
const DEFAULT_MS = 60;
const MAX_PLIES = 320;

/**
 * Stockfish.js se escribió como script de Node clásico (CommonJS), pero este proyecto es ESM: dentro
 * del repositorio Node lo trataría como módulo y fallaría. Se copia a una carpeta temporal con su
 * propio `package.json` para ejecutarlo tal cual.
 */
function prepareEngine(): { readonly file: string; readonly cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'morphiq-engine-'));
  writeFileSync(join(dir, 'package.json'), '{"type":"commonjs"}\n');
  for (const extension of ['js', 'wasm']) {
    copyFileSync(resolve(`public/engine/${ENGINE_NAME}.${extension}`), join(dir, `${ENGINE_NAME}.${extension}`));
  }
  return { file: join(dir, `${ENGINE_NAME}.js`), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function nodeTransport(file: string): EngineTransport {
  const child = spawn(process.execPath, [file], { stdio: ['pipe', 'pipe', 'inherit'] });
  const transport: EngineTransport = {
    send: (line) => void child.stdin.write(`${line}\n`),
    onLine: null,
    onFail: null,
    terminate: () => void child.kill(),
  };
  createInterface({ input: child.stdout }).on('line', (line) => transport.onLine?.(line));
  child.on('error', (error) => transport.onFail?.(error));
  return transport;
}

interface Contender {
  readonly label: string;
  readonly strength: Strength;
}

function parseContender(spec: string): Contender {
  const [kind, ...rest] = spec.split(':');
  if (kind === 'persona') {
    const persona = personaById(rest[0] ?? '');
    if (!persona) throw new Error(`No existe el rival «${rest[0]}».`);
    const strength: Strength =
      persona.strength.kind === 'sampler' ? persona.strength : { ...persona.strength, movetime: DEFAULT_MS };
    return { label: spec, strength };
  }
  if (kind === 'elo') return { label: spec, strength: { kind: 'elo', elo: Number(rest[0]), movetime: Number(rest[1] ?? DEFAULT_MS) } };
  if (kind === 'max') return { label: spec, strength: { kind: 'max', movetime: Number(rest[0] ?? DEFAULT_MS) } };
  if (kind === 'sampler') {
    const [depth, lines, temperature, blunder] = rest.map(Number) as [number, number, number, number];
    return { label: spec, strength: { kind: 'sampler', depth, lines, temperature, blunder } };
  }
  throw new Error(`Rival desconocido: ${spec}`);
}

/** Generador con semilla (mulberry32): la misma semilla repite las mismas partidas. */
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

const VALUES = [0, 1, 3, 3, 5, 9, 0] as const;
function materialBalance(position: Position): number {
  let balance = 0;
  for (const code of position.board) balance += Math.sign(code) * (VALUES[Math.abs(code)] ?? 0);
  return balance;
}

type Result = 'w' | 'b' | 'draw';

interface Played {
  readonly result: Result;
  readonly plies: number;
  readonly how: string;
}

async function playGame(
  engine: UciEngine,
  white: Contender,
  black: Contender,
  random: () => number,
): Promise<Played> {
  let position = initialPosition();
  const moves: string[] = [];
  const seen = new Map<string, number>([[repetitionKey(position), 1]]);
  engine.newGame();
  for (let ply = 0; ply < MAX_PLIES; ply++) {
    const legal = generateLegalMoves(position);
    const outcome = getPositionOutcome(position, legal);
    if (outcome) {
      if (outcome.type === 'checkmate') return { result: outcome.winner, plies: ply, how: 'mate' };
      return { result: 'draw', plies: ply, how: outcome.type === 'draw' ? outcome.reason : outcome.type };
    }
    if (position.halfmove >= 100) return { result: 'draw', plies: ply, how: '50 jugadas' };
    const contender = position.turn === 'w' ? white : black;
    const plan = planSearch(contender.strength, ply);
    const result = await engine.search({ startFen: null, moves, ...plan });
    const move = pickMove(contender.strength, result, legal, ply, random);
    moves.push(moveToUci(move));
    position = applyMove(position, move);
    const key = repetitionKey(position);
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count >= 3) return { result: 'draw', plies: ply + 1, how: 'repetición' };
  }
  // Se acabó el tiempo de la partida: gana quien tenga al menos tres peones de ventaja.
  const balance = materialBalance(position);
  const winner: Result = balance >= 3 ? 'w' : balance <= -3 ? 'b' : 'draw';
  return { result: winner, plies: MAX_PLIES, how: 'material' };
}

function option(name: string, fallback?: string): string {
  const at = process.argv.indexOf(`--${name}`);
  const value = at === -1 ? fallback : process.argv[at + 1];
  if (value === undefined) throw new Error(`Falta --${name}`);
  return value;
}

/** Diferencia de Elo que corresponde a una puntuación media (0–1), con límites para no dar infinitos. */
function eloDifference(score: number): number {
  const clamped = Math.min(0.995, Math.max(0.005, score));
  return -400 * Math.log10(1 / clamped - 1);
}

async function main(): Promise<void> {
  const a = parseContender(option('a'));
  const b = parseContender(option('b'));
  const games = Number(option('games', '20'));
  const lanes = Number(option('lanes', '2'));
  const seed = Number(option('seed', '1'));
  const out = process.argv.includes('--out') ? option('out') : null;

  const engineFiles = prepareEngine();
  let next = 0;
  const records: { a: Color; result: Result; plies: number; how: string }[] = [];
  const started = Date.now();

  const lane = async (index: number): Promise<void> => {
    const engine = new UciEngine(() => nodeTransport(engineFiles.file));
    await engine.ready();
    try {
      for (;;) {
        const game = next++;
        if (game >= games) return;
        const aIsWhite = game % 2 === 0;
        const random = seeded(seed * 100_003 + game * 7919 + index);
        const played = await playGame(engine, aIsWhite ? a : b, aIsWhite ? b : a, random);
        records.push({ a: aIsWhite ? 'w' : 'b', ...played });
        process.stderr.write(`\r${records.length}/${games} partidas`);
      }
    } finally {
      engine.dispose();
    }
  };
  try {
    await Promise.all(Array.from({ length: lanes }, (_, index) => lane(index)));
  } finally {
    engineFiles.cleanup();
  }
  process.stderr.write('\n');

  let wins = 0;
  let draws = 0;
  let losses = 0;
  for (const record of records) {
    if (record.result === 'draw') draws++;
    else if (record.result === record.a) wins++;
    else losses++;
  }
  const n = records.length;
  const score = (wins + draws / 2) / n;
  // Error típico de la puntuación (con los empates contando como media victoria).
  const variance = (wins * (1 - score) ** 2 + draws * (0.5 - score) ** 2 + losses * score ** 2) / n;
  const se = Math.sqrt(variance / n);
  const summary = {
    a: a.label,
    b: b.label,
    games: n,
    wins,
    draws,
    losses,
    score: Number(score.toFixed(3)),
    elo: Math.round(eloDifference(score)),
    eloRange: [Math.round(eloDifference(score - 1.96 * se)), Math.round(eloDifference(score + 1.96 * se))],
    byHow: records.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.how]: (acc[r.how] ?? 0) + 1 }), {}),
    avgPlies: Math.round(records.reduce((sum, r) => sum + r.plies, 0) / n),
    seconds: Math.round((Date.now() - started) / 1000),
  };
  console.log(JSON.stringify(summary));
  if (out) writeFileSync(out, `${JSON.stringify({ summary, records }, null, 1)}\n`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
