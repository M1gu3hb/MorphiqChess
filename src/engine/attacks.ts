import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK } from './pieces';
import { KING_TARGETS, KNIGHT_TARGETS, PAWN_ATTACKERS, RAYS } from './tables';
import type { Color, Square } from './types';

/** Casilla del rey de `color`, o -1 si no existe (posición malformada). */
export function kingSquare(board: Int8Array, color: Color): Square {
  const target = color === 'w' ? KING : -KING;
  for (let sq = 0; sq < 64; sq++) {
    if (board[sq] === target) return sq;
  }
  return -1;
}

/** ¿Ataca alguna pieza de `by` la casilla `sq`? (no importa lo que haya en `sq`). */
export function isSquareAttacked(board: Int8Array, sq: Square, by: Color): boolean {
  const sign = by === 'w' ? 1 : -1;

  const pawns = PAWN_ATTACKERS[by][sq]!;
  for (let i = 0; i < pawns.length; i++) {
    if (board[pawns[i]!] === sign * PAWN) return true;
  }

  const knights = KNIGHT_TARGETS[sq]!;
  for (let i = 0; i < knights.length; i++) {
    if (board[knights[i]!] === sign * KNIGHT) return true;
  }

  const kings = KING_TARGETS[sq]!;
  for (let i = 0; i < kings.length; i++) {
    if (board[kings[i]!] === sign * KING) return true;
  }

  const rays = RAYS[sq]!;
  for (let dir = 0; dir < 8; dir++) {
    const ray = rays[dir]!;
    for (let i = 0; i < ray.length; i++) {
      const occupant = board[ray[i]!]! * sign;
      if (occupant === 0) continue;
      if (occupant > 0 && (occupant === QUEEN || (dir < 4 ? occupant === ROOK : occupant === BISHOP))) {
        return true;
      }
      break; // pieza que bloquea el rayo
    }
  }
  return false;
}
