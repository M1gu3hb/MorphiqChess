import { colorOfCode, kingSquare, opposite, typeOfCode, type Color, type PieceType } from '../engine';
import type { Ply, Transition } from '../game';
import {
  addShards,
  buildAnchor,
  buildGlow,
  buildPiece,
  buildRing,
  buildSpark,
  buildTrail,
  type PieceParts,
} from './dom';
import { chebyshev, fileOf, pieceZ, placeAt, rowOf } from './geometry';
import {
  DROP_SETTLE_MS,
  EASE_MOVE,
  EASE_OUT,
  EASE_SPIN,
  IMPACT_GAP_MS,
  SPIN_LEAD_MS,
  SPIN_MS,
  SPIN_STAGGER_MS,
  glideMs,
  type MotionMode,
  type Orientation,
} from './timing';
import type { DirectorOptions, DirectorTargets, DropHint, Frame } from './types';

export interface DirectorUpdate {
  readonly frame: Frame;
  readonly transition: Transition;
  readonly motion: MotionMode;
  /** Si la jugada vino de arrastrar una pieza: de dónde la soltó la persona. */
  readonly drop?: DropHint | null;
}

type Hop = 'none' | 'step' | 'jump';

/** d4: punto desde el que se propaga el giro cuando no hay una pieza que lo origine. */
const CENTER_SQUARE = 27;

interface Parts {
  readonly lift: HTMLElement;
  readonly face: HTMLElement;
  readonly shadow: HTMLElement;
}

function partsOf(piece: HTMLElement): Parts | null {
  const lift = piece.querySelector<HTMLElement>('.piece-lift');
  const face = piece.querySelector<HTMLElement>('.piece-face');
  const shadow = piece.querySelector<HTMLElement>('.piece-shadow');
  return lift && face && shadow ? { lift, face, shadow } : null;
}

const colorVar = (color: Color): readonly string[] =>
  color === 'w'
    ? ['var(--sq-light)', '#9cc4ff', '#ffffff']
    : ['var(--accent)', 'var(--brand)', '#7fd8ff'];

/**
 * Director de animaciones del tablero.
 *
 * Idea central: React ya pintó el estado FINAL (cada pieza en su casilla y orientación definitivas).
 * El director solo «reproduce hacia ese estado» con la Web Animations API: parte de la posición
 * anterior y llega a la actual. Así nunca hay estados intermedios que se desincronicen, y cancelar
 * una animación equivale a saltar al final (`cancel()` devuelve el estilo real del elemento).
 */
export class Director {
  private prev: Frame | null = null;
  private animations: Animation[] = [];
  private temporary: HTMLElement[] = [];
  private sentinel: Animation | null = null;
  private endMs = 0;
  private cellPx = 0;

  constructor(
    private readonly targets: DirectorTargets,
    private readonly options: DirectorOptions,
  ) {}

  /** Salta al estado final de lo que esté animándose (p. ej. si la persona ya tocó el tablero). */
  finish(): void {
    this.cancelAll();
  }

  destroy(): void {
    this.cancelAll();
    this.prev = null;
  }

  update({ frame, transition, motion, drop = null }: DirectorUpdate): void {
    const previous = this.prev;
    this.prev = frame;
    this.cancelAll();
    this.cellPx = this.targets.pieces.getBoundingClientRect().width / 8;

    // Primer dibujo o partida nueva.
    if (previous === null || previous.gameId !== frame.gameId || transition.type === 'reset') {
      this.clearDrop(drop);
      if (motion === 'full') this.entrance(frame);
      this.armCleanup();
      return;
    }

    // Mismo estado de partida (cambió un ajuste, p. ej. el giro de piezas): solo la orientación.
    if (previous.revision === frame.revision) {
      this.clearDrop(drop);
      if (motion === 'full') this.spin(previous.orientation, frame.orientation, 0, CENTER_SQUARE);
      this.armCleanup();
      return;
    }

    if (motion === 'reduced') {
      this.updateReduced(previous, frame, drop);
      this.armCleanup();
      return;
    }

    switch (transition.type) {
      case 'forward':
        this.choreograph(previous, frame, transition.ply, 'forward', drop);
        break;
      case 'backward':
        this.choreograph(previous, frame, transition.ply, 'backward', drop);
        break;
      case 'jump':
        this.clearDrop(drop);
        this.jump(previous, frame);
        break;
      default:
        this.clearDrop(drop);
        this.spin(previous.orientation, frame.orientation, 0, CENTER_SQUARE);
    }
    this.armCleanup();
  }

