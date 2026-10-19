import type { Move } from '../engine';

export type Orientation = 0 | 180;
export type MotionMode = 'full' | 'reduced';

/** Curvas y duraciones de la coreografía. Un solo lugar para ajustar el «tacto» del juego. */
export const EASE_MOVE = 'cubic-bezier(0.45, 0.05, 0.2, 1)';
export const EASE_SPIN = 'cubic-bezier(0.55, 0.05, 0.2, 1)';
export const EASE_OUT = 'cubic-bezier(0.15, 0.75, 0.25, 1)';

/** Duración del giro de 180° de cada pieza. */
export const SPIN_MS = 720;
/** Retraso extra por casilla de distancia al punto de impacto: el giro «viaja» por el tablero. */
export const SPIN_STAGGER_MS = 18;
/** El giro empieza un poco antes de que la pieza termine de llegar. */
export const SPIN_LEAD_MS = 90;

/** Tiempo que tarda el asentamiento tras arrastrar y soltar una pieza. */
export const DROP_SETTLE_MS = 150;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Duración del desplazamiento según la distancia (en casillas): se nota el recorrido sin hacerse lento. */
export function glideMs(distance: number): number {
  return Math.round(clamp(330 + distance * 80, 380, 760));
}

export function moveDistance(move: Move): number {
  const df = (move.to & 7) - (move.from & 7);
  const dr = (move.to >> 3) - (move.from >> 3);
  return Math.hypot(df, dr);
}

/**
 * Milisegundos hasta que la pieza llega a su casilla. Lo usa el director (para encadenar efectos)
 * y la interfaz (para retrasar el aviso de jaque y la caída del rey) sin duplicar la cuenta.
 */
export function arrivalMs(move: Move, motion: MotionMode): number {
  return motion === 'reduced' ? 0 : glideMs(moveDistance(move));
}

/** Pausa entre la llegada y el efecto de jaque/mate. */
export const IMPACT_GAP_MS = 40;
