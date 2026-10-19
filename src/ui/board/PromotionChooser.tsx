import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Color, PromotionPiece } from '../../engine';
import { es } from '../../i18n/es';
import { PIECE_SRC } from '../pieceArt';

const CHOICES: readonly PromotionPiece[] = ['q', 'r', 'b', 'n'];

interface PromotionChooserProps {
  readonly color: Color;
  readonly onPick: (piece: PromotionPiece) => void;
  readonly onCancel: () => void;
}

/** Elegir en qué se corona el peón. Es un diálogo: foco atrapado, Escape cancela. */
export function PromotionChooser({ color, onPick, onCancel }: PromotionChooserProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={rootRef}
      className="promo"
      role="dialog"
      aria-modal="true"
      aria-label={es.dialogs.promotion.title}
      onKeyDown={onKeyDown}
    >
      <div className="promo__box">
        <p className="promo__title">{es.dialogs.promotion.title}</p>
        <div className="promo__row">
          {CHOICES.map((piece) => (
            <button
              key={piece}
              type="button"
              className="promo__btn"
              aria-label={es.dialogs.promotion.pick(es.pieceNames[piece])}
              onClick={() => onPick(piece)}
            >
              <img src={PIECE_SRC[color][piece]} alt="" draggable={false} />
              <span>{es.pieceNames[piece]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          {es.dialogs.cancel}
        </button>
      </div>
    </div>
  );
}
