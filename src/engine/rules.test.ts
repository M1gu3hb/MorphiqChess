import { describe, expect, it } from 'vitest';
import {
  START_FEN,
  applyMove,
  findLegalMove,
  generateLegalMoves,
  generateLegalMovesFrom,
  getPositionOutcome,
  initialPosition,
  isInCheck,
  isInsufficientMaterial,
  localizeSan,
  moveToSan,
  parseFen,
  parseSquare,
  repetitionKey,
  sanToMove,
  toFen,
  type Position,
} from './index';

const sq = (name: string): number => {
  const parsed = parseSquare(name);
  if (parsed === null) throw new Error(`casilla inválida: ${name}`);
  return parsed;
};

/** Juega una secuencia de jugadas en SAN desde `from` y devuelve la posición final. */
function play(sans: readonly string[], from: Position = initialPosition()): Position {
  let pos = from;
  for (const san of sans) {
    const move = sanToMove(pos, san);
    if (!move) throw new Error(`jugada ilegal o ambigua: ${san} en ${toFen(pos)}`);
    pos = applyMove(pos, move);
  }
  return pos;
}

describe('FEN', () => {
  it('la posición inicial coincide con el FEN estándar', () => {
    expect(toFen(initialPosition())).toBe(START_FEN);
  });

  it('ida y vuelta de FEN con enroque, al paso y contadores', () => {
    const fens = [
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
      'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
      '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 b - - 12 57',
    ];
    for (const fen of fens) expect(toFen(parseFen(fen))).toBe(fen);
  });

  it('rechaza FEN malformados', () => {
    expect(() => parseFen('')).toThrow();
    expect(() => parseFen('8/8/8/8/8/8/8 w - - 0 1')).toThrow(); // 7 filas
    expect(() => parseFen('9/8/8/8/8/8/8/8 w - - 0 1')).toThrow(); // fila de 9
    expect(() => parseFen('8/8/8/8/8/8/8/8 w - - 0 1')).toThrow(); // sin reyes
    expect(() => parseFen('P3k3/8/8/8/8/8/8/4K3 w - - 0 1')).toThrow(); // peón en octava
    expect(() => parseFen('4k3/8/8/8/8/8/8/4K3 x - - 0 1')).toThrow(); // turno inválido
    expect(() => parseFen('4k3/8/8/8/8/8/8/4K3 w Z - 0 1')).toThrow(); // enroque inválido
  });

  it('descarta derechos de enroque sin rey o torre en su casilla', () => {
    const pos = parseFen('r3k2r/8/8/8/8/8/8/R3K3 w KQkq - 0 1'); // falta la torre h1
    expect(toFen(pos)).toBe('r3k2r/8/8/8/8/8/8/R3K3 w Qkq - 0 1');
  });
});

