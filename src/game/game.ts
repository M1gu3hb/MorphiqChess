import {
  applyMove,
  findLegalMove,
  generateLegalMoves,
  getPositionOutcome,
  initialPosition,
  isInCheck,
  moveToSan,
  opposite,
  parseFen,
  parseSquare,
  repetitionKey,
  squareName,
  toFen,
  type Color,
  type Move,
  type Outcome,
  type Position,
  type PromotionPiece,
} from '../engine';
import type { ClaimableDraw, GameSnapshot, Ply, SavedGame } from './types';

/* ---------- ids estables de pieza ---------- */

function initialIds(position: Position): Int16Array {
  const ids = new Int16Array(64).fill(-1);
  let next = 0;
  for (let sq = 0; sq < 64; sq++) {
    if (position.board[sq] !== 0) ids[sq] = next++;
  }
  return ids;
}

/** Traslada los ids según la jugada: la pieza que se mueve conserva su id; la capturada desaparece. */
function applyToIds(ids: Int16Array, move: Move): { ids: Int16Array; capturedId: number } {
  const next = ids.slice();
  const moving = next[move.from]!;
  let capturedId = -1;
  if (move.captureSquare !== undefined) {
    capturedId = next[move.captureSquare]!;
    next[move.captureSquare] = -1;
  }
  next[move.from] = -1;
  next[move.to] = moving;
  if (move.castle) {
    const base = move.color === 'w' ? 0 : 56;
    const rookFrom = base + (move.castle === 'k' ? 7 : 0);
    const rookTo = base + (move.castle === 'k' ? 5 : 3);
    next[rookTo] = next[rookFrom]!;
    next[rookFrom] = -1;
  }
  return { ids: next, capturedId };
}

/* ---------- consultas ---------- */

export function positionAt(game: GameSnapshot, cursor: number = game.cursor): Position {
  return cursor === 0 ? game.start : game.plies[cursor - 1]!.after;
}

export function idsAt(game: GameSnapshot, cursor: number = game.cursor): Int16Array {
  return cursor === 0 ? game.startIds : game.plies[cursor - 1]!.idsAfter;
}

export const isAtEnd = (game: GameSnapshot): boolean => game.cursor === game.plies.length;

const legalCache = new WeakMap<Position, readonly Move[]>();

/** Jugadas legales de una posición (con caché por objeto de posición). */
export function legalMovesOf(position: Position): readonly Move[] {
  let moves = legalCache.get(position);
  if (!moves) {
    moves = generateLegalMoves(position);
    legalCache.set(position, moves);
  }
  return moves;
}

/** Última jugada realizada hasta el cursor (para resaltarla). */
export function lastMoveAt(game: GameSnapshot, cursor: number = game.cursor): Move | null {
  return cursor === 0 ? null : game.plies[cursor - 1]!.move;
}

/**
 * Hacia quién miran las piezas: 0° = derechas para Blancas (abajo), 180° = derechas para Azules (arriba).
 * Con la partida terminada, se quedan mirando al ganador (quien dio la última jugada).
 */
export function orientationAt(game: GameSnapshot, rotate: boolean): 0 | 180 {
  if (!rotate) return 0;
  return facingColor(game) === 'w' ? 0 : 180;
}

const AUTOMATIC_DRAWS: readonly string[] = ['stalemate', 'insufficient-material', 'seventy-five-move', 'fivefold'];

function facingColor(game: GameSnapshot): Color {
  const outcome = game.outcome;
  if (outcome && isAtEnd(game)) {
    if (outcome.type === 'checkmate' || outcome.type === 'resignation') return outcome.winner;
    // Tablas por posición: se quedan como las dejó quien dio la última jugada.
    const lastPly = game.plies[game.plies.length - 1];
    if (lastPly && AUTOMATIC_DRAWS.includes(outcome.reason)) return lastPly.move.color;
  }
  return positionAt(game).turn;
}

export function inCheckAt(game: GameSnapshot, cursor: number = game.cursor): boolean {
  return cursor > 0 && game.plies[cursor - 1]!.check;
}

/* ---------- construcción ---------- */

let gameCounter = 0;

