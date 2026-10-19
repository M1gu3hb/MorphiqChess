import { useMemo } from 'react';
import type { GameSnapshot } from '../game';
import { positionAt } from '../game';
import { announcePly, describeOutcome, es } from '../i18n/es';

/** Texto para la región «en vivo»: lo que una persona que ve el tablero percibe de un vistazo. */
export function useAnnouncement(game: GameSnapshot): string {
  return useMemo(() => {
    const t = game.transition;
    const turn = es.game.turnOf(es.sidesOf[positionAt(game).turn]);
    const end = game.outcome ? describeOutcome(game.outcome) : null;
    const tail = end ? `${end.headline}. ${end.detail}.` : `${turn}.`;
    switch (t.type) {
      case 'reset':
        return `${es.a11y.announceNew} ${turn}.`;
      case 'forward':
        return t.source === 'nav'
          ? `${es.a11y.announceViewing(t.index, game.plies.length)} ${announcePly(t.ply)}`
          : `${announcePly(t.ply)} ${tail}`;
      case 'backward':
        return game.cursor === 0
          ? es.a11y.announceStart
          : `${es.a11y.announceViewing(game.cursor, game.plies.length)} ${turn}.`;
      case 'jump':
        return game.cursor === 0
          ? es.a11y.announceStart
          : `${es.a11y.announceViewing(game.cursor, game.plies.length)}`;
      default:
        return end ? `${end.headline}. ${end.detail}.` : turn;
    }
    // La partida es inmutable: basta con su identidad y su revisión.
  }, [game.gameId, game.revision]);
}
