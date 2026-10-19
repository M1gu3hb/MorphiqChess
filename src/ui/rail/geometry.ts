/**
 * Cuentas del cajón lateral. Están aparte del DOM para poder probarlas con números.
 */

export interface PushInput {
  /** Ancho visible de la pantalla. */
  readonly viewport: number;
  /** Ancho del cajón completo (asa + panel). */
  readonly rail: number;
  /** Posición izquierda y ancho del tablero sin transformar. */
  readonly boardLeft: number;
  readonly boardWidth: number;
  /** Aire mínimo entre el tablero y el cajón o el borde de la pantalla. */
  readonly gap: number;
}

export interface Push {
  /** Escala del tablero con el cajón abierto (≤ 1). */
  readonly scale: number;
  /** Desplazamiento horizontal en px (≤ 0): el tablero se corre a la izquierda. */
  readonly shift: number;
}

const MIN_SCALE = 0.5;

/**
 * Con el cajón abierto el tablero se encoge y se corre lo justo para seguir entero a la vista,
 * a la izquierda del cajón. Si ya cabe, no se mueve.
 */
export function pushGeometry({ viewport, rail, boardLeft, boardWidth, gap }: PushInput): Push {
  if (boardWidth <= 0) return { scale: 1, shift: 0 };
  const free = viewport - rail - 2 * gap;
  const scale = Math.max(MIN_SCALE, Math.min(1, free / boardWidth));
  const center = boardLeft + boardWidth / 2;
  const rightEdge = center + (boardWidth * scale) / 2;
  const limit = viewport - rail - gap;
  return { scale, shift: Math.min(0, limit - rightEdge) };
}

/** Velocidad (fracción del recorrido por ms) a partir de la cual un gesto cuenta como «lanzado». */
export const FLICK = 0.0015;

/**
 * ¿Queda abierto al soltar? Un lanzamiento rápido manda; si no, se queda del lado en que está más cerca.
 * `velocity` es positiva cuando el dedo va abriendo.
 */
export function settleOpen(progress: number, velocity: number): boolean {
  if (Math.abs(velocity) > FLICK) return velocity > 0;
  return progress >= 0.5;
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Jugada elegida al tocar o arrastrar a `offset` px del inicio de la guía (0 = arriba). */
export function scrubValue(offset: number, size: number, thumb: number, max: number): number {
  if (max <= 0) return 0;
  const span = Math.max(1, size - thumb);
  return Math.round(clamp01((offset - thumb / 2) / span) * max);
}

/** Posición (0 a 1) del control a lo largo de la guía. */
export function scrubFraction(value: number, max: number): number {
  return max <= 0 ? 0 : clamp01(value / max);
}