  /* ------------------------------------------------------------------ */
  /* Coreografías                                                         */
  /* ------------------------------------------------------------------ */

  /** Entrada de una partida nueva: las piezas «bajan» a su casilla en una ola diagonal. */
  private entrance(frame: Frame): void {
    for (const [id, piece] of this.pieceElements()) {
      const sq = frame.squareOf[id];
      const parts = partsOf(piece);
      if (sq === undefined || sq < 0 || !parts) continue;
      const delay = (fileOf(sq) + rowOf(sq)) * 24;
      const timing = { duration: 520, delay, easing: EASE_OUT, fill: 'backwards' as const };
      this.run(
        parts.lift,
        [
          { opacity: 0, transform: 'translateY(-38%) scale(1.16)' },
          { opacity: 1, transform: 'translateY(0) scale(1)' },
        ],
        timing,
      );
      this.run(parts.shadow, [{ opacity: 0 }, { opacity: 1 }], timing);
    }
  }

  /** Salto a otra jugada del historial (inicio, final, varias a la vez): todo se desliza a la vez. */
  private jump(prev: Frame, next: Frame): void {
    const elements = this.pieceElements();
    const D = 460;
    for (const [id, piece] of elements) {
      const to = next.squareOf[id] ?? -1;
      const from = prev.squareOf[id] ?? -1;
      if (to < 0) continue;
      if (from < 0) {
        // Reaparece una pieza capturada en el tramo que se rebobinó.
        const parts = partsOf(piece);
        if (parts) this.appear(parts, 180);
        continue;
      }
      if (from !== to) this.glide(piece, from, to, D, 0, 'none');
    }
    // Las que ya no están en la posición de destino se desvanecen donde estaban.
    for (let id = 0; id < 64; id++) {
      const from = prev.squareOf[id] ?? -1;
      if (from < 0 || (next.squareOf[id] ?? -1) >= 0) continue;
      const code = prev.board[from]!;
      const ghost = this.ghost(colorOfCode(code), typeOfCode(code), from, prev.orientation);
      this.run(ghost.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' });
    }
    this.spin(prev.orientation, next.orientation, D - SPIN_LEAD_MS, null);
  }

  /** Una jugada (hacia delante o hacia atrás): desplazamiento, captura, coronación, jaque/mate y giro. */
  private choreograph(
    prev: Frame,
    next: Frame,
    ply: Ply,
    direction: 'forward' | 'backward',
    drop: DropHint | null,
  ): void {
    const { move } = ply;
    const forward = direction === 'forward';
    const visualFrom = forward ? move.from : move.to;
    const visualTo = forward ? move.to : move.from;
    const moverId = next.ids[visualTo] ?? -1;
    const dropped = forward && drop !== null && drop.id === moverId;
    const distance = Math.hypot(
      fileOf(visualTo) - fileOf(visualFrom),
      rowOf(visualTo) - rowOf(visualFrom),
    );
    const D = dropped ? DROP_SETTLE_MS : glideMs(distance);
    const elements = this.pieceElements();
    const attack = Math.atan2(rowOf(visualTo) - rowOf(visualFrom), fileOf(visualTo) - fileOf(visualFrom));
    if (!dropped) this.clearDrop(drop);

    // 1) Piezas que cambian de casilla (la que mueve y, en el enroque, la torre).
    for (let sq = 0; sq < 64; sq++) {
      const id = next.ids[sq]!;
      if (id < 0) continue;
      const from = prev.squareOf[id] ?? -1;
      if (from < 0 || from === sq) continue;
      const piece = elements.get(id);
      if (!piece) continue;

      if (id !== moverId) {
        const rookMs = glideMs(Math.hypot(fileOf(sq) - fileOf(from), rowOf(sq) - rowOf(from)));
        this.glide(piece, from, sq, rookMs, 70, 'step');
        continue;
      }

      const before = prev.board[from]!;
      const after = next.board[sq]!;
      if (typeOfCode(before) !== typeOfCode(after)) {
        this.transformMover(piece, before, from, sq, D, prev.orientation);
      } else if (dropped && drop) {
        piece.style.translate = '';
        this.run(
          piece,
          [
            { translate: `${drop.dx}px ${drop.dy}px`, zIndex: 60 },
            { translate: '0px 0px', zIndex: 60 },
          ],
          { duration: D, easing: EASE_OUT },
        );
      } else {
        this.glide(piece, from, sq, D, 0, typeOfCode(after) === 'n' ? 'jump' : 'step');
        if (typeOfCode(after) !== 'n') this.trail(from, sq, D);
      }
    }

    // 2) Capturas.
    if (move.capture) {
      const captureSq = move.captureSquare ?? move.to;
      const capturedColor = opposite(move.color);
      if (forward) {
        this.shatterCapture(capturedColor, move.capture, captureSq, prev.orientation, attack, Math.max(0, D - 90));
        this.ring(move.to, 'var(--accent)', Math.max(0, D - 50), { to: 1.55, ms: 520 });
      } else {
        const revived = elements.get(ply.capturedId);
        const parts = revived ? partsOf(revived) : null;
        if (parts) this.appear(parts, D * 0.55);
        this.ring(captureSq, 'var(--accent)', D * 0.55, { to: 1.4, ms: 520 });
      }
    }

    // 3) Jaque y jaque mate (solo al jugar hacia delante).
    if (forward && ply.check) {
      const king = kingSquare(next.board, opposite(move.color));
      const at = D + IMPACT_GAP_MS;
      if (ply.mate) this.mateEffects(king, at);
      else this.checkEffects(king, at);
    }

    // 4) Al terminar el turno, todas las piezas giran para quedar derechas frente a quien juega.
    this.spin(prev.orientation, next.orientation, Math.max(0, D - SPIN_LEAD_MS), visualTo);
  }

  /** Coronación: la pieza «vieja» viaja como fantasma y la nueva emerge con un destello al llegar. */
  private transformMover(
    piece: HTMLElement,
    beforeCode: number,
    from: number,
    to: number,
    D: number,
    orientation: Orientation,
  ): void {
    const parts = partsOf(piece);
    // El fantasma lleva la imagen anterior y la orientación que tenía la pieza antes de la jugada.
    const ghost = this.ghost(colorOfCode(beforeCode), typeOfCode(beforeCode), from, orientation);
    ghost.root.style.setProperty('--z', '60');
    this.glide(ghost.root, from, to, D, 0, typeOfCode(beforeCode) === 'n' ? 'jump' : 'step');
    this.run(ghost.root, [{ opacity: 1 }, { opacity: 1, offset: 0.98 }, { opacity: 0 }], {
      duration: D + 1,
      fill: 'forwards',
    });
    this.run(piece, [{ opacity: 0 }, { opacity: 0 }], { duration: D, fill: 'backwards' });
    if (parts) {
      this.run(
        parts.lift,
        [
          { opacity: 0, scale: 0.55 },
          { opacity: 1, scale: 1.22, offset: 0.55 },
          { opacity: 1, scale: 1 },
        ],
        { duration: 520, delay: D, easing: EASE_OUT, fill: 'backwards' },
      );
    }
    this.ring(to, 'var(--accent)', D, { to: 1.8, ms: 640 });
    this.glow(to, 'var(--accent)', D, 700);
    this.sparks(to, 12, ['var(--accent)', '#ffffff', 'var(--brand)'], {
      angle: -Math.PI / 2,
      spread: Math.PI * 1.3,
      reach: 1.1,
      delay: D,
    });
  }

  /** Captura: la pieza se hace añicos justo antes de que llegue la que captura. */
  private shatterCapture(
    color: Color,
    type: PieceType,
    sq: number,
    orientation: Orientation,
    attack: number,
    delay: number,
  ): void {
    const src = this.options.pieceSrc(color, type);
    const ghost = this.ghost(color, type, sq, orientation);
    const shards = addShards(ghost.root, src);

    this.run(ghost.lift, [{ opacity: 0 }, { opacity: 0 }], { duration: 1, delay, fill: 'forwards' });
    this.run(ghost.shadow, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay, fill: 'forwards' });

    const cell = this.cellPx;
    const bursts = [
      [-0.45, -0.85, -38],
      [0.7, -0.45, 32],
      [0.6, 0.3, 52],
      [-0.65, 0.25, -44],
    ] as const;
    shards.forEach((shard, index) => {
      const [bx, by, rot] = bursts[index]!;
      const push = 0.6 + Math.random() * 0.4;
      const tx = (Math.cos(attack) * push + bx) * cell * 0.95;
      const ty = (Math.sin(attack) * push + by) * cell * 0.95;
      this.run(
        shard,
        [
          { opacity: 1, transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
          {
            opacity: 1,
            transform: `translate(${tx * 0.65}px, ${ty * 0.65 - cell * 0.18}px) rotate(${rot * 0.7}deg) scale(0.92)`,
            offset: 0.4,
          },
          {
            opacity: 0,
            transform: `translate(${tx}px, ${ty + cell * 0.55}px) rotate(${rot * 1.6}deg) scale(0.5)`,
          },
        ],
        { duration: 620, delay, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)', fill: 'forwards' },
      );
    });

    this.sparks(sq, 14, colorVar(color), { angle: attack, spread: Math.PI * 1.25, reach: 1.25, delay });
  }

  private checkEffects(king: number, at: number): void {
    this.ring(king, 'var(--danger)', at, { to: 2.1, ms: 760 });
    this.ring(king, 'var(--danger)', at + 170, { to: 1.5, ms: 640 });
    this.glow(king, 'var(--danger)', at, 760);
    this.sparks(king, 8, ['var(--danger)', '#ffffff'], { angle: 0, spread: Math.PI * 2, reach: 0.9, delay: at });
  }

  private mateEffects(king: number, at: number): void {
    this.ring(king, 'var(--danger)', at, { to: 3.4, ms: 980 });
    this.ring(king, 'var(--danger)', at + 160, { to: 2.6, ms: 900 });
    this.ring(king, '#ffffff', at + 320, { to: 1.9, ms: 800 });
    this.glow(king, 'var(--danger)', at, 1100, 3.4);
    this.sparks(king, 20, ['var(--danger)', '#ffffff', '#ffb3c0'], {
      angle: 0,
      spread: Math.PI * 2,
      reach: 1.6,
      delay: at,
      ms: 760,
    });

    // Destello rojo sobre el tablero, centrado en el rey.
    const { flash, board } = this.targets;
    const x = ((fileOf(king) + 0.5) / 8) * 100;
    const y = ((rowOf(king) + 0.5) / 8) * 100;
    flash.style.background = `radial-gradient(circle at ${x}% ${y}%, rgb(255 77 106 / 0.85), rgb(255 77 106 / 0) 62%)`;
    this.run(flash, [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0 }], {
      duration: 900,
      delay: at,
      easing: 'ease-out',
    });

    // Pequeño temblor del tablero.
    this.run(
      board,
      [
        { translate: '0 0' },
        { translate: '-0.7% 0.35%' },
        { translate: '0.6% -0.3%' },
        { translate: '-0.35% 0.2%' },
        { translate: '0 0' },
      ],
      { duration: 440, delay: at, easing: 'linear' },
    );
  }

