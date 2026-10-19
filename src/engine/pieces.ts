import type { Color, Piece, PieceType } from './types';

/** Códigos numéricos de pieza dentro de `Position.board`. */
export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

const TYPES: readonly PieceType[] = ['p', 'p', 'n', 'b', 'r', 'q', 'k'];
const CODES: Record<PieceType, number> = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING };

export const signOf = (color: Color): 1 | -1 => (color === 'w' ? 1 : -1);

/** Código con signo para (color, tipo): blancas positivo, azules negativo. */
export function codeOf(color: Color, type: PieceType): number {
  return signOf(color) * CODES[type];
}

export const typeOfCode = (code: number): PieceType => TYPES[Math.abs(code)]!;
export const colorOfCode = (code: number): Color => (code > 0 ? 'w' : 'b');

export function pieceFromCode(code: number): Piece | null {
  if (code === EMPTY) return null;
  return { color: colorOfCode(code), type: typeOfCode(code) };
}
