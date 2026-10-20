import { describe, expect, it } from 'vitest';
import { isLightSquare } from '../engine';
import { makeFrame } from './types';
import { fileOf, placeAt, rowOf, squareAt, viewSq } from './geometry';

describe('viewSq (vista de Azules)', () => {
  it('no cambia nada con el tablero sin girar', () => {
    for (let sq = 0; sq < 64; sq++) expect(viewSq(sq, false)).toBe(sq);
  });

  it('es su propia inversa', () => {
    for (let sq = 0; sq < 64; sq++) expect(viewSq(viewSq(sq, true), true)).toBe(sq);
  });

  it('lleva a1 arriba a la derecha y h8 abajo a la izquierda', () => {
    const a1 = viewSq(0, true);
    expect([fileOf(a1), rowOf(a1)]).toEqual([7, 0]);
    const h8 = viewSq(63, true);
    expect([fileOf(h8), rowOf(h8)]).toEqual([0, 7]);
  });

  it('pone las filas de Azules (rango 8) abajo', () => {
    // e8 (60): en la vista normal está arriba (fila 0); girado, abajo (fila 7).
    expect(rowOf(viewSq(60, false))).toBe(0);
    expect(rowOf(viewSq(60, true))).toBe(7);
  });

  it('conserva el color de las casillas (el marco se dibuja por posición en pantalla)', () => {
    for (let sq = 0; sq < 64; sq++) expect(isLightSquare(viewSq(sq, true))).toBe(isLightSquare(sq));
  });

  it('cada casilla de pantalla muestra una casilla distinta del motor', () => {
    const shown = new Set<number>();
    for (let row = 0; row < 8; row++) {
      for (let file = 0; file < 8; file++) {
        const sq = viewSq(squareAt(file, row), true);
        shown.add(sq);
        // Dibujar esa casilla la devuelve a la misma celda de pantalla.
        const at = viewSq(sq, true);
        expect([fileOf(at), rowOf(at)]).toEqual([file, row]);
      }
    }
    expect(shown.size).toBe(64);
  });

  it('coloca la pieza con el desplazamiento de la casilla de pantalla', () => {
    expect(placeAt(viewSq(0, true))).toBe('translate(700%, 0%)');
    expect(placeAt(viewSq(0, false))).toBe('translate(0%, 700%)');
  });
});

describe('makeFrame', () => {
  it('guarda si la vista está girada (por omisión no)', () => {
    const board = new Int8Array(64);
    const ids = new Int16Array(64).fill(-1);
    expect(makeFrame(1, 0, board, ids, 0).flipped).toBe(false);
    expect(makeFrame(1, 0, board, ids, 0, true).flipped).toBe(true);
  });
});
