import type { Orientation } from './timing';

/** Columna 0..7 (a..h) de una casilla del motor (a1 = 0). */
export const fileOf = (sq: number): number => sq & 7;

/** Fila visual 0..7, de arriba (rango 8) hacia abajo (rango 1) en la vista de Blancas. */
export const rowOf = (sq: number): number => 7 - (sq >> 3);

/**
 * Casilla tal como se ve en pantalla. En la vista de Azules el tablero se ve girado 180° (a1 queda
 * arriba a la derecha) y cada casilla ocupa el lugar de su opuesta. Es su propia inversa: sirve igual
 * para pasar de la casilla del motor a la de pantalla y de vuelta. `fileOf`, `rowOf`, `placeAt` y
 * `pieceZ` trabajan con la casilla de pantalla.
 */
export const viewSq = (sq: number, flipped: boolean): number => (flipped ? 63 - sq : sq);

/** Casilla del motor a partir de columna y fila visual (vista de Blancas). */
export const squareAt = (file: number, row: number): number => (7 - row) * 8 + file;

/** Distancia «de rey» entre dos casillas. */
export const chebyshev = (a: number, b: number): number =>
  Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rowOf(a) - rowOf(b)));

/** `transform` que coloca una pieza en su casilla (porcentajes de su propio tamaño = casillas). */
export const placeAt = (sq: number): string => `translate(${fileOf(sq) * 100}%, ${rowOf(sq) * 100}%)`;

/**
 * Orden de apilado: la pieza más cercana a quien la mira va delante. Con las piezas derechas para
 * Blancas (0°) eso son las filas de abajo; giradas (180°), las de arriba.
 */
export const pieceZ = (sq: number, orientation: Orientation): number =>
  orientation === 0 ? rowOf(sq) + 1 : 8 - rowOf(sq);
