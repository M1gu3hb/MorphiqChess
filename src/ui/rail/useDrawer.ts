import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { clamp01, pushGeometry, settleOpen } from './geometry';

const DURATION_MS = 280;
/** Recorrido mínimo para que un toque pase a ser arrastre. */
const TAP_SLOP = 6;
/** Aire entre el tablero encogido y el cajón. */
const GAP = 8;

interface Geometry {
  /** Cuánto sale el cajón de la pantalla cuando está cerrado (el ancho del panel). */
  readonly travel: number;
  readonly scale: number;
  readonly shift: number;
  /** Centro del tablero: el escalado se hace desde ahí. */
  readonly origin: string;
}

interface Drag {
  readonly id: number;
  readonly target: Element;
  readonly startX: number;
  readonly startProgress: number;
  readonly onGrip: boolean;
  lastX: number;
  lastTime: number;
  velocity: number;
  moved: boolean;
}

export interface DrawerOptions {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Sin animaciones: el cajón salta de un estado al otro. */
  readonly reduced: boolean;
  /** Escena (franjas + tablero): se encoge y se corre al abrir. */
  readonly stage: RefObject<HTMLElement | null>;
  readonly rail: RefObject<HTMLElement | null>;
  readonly panel: RefObject<HTMLElement | null>;
}

export interface DrawerHandlers {
  readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  /** Clic del asa (teclado o lector de pantalla). Los toques con puntero ya los resuelve el arrastre. */
  readonly onGripClick: () => void;
}

/**
 * Cajón lateral que se arrastra con el dedo. El avance (0 = cerrado, 1 = abierto) se aplica directo
 * a los estilos de la escena y del cajón, fotograma a fotograma, sin pasar por React: así el gesto
 * sigue al dedo sin tirones. React solo se entera de dónde quedó (abierto o cerrado) al soltar.
 */
export function useDrawer({ open, onOpenChange, reduced, stage, rail, panel }: DrawerOptions): DrawerHandlers {
  const progress = useRef(open ? 1 : 0);
  const geometry = useRef<Geometry>({ travel: 0, scale: 1, shift: 0, origin: '50% 50%' });
  const frame = useRef(0);
  const drag = useRef<Drag | null>(null);
  /** Cuándo terminó el último gesto que empezó en el asa (el clic que sigue a ese gesto ya está resuelto). */
  const lastGrip = useRef(-Infinity);

  /** Lee los tamaños reales (sin transformaciones) y calcula cuánto hay que mover y encoger. */
  const measure = useCallback(() => {
    const stageEl = stage.current;
    const railEl = rail.current;
    const panelEl = panel.current;
    const board = stageEl?.querySelector<HTMLElement>('.board');
    if (!stageEl || !railEl || !panelEl || !board) return;
    const previous = stageEl.style.transform;
    stageEl.style.transform = '';
    const stageBox = stageEl.getBoundingClientRect();
    const box = board.getBoundingClientRect();
    stageEl.style.transform = previous;
    const { scale, shift } = pushGeometry({
      viewport: document.documentElement.clientWidth,
      rail: railEl.offsetWidth,
      boardLeft: box.left,
      boardWidth: box.width,
      gap: GAP,
    });
    geometry.current = {
      travel: panelEl.offsetWidth,
      scale,
      shift,
      origin: `${box.left - stageBox.left + box.width / 2}px ${box.top - stageBox.top + box.height / 2}px`,
    };
  }, [stage, rail, panel]);

  const apply = useCallback(
    (value: number) => {
      progress.current = value;
      const g = geometry.current;
      const railEl = rail.current;
      const stageEl = stage.current;
      if (railEl) railEl.style.transform = `translate3d(${(1 - value) * g.travel}px, 0, 0)`;
      if (stageEl) {
        if (value <= 0) {
          stageEl.style.transform = '';
          stageEl.style.transformOrigin = '';
        } else {
          stageEl.style.transformOrigin = g.origin;
          stageEl.style.transform = `translate3d(${value * g.shift}px, 0, 0) scale(${1 - value * (1 - g.scale)})`;
        }
      }
    },
    [rail, stage],
  );

  const animateTo = useCallback(
    (target: 0 | 1) => {
      cancelAnimationFrame(frame.current);
      const from = progress.current;
      if (reduced || from === target) {
        apply(target);
        return;
      }
      const stageEl = stage.current;
      if (stageEl) stageEl.style.willChange = 'transform';
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        apply(from + (target - from) * eased);
        if (t < 1) frame.current = requestAnimationFrame(step);
        else if (stageEl) stageEl.style.willChange = '';
      };
      frame.current = requestAnimationFrame(step);
    },
    [apply, reduced, stage],
  );

  // Colocación inicial y cada vez que cambia el tamaño de la pantalla.
  useLayoutEffect(() => {
    const place = () => {
      measure();
      apply(progress.current);
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [measure, apply]);

  // Abrir o cerrar desde fuera: Escape, el menú, tocar fuera del cajón…
  useEffect(() => {
    if (drag.current) return;
    measure();
    animateTo(open ? 1 : 0);
  }, [open, measure, animateTo]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const onGrip = target.closest('[data-grip]') !== null;
    // Los botones y la guía del panel son para tocarlos, no para arrastrar el cajón.
    if (!onGrip && target.closest('button, a, input, [role="slider"]')) return;
    // Cerrado, solo el asa responde.
    if (!onGrip && !open) return;
    measure();
    cancelAnimationFrame(frame.current);
    target.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      target,
      startX: event.clientX,
      startProgress: progress.current,
      onGrip,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const dx = event.clientX - d.startX;
    if (!d.moved) {
      if (Math.abs(dx) < TAP_SLOP) return;
      d.moved = true;
      const stageEl = stage.current;
      if (stageEl) stageEl.style.willChange = 'transform';
    }
    const travel = Math.max(1, geometry.current.travel);
    const dt = event.timeStamp - d.lastTime;
    if (dt > 0) {
      const instant = -(event.clientX - d.lastX) / travel / dt;
      d.velocity = 0.7 * d.velocity + 0.3 * instant;
    }
    d.lastX = event.clientX;
    d.lastTime = event.timeStamp;
    apply(clamp01(d.startProgress - dx / travel));
  };

  const finish = (event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    drag.current = null;
    if (d.target.hasPointerCapture(d.id)) d.target.releasePointerCapture(d.id);
    // Con ratón, soltar tras arrastrar el asa también genera un clic: no debe volver a alternar el cajón.
    if (d.onGrip) lastGrip.current = performance.now();
    if (!d.moved) {
      // Toque corto sobre el asa: abre o cierra.
      if (!cancelled && d.onGrip) onOpenChange(!open);
      return;
    }
    const next = cancelled ? progress.current >= 0.5 : settleOpen(progress.current, d.velocity);
    animateTo(next ? 1 : 0);
    if (next !== open) onOpenChange(next);
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: (event) => finish(event, false),
    onPointerCancel: (event) => finish(event, true),
    onGripClick: () => {
      // Si el gesto ya lo resolvió el puntero, este clic es el mismo toque (o el cierre del arrastre).
      if (performance.now() - lastGrip.current < 500) return;
      onOpenChange(!open);
    },
  };
}