  /* ------------------------------------------------------------------ */
  /* Piezas sueltas                                                       */
  /* ------------------------------------------------------------------ */

  /** Desliza un elemento de pieza de una casilla a otra, con un pequeño salto opcional. */
  private glide(el: HTMLElement, from: number, to: number, duration: number, delay: number, hop: Hop): void {
    this.run(
      el,
      [
        { transform: placeAt(from), zIndex: 60 },
        { transform: placeAt(to), zIndex: 60 },
      ],
      { duration, delay, easing: EASE_MOVE, fill: 'backwards' },
    );
    const parts = partsOf(el);
    if (hop === 'none' || !parts) return;
    const high = hop === 'jump';
    this.run(
      parts.lift,
      [
        { transform: 'translateY(0) scale(1)' },
        { transform: `translateY(${high ? -18 : -7}%) scale(${high ? 1.22 : 1.07})`, offset: 0.5 },
        { transform: 'translateY(0) scale(1)' },
      ],
      { duration, delay, easing: 'ease-in-out' },
    );
    this.run(
      parts.shadow,
      [
        { opacity: 1, scale: 1 },
        { opacity: high ? 0.45 : 0.65, scale: high ? 0.78 : 0.88, offset: 0.5 },
        { opacity: 1, scale: 1 },
      ],
      { duration, delay, easing: 'ease-in-out' },
    );
  }

