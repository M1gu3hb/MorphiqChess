/**
 * Tipos base del motor de ajedrez de MorphiqChess.
 *
 * El motor es TypeScript puro: no conoce el DOM, React ni la animación.
 * Eso lo mantiene testeable y reutilizable (IA, modo online, servidor...).
 *
 * Convención de colores: 'w' = Blancas, 'b' = Azules (las "negras" del set Morphiq).
 */

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'n' | 'b' | 'r' | 'q';

/** Casilla 0..63. a1 = 0, b1 = 1, ... h1 = 7, a2 = 8, ... h8 = 63. */
export type Square = number;

export interface Piece {
  readonly color: Color;
  readonly type: PieceType;
}

export interface Move {
  readonly from: Square;
  readonly to: Square;
  readonly color: Color;
  /** Pieza que se mueve (antes de coronar). */
  readonly piece: PieceType;
  /** Tipo de pieza capturada, si la hay (en captura al paso es 'p'). */
  readonly capture?: PieceType;
  /** Casilla donde estaba la pieza capturada (distinta de `to` solo al paso). */
  readonly captureSquare?: Square;
  readonly promotion?: PromotionPiece;
  /** 'k' = enroque corto, 'q' = enroque largo. */
  readonly castle?: 'k' | 'q';
  readonly enPassant?: boolean;
  readonly doublePush?: boolean;
}

/** Derechos de enroque como máscara de bits. */
export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export interface Position {
  /** 64 casillas; 0 vacío, + blancas, - azules (1=P 2=N 3=B 4=R 5=Q 6=K). */
  readonly board: Int8Array;
  readonly turn: Color;
  readonly castling: number;
  /** Casilla objetivo de captura al paso, o -1. */
  readonly ep: Square;
  /** Medios movimientos desde la última captura o avance de peón. */
  readonly halfmove: number;
  readonly fullmove: number;
}

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w';
}
