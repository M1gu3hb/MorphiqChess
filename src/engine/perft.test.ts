import { describe, expect, it } from 'vitest';
import { parseFen, perft } from './index';

/**
 * Perft: cuenta de nodos por profundidad. Es la prueba estándar para validar un generador de
 * jugadas: un solo error de enroque, captura al paso, coronación o clavada cambia estos números.
 *
 * Valores de referencia: https://www.chessprogramming.org/Perft_Results y la colección de
 * posiciones "tramposas" (captura al paso ilegal, enroque que da jaque, coronar para dar jaque...).
 * Se contrastaron además contra chess.js.
 */
const SUITE: ReadonlyArray<readonly [name: string, fen: string, counts: readonly number[]]> = [
  ['posición inicial', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281]],
  [
    'Kiwipete (enroques, clavadas, al paso)',
    'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    [48, 2039, 97862],
  ],
  ['posición 3 (finales con al paso)', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238, 674624]],
  [
    'posición 4 (coronaciones)',
    'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    [6, 264, 9467, 422333],
  ],
  [
    'posición 4 espejada',
    'r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1',
    [6, 264, 9467, 422333],
  ],
  ['posición 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]],
  [
    'posición 6',
    'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
    [46, 2079, 89890],
  ],
  ['al paso ilegal #1', '3k4/3p4/8/K1P4r/8/8/8/8 b - - 0 1', [18, 92, 1670, 10138, 185429]],
  ['al paso ilegal #2', '8/8/4k3/8/2p5/8/B2P2K1/8 w - - 0 1', [13, 102, 1266, 10276, 135655]],
  ['al paso que da jaque', '8/8/1k6/2b5/2pP4/8/5K2/8 b - d3 0 1', [15, 126, 1928, 13931, 206379]],
  ['enroque corto que da jaque', '5k2/8/8/8/8/8/8/4K2R w K - 0 1', [15, 66, 1198, 6399, 120330]],
  ['enroque largo que da jaque', '3k4/8/8/8/8/8/8/R3K3 w Q - 0 1', [16, 71, 1286, 7418, 141077]],
  ['derechos de enroque', 'r3k2r/1b4bq/8/8/8/8/7B/R3K2R w KQkq - 0 1', [26, 1141, 27826]],
  ['enroque impedido', 'r3k2r/8/3Q4/8/8/5q2/8/R3K2R b KQkq - 0 1', [44, 1494, 50509]],
  ['coronar saliendo de jaque', '2K2r2/4P3/8/8/8/8/8/3k4 w - - 0 1', [11, 133, 1442, 19174, 266199]],
  ['jaque descubierto', '8/8/1P2K3/8/2n5/1q6/8/5k2 b - - 0 1', [29, 165, 5160, 31961]],
  ['coronar dando jaque', '4k3/1P6/8/8/8/8/K7/8 w - - 0 1', [9, 40, 472, 2661, 38983]],
  ['subcoronar dando jaque', '8/P1k5/K7/8/8/8/8/8 w - - 0 1', [6, 27, 273, 1329, 18135]],
  ['ahogado propio', 'K1k5/8/P7/8/8/8/8/8 w - - 0 1', [2, 6, 13, 63, 382]],
  ['ahogado y mate #1', '8/k1P5/8/1K6/8/8/8/8 w - - 0 1', [10, 25, 268, 926, 10857, 43261]],
  ['ahogado y mate #2', '8/8/2k5/5q2/5n2/8/5K2/8 b - - 0 1', [37, 183, 6559, 23527]],
];

describe('perft', () => {
  for (const [name, fen, counts] of SUITE) {
    it(
      `${name} (profundidad ${counts.length})`,
      () => {
        const position = parseFen(fen);
        counts.forEach((expected, index) => {
          expect(perft(position, index + 1), `profundidad ${index + 1}`).toBe(expected);
        });
      },
      120_000,
    );
  }
});
