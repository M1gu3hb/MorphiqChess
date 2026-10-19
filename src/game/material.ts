import type { Color, PieceType } from '../engine';
import type { GameSnapshot } from './types';

/** Orden en que se muestran las piezas capturadas: de la más a la menos valiosa. */
export const CAPTURE_ORDER: readonly PieceType[] = ['q', 'r', 'b', 'n', 'p'];

const VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface MaterialTally {
  /** Piezas que ha capturado cada bando, por tipo, hasta la jugada que se está viendo. */
  readonly captured: Record<Color, Partial<Record<PieceType, number>>>;
  /** Valor de lo capturado por cada bando (peón 1, caballo y alfil 3, torre 5, dama 9). */
  readonly points: Record<Color, number>;
}

export function tallyMaterial(game: GameSnapshot): MaterialTally {
  const captured: MaterialTally['captured'] = { w: {}, b: {} };
  const points: Record<Color, number> = { w: 0, b: 0 };
  for (let i = 0; i < game.cursor; i++) {
    const { move } = game.plies[i]!;
    if (!move.capture) continue;
    captured[move.color][move.capture] = (captured[move.color][move.capture] ?? 0) + 1;
    points[move.color] += VALUE[move.capture];
  }
  return { captured, points };
}

/** Ventaja de material de un bando; 0 si va igual o por debajo. */
export function leadOf(tally: MaterialTally, side: Color): number {
  const other: Color = side === 'w' ? 'b' : 'w';
  return Math.max(0, tally.points[side] - tally.points[other]);
}
