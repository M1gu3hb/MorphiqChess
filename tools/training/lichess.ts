/**
 * Variantes para practicar a partir de la base de nombres de aperturas de Lichess
 * (https://github.com/lichess-org/chess-openings, dominio público CC0). Son funciones puras;
 * `run.ts` lee los archivos `a.tsv` … `e.tsv` y las usa.
 *
 * Cada fila de la base nombra una posición: `C50<TAB>Italian Game: Giuoco Piano<TAB>1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5`.
 * Una apertura del menú toma las filas cuyo nombre empieza como ella y cuyas jugadas empiezan como ella.
 * Si son demasiadas, se quedan las más cortas hasta llenar el tope de posiciones por decidir: así cada
 * rama queda completa en lo básico y no se llega a rincones muy profundos que casi nadie juega.
 */
import { applyMove, initialPosition, moveToSan, sanToMove, type Color, type Position } from '../../src/engine';
import { normalizeSan, positionKey } from '../../src/training/graph';
import type { Line, LinesFile } from '../../src/training/types';
import { translateName } from './names';

export interface OpeningRow {
  readonly eco: string;
  readonly name: string;
  readonly pgn: string;
}

/** Filas de un `.tsv` de la base (con su encabezado `eco name pgn`). */
export function parseOpeningsTsv(text: string): OpeningRow[] {
  const rows: OpeningRow[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === '') return;
    const [eco, name, pgn, ...extra] = line.split('\t');
    if (index === 0 && eco === 'eco') return;
    if (!eco || !name || !pgn || extra.length > 0) throw new Error(`Fila ${index + 1} mal formada: «${line}»`);
    rows.push({ eco, name, pgn });
  });
  return rows;
}

/** «1. e4 e5 2. Nf3» → [«e4», «e5», «Nf3»]. */
export const pgnMoves = (pgn: string): string[] => pgn.replace(/\d+\.(?:\.\.)?/g, ' ').split(/\s+/).filter(Boolean);

export interface LichessSpec {
  /** Para tomar una fila, su nombre (en inglés) tiene que cumplir alguna. */
  readonly names: readonly RegExp[];
  /** Jugadas (SAN, separadas por espacio) con las que empiezan todas las líneas que se toman. */
  readonly prefix: string;
  /** Nombres (en inglés) de la propia apertura: se quitan del principio del nombre en español. */
  readonly own: readonly string[];
  /** Tope de posiciones en las que la persona decide (cada una es una tarjeta). */
  readonly maxCards?: number;
}

/** Tope por defecto: lo bastante grande para que haya mucho que aprender, lo bastante chico para poder dominarlo. */
export const DEFAULT_MAX_CARDS = 200;

interface Candidate {
  readonly row: OpeningRow;
  readonly index: number;
  /** SAN normalizado de cada jugada, ya comprobado con el motor. */
  readonly moves: readonly string[];
  /** Clave de la posición antes de cada jugada y quién mueve en ella. */
  readonly steps: readonly { readonly key: string; readonly turn: Color; readonly san: string }[];
}

function candidateOf(row: OpeningRow, index: number): Candidate {
  let position: Position = initialPosition();
  const steps: { key: string; turn: Color; san: string }[] = [];
  for (const token of pgnMoves(row.pgn)) {
    const move = sanToMove(position, token);
    if (!move) throw new Error(`Jugada ilegal «${token}» en «${row.name}» (${row.pgn})`);
    const san = normalizeSan(moveToSan(position, move));
    steps.push({ key: positionKey(position), turn: position.turn, san });
    position = applyMove(position, move);
  }
  return { row, index, moves: steps.map((step) => step.san), steps };
}

const startsWith = (moves: readonly string[], prefix: readonly string[]): boolean =>
  moves.length >= prefix.length && prefix.every((san, at) => moves[at] === san);

/**
 * Las filas que forman la apertura, sin pasarse del tope de tarjetas. Primero las líneas más cortas
 * (a igual largo, el orden de la base); una que haría pasar del tope se salta y se sigue con las demás.
 * Devuelve las elegidas en el orden de la base.
 */
export function selectRows(rows: readonly OpeningRow[], spec: LichessSpec, side: Color): OpeningRow[] {
  const prefix = spec.prefix.split(/\s+/).filter(Boolean);
  const max = spec.maxCards ?? DEFAULT_MAX_CARDS;

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  rows.forEach((row, index) => {
    if (!spec.names.some((pattern) => pattern.test(row.name))) return;
    const candidate = candidateOf(row, index);
    if (!startsWith(candidate.moves, prefix)) return;
    const moves = candidate.moves.join(' ');
    if (seen.has(moves)) return; // la misma secuencia con otro nombre no aporta posiciones nuevas
    seen.add(moves);
    candidates.push(candidate);
  });
  candidates.sort((a, b) => a.moves.length - b.moves.length || a.index - b.index);

  // Posiciones con jugada de la persona ya cubiertas, y cuántas jugadas distintas tiene cada una.
  const answered = new Set<string>();
  const chosen: Candidate[] = [];
  for (const candidate of candidates) {
    const fresh = new Set<string>();
    for (const step of candidate.steps) {
      if (step.turn === side && !answered.has(step.key)) fresh.add(step.key);
    }
    if (answered.size + fresh.size > max) continue;
    for (const key of fresh) answered.add(key);
    chosen.push(candidate);
  }
  return chosen.sort((a, b) => a.index - b.index).map((candidate) => candidate.row);
}

/** Pasa las filas elegidas al formato de la app (el SAN sale normalizado por el motor, sin «+» ni «#»). */
export function convertLichess(id: string, rows: readonly OpeningRow[], spec: LichessSpec, side: Color): LinesFile {
  const lines: Line[] = rows.map((row) => ({
    name: translateName(row.name, spec.own),
    nameEn: row.name,
    eco: row.eco,
    moves: candidateOf(row, 0).moves.join(' '),
  }));
  return { id, source: 'Lichess', side, lines };
}
