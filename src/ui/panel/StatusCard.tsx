import { positionAt, isAtEnd, type GameSnapshot } from '../../game';
import { describeOutcome, es } from '../../i18n/es';

interface StatusCardProps {
  readonly game: GameSnapshot;
  readonly onBackToEnd: () => void;
  readonly onResume: () => void;
  readonly onNewGame: () => void;
  readonly onReview: () => void;
}

/** Quién juega, jaque, resultado final o aviso de que se está viendo una jugada anterior. */
export function StatusCard({ game, onBackToEnd, onResume, onNewGame, onReview }: StatusCardProps) {
  const position = positionAt(game);
  const viewing = !isAtEnd(game);
  const total = game.plies.length;
  const check = game.cursor > 0 && game.plies[game.cursor - 1]!.check;

  if (viewing) {
    return (
      <section className="card status" data-state="viewing" aria-label={es.game.moves}>
        <div className="status__row">
          <span className="chip chip--neutral" aria-hidden="true" />
          <div>
            <p className="status__title">
              {game.cursor === 0 ? es.game.viewingStart(total) : es.game.viewing(game.cursor, total)}
            </p>
            <p className="status__sub">{es.game.turnOf(es.sidesOf[position.turn])}</p>
          </div>
        </div>
        <div className="status__actions">
          <button type="button" className="btn btn--primary" onClick={onBackToEnd}>
            {es.game.backToGame}
          </button>
          <button type="button" className="btn" onClick={onResume}>
            {es.game.resumeHere}
          </button>
        </div>
      </section>
    );
  }

  if (game.outcome) {
    const text = describeOutcome(game.outcome);
    return (
      <section className="card status" data-state="over" aria-label={es.gameOver.title}>
        <div className="status__row">
          <span
            className="chip"
            data-side={game.outcome.type === 'draw' ? undefined : game.outcome.winner}
            data-draw={game.outcome.type === 'draw' ? '' : undefined}
            aria-hidden="true"
          />
          <div>
            <p className="status__title">{text.headline}</p>
            <p className="status__sub">{text.detail}</p>
          </div>
        </div>
        <div className="status__actions">
          <button type="button" className="btn btn--primary" onClick={onNewGame}>
            {es.gameOver.newGame}
          </button>
          <button type="button" className="btn" onClick={onReview}>
            {es.gameOver.review}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card status" data-state="turn" aria-label={es.game.turnOf(es.sidesOf[position.turn])}>
      <div className="status__row">
        <span className="chip" data-side={position.turn} aria-hidden="true" />
        <div>
          <p className="status__title">{es.game.turnOf(es.sidesOf[position.turn])}</p>
          {check && <p className="status__sub status__sub--check">{es.game.check}</p>}
        </div>
      </div>
    </section>
  );
}
