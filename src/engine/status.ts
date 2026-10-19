import { generateLegalMoves, isInCheck } from './movegen';
import { BISHOP, KING, KNIGHT } from './pieces';
import { isLightSquare } from './squares';
import { opposite, type Color, type Move, type Position } from './types';

export type DrawReason =
  | 'stalemate'
  | 'insufficient-material'
  | 'seventy-five-move'
  | 'fivefold'
  | 'threefold'
  | 'fifty-move'
  | 'agreement';

export type Outcome =
  | { readonly type: 'checkmate'; readonly winner: Color }
  | { readonly type: 'resignation'; readonly winner: Color }
  | { readonly type: 'draw'; readonly reason: DrawReason };

/**
 * Material insuficiente para dar mate (posición muerta):
 * R vs R, R+alfil/caballo vs R, y alfiles todos del mismo color de casilla.
 */
export function isInsufficientMaterial(board: Int8Array): boolean {
  let knights = 0;
  let bishopsOnLight = 0;
  let bishopsOnDark = 0;
  for (let sq = 0; sq < 64; sq++) {
    const code = board[sq]!;
    if (code === 0) continue;
    const abs = Math.abs(code);
    if (abs === KING) continue;
    if (abs === KNIGHT) knights++;
    else if (abs === BISHOP) {
      if (isLightSquare(sq)) bishopsOnLight++;
      else bishopsOnDark++;
    } else return false; // peón, torre o dama: siempre hay material de mate
  }
  const bishops = bishopsOnLight + bishopsOnDark;
  if (knights + bishops <= 1) return true;
  if (knights === 0 && (bishopsOnLight === 0 || bishopsOnDark === 0)) return true;
  return false;
}

/** Resultado automático de la posición, o `null` si la partida continúa. */
export function getPositionOutcome(pos: Position, legalMoves: readonly Move[] = generateLegalMoves(pos)): Outcome | null {
  if (legalMoves.length === 0) {
    return isInCheck(pos)
      ? { type: 'checkmate', winner: opposite(pos.turn) }
      : { type: 'draw', reason: 'stalemate' };
  }
  if (isInsufficientMaterial(pos.board)) return { type: 'draw', reason: 'insufficient-material' };
  if (pos.halfmove >= 150) return { type: 'draw', reason: 'seventy-five-move' };
  return null;
}
