import type { Color, PieceType } from '../engine';
import type { Orientation } from './timing';

/**
 * Lo mínimo de una posición que necesita el director para animar: qué pieza (id estable) está
 * en cada casilla y hacia dónde miran. No conoce reglas ni React.
 */
export interface Frame {
  readonly gameId: number;
  readonly revision: number;
  /** Código de pieza por casilla (+blancas / −azules). */
  readonly board: Int8Array;
  /** Id estable de pieza por casilla (−1 = vacía). */
  readonly ids: Int16Array;
  /** Casilla por id (−1 = fuera del tablero). Se indexa con el id de la pieza. */
  readonly squareOf: Int16Array;
  readonly orientation: Orientation;
  /** Vista de Azules: el tablero se ve girado 180° (ver `viewSq`). */
  readonly flipped: boolean;
}

export function makeFrame(
  gameId: number,
  revision: number,
  board: Int8Array,
  ids: Int16Array,
  orientation: Orientation,
  flipped = false,
): Frame {
  const squareOf = new Int16Array(64).fill(-1);
  for (let sq = 0; sq < 64; sq++) {
    const id = ids[sq]!;
    if (id >= 0) squareOf[id] = sq;
  }
  return { gameId, revision, board, ids, squareOf, orientation, flipped };
}

/** Pieza soltada tras arrastrar: desplazamiento (px) respecto al centro de su casilla de destino. */
export interface DropHint {
  readonly id: number;
  readonly dx: number;
  readonly dy: number;
}

export interface DirectorTargets {
  /** Raíz del tablero (para el temblor del mate). */
  readonly board: HTMLElement;
  /** Capa de piezas (renderizada por React). */
  readonly pieces: HTMLElement;
  /** Capa de efectos (solo la toca el director). */
  readonly fx: HTMLElement;
  /** Velo de color para el destello del mate. */
  readonly flash: HTMLElement;
}

export interface DirectorOptions {
  /** URL de la imagen de una pieza (para los «fantasmas» que se rompen o se transforman). */
  readonly pieceSrc: (color: Color, type: PieceType) => string;
}
