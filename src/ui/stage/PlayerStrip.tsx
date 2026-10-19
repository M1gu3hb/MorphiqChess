import type { Color } from '../../engine';
import type { GameSnapshot, GameStore } from '../../game';
import { CAPTURE_ORDER, isAtEnd, leadOf, positionAt, tallyMaterial } from '../../game';
import { es } from '../../i18n/es';
import { PIECE_SRC } from '../pieceArt';

interface PlayerStripProps {
  readonly side: Color;
  readonly game: GameSnapshot;
  readonly store: GameStore;
  /** La franja de arriba se gira 180° para quedar derecha frente a quien se sienta de ese lado. */
  readonly flipped?: boolean;
}

/**
 * Franja de cada jugador, pegada a su orilla: de quién es el turno, lo que ha capturado y la
 * ventaja de material. Al revisar una jugada anterior muestra, en las dos franjas, cómo volver.
 */
export function PlayerStrip({ side, game, store, flipped = false }: PlayerStripProps) {
  const viewing = !isAtEnd(game);
  const tally = tallyMaterial(game);
  const enemy: Color = side === 'w' ? 'b' : 'w';
  const counts = tally.captured[side];
  const total = CAPTURE_ORDER.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
  const lead = leadOf(tally, side);
  const turn = !viewing && game.outcome === null && positionAt(game).turn === side;
  // La franja girada queda fuera del orden de tabulación de los botones repetidos.
  const tabIndex = flipped ? -1 : undefined;

  return (
    <section
      className="strip"
      data-side={side}
      data-flip={flipped ? '' : undefined}
      data-turn={turn ? '' : undefined}
      data-viewing={viewing ? '' : undefined}
      aria-label={es.sides[side]}
    >
      {viewing ? (
        <>
          <p className="strip__viewing">{es.strip.viewing(game.cursor, game.plies.length)}</p>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => store.last()}
            aria-label={es.game.backToGame}
            tabIndex={tabIndex}
          >
            {es.strip.back}
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => store.resumeFromCursor()}
            aria-label={es.game.resumeHere}
            tabIndex={tabIndex}
          >
            {es.strip.resume}
          </button>
        </>
      ) : (
        <>
          <span className="chip" data-side={side} aria-hidden="true" />
          <span className="strip__name">{es.sides[side]}</span>
          <ul className="strip__captured" aria-label={es.a11y.captured(es.sidesOf[side])}>
            {total === 0 ? (
              <li className="visually-hidden">{es.a11y.nothingCaptured}</li>
            ) : (
              CAPTURE_ORDER.flatMap((type) =>
                Array.from({ length: counts[type] ?? 0 }, (_, n) => (
                  <li key={`${type}${n}`} className="strip__piece">
                    <img src={PIECE_SRC[enemy][type]} alt={es.pieceNames[type]} draggable={false} />
                  </li>
                )),
              )
            )}
          </ul>
          {lead > 0 && <span className="strip__lead">+{lead}</span>}
        </>
      )}
    </section>
  );
}
