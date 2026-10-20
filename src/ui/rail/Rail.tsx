import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import type { GameSnapshot, GameStore } from '../../game';
import { isAtEnd } from '../../game';
import { es } from '../../i18n/es';
import { Icon } from '../icons';
import type { FullscreenControl } from '../useFullscreen';
import { Scrubber } from './Scrubber';
import { useDrawer } from './useDrawer';

interface RailProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Escena que se encoge y se corre al abrir (franjas + tablero). */
  readonly stageRef: RefObject<HTMLElement | null>;
  readonly game: GameSnapshot;
  readonly store: GameStore;
  readonly reduced: boolean;
  readonly fullscreen: FullscreenControl;
  readonly onMenu: () => void;
  /** Primera vez: el asa «asoma» una vez para que se sepa que está ahí. */
  readonly hint: boolean;
  /** Otro modo de deshacer (contra un rival se deshacen la jugada propia y la de él). Por omisión, la última jugada. */
  readonly onUndo?: () => void;
  /** Con `onUndo`, quien decide si se puede deshacer. */
  readonly undoDisabled?: boolean;
  /** Herramientas extra, antes del botón de deshacer (la pista en el modo Práctica). */
  readonly tools?: ReactNode;
}

/**
 * Cajón lateral con las herramientas. Está en el borde derecho —el lado que queda entre las dos
 * personas sentadas frente a frente— y se abre con un toque al asa o arrastrándola hacia dentro.
 */
export function Rail({
  open,
  onOpenChange,
  stageRef,
  game,
  store,
  reduced,
  fullscreen,
  onMenu,
  hint,
  onUndo,
  undoDisabled,
  tools,
}: RailProps) {
  const railRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const drawer = useDrawer({ open, onOpenChange, reduced, stage: stageRef, rail: railRef, panel: panelRef });

  const total = game.plies.length;
  const atStart = game.cursor === 0;
  const atEnd = isAtEnd(game);

  // Escape cierra el cajón y devuelve el foco al asa si estaba dentro.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]')) return;
      const inside = railRef.current?.contains(document.activeElement) ?? false;
      onOpenChange(false);
      if (inside) gripRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  return (
    <>
      <aside
        ref={railRef}
        className="rail"
        data-open={open ? '' : undefined}
        data-hint={hint && !open ? '' : undefined}
        aria-label={es.rail.title}
        onPointerDown={drawer.onPointerDown}
        onPointerMove={drawer.onPointerMove}
        onPointerUp={drawer.onPointerUp}
        onPointerCancel={drawer.onPointerCancel}
      >
        <button
          ref={gripRef}
          type="button"
          className="rail__grip"
          data-grip=""
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? es.rail.close : es.rail.open}
          onClick={drawer.onGripClick}
        >
          <span className="rail__pill" aria-hidden="true" />
        </button>

        <div ref={panelRef} id={panelId} className="rail__panel" inert={!open}>
          <p className="rail__pos" aria-hidden="true">
            <b>{game.cursor}</b>
            <span>/{total}</span>
          </p>

          <div className="rail__nav" role="group" aria-label={es.a11y.history}>
            <button
              type="button"
              className="rail__btn"
              onClick={() => store.first()}
              disabled={atStart}
              aria-label={es.game.nav.first}
              title={es.game.nav.first}
            >
              <Icon name="first" size={22} />
            </button>
            <button
              type="button"
              className="rail__btn"
              onClick={() => store.back()}
              disabled={atStart}
              aria-label={es.game.nav.back}
              title={es.game.nav.back}
            >
              <Icon name="back" size={22} />
            </button>
            <Scrubber
              value={game.cursor}
              max={total}
              onChange={(n) => store.goTo(n)}
              label={es.rail.scrub}
              valueText={es.rail.scrubText(game.cursor, total)}
            />
            <button
              type="button"
              className="rail__btn"
              onClick={() => store.forward()}
              disabled={atEnd}
              aria-label={es.game.nav.forward}
              title={es.game.nav.forward}
            >
              <Icon name="forward" size={22} />
            </button>
            <button
              type="button"
              className="rail__btn"
              onClick={() => store.last()}
              disabled={atEnd}
              aria-label={es.game.nav.last}
              title={es.game.nav.last}
            >
              <Icon name="last" size={22} />
            </button>
          </div>

          <span className="rail__sep" aria-hidden="true" />

          <div className="rail__tools">
            {tools}
            <button
              type="button"
              className="rail__btn"
              onClick={onUndo ?? (() => store.undo())}
              disabled={onUndo ? (undoDisabled ?? false) : total === 0 || !atEnd}
              aria-label={es.game.actions.undo}
              title={es.game.actions.undo}
            >
              <Icon name="undo" size={22} />
            </button>
            {fullscreen.supported && (
              <button
                type="button"
                className="rail__btn"
                onClick={fullscreen.toggle}
                aria-pressed={fullscreen.active}
                aria-label={fullscreen.active ? es.rail.exitFullscreen : es.rail.fullscreen}
                title={fullscreen.active ? es.rail.exitFullscreen : es.rail.fullscreen}
              >
                <Icon name={fullscreen.active ? 'exitFullscreen' : 'fullscreen'} size={22} />
              </button>
            )}
            <button type="button" className="rail__btn" onClick={onMenu} aria-label={es.rail.menu} title={es.rail.menu}>
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
