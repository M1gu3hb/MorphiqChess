import type { Color, PieceType } from '../engine';
import bb from '../assets/pieces/bb.webp';
import bk from '../assets/pieces/bk.webp';
import bn from '../assets/pieces/bn.webp';
import bp from '../assets/pieces/bp.webp';
import bq from '../assets/pieces/bq.webp';
import br from '../assets/pieces/br.webp';
import wb from '../assets/pieces/wb.webp';
import wk from '../assets/pieces/wk.webp';
import wn from '../assets/pieces/wn.webp';
import wp from '../assets/pieces/wp.webp';
import wq from '../assets/pieces/wq.webp';
import wr from '../assets/pieces/wr.webp';

/** Arte de las piezas: 'w' = blancas, 'b' = azules (la fila superior de la hoja original). */
export const PIECE_SRC: Record<Color, Record<PieceType, string>> = {
  w: { k: wk, q: wq, r: wr, b: wb, n: wn, p: wp },
  b: { k: bk, q: bq, r: br, b: bb, n: bn, p: bp },
};

/** Proporción del lienzo de cada pieza (156 × 260). */
export const PIECE_ASPECT = 156 / 260;

let preloaded = false;

/** Descarga y decodifica las 12 imágenes por adelantado para que ninguna parpadee al aparecer. */
export function preloadPieces(): void {
  if (preloaded || typeof Image === 'undefined') return;
  preloaded = true;
  for (const color of ['w', 'b'] as const) {
    for (const src of Object.values(PIECE_SRC[color])) {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
      void image.decode?.().catch(() => undefined);
    }
  }
}