function finalize(
  base: Omit<GameSnapshot, 'outcome' | 'claimable'>,
): GameSnapshot {
  const last = base.plies.length === 0 ? base.start : base.plies[base.plies.length - 1]!.after;
  const lastKey = base.keys[base.keys.length - 1]!;
  const repetitions = base.keys.reduce((count, key) => (key === lastKey ? count + 1 : count), 0);

  let outcome: Outcome | null = base.manualOutcome;
  if (!outcome) {
    outcome = getPositionOutcome(last, legalMovesOf(last));
    if (!outcome && repetitions >= 5) outcome = { type: 'draw', reason: 'fivefold' };
  }
  let claimable: ClaimableDraw | null = null;
  if (!outcome) {
    if (repetitions >= 3) claimable = 'threefold';
    else if (last.halfmove >= 100) claimable = 'fifty-move';
  }
  return { ...base, outcome, claimable };
}

export function createGame(startFen?: string): GameSnapshot {
  const start = startFen ? parseFen(startFen) : initialPosition();
  return finalize({
    gameId: ++gameCounter,
    revision: 0,
    start,
    startIds: initialIds(start),
    plies: [],
    cursor: 0,
    keys: [repetitionKey(start)],
    manualOutcome: null,
    transition: { type: 'reset' },
  });
}

function next(game: GameSnapshot, patch: Partial<GameSnapshot>): GameSnapshot {
  return finalize({
    gameId: game.gameId,
    revision: game.revision + 1,
    start: game.start,
    startIds: game.startIds,
    plies: game.plies,
    cursor: game.cursor,
    keys: game.keys,
    manualOutcome: game.manualOutcome,
    transition: { type: 'none' },
    ...patch,
  });
}

/* ---------- acciones ---------- */

/** ¿Se puede jugar? Solo en la posición final y con la partida en curso. */
export function canPlay(game: GameSnapshot): boolean {
  return game.outcome === null && isAtEnd(game);
}

export function playMove(game: GameSnapshot, move: Move): GameSnapshot {
  if (!canPlay(game)) return game;
  const position = positionAt(game);
  const legal = legalMovesOf(position);
  if (!legal.includes(move)) {
    // Admite objetos equivalentes (p. ej. reconstruidos): se busca por coordenadas.
    const match = legal.find((m) => m.from === move.from && m.to === move.to && m.promotion === move.promotion);
    if (!match) return game;
    move = match;
  }
  const after = applyMove(position, move);
  const { ids, capturedId } = applyToIds(idsAt(game), move);
  const afterLegal = legalMovesOf(after);
  const check = isInCheck(after);
  const ply: Ply = {
    move,
    san: moveToSan(position, move, legal),
    after,
    idsAfter: ids,
    capturedId,
    check,
    mate: check && afterLegal.length === 0,
  };
  const plies = [...game.plies, ply];
  return next(game, {
    plies,
    cursor: plies.length,
    keys: [...game.keys, repetitionKey(after)],
    transition: { type: 'forward', ply, index: plies.length, source: 'play' },
  });
}

export function goTo(game: GameSnapshot, target: number): GameSnapshot {
  const cursor = Math.max(0, Math.min(game.plies.length, Math.trunc(target)));
  if (cursor === game.cursor) return game;
  let transition: GameSnapshot['transition'] = { type: 'jump' };
  if (cursor === game.cursor + 1) {
    transition = { type: 'forward', ply: game.plies[cursor - 1]!, index: cursor, source: 'nav' };
  } else if (cursor === game.cursor - 1) {
    transition = { type: 'backward', ply: game.plies[game.cursor - 1]!, index: game.cursor, source: 'nav' };
  }
  return next(game, { cursor, transition });
}

/** Deshace la última jugada (borra del historial). */
export function undo(game: GameSnapshot): GameSnapshot {
  if (game.plies.length === 0) return game;
  const removed = game.plies[game.plies.length - 1]!;
  const wasAtEnd = isAtEnd(game);
  const plies = game.plies.slice(0, -1);
  return next(game, {
    plies,
    keys: game.keys.slice(0, -1),
    cursor: Math.min(game.cursor, plies.length),
    manualOutcome: null,
    transition: wasAtEnd
      ? { type: 'backward', ply: removed, index: game.plies.length, source: 'undo' }
      : { type: 'none' },
  });
}

