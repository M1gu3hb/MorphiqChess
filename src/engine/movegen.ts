import { isSquareAttacked, kingSquare } from './attacks';
import { castlingString, placementOf } from './position';
import {
  BISHOP,
  KING,
  KNIGHT,
  PAWN,
  ROOK,
  codeOf,
  signOf,
  typeOfCode,
} from './pieces';
import { squareName } from './squares';
import { KING_TARGETS, KNIGHT_TARGETS, RAYS } from './tables';
import {
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  opposite,
  type Color,
  type Move,
  type PieceType,
  type Position,
  type PromotionPiece,
  type Square,
} from './types';

const PROMOTIONS: readonly PromotionPiece[] = ['q', 'r', 'b', 'n'];
const PAWN_FILE_STEPS = [-1, 1] as const;

/** Máscara que borra derechos de enroque cuando se toca (sale o llega) una casilla clave. */
const CASTLE_MASK = new Int8Array(64).fill(15);
CASTLE_MASK[0] = 15 & ~CASTLE_WQ;
CASTLE_MASK[7] = 15 & ~CASTLE_WK;
CASTLE_MASK[4] = 15 & ~(CASTLE_WK | CASTLE_WQ);
CASTLE_MASK[56] = 15 & ~CASTLE_BQ;
CASTLE_MASK[63] = 15 & ~CASTLE_BK;
CASTLE_MASK[60] = 15 & ~(CASTLE_BK | CASTLE_BQ);

function pushPawnMove(
  out: Move[],
  from: Square,
  to: Square,
  color: Color,
  capture: PieceType | undefined,
  lastRank: number,
): void {
  if (to >> 3 === lastRank) {
    for (const promotion of PROMOTIONS) {
      out.push(
        capture
          ? { from, to, color, piece: 'p', capture, captureSquare: to, promotion }
          : { from, to, color, piece: 'p', promotion },
      );
    }
  } else {
    out.push(
      capture
        ? { from, to, color, piece: 'p', capture, captureSquare: to }
        : { from, to, color, piece: 'p' },
    );
  }
}

function genPawn(pos: Position, from: Square, sign: 1 | -1, out: Move[]): void {
  const { board, turn, ep } = pos;
  const file = from & 7;
  const rank = from >> 3;
  const startRank = sign === 1 ? 1 : 6;
  const lastRank = sign === 1 ? 7 : 0;
  const forward = from + 8 * sign;
  if (forward < 0 || forward > 63) return;

  if (board[forward] === 0) {
    pushPawnMove(out, from, forward, turn, undefined, lastRank);
    if (rank === startRank) {
      const two = forward + 8 * sign;
      if (board[two] === 0) out.push({ from, to: two, color: turn, piece: 'p', doublePush: true });
    }
  }

  for (const df of PAWN_FILE_STEPS) {
    const nf = file + df;
    if (nf < 0 || nf > 7) continue;
    const to = forward + df;
    const occupant = board[to]!;
    if (occupant * sign < 0) {
      pushPawnMove(out, from, to, turn, typeOfCode(occupant), lastRank);
    } else if (occupant === 0 && to === ep) {
      const captureSquare = (rank << 3) + nf;
      if (board[captureSquare] === -sign * PAWN) {
        out.push({ from, to, color: turn, piece: 'p', capture: 'p', captureSquare, enPassant: true });
      }
    }
  }
}

function genSteps(
  board: Int8Array,
  from: Square,
  targets: Int8Array,
  sign: 1 | -1,
  piece: PieceType,
  color: Color,
  out: Move[],
): void {
  for (let i = 0; i < targets.length; i++) {
    const to = targets[i]!;
    const occupant = board[to]!;
    if (occupant === 0) out.push({ from, to, color, piece });
    else if (occupant * sign < 0) {
      out.push({ from, to, color, piece, capture: typeOfCode(occupant), captureSquare: to });
    }
  }
}

function genSlides(
  board: Int8Array,
  from: Square,
  kind: number,
  sign: 1 | -1,
  color: Color,
  out: Move[],
): void {
  const piece = typeOfCode(kind);
  const firstDir = kind === BISHOP ? 4 : 0;
  const lastDir = kind === ROOK ? 3 : 7;
  const rays = RAYS[from]!;
  for (let dir = firstDir; dir <= lastDir; dir++) {
    const ray = rays[dir]!;
    for (let i = 0; i < ray.length; i++) {
      const to = ray[i]!;
      const occupant = board[to]!;
      if (occupant === 0) {
        out.push({ from, to, color, piece });
        continue;
      }
      if (occupant * sign < 0) {
        out.push({ from, to, color, piece, capture: typeOfCode(occupant), captureSquare: to });
      }
      break;
    }
  }
}