  /** Una pieza que reaparece (al deshacer una captura): se materializa con un pequeño rebote. */
  private appear(parts: Parts, delay: number): void {
    const timing = { duration: 440, delay, easing: EASE_OUT, fill: 'backwards' as const };
    this.run(
      parts.lift,
      [
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1.12, offset: 0.6 },
        { opacity: 1, scale: 1 },
      ],
      timing,
    );
    this.run(parts.shadow, [{ opacity: 0 }, { opacity: 1 }], timing);
  }

  /** Estela luminosa entre la casilla de origen y la de destino. */
  private trail(from: number, to: number, ms: number): void {
    const node = buildTrail();
    const df = fileOf(to) - fileOf(from);
    const dr = rowOf(to) - rowOf(from);
    const rotate = `rotate(${Math.atan2(dr, df)}rad)`;
    node.style.left = `${(fileOf(from) + 0.5) * 12.5}%`;
    node.style.top = `${(rowOf(from) + 0.5) * 12.5}%`;
    node.style.width = `${Math.hypot(df, dr) * 12.5}%`;
    this.targets.fx.append(node);
    this.temporary.push(node);
    this.run(
      node,
      [
        { opacity: 0, transform: `${rotate} scaleX(0)` },
        { opacity: 0.8, transform: `${rotate} scaleX(0.7)`, offset: 0.5 },
        { opacity: 0, transform: `${rotate} scaleX(1)` },
      ],
      { duration: ms + 240, easing: EASE_MOVE, fill: 'forwards' },
    );
  }

  /* ------------------------------------------------------------------ */
  /* Giro de las piezas                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Gira todas las piezas 180° sobre su propio eje. Siempre en el mismo sentido (horario):
   * 0→180 y 180→360 (que equivale visualmente a 0°). Con `origin`, el giro se propaga en ola
   * desde la casilla indicada.
   */
  private spin(from: Orientation, to: Orientation, delay: number, origin: number | null): void {
    if (from === to) return;
    const start = from === 0 ? 0 : 180;
    const end = start + 180;
    for (const [, piece] of this.pieceElements()) {
      const parts = partsOf(piece);
      if (!parts) continue;
      const sq = Number(piece.dataset.sq);
      const stagger = origin === null || Number.isNaN(sq) ? 0 : chebyshev(sq, origin) * SPIN_STAGGER_MS;
      const timing = {
        duration: SPIN_MS,
        delay: delay + stagger,
        easing: EASE_SPIN,
        fill: 'backwards' as const,
      };
      const turn = [{ rotate: `${start}deg` }, { rotate: `${end}deg` }];
      this.run(parts.face, turn, timing);
      this.run(parts.shadow, turn, timing);
      this.run(parts.lift, [{ scale: 1 }, { scale: 1.1, offset: 0.5 }, { scale: 1 }], {
        ...timing,
        easing: 'ease-in-out',
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Movimiento reducido                                                  */
  /* ------------------------------------------------------------------ */

  /** Sin desplazamientos ni giros: solo un destello breve en las piezas que cambiaron de casilla. */
  private updateReduced(prev: Frame, next: Frame, drop: DropHint | null): void {
    this.clearDrop(drop);
    for (const [id, piece] of this.pieceElements()) {
      const from = prev.squareOf[id] ?? -1;
      const to = next.squareOf[id] ?? -1;
      if (to < 0 || from === to) continue;
      const parts = partsOf(piece);
      if (parts) this.run(parts.lift, [{ opacity: 0.35 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Efectos genéricos                                                    */
  /* ------------------------------------------------------------------ */

  private ring(sq: number, color: string, delay: number, options: { to?: number; ms?: number } = {}): void {
    const anchor = buildAnchor(sq);
    const ring = buildRing(color);
    anchor.append(ring);
    this.targets.fx.append(anchor);
    this.temporary.push(anchor);
    this.run(
      ring,
      [
        { opacity: 0.95, transform: 'scale(0.3)' },
        { opacity: 0, transform: `scale(${options.to ?? 1.7})` },
      ],
      { duration: options.ms ?? 640, delay, easing: EASE_OUT, fill: 'forwards' },
    );
  }

  private glow(sq: number, color: string, delay: number, ms: number, to = 1.8): void {
    const anchor = buildAnchor(sq);
    const glow = buildGlow(color);
    anchor.append(glow);
    this.targets.fx.append(anchor);
    this.temporary.push(anchor);
    this.run(
      glow,
      [
        { opacity: 0, transform: 'scale(0.5)' },
        { opacity: 0.75, transform: `scale(${to * 0.55})`, offset: 0.25 },
        { opacity: 0, transform: `scale(${to})` },
      ],
      { duration: ms, delay, easing: 'ease-out', fill: 'forwards' },
    );
  }

  private sparks(
    sq: number,
    count: number,
    colors: readonly string[],
    options: { angle: number; spread: number; reach: number; delay: number; ms?: number },
  ): void {
    const anchor = buildAnchor(sq);
    this.targets.fx.append(anchor);
    this.temporary.push(anchor);
    const cell = this.cellPx;
    for (let i = 0; i < count; i++) {
      const spark = buildSpark(colors[i % colors.length]!);
      anchor.append(spark);
      const angle = options.angle + (Math.random() - 0.5) * options.spread;
      const reach = cell * options.reach * (0.45 + Math.random() * 0.75);
      const dx = Math.cos(angle) * reach;
      const dy = Math.sin(angle) * reach;
      const spin = (Math.random() - 0.5) * 540;
      this.run(
        spark,
        [
          { opacity: 1, transform: 'translate(0px, 0px) rotate(0deg) scale(1)' },
          {
            opacity: 1,
            transform: `translate(${dx * 0.7}px, ${dy * 0.7 - cell * 0.1}px) rotate(${spin * 0.6}deg) scale(0.9)`,
            offset: 0.45,
          },
          {
            opacity: 0,
            transform: `translate(${dx}px, ${dy + cell * 0.25}px) rotate(${spin}deg) scale(0.2)`,
          },
        ],
        {
          duration: (options.ms ?? 560) * (0.75 + Math.random() * 0.5),
          delay: options.delay,
          easing: EASE_OUT,
          fill: 'forwards',
        },
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* Infraestructura                                                      */
  /* ------------------------------------------------------------------ */

  private ghost(color: Color, type: PieceType, sq: number, orientation: Orientation): PieceParts {
    const parts = buildPiece(this.options.pieceSrc(color, type), sq, orientation, pieceZ(sq, orientation));
    this.targets.pieces.append(parts.root);
    this.temporary.push(parts.root);
    return parts;
  }

  private pieceElements(): Map<number, HTMLElement> {
    const map = new Map<number, HTMLElement>();
    for (const piece of this.targets.pieces.querySelectorAll<HTMLElement>('.piece[data-id]')) {
      map.set(Number(piece.dataset.id), piece);
    }
    return map;
  }

  private clearDrop(drop: DropHint | null): void {
    if (!drop) return;
    const piece = this.pieceElements().get(drop.id);
    if (piece) piece.style.translate = '';
  }

  private run(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions & { duration: number }): Animation {
    const animation = el.animate(keyframes, options);
    this.animations.push(animation);
    const delay = typeof options.delay === 'number' ? options.delay : 0;
    this.endMs = Math.max(this.endMs, delay + options.duration);
    return animation;
  }

  /** Una animación «centinela» avisa cuando acabó todo lo programado para retirar los elementos temporales. */
  private armCleanup(): void {
    if (this.animations.length === 0 && this.temporary.length === 0) return;
    const sentinel = this.targets.fx.animate([{ opacity: 1 }, { opacity: 1 }], { duration: this.endMs + 100 });
    sentinel.onfinish = () => {
      if (this.sentinel !== sentinel) return;
      this.cleanupTemporary();
      this.animations = [];
      this.sentinel = null;
      this.endMs = 0;
    };
    this.sentinel = sentinel;
  }

  private cancelAll(): void {
    for (const animation of this.animations) animation.cancel();
    this.sentinel?.cancel();
    this.sentinel = null;
    this.animations = [];
    this.endMs = 0;
    this.cleanupTemporary();
  }

  private cleanupTemporary(): void {
    for (const node of this.temporary) node.remove();
    this.temporary = [];
  }
}
