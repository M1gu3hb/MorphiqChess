import { applyMove, generateLegalMoves, isInCheck } from './movegen';
import { FILES, squareName } from './squares';
import type { Move, PieceType, Position } from './types';

const LETTER: Record<PieceType, string> = { p: '', n: 'N', b: 'B', r: 'R', q: 'Q', k: 'K' };

/**
 * Notación algebraica estándar (SAN, letras inglesas) con desambiguación y sufijo de jaque (+) o mate (#).
 * Es el formato canónico: sirve para PGN, pruebas y para localizar en la interfaz.
 */
export function moveToSan(
  pos: Position,
  move: Move,
  legalMoves: readonly Move[] = generateLegalMoves(pos),
): string {
  let san: string;
  if (move.castle) {
    san = move.castle === 'k' ? 'O-O' : 'O-O-O';
  } else if (move.piece === 'p') {
    san = move.capture ? `${FILES[move.from & 7]}x${squareName(move.to)}` : squareName(move.to);
    if (move.promotion) san += `=${LETTER[move.promotion]}`;
  } else {
    const rivals = legalMoves.filter(
      (other) => other.piece === move.piece && other.to === move.to && other.from !== move.from,
    );
    let origin = '';
    if (rivals.length > 0) {
      const name = squareName(move.from);
      const sameFile = rivals.some((other) => (other.from & 7) === (move.from & 7));
      const sameRank = rivals.some((other) => other.from >> 3 === move.from >> 3);
      if (!sameFile) origin = name[0]!;
      else if (!sameRank) origin = name[1]!;
      else origin = name;
    }
    san = `${LETTER[move.piece]}${origin}${move.capture ? 'x' : ''}${squareName(move.to)}`;
  }

  const next = applyMove(pos, move);
  if (isInCheck(next)) san += generateLegalMoves(next).length === 0 ? '#' : '+';
  return san;
}

const strip = (san: string): string => san.replace(/[+#!?x=]/g, '').replace(/0/g, 'O');

/** Interpreta un movimiento en SAN (tolerante con x, =, +, #, !, ?). Devuelve null si no es legal. */
export function sanToMove(pos: Position, text: string): Move | null {
  const wanted = strip(text.trim());
  if (!wanted) return null;
  const legal = generateLegalMoves(pos);
  for (const move of legal) {
    if (strip(moveToSan(pos, move, legal)) === wanted) return move;
  }
  return null;
}

export type NotationLanguage = 'en' | 'es';

const ES_LETTER: Record<string, string> = { K: 'R', Q: 'D', R: 'T', B: 'A', N: 'C' };

/** Traduce las letras de pieza de un SAN: Rey=R, Dama=D, Torre=T, Alfil=A, Caballo=C. */
export function localizeSan(san: string, language: NotationLanguage): string {
  if (language === 'en') return san;
  return san
    .replace(/^[KQRBN]/, (letter) => ES_LETTER[letter]!)
    .replace(/=([QRBN])/, (_, letter: string) => `=${ES_LETTER[letter]!}`);
}