function genCastling(pos: Position, out: Move[]): void {
  const { board, turn, castling } = pos;
  const sign = signOf(turn);
  const base = turn === 'w' ? 0 : 56;
  if (board[base + 4] !== sign * KING) return;
  const enemy = opposite(turn);

  const shortRight = turn === 'w' ? CASTLE_WK : CASTLE_BK;
  const longRight = turn === 'w' ? CASTLE_WQ : CASTLE_BQ;
  const canShort =
    (castling & shortRight) !== 0 &&
    board[base + 5] === 0 &&
    board[base + 6] === 0 &&
    board[base + 7] === sign * ROOK;
  const canLong =
    (castling & longRight) !== 0 &&
    board[base + 3] === 0 &&
    board[base + 2] === 0 &&
    board[base + 1] === 0 &&
    board[base] === sign * ROOK;
  if (!canShort && !canLong) return;
  if (isSquareAttacked(board, base + 4, enemy)) return; // no se enroca estando en jaque

  if (canShort && !isSquareAttacked(board, base + 5, enemy) && !isSquareAttacked(board, base + 6, enemy)) {
    out.push({ from: base + 4, to: base + 6, color: turn, piece: 'k', castle: 'k' });
  }
  if (canLong && !isSquareAttacked(board, base + 3, enemy) && !isSquareAttacked(board, base + 2, enemy)) {
    out.push({ from: base + 4, to: base + 2, color: turn, piece: 'k', castle: 'q' });
  }
}

/** Movimientos pseudo-legales (pueden dejar al propio rey en jaque). */
export function generatePseudoLegalMoves(pos: Position, onlyFrom?: Square): Move[] {
  const { board, turn } = pos;
  const sign = signOf(turn);
  const moves: Move[] = [];
  const first = onlyFrom ?? 0;
  const last = onlyFrom ?? 63;
  for (let from = first; from <= last; from++) {
    const kind = board[from]! * sign;
    if (kind <= 0) continue; // vacía o del rival
    if (kind === PAWN) genPawn(pos, from, sign, moves);
    else if (kind === KNIGHT) genSteps(board, from, KNIGHT_TARGETS[from]!, sign, 'n', turn, moves);
    else if (kind === KING) {
      genSteps(board, from, KING_TARGETS[from]!, sign, 'k', turn, moves);
      genCastling(pos, moves);
    } else genSlides(board, from, kind, sign, turn, moves);
  }
  return moves;
}

/** Aplica el movimiento sobre un tablero (modifica `board`). No valida nada. */
export function applyToBoard(board: Int8Array, move: Move): void {
  const moving = board[move.from]!;
  board[move.from] = 0;
  if (move.enPassant) board[move.captureSquare!] = 0;
  board[move.to] = move.promotion ? codeOf(move.color, move.promotion) : moving;
  if (move.castle) {
    const sign = signOf(move.color);
    const base = move.color === 'w' ? 0 : 56;
    if (move.castle === 'k') {
      board[base + 7] = 0;
      board[base + 5] = sign * ROOK;
    } else {
      board[base] = 0;
      board[base + 3] = sign * ROOK;
    }
  }
}

const scratch = new Int8Array(64);

function leavesKingSafe(pos: Position, move: Move): boolean {
  scratch.set(pos.board);
  applyToBoard(scratch, move);
  const king = move.piece === 'k' ? move.to : kingSquare(scratch, move.color);
  return king < 0 || !isSquareAttacked(scratch, king, opposite(move.color));
}

export function generateLegalMoves(pos: Position): Move[] {
  const out: Move[] = [];
  for (const move of generatePseudoLegalMoves(pos)) {
    if (leavesKingSafe(pos, move)) out.push(move);
  }
  return out;
}

export function generateLegalMovesFrom(pos: Position, from: Square): Move[] {
  const out: Move[] = [];
  for (const move of generatePseudoLegalMoves(pos, from)) {
    if (leavesKingSafe(pos, move)) out.push(move);
  }
  return out;
}

/** Busca el movimiento legal exacto (en una coronación hay que indicar la pieza). */
export function findLegalMove(
  pos: Position,
  from: Square,
  to: Square,
  promotion?: PromotionPiece,
): Move | null {
  for (const move of generateLegalMovesFrom(pos, from)) {
    if (move.to === to && move.promotion === promotion) return move;
  }
  return null;
}

/** Devuelve la posición resultante. Asume que `move` es legal en `pos`. */
export function applyMove(pos: Position, move: Move): Position {
  const board = pos.board.slice();
  applyToBoard(board, move);
  return {
    board,
    turn: opposite(pos.turn),
    castling: pos.castling & CASTLE_MASK[move.from]! & CASTLE_MASK[move.to]!,
    ep: move.doublePush ? (move.from + move.to) >> 1 : -1,
    halfmove: move.piece === 'p' || move.capture ? 0 : pos.halfmove + 1,
    fullmove: pos.fullmove + (pos.turn === 'b' ? 1 : 0),
  };
}

export function isInCheck(pos: Position, color: Color = pos.turn): boolean {
  const king = kingSquare(pos.board, color);
  return king >= 0 && isSquareAttacked(pos.board, king, opposite(color));
}

/**
 * Clave de repetición (FIDE): colocación, turno, derechos de enroque y captura al paso
 * únicamente cuando esa captura es realmente posible.
 */
export function repetitionKey(pos: Position): string {
  let ep = '-';
  if (pos.ep !== -1 && generateLegalMoves(pos).some((m) => m.enPassant)) ep = squareName(pos.ep);
  return `${placementOf(pos.board)} ${pos.turn} ${castlingString(pos.castling)} ${ep}`;
}

/** Cuenta nodos hoja a profundidad `depth` (herramienta de validación del motor). */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = generateLegalMoves(pos);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const move of moves) nodes += perft(applyMove(pos, move), depth - 1);
  return nodes;
}
