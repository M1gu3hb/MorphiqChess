import type { Square } from './types';

export const FILES = 'abcdefgh';

export const fileOf = (sq: Square): number => sq & 7;
export const rankOf = (sq: Square): number => sq >> 3;
export const makeSquare = (file: number, rank: number): Square => rank * 8 + file;

export function squareName(sq: Square): string {
  return `${FILES[sq & 7]}${(sq >> 3) + 1}`;
}

/** 'e4' -> 28. Devuelve null si el texto no es una casilla válida. */
export function parseSquare(name: string): Square | null {
  if (name.length !== 2) return null;
  const file = FILES.indexOf(name[0]!);
  const rank = Number(name[1]) - 1;
  if (file < 0 || !Number.isInteger(rank) || rank < 0 || rank > 7) return null;
  return makeSquare(file, rank);
}

/** Color de la casilla: true si es clara (a1 es oscura). */
export function isLightSquare(sq: Square): boolean {
  return (fileOf(sq) + rankOf(sq)) % 2 === 1;
}
