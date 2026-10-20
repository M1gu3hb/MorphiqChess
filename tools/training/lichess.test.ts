import { describe, expect, it } from 'vitest';
import { buildGraph } from '../../src/training/graph';
import { convertLichess, parseOpeningsTsv, pgnMoves, selectRows, type LichessSpec, type OpeningRow } from './lichess';

const row = (name: string, pgn: string, eco = 'B20'): OpeningRow => ({ eco, name, pgn });

describe('lectura de la base de Lichess', () => {
  it('lee las filas del .tsv y se salta el encabezado y las líneas vacías', () => {
    const rows = parseOpeningsTsv('eco\tname\tpgn\nB20\tSicilian Defense\t1. e4 c5\n\nB21\tSicilian Defense: Smith-Morra Gambit\t1. e4 c5 2. d4 cxd4 3. c3\n');
    expect(rows).toEqual([
      { eco: 'B20', name: 'Sicilian Defense', pgn: '1. e4 c5' },
      { eco: 'B21', name: 'Sicilian Defense: Smith-Morra Gambit', pgn: '1. e4 c5 2. d4 cxd4 3. c3' },
    ]);
  });

  it('rechaza una fila mal formada diciendo cuál es', () => {
    expect(() => parseOpeningsTsv('eco\tname\tpgn\nB20\tSolo dos columnas')).toThrow(/Fila 2/);
    expect(() => parseOpeningsTsv('B20\tNombre\t1. e4\tsobra')).toThrow(/Fila 1/);
  });

  it('saca las jugadas de la notación PGN', () => {
    expect(pgnMoves('1. e4 e5 2. Nf3 Nc6 3. Bb5+')).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5+']);
    expect(pgnMoves('1. d4 Nf6 2. c4 g6 3. Nc3 d5')).toEqual(['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5']);
  });
});

describe('selección de líneas', () => {
  const sicilian: LichessSpec = { names: [/^Sicilian Defense/], prefix: 'e4 c5', own: ['Sicilian Defense'] };
  const rows: OpeningRow[] = [
    row('Sicilian Defense', '1. e4 c5'),
    row('Sicilian Defense: Closed', '1. e4 c5 2. Nc3'),
    row('Sicilian Defense: Smith-Morra Gambit', '1. e4 c5 2. d4 cxd4 3. c3'),
    row('Sicilian Defense: Alapin Variation', '1. e4 c5 2. c3'),
    row('French Defense', '1. e4 e6', 'C00'),
    row('Sicilian Defense: Transposición', '1. Nf3 c5 2. e4'),
    row('Sicilian Defense: Alapin Variation', '1. e4 c5 2. c3'),
  ];

  it('toma las filas del nombre y de las jugadas pedidas, sin repetir secuencias', () => {
    const chosen = selectRows(rows, sicilian, 'b');
    expect(chosen.map((entry) => entry.pgn)).toEqual(['1. e4 c5', '1. e4 c5 2. Nc3', '1. e4 c5 2. d4 cxd4 3. c3', '1. e4 c5 2. c3']);
  });

  it('respeta el tope de posiciones por decidir y prefiere las líneas cortas', () => {
    // Con azules, 1.e4 c5 ya es una posición; la Smith-Morra añade otra (…cxd4) y la Alapin ninguna nueva en esa rama.
    const tight = selectRows(rows, { ...sicilian, maxCards: 1 }, 'b');
    expect(tight.map((entry) => entry.pgn)).toEqual(['1. e4 c5', '1. e4 c5 2. Nc3', '1. e4 c5 2. c3']);
    const roomy = selectRows(rows, { ...sicilian, maxCards: 2 }, 'b');
    expect(roomy).toHaveLength(4);
  });

  it('el resultado se arma en un grafo y no pasa del tope', () => {
    for (const max of [1, 2, 3]) {
      const chosen = selectRows(rows, { ...sicilian, maxCards: max }, 'b');
      const lines = chosen.map((entry) => ({ moves: pgnMoves(entry.pgn).join(' ').replace(/[+#]/g, '') }));
      expect(buildGraph(lines, 'b').cards.length).toBeLessThanOrEqual(max);
    }
  });

  it('con blancas cuenta las posiciones en las que mueven las blancas', () => {
    const white: LichessSpec = { names: [/^Sicilian Defense/], prefix: 'e4', own: [] };
    const chosen = selectRows(rows, { ...white, maxCards: 1 }, 'w');
    // Solo cabe la posición inicial (1.e4): las líneas que añaden otra posición de las blancas se quedan fuera.
    expect(chosen.map((entry) => entry.pgn)).toEqual(['1. e4 c5']);
  });

  it('una jugada ilegal en la base detiene todo con el nombre y las jugadas', () => {
    expect(() => selectRows([row('Sicilian Defense: Rota', '1. e4 c5 2. Ke3')], sicilian, 'b')).toThrow(/Ke3.*Rota/);
  });
});

describe('conversión', () => {
  const spec: LichessSpec = { names: [/^Sicilian Defense/], prefix: 'e4 c5', own: ['Sicilian Defense'] };

  it('pasa los nombres al español, conserva el original y normaliza el SAN', () => {
    const file = convertLichess(
      'sicilian',
      [row('Sicilian Defense', '1. e4 c5'), row('Sicilian Defense: Najdorf Variation, English Attack', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5+')],
      spec,
      'b',
    );
    expect(file).toMatchObject({ id: 'sicilian', source: 'Lichess', side: 'b' });
    expect(file.lines[0]).toEqual({ name: 'Defensa Siciliana', nameEn: 'Sicilian Defense', eco: 'B20', moves: 'e4 c5' });
    expect(file.lines[1]).toMatchObject({
      name: 'Variante Najdorf, Ataque Inglés',
      nameEn: 'Sicilian Defense: Najdorf Variation, English Attack',
      moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5',
    });
  });
});
