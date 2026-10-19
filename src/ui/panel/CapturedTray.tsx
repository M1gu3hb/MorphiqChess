import type { Color, PieceType } from '../../engine';
import type { GameSnapshot } from '../../game';
import { es } from '../../i18n/es';
import { PIECE_SRC } from '../pieceArt';

const ORDER: readonly PieceType[] = ['q', 'r', 'b', 'n', 'p'];
const VALUE: Record<PieceType, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

interface Tally {
  /** Piezas capturadas por cada bando, por tipo. */
  readonly byColor: Record<Color, Partial<Record<PieceType, number>>>;
  readonly points: Record<Color, number>;
}

function tally(game: GameSnapshot): Tally {
  const byColor: Tally['byColor'] = { w: {}, b: {} };
  const points: Record<Color, number> = { w: 0, b: 0 };
  for (let i = 0; i < game.cursor; i++) {
    const { move } = game.plies[i]!;
    if (!move.capture) continue;
    byColor[move.color][move.capture] = (byColor[move.color][move.capture] ?? 0) + 1;
    points[move.color] += VALUE[move.capture];
  }
  return { byColor, points };
}

/** Piezas que cada bando ha capturado y la ventaja de material. */
export function CapturedTray({ game }: { readonly game: GameSnapshot }) {
  const { byColor, points } = tally(game);
  const advantage = points.w - points.b;

  const row = (side: Color) => {
    const capturedColor: Color = side === 'w' ? 'b' : 'w';
    const counts = byColor[side];
    const total = ORDER.reduce((sum, type) => sum + (counts[type] ?? 0), 0);
    const lead = side === 'w' ? advantage : -advantage;
    return (
      <div className="captured__row" key={side}>
        <span className="captured__who" data-side={side}>
          {es.sides[side]}
        </span>
        <ul
          className="captured__list"
          aria-label={es.a11y.captured(es.sidesOf[side])}
          data-empty={total === 0 ? '' : undefined}
        >
          {total === 0 ? (
            <li className="captured__none">{es.a11y.nothingCaptured}</li>
          ) : (
            ORDER.flatMap((type) =>
              Array.from({ length: counts[type] ?? 0 }, (_, n) => (
                <li key={`${type}${n}`} className="captured__piece" title={es.pieceNames[type]}>
                  <img src={PIECE_SRC[capturedColor][type]} alt={es.pieceNames[type]} draggable={false} />
                </li>
              )),
            )
          )}
        </ul>
        {lead > 0 && <span className="captured__lead">+{lead}</span>}
      </div>
    );
  };

  return (
    <section className="card captured" aria-label={es.game.captured}>
      <h2 className="card__title">{es.game.captured}</h2>
      {row('w')}
      {row('b')}
    </section>
  );
}
