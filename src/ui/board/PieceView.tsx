import { memo, type CSSProperties } from 'react';
import type { Orientation } from '../../anim/timing';
import { colorOfCode, typeOfCode } from '../../engine';
import { PIECE_SRC } from '../pieceArt';
import { fileOf, pieceZ, rowOf } from './geometry';

interface PieceViewProps {
  readonly id: number;
  readonly sq: number;
  readonly code: number;
  readonly orientation: Orientation;
  /** Rey en jaque mate: queda tumbado. */
  readonly mated: boolean;
  /** Retraso (ms) para que el rey caiga después de la jugada que da mate. */
  readonly toppleDelay: number;
}

/**
 * Una pieza. La estructura es la misma que construye el director para sus «fantasmas»
 * (ver `anim/dom.ts`):
 *
 *   .piece                    posición (porcentajes de su propio tamaño = casillas)
 *     .piece-shadow           sombra en el suelo (gira con la pieza)
 *     .piece-lift             salto / escala en el espacio de la pantalla
 *       .piece-face           giro de 180° sobre el eje de la pieza
 *         img.piece-img       la imagen
 */
export const PieceView = memo(function PieceView({ id, sq, code, orientation, mated, toppleDelay }: PieceViewProps) {
  const style = {
    '--f': fileOf(sq),
    '--r': rowOf(sq),
    '--z': pieceZ(sq, orientation),
    '--a': `${orientation}deg`,
    '--topple-delay': `${toppleDelay}ms`,
  } as CSSProperties;

  return (
    <div className="piece" data-id={id} data-sq={sq} data-mated={mated ? '' : undefined} style={style}>
      <span className="piece-shadow" />
      <div className="piece-lift">
        <div className="piece-face">
          <img
            className="piece-img"
            src={PIECE_SRC[colorOfCode(code)][typeOfCode(code)]}
            alt=""
            draggable={false}
            decoding="sync"
          />
        </div>
      </div>
    </div>
  );
});
