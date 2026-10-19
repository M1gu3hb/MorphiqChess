import type { Square } from './types';

type Delta = readonly [number, number];

/** Direcciones [dColumna, dFila]. Índices 0-3 ortogonales, 4-7 diagonales. */
export const DIRS: readonly Delta[] = [
  [0, 1], // 0 norte
  [0, -1], // 1 sur
  [1, 0], // 2 este
  [-1, 0], // 3 oeste
  [1, 1], // 4 noreste
  [-1, 1], // 5 noroeste
  [1, -1], // 6 sureste
  [-1, -1], // 7 suroeste
];

const KNIGHT_DELTAS: readonly Delta[] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

function squaresFrom(sq: Square, deltas: readonly Delta[]): Int8Array {
  const file = sq & 7;
  const rank = sq >> 3;
  const out: number[] = [];
  for (const [df, dr] of deltas) {
    const f = file + df;
    const r = rank + dr;
    if (f >= 0 && f < 8 && r >= 0 && r < 8) out.push(r * 8 + f);
  }
  return Int8Array.from(out);
}

const perSquare = (fn: (sq: Square) => Int8Array): readonly Int8Array[] =>
  Array.from({ length: 64 }, (_, sq) => fn(sq));

export const KNIGHT_TARGETS = perSquare((sq) => squaresFrom(sq, KNIGHT_DELTAS));
export const KING_TARGETS = perSquare((sq) => squaresFrom(sq, DIRS));

/** Casillas desde las que un peón de ese color ataca `sq`. */
export const PAWN_ATTACKERS = {
  w: perSquare((sq) => squaresFrom(sq, [[-1, -1], [1, -1]])),
  b: perSquare((sq) => squaresFrom(sq, [[-1, 1], [1, 1]])),
} as const;

/** RAYS[sq][dir] = casillas en esa dirección, ordenadas de la más cercana a la más lejana. */
export const RAYS: readonly (readonly Int8Array[])[] = Array.from({ length: 64 }, (_, sq) =>
  DIRS.map(([df, dr]) => {
    const out: number[] = [];
    let f = (sq & 7) + df;
    let r = (sq >> 3) + dr;
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      out.push(r * 8 + f);
      f += df;
      r += dr;
    }
    return Int8Array.from(out);
  }),
);
