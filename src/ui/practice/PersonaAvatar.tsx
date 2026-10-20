import { tierOf, type Persona } from '../../bots/personas';
import { PIECE_SRC } from '../pieceArt';

export type AvatarSize = 'strip' | 'sm' | 'md' | 'lg';

/** La pieza que hace de personaje. Se muestra entera, nunca recortada; el nombre lo da quien la use. */
export function PersonaAvatar({ persona, size = 'md' }: { readonly persona: Persona; readonly size?: AvatarSize }) {
  return (
    <span className="avatar" data-size={size} data-tier={tierOf(persona.elo)} data-color={persona.color} aria-hidden="true">
      <img src={PIECE_SRC[persona.color][persona.piece]} alt="" width={156} height={260} draggable={false} />
    </span>
  );
}

/** Texto del Elo de un rival: el más fuerte no tiene techo, así que lleva un «+». */
export const eloLabel = (persona: Persona, format: (value: number, open: boolean) => string): string =>
  format(persona.elo, persona.strength.kind === 'max');
