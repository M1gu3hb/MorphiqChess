import { useEffect, useRef } from 'react';
import { localizeSan } from '../../engine';
import type { GameSnapshot, GameStore } from '../../game';
import { es } from '../../i18n/es';

interface MoveListProps {
  readonly game: GameSnapshot;
  readonly store: GameStore;
}

/** Lista de jugadas en notación algebraica en español (R, D, T, A, C). Cada jugada es un botón. */
export function MoveList({ game, store }: MoveListProps) {
  const listRef = useRef<HTMLOListElement>(null);

  // Mantiene visible la jugada actual dentro de la lista, sin mover la página.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list) return;
    if (!current) {
      list.scrollTop = game.cursor === 0 ? 0 : list.scrollTop;
      return;
    }
    // Con rectángulos en pantalla: no depende de qué elemento sea el offsetParent de cada botón.
    const listBox = list.getBoundingClientRect();
    const box = current.getBoundingClientRect();
    if (box.top < listBox.top) list.scrollTop -= listBox.top - box.top + 8;
    else if (box.bottom > listBox.bottom) list.scrollTop += box.bottom - listBox.bottom + 8;
  }, [game.cursor, game.plies.length]);

  const rows: number[] = [];
  for (let i = 0; i < game.plies.length; i += 2) rows.push(i);

  const cell = (index: number) => {
    const ply = game.plies[index];
    if (!ply) return <span className="moves__empty" />;
    const current = game.cursor === index + 1;
    return (
      <button
        type="button"
        className="moves__ply"
        aria-current={current ? 'step' : undefined}
        onClick={() => store.goTo(index + 1)}
      >
        {localizeSan(ply.san, 'es')}
      </button>
    );
  };

  return (
    <section className="card moves-card" aria-label={es.a11y.moveList}>
      <h2 className="card__title">{es.game.moves}</h2>
      {rows.length === 0 ? (
        <p className="moves__none">{es.game.noMoves}</p>
      ) : (
        <ol ref={listRef} className="moves">
          {rows.map((i) => (
            <li key={i} className="moves__row">
              <span className="moves__n">{i / 2 + 1}.</span>
              {cell(i)}
              {cell(i + 1)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
