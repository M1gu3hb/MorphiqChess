import { useEffect, useRef, type ReactNode } from 'react';
import { revealBlocks } from '../../training/markup';
import { PIECE_SRC } from '../pieceArt';
import { Inline, RichBlocks } from './RichText';
import type { CoachText } from './useCoachText';

interface CoachProps {
  readonly title?: string;
  readonly text: CoachText;
  readonly tone?: 'neutral' | 'good' | 'bad';
  /** Algo fijo debajo del texto (por ejemplo, una pista). */
  readonly children?: ReactNode;
}

/**
 * El «profesor»: una ficha de caballo y un globo con el texto. El texto completo está siempre
 * presente (invisible) para que el globo no cambie de tamaño mientras se escribe encima.
 */
export function Coach({ title, text, tone = 'neutral', children }: CoachProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const typing = !text.done;

  // Si el texto es más alto que el globo, lo que se va escribiendo se mantiene a la vista.
  useEffect(() => {
    if (typing) bubbleRef.current?.querySelector('.caret')?.scrollIntoView({ block: 'nearest' });
  }, [typing, text.count]);

  return (
    <div className="coach" data-tone={tone}>
      <div className="coach__avatar" aria-hidden="true">
        <img src={PIECE_SRC.w.n} alt="" width={156} height={260} />
      </div>
      <div className="bubble" ref={bubbleRef}>
        {title && (
          <p className="bubble__title">
            <Inline text={title} />
          </p>
        )}
        <div className="bubble__text" aria-hidden="true">
          <div className="bubble__ghost">
            <RichBlocks blocks={text.blocks} />
          </div>
          <div className="bubble__live">
            <RichBlocks blocks={revealBlocks(text.blocks, text.count)} caret={typing} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
