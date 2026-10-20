import { describe, expect, it } from 'vitest';
import { generateLegalMoves, initialPosition, parseFen } from '../engine';
import { findMoveByUci, MATE_CP, moveToUci, parseBestMove, parseInfoLine } from './uci';

describe('jugadas en UCI', () => {
  it('escribe las jugadas en coordenadas', () => {
    const uci = generateLegalMoves(initialPosition()).map(moveToUci);
    expect(uci).toHaveLength(20);
    expect(uci).toEqual(expect.arrayContaining(['e2e4', 'g1f3', 'a2a3', 'b1c3']));
  });

  it('la promoción lleva la pieza al final', () => {
    const uci = generateLegalMoves(parseFen('8/P6k/8/8/8/8/8/K7 w - - 0 1')).map(moveToUci);
    expect(uci).toEqual(expect.arrayContaining(['a7a8q', 'a7a8r', 'a7a8b', 'a7a8n']));
    expect(uci).not.toContain('a7a8');
  });

  it('el enroque es la jugada del rey, como lo espera el motor', () => {
    const uci = generateLegalMoves(parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')).map(moveToUci);
    expect(uci).toEqual(expect.arrayContaining(['e1g1', 'e1c1']));
    const black = generateLegalMoves(parseFen('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')).map(moveToUci);
    expect(black).toEqual(expect.arrayContaining(['e8g8', 'e8c8']));
  });

  it('encuentra la jugada legal de un texto, o nada si no es legal', () => {
    const legal = generateLegalMoves(initialPosition());
    const move = findMoveByUci(legal, 'e2e4');
    expect(move).not.toBeNull();
    expect(move && moveToUci(move)).toBe('e2e4');
    expect(findMoveByUci(legal, 'e2e5')).toBeNull();
    expect(findMoveByUci(legal, '')).toBeNull();
    expect(findMoveByUci(legal, '(none)')).toBeNull();
  });
});

describe('líneas info', () => {
  it('lee profundidad, variante, puntuación y jugadas', () => {
    const info = parseInfoLine(
      'info depth 12 seldepth 18 multipv 2 score cp 34 nodes 1000 nps 100000 hashfull 3 tbhits 0 time 10 pv e2e4 e7e5 g1f3',
    );
    expect(info).toEqual({ depth: 12, multipv: 2, score: 34, mate: null, pv: ['e2e4', 'e7e5', 'g1f3'] });
  });

  it('sin multipv cuenta como la primera variante', () => {
    expect(parseInfoLine('info depth 3 score cp -15 pv d2d4')?.multipv).toBe(1);
  });

  it('un mate vale más cuanto antes llega', () => {
    const soon = parseInfoLine('info depth 5 score mate 2 pv a1a8');
    const late = parseInfoLine('info depth 5 score mate 5 pv a1a8');
    const against = parseInfoLine('info depth 5 score mate -3 pv a1a8');
    expect(soon).toMatchObject({ mate: 2, score: MATE_CP - 2 });
    expect(late).toMatchObject({ mate: 5, score: MATE_CP - 5 });
    expect(soon!.score).toBeGreaterThan(late!.score);
    expect(against).toMatchObject({ mate: -3, score: -(MATE_CP - 3) });
  });

  it('descarta las cotas: no sirven para comparar jugadas', () => {
    expect(parseInfoLine('info depth 5 score cp 10 lowerbound pv e2e4')).toBeNull();
    expect(parseInfoLine('info depth 5 score cp 10 upperbound pv e2e4')).toBeNull();
  });

  it('ignora lo que no trae puntuación y variante', () => {
    expect(parseInfoLine('info string NNUE evaluation using nn-61e7af4bb97d.nnue')).toBeNull();
    expect(parseInfoLine('info depth 4 currmove e2e4 currmovenumber 1')).toBeNull();
    expect(parseInfoLine('info depth 4 score cp 10')).toBeNull();
    expect(parseInfoLine('readyok')).toBeNull();
    expect(parseInfoLine('')).toBeNull();
  });

  it('solo conserva jugadas bien escritas en la variante', () => {
    expect(parseInfoLine('info depth 2 score cp 0 pv e2e4 (none) e7e5')?.pv).toEqual(['e2e4', 'e7e5']);
    expect(parseInfoLine('info depth 2 score cp 0 pv (none)')).toBeNull();
  });

  it('tolera números rotos sin lanzar', () => {
    expect(parseInfoLine('info depth x score cp 5 pv e2e4')).toBeNull();
  });
});

describe('bestmove', () => {
  it('lee la jugada, con o sin ponder', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toEqual({ move: 'e2e4' });
    expect(parseBestMove('bestmove g1f3')).toEqual({ move: 'g1f3' });
    expect(parseBestMove('bestmove a7a8q')).toEqual({ move: 'a7a8q' });
  });

  it('«(none)» es que no hay jugadas', () => {
    expect(parseBestMove('bestmove (none)')).toEqual({ move: null });
    expect(parseBestMove('bestmove 0000')).toEqual({ move: null });
  });

  it('otras líneas no son un bestmove', () => {
    expect(parseBestMove('readyok')).toBeNull();
    expect(parseBestMove('info depth 1 score cp 0 pv e2e4')).toBeNull();
    expect(parseBestMove('bestmove')).toBeNull();
  });
});
