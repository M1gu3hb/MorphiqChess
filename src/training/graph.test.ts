import { describe, expect, it } from 'vitest';
import { initialPosition } from '../engine';
import { acceptedMoves, buildGraph, fenKey, normalizeSan, positionKey, splitMoves } from './graph';

const LINES = [
  { name: 'Italiana', moves: 'e4 e5 Nf3 Nc6 Bc4' },
  { name: 'Española', moves: 'e4 e5 Nf3 Nc6 Bb5' },
  { name: 'Siciliana', moves: 'e4 c5' },
];

describe('claves de posición', () => {
  it('ignoran la casilla «al paso» y los contadores', () => {
    const a = fenKey('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
    const b = fenKey('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 5 9');
    expect(a).toBe(b);
  });

  it('coinciden con la posición del motor', () => {
    expect(positionKey(initialPosition())).toBe(fenKey('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'));
  });

  it('normalizan el SAN', () => {
    expect(normalizeSan('Bxf7+')).toBe('Bxf7');
    expect(normalizeSan('Qh5#')).toBe('Qh5');
    expect(splitMoves('  e4   e5 ')).toEqual(['e4', 'e5']);
  });
});

describe('buildGraph', () => {
  const graph = buildGraph(LINES, 'w');

  it('funde los prefijos comunes y crea una tarjeta por decisión de la persona', () => {
    // Blancas deciden: inicio (e4), tras 1...e5 (Nf3), tras 2...Nc6 (Bc4 o Bb5); tras 1...c5 no hay más.
    expect(graph.cards).toHaveLength(3);
    expect(acceptedMoves(graph, graph.root)).toEqual(['e4']);
  });

  it('ofrece las dos jugadas en la bifurcación', () => {
    const fork = graph.cards[2]!;
    expect(acceptedMoves(graph, fork)).toEqual(['Bc4', 'Bb5']);
  });

  it('anota dónde termina cada línea', () => {
    const ends = [...graph.nodes.values()].flatMap((node) => node.ends);
    expect(ends.sort()).toEqual([0, 1, 2]);
  });

  it('anota qué líneas siguen siendo posibles en cada posición', () => {
    expect(graph.nodes.get(graph.root)!.through).toEqual([0, 1, 2]);
    const afterE4E5 = [...graph.nodes.values()].find((node) => node.next.size === 1 && node.through.length === 2);
    expect(afterE4E5?.through).toEqual([0, 1]);
    const fork = graph.nodes.get(graph.cards[2]!)!;
    expect(fork.through).toEqual([0, 1]);
    const leaf = [...fork.next.values()].map((key) => graph.nodes.get(key)!.through);
    expect(leaf).toEqual([[0], [1]]);
  });

  it('une las transposiciones', () => {
    const transposed = buildGraph([{ moves: 'e4 e5 Nf3 Nc6' }, { moves: 'Nf3 Nc6 e4 e5' }], 'w');
    const finals = [...transposed.nodes.values()].filter((node) => node.ends.length > 0);
    expect(finals).toHaveLength(1);
    expect(finals[0]!.ends).toEqual([0, 1]);
  });

  it('con Azules como bando, las tarjetas son sus decisiones', () => {
    const black = buildGraph(LINES, 'b');
    // Azules deciden tras 1.e4 (e5 o c5) y tras 2.Nf3 (Nc6); tras 3.Bc4 / 3.Bb5 las líneas ya terminaron.
    expect(black.cards).toHaveLength(2);
  });

  it('avisa de una jugada ilegal con la línea', () => {
    expect(() => buildGraph([{ name: 'Rota', moves: 'e4 e5 Qxe5' }], 'w')).toThrow(/Qxe5.*línea 1.*Rota/);
  });
});
