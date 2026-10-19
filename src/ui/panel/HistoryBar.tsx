import type { GameSnapshot, GameStore } from '../../game';
import { es } from '../../i18n/es';
import { Icon } from '../icons';

interface HistoryBarProps {
  readonly game: GameSnapshot;
  readonly store: GameStore;
}

/** Flechas para revisar jugadas anteriores: inicio, anterior, siguiente y última. */
export function HistoryBar({ game, store }: HistoryBarProps) {
  const total = game.plies.length;
  const atStart = game.cursor === 0;
  const atEnd = game.cursor === total;
  return (
    <nav className="history-bar" aria-label={es.a11y.history}>
      <button
        type="button"
        className="icon-btn icon-btn--lg"
        onClick={() => store.first()}
        disabled={atStart}
        aria-label={es.game.nav.first}
        title={`${es.game.nav.first} (Inicio)`}
      >
        <Icon name="first" size={24} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--lg"
        onClick={() => store.back()}
        disabled={atStart}
        aria-label={es.game.nav.back}
        title={`${es.game.nav.back} (←)`}
      >
        <Icon name="back" size={24} />
      </button>
      <p className="history-bar__pos" aria-hidden="true">
        <span className="history-bar__now">{game.cursor}</span>
        <span className="history-bar__sep">/</span>
        <span>{total}</span>
      </p>
      <button
        type="button"
        className="icon-btn icon-btn--lg"
        onClick={() => store.forward()}
        disabled={atEnd}
        aria-label={es.game.nav.forward}
        title={`${es.game.nav.forward} (→)`}
      >
        <Icon name="forward" size={24} />
      </button>
      <button
        type="button"
        className="icon-btn icon-btn--lg"
        onClick={() => store.last()}
        disabled={atEnd}
        aria-label={es.game.nav.last}
        title={`${es.game.nav.last} (Fin)`}
      >
        <Icon name="last" size={24} />
      </button>
    </nav>
  );
}