describe('posición inicial', () => {
  it('tiene 20 jugadas legales y no hay jaque', () => {
    const pos = initialPosition();
    expect(generateLegalMoves(pos)).toHaveLength(20);
    expect(isInCheck(pos)).toBe(false);
    expect(getPositionOutcome(pos)).toBeNull();
  });

  it('avanzar e4 deja la casilla al paso en el FEN y actualiza contadores', () => {
    const afterE4 = play(['e4']);
    expect(toFen(afterE4)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    const afterNf3 = play(['e4', 'c5', 'Nf3']);
    expect(toFen(afterNf3)).toBe('rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2');
  });
});

describe('jaque mate y ahogado', () => {
  it('mate del loco', () => {
    const pos = play(['f3', 'e5', 'g4', 'Qh4#']);
    expect(isInCheck(pos)).toBe(true);
    expect(generateLegalMoves(pos)).toHaveLength(0);
    expect(getPositionOutcome(pos)).toEqual({ type: 'checkmate', winner: 'b' });
  });

  it('mate pastor', () => {
    const pos = play(['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#']);
    expect(getPositionOutcome(pos)).toEqual({ type: 'checkmate', winner: 'w' });
  });

  it('ahogado es tablas y no jaque mate', () => {
    const pos = parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(isInCheck(pos)).toBe(false);
    expect(generateLegalMoves(pos)).toHaveLength(0);
    expect(getPositionOutcome(pos)).toEqual({ type: 'draw', reason: 'stalemate' });
  });

  it('la Ópera de Morphy (17 jugadas) termina en mate con el SAN correcto', () => {
    const game = [
      'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7',
      'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1',
      'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#',
    ];
    const pos = play(game);
    expect(getPositionOutcome(pos)).toEqual({ type: 'checkmate', winner: 'w' });
    expect(toFen(pos)).toBe('1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17');
  });
});

describe('enroque', () => {
  it('permite enroque corto y largo cuando el camino está libre', () => {
    const pos = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const castles = generateLegalMoves(pos).filter((m) => m.castle);
    expect(castles.map((m) => moveToSan(pos, m)).sort()).toEqual(['O-O', 'O-O-O']);
  });

  it('mueve rey y torre y retira los derechos', () => {
    const pos = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const short = applyMove(pos, sanToMove(pos, 'O-O')!);
    expect(toFen(short)).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1');
    const long = applyMove(pos, sanToMove(pos, 'O-O-O')!);
    expect(toFen(long)).toBe('r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1');
  });

  it('no se puede enrocar estando en jaque', () => {
    const pos = parseFen('r3k2r/8/8/8/4r3/8/8/R3K2R w KQkq - 0 1');
    expect(generateLegalMoves(pos).some((m) => m.castle)).toBe(false);
  });

  it('no se puede enrocar pasando por casilla atacada, pero sí el otro lado', () => {
    const pos = parseFen('r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1'); // torre negra ataca f1
    const castles = generateLegalMoves(pos).filter((m) => m.castle);
    expect(castles.map((m) => m.castle)).toEqual(['q']);
  });

  it('el enroque largo sigue permitido si solo b1 está atacada', () => {
    const pos = parseFen('r3k2r/8/8/8/8/1r6/8/R3K2R w KQkq - 0 1');
    expect(generateLegalMoves(pos).some((m) => m.castle === 'q')).toBe(true);
  });

  it('no se puede enrocar con una pieza en medio', () => {
    const pos = parseFen('r3k2r/8/8/8/8/8/8/RN2K1NR w KQkq - 0 1');
    expect(generateLegalMoves(pos).some((m) => m.castle)).toBe(false);
  });

  it('mover el rey o la torre pierde el derecho; capturar la torre también', () => {
    const base = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(toFen(play(['Rh2'], base))).toContain(' Qkq ');
    expect(toFen(play(['Ra2'], base))).toContain(' Kkq ');
    expect(toFen(play(['Ke2'], base))).toContain(' kq ');
    const captured = parseFen('r3k2r/8/8/8/8/8/6b1/R3K2R b KQkq - 0 1');
    expect(toFen(play(['Bxh1'], captured))).toContain(' Qkq ');
  });
});

describe('captura al paso', () => {
  it('se puede capturar justo después del avance doble y desaparece el peón', () => {
    const pos = play(['e4', 'a6', 'e5', 'd5']);
    const move = sanToMove(pos, 'exd6');
    expect(move?.enPassant).toBe(true);
    expect(move?.captureSquare).toBe(sq('d5'));
    const after = applyMove(pos, move!);
    expect(toFen(after)).toBe('rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3');
  });

  it('el derecho caduca si no se ejerce en el acto', () => {
    const pos = play(['e4', 'a6', 'e5', 'd5', 'Nf3', 'a5']);
    expect(sanToMove(pos, 'exd6')).toBeNull();
  });

  it('es ilegal si deja al rey en jaque horizontal (clavada de fila)', () => {
    const pos = parseFen('8/8/8/8/k2Pp2Q/8/8/3K4 b - d3 0 1');
    expect(generateLegalMoves(pos).some((m) => m.enPassant)).toBe(false);
  });
});

describe('coronación', () => {
  it('ofrece las cuatro piezas y aplica la elegida', () => {
    const pos = parseFen('8/P7/7k/8/8/8/8/K7 w - - 0 1');
    const promos = generateLegalMovesFrom(pos, sq('a7'));
    expect(promos.map((m) => m.promotion).sort()).toEqual(['b', 'n', 'q', 'r']);
    const knight = findLegalMove(pos, sq('a7'), sq('a8'), 'n')!;
    expect(toFen(applyMove(pos, knight))).toBe('N7/8/7k/8/8/8/8/K7 b - - 0 1');
    expect(findLegalMove(pos, sq('a7'), sq('a8'))).toBeNull(); // sin pieza elegida no hay jugada
    expect(moveToSan(pos, findLegalMove(pos, sq('a7'), sq('a8'), 'q')!)).toBe('a8=Q');
  });

  it('coronar capturando ofrece cuatro piezas por cada captura', () => {
    const pos = parseFen('n1b4k/1P6/8/8/8/8/8/K7 w - - 0 1');
    const moves = generateLegalMovesFrom(pos, sq('b7'));
    expect(moves).toHaveLength(12); // b8, bxa8, bxc8 × 4
    expect(moves.filter((m) => m.capture)).toHaveLength(8);
  });
});

describe('tablas por material y regla de movimientos', () => {
  const material = (fen: string): boolean => isInsufficientMaterial(parseFen(fen).board);

  it('R vs R, R+A vs R y R+C vs R son insuficientes', () => {
    expect(material('8/8/4k3/8/8/3K4/8/8 w - - 0 1')).toBe(true);
    expect(material('8/8/4k3/8/8/3KB3/8/8 w - - 0 1')).toBe(true);
    expect(material('8/8/4k3/8/8/3KN3/8/8 w - - 0 1')).toBe(true);
  });

  it('alfiles del mismo color de casilla son insuficientes; de distinto color no', () => {
    expect(material('5b2/8/4k3/8/8/3K4/8/2B5 w - - 0 1')).toBe(true); // c1 y f8 oscuras
    expect(material('2b5/8/4k3/8/8/3K4/8/2B5 w - - 0 1')).toBe(false); // c8 clara
  });

  it('con peón, torre, dama o dos caballos todavía hay posibilidad de mate', () => {
    expect(material('8/8/4k3/8/8/3K4/4P3/8 w - - 0 1')).toBe(false);
    expect(material('8/8/4k3/8/8/3K4/4R3/8 w - - 0 1')).toBe(false);
    expect(material('8/8/4k3/8/8/3K4/4Q3/8 w - - 0 1')).toBe(false);
    expect(material('8/8/4k3/8/8/2NKN3/8/8 w - - 0 1')).toBe(false);
    expect(material('8/8/4k1n1/8/8/3KN3/8/8 w - - 0 1')).toBe(false);
  });

  it('el outcome reconoce material insuficiente', () => {
    const pos = parseFen('8/8/4k3/8/8/3K4/8/8 w - - 0 1');
    expect(getPositionOutcome(pos)).toEqual({ type: 'draw', reason: 'insufficient-material' });
  });

  it('75 movimientos sin captura ni peón es tablas automáticas; el mate tiene prioridad', () => {
    expect(getPositionOutcome(parseFen('4k3/8/8/8/8/8/R7/4K3 w - - 149 90'))).toBeNull();
    expect(getPositionOutcome(parseFen('4k3/8/8/8/8/8/R7/4K3 w - - 150 90'))).toEqual({
      type: 'draw',
      reason: 'seventy-five-move',
    });
    const mate = parseFen('R5k1/5ppp/8/8/8/8/8/6K1 b - - 150 90');
    expect(getPositionOutcome(mate)).toEqual({ type: 'checkmate', winner: 'w' });
  });
});

describe('notación SAN', () => {
  it('desambigua por columna, por fila o por ambas', () => {
    const knights = parseFen('4k3/8/8/8/8/8/8/1N2KN2 w - - 0 1');
    const sans = generateLegalMoves(knights).map((m) => moveToSan(knights, m));
    expect(sans).toContain('Nbd2');
    expect(sans).toContain('Nfd2');

    const rooks = parseFen('4k3/8/8/R7/8/8/8/R3K3 w - - 0 1');
    const rookSans = generateLegalMoves(rooks).map((m) => moveToSan(rooks, m));
    expect(rookSans).toContain('R1a3');
    expect(rookSans).toContain('R5a3');

    const queens = parseFen('4k3/8/8/8/8/Q7/8/Q1Q1K3 w - - 0 1');
    const queenSans = generateLegalMoves(queens).map((m) => moveToSan(queens, m));
    expect(queenSans).toContain('Qa1c3');
    expect(queenSans).toContain('Q3c3');
    expect(queenSans).toContain('Qcc3');
  });

  it('marca capturas, jaques y enroques', () => {
    const pos = play(['e4', 'e5', 'Qh5', 'Nc6']);
    expect(moveToSan(pos, sanToMove(pos, 'Qxf7')!)).toBe('Qxf7+');
    expect(moveToSan(pos, sanToMove(pos, 'Qxe5')!)).toBe('Qxe5+');
  });

  it('acepta variantes tolerantes al interpretar', () => {
    const pos = initialPosition();
    expect(sanToMove(pos, 'Nf3')).toEqual(sanToMove(pos, 'Nf3+'));
    expect(sanToMove(pos, 'e4!?')).not.toBeNull();
    expect(sanToMove(pos, 'Ke2')).toBeNull();
    expect(sanToMove(pos, '')).toBeNull();
    const castling = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(sanToMove(castling, '0-0')?.castle).toBe('k');
  });

  it('traduce las letras de pieza al español', () => {
    expect(localizeSan('Nf3', 'es')).toBe('Cf3');
    expect(localizeSan('Qxf7+', 'es')).toBe('Dxf7+');
    expect(localizeSan('Bxe5', 'es')).toBe('Axe5');
    expect(localizeSan('Rd8#', 'es')).toBe('Td8#');
    expect(localizeSan('Kg2', 'es')).toBe('Rg2');
    expect(localizeSan('e8=Q', 'es')).toBe('e8=D');
    expect(localizeSan('exd5', 'es')).toBe('exd5');
    expect(localizeSan('bxc8=N+', 'es')).toBe('bxc8=C+');
    expect(localizeSan('O-O-O', 'es')).toBe('O-O-O');
    expect(localizeSan('Nf3', 'en')).toBe('Nf3');
  });
});

describe('clave de repetición', () => {
  it('volver a la posición inicial repite la clave', () => {
    const start = repetitionKey(initialPosition());
    expect(repetitionKey(play(['Nf3', 'Nf6', 'Ng1', 'Ng8']))).toBe(start);
    expect(repetitionKey(play(['Nf3', 'Nf6']))).not.toBe(start);
  });

  it('la casilla al paso solo cuenta si la captura es posible', () => {
    // Tras 1.e4 no hay peón negro que pueda capturar al paso: misma clave que sin casilla.
    const afterE4 = play(['e4']);
    const sameWithoutEp = parseFen('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    expect(repetitionKey(afterE4)).toBe(repetitionKey(sameWithoutEp));
    // Aquí sí puede capturarse (d5 está al lado de e5): la clave debe distinguirlo.
    const withEp = parseFen('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3');
    const withoutEp = parseFen('rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3');
    expect(repetitionKey(withEp)).not.toBe(repetitionKey(withoutEp));
  });

  it('los derechos de enroque distinguen posiciones', () => {
    const a = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    const b = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w Qkq - 0 1');
    expect(repetitionKey(a)).not.toBe(repetitionKey(b));
  });
});