/** «Retomar desde aquí»: descarta las jugadas posteriores al cursor. */
export function truncateAtCursor(game: GameSnapshot): GameSnapshot {
  if (isAtEnd(game)) return game;
  return next(game, {
    plies: game.plies.slice(0, game.cursor),
    keys: game.keys.slice(0, game.cursor + 1),
    manualOutcome: null,
    transition: { type: 'none' },
  });
}

export function resign(game: GameSnapshot, loser: Color): GameSnapshot {
  if (game.outcome) return game;
  return next(game, {
    manualOutcome: { type: 'resignation', winner: opposite(loser) },
    cursor: game.plies.length,
    transition: { type: 'none', ended: true },
  });
}

export function agreeDraw(game: GameSnapshot): GameSnapshot {
  if (game.outcome) return game;
  return next(game, {
    manualOutcome: { type: 'draw', reason: 'agreement' },
    cursor: game.plies.length,
    transition: { type: 'none', ended: true },
  });
}

/** Reclama las tablas por triple repetición o regla de 50 movimientos (si están disponibles). */
export function claimDraw(game: GameSnapshot): GameSnapshot {
  if (game.outcome || !game.claimable) return game;
  return next(game, {
    manualOutcome: { type: 'draw', reason: game.claimable },
    cursor: game.plies.length,
    transition: { type: 'none', ended: true },
  });
}

/* ---------- guardado ---------- */

const coord = (move: Move): string =>
  `${squareName(move.from)}${squareName(move.to)}${move.promotion ?? ''}`;

export function serializeGame(game: GameSnapshot): SavedGame {
  return {
    v: 1,
    startFen: toFen(game.start),
    moves: game.plies.map((ply) => coord(ply.move)),
    manualOutcome: game.manualOutcome,
    cursor: game.cursor,
  };
}

const PROMOTIONS = 'qrbn';

/** Solo los finales «manuales» se guardan; los demás se recalculan al reproducir las jugadas. */
function isManualOutcome(value: unknown): value is Outcome {
  if (typeof value !== 'object' || value === null) return false;
  const outcome = value as Record<string, unknown>;
  if (outcome.type === 'resignation') return outcome.winner === 'w' || outcome.winner === 'b';
  if (outcome.type === 'draw') {
    return outcome.reason === 'agreement' || outcome.reason === 'threefold' || outcome.reason === 'fifty-move';
  }
  return false;
}

/** Reconstruye la partida reproduciendo las jugadas; devuelve null si el guardado no es válido. */
export function deserializeGame(saved: unknown): GameSnapshot | null {
  if (typeof saved !== 'object' || saved === null) return null;
  const data = saved as Partial<SavedGame>;
  if (data.v !== 1 || typeof data.startFen !== 'string' || !Array.isArray(data.moves)) return null;
  try {
    let game = createGame(data.startFen);
    for (const text of data.moves) {
      if (typeof text !== 'string' || (text.length !== 4 && text.length !== 5)) return null;
      const from = parseSquare(text.slice(0, 2));
      const to = parseSquare(text.slice(2, 4));
      const promotion = text.length === 5 ? text[4] : undefined;
      if (from === null || to === null) return null;
      if (promotion !== undefined && !PROMOTIONS.includes(promotion)) return null;
      const move = findLegalMove(positionAt(game), from, to, promotion as PromotionPiece | undefined);
      if (!move) return null;
      const before = game;
      game = playMove(game, move);
      if (game === before) return null;
    }
    const manual = data.manualOutcome;
    if (isManualOutcome(manual) && !game.outcome) {
      game = next(game, { manualOutcome: manual, transition: { type: 'none' } });
    }
    const cursor = typeof data.cursor === 'number' ? data.cursor : game.plies.length;
    return next(game, { cursor: Math.max(0, Math.min(game.plies.length, cursor)), transition: { type: 'reset' } });
  } catch {
    return null;
  }
}
