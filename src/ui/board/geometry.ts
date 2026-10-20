/**
 * Medidas del tablero original (1254 × 1254). Las capas del tablero se colocan con estas
 * proporciones, así el diseño se escala a cualquier tamaño sin medir píxeles.
 */
export { fileOf, rowOf, squareAt, pieceZ, viewSq } from '../../anim/geometry';

export const VIEW_SIZE = 1254;
export const GRID = { x: 82, y: 83, size: 1092 } as const;
export const CELL = GRID.size / 8;
