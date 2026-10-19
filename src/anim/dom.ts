import { fileOf, rowOf } from './geometry';
import type { Orientation } from './timing';

/**
 * Constructores de DOM para lo que el director crea por su cuenta (fantasmas que se rompen,
 * chispas, anillos). La estructura de la pieza es la misma que renderiza `PieceView`:
 *
 *   .piece > .piece-shadow
 *          > .piece-lift > .piece-face > img.piece-img
 */

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

export interface PieceParts {
  readonly root: HTMLElement;
  readonly shadow: HTMLElement;
  readonly lift: HTMLElement;
  readonly face: HTMLElement;
  readonly img: HTMLImageElement;
}

export function buildPiece(src: string, sq: number, orientation: Orientation, z: number): PieceParts {
  const root = make('div', 'piece fx-piece');
  root.style.setProperty('--f', String(fileOf(sq)));
  root.style.setProperty('--r', String(rowOf(sq)));
  root.style.setProperty('--z', String(z));
  root.style.setProperty('--a', `${orientation}deg`);
  const shadow = make('span', 'piece-shadow');
  const lift = make('div', 'piece-lift');
  const face = make('div', 'piece-face');
  const img = make('img', 'piece-img');
  img.src = src;
  img.alt = '';
  img.draggable = false;
  img.decoding = 'sync';
  face.append(img);
  lift.append(face);
  root.append(shadow, lift);
  return { root, shadow, lift, face, img };
}

/** Cortes diagonales que tesela el lienzo de la pieza en 4 esquirlas. */
const SHARD_CLIPS = [
  'polygon(0% 0%, 100% 0%, 100% 34%, 0% 46%)',
  'polygon(0% 46%, 100% 34%, 100% 66%, 0% 74%)',
  'polygon(48% 70.2%, 100% 66%, 100% 100%, 52% 100%)',
  'polygon(0% 74%, 48% 70.2%, 52% 100%, 0% 100%)',
] as const;

/** Añade 4 esquirlas (ocultas) a un fantasma; cada una vuela por separado al romperse. */
export function addShards(root: HTMLElement, src: string): HTMLElement[] {
  return SHARD_CLIPS.map((clip) => {
    const lift = make('div', 'piece-lift');
    lift.style.opacity = '0';
    const face = make('div', 'piece-face');
    const img = make('img', 'piece-img');
    img.src = src;
    img.alt = '';
    img.draggable = false;
    img.decoding = 'sync';
    img.style.clipPath = clip;
    face.append(img);
    lift.append(face);
    root.append(lift);
    return lift;
  });
}

/** Contenedor posicionado en una casilla (ancla para anillos, destellos y chispas). */
export function buildAnchor(sq: number): HTMLElement {
  const anchor = make('div', 'fx-at');
  anchor.style.setProperty('--f', String(fileOf(sq)));
  anchor.style.setProperty('--r', String(rowOf(sq)));
  return anchor;
}

export function buildRing(color: string): HTMLElement {
  const ring = make('div', 'fx-ring');
  ring.style.setProperty('--ring', color);
  return ring;
}

export function buildGlow(color: string): HTMLElement {
  const glow = make('div', 'fx-glow');
  glow.style.setProperty('--ring', color);
  return glow;
}

export function buildSpark(color: string): HTMLElement {
  const spark = make('div', 'fx-spark');
  spark.style.setProperty('--spark', color);
  return spark;
}

export function buildTrail(): HTMLElement {
  return make('div', 'fx-trail');
}
