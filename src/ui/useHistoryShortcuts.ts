import { useEffect } from 'react';
import type { GameStore } from '../game';

/**
 * Atajos de teclado del historial: ← → Inicio Fin.
 * Dentro del tablero las flechas mueven el foco entre casillas, así que ahí se usa Alt + flecha.
 */
export function useHistoryShortcuts(store: GameStore): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (document.querySelector('dialog[open], .promo')) return;
      const inBoard = target?.closest('.board-grid') !== null && target !== null;
      const navKey = ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key);
      if (!navKey) return;
      if (inBoard && !event.altKey) return;
      event.preventDefault();
      switch (event.key) {
        case 'ArrowLeft':
          store.back();
          break;
        case 'ArrowRight':
          store.forward();
          break;
        case 'Home':
          store.first();
          break;
        default:
          store.last();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store]);
}
