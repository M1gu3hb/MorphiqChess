import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import {
  START_FEN,
  applyMove,
  generateLegalMoves,
  getPositionOutcome,
  isInsufficientMaterial,
  moveToSan,
  parseFen,
  toFen,
  type Position,
} from './index';

/**
 * Prueba diferencial: partidas aleatorias (con semilla fija, reproducibles) jugadas a la vez en
 * nuestro motor y en chess.js. En cada jugada deben coincidir el conjunto de jugadas legales,
 * su notación SAN (desambiguación, jaque, mate), el FEN resultante y el estado de la partida.
 * Sirve de red de seguridad cuando se optimice el motor (bitboards, IA, modo en línea...).
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARTS: readonly string[] = [
  START_FEN,
  'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
  'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
  '4k3/PPP5/8/8/8/8/ppp5/4K3 w - - 0 1',
  '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
  'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
  '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1',
];

const GAMES_PER_START = 25;
const MAX_PLIES = 160;

/** FEN sin la casilla al paso (chess.js solo la muestra cuando la captura es posible). */
const withoutEp = (fen: string): string => {
  const parts = fen.split(' ');
  parts[3] = '-';
  return parts.join(' ');
};

/** Sesga la elección hacia enroques, coronaciones y capturas para ejercitar casos raros. */
function pickMove(sans: readonly string[], random: () => number): string {
  const special = sans.filter((san) => san.startsWith('O-O') || san.includes('=') || san.includes('x'));
  if (special.length > 0 && random() < 0.45) return special[Math.floor(random() * special.length)]!;
  return sans[Math.floor(random() * sans.length)]!;
}

describe('motor vs chess.js (partidas aleatorias)', () => {
  STARTS.forEach((startFen, startIndex) => {
    it(
      `coincide jugada a jugada · inicio ${startIndex + 1}`,
      () => {
        const random = mulberry32(1000 + startIndex);
        for (let game = 0; game < GAMES_PER_START; game++) {
          const reference = new Chess(startFen);
          let position: Position = parseFen(startFen);

          for (let ply = 0; ply < MAX_PLIES; ply++) {
            const context = `inicio ${startIndex + 1}, partida ${game + 1}, ply ${ply}, ${toFen(position)}`;
            const ours = generateLegalMoves(position);
            const ourSans = ours.map((move) => moveToSan(position, move, ours));
            const theirSans = reference.moves();
            expect([...ourSans].sort(), context).toEqual([...theirSans].sort());

            // Estado de la partida
            const outcome = getPositionOutcome(position, ours);
            expect(outcome?.type === 'checkmate', context).toBe(reference.isCheckmate());
            expect(outcome?.type === 'draw' && outcome.reason === 'stalemate', context).toBe(
              reference.isStalemate(),
            );
            expect(isInsufficientMaterial(position.board), context).toBe(reference.isInsufficientMaterial());
            if (reference.isCheckmate() || reference.isStalemate() || theirSans.length === 0) break;

            const chosen = pickMove(theirSans, random);
            const index = ourSans.indexOf(chosen);
            expect(index, `${context} · ${chosen}`).toBeGreaterThanOrEqual(0);
            reference.move(chosen);
            position = applyMove(position, ours[index]!);

            expect(withoutEp(toFen(position)), context).toBe(withoutEp(reference.fen()));
          }
        }
      },
      120_000,
    );
  });
});
