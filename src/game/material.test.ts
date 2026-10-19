import { describe, expect, it } from 'vitest';
import { sanToMove } from '../engine';
import { createGame, goTo, playMove, positionAt } from './game';
import { leadOf, tallyMaterial } from './material';
import type { GameSnapshot } from './types';

function play(game: GameSnapshot, ...sans: string[]): GameSnapshot {
  let current = game;
  for (const san of sans) {
    const move = sanToMove(positionAt(current), san);
    if (!move) throw new Error(`jugada ilegal: ${san}`);
    current = playMove(current, move);
  }
  return current;
}

describe('material capturado', () => {
  it('no hay capturas al empezar', () => {
    const tally = tallyMaterial(createGame());
    expect(tally.captured).toEqual({ w: {}, b: {} });
    expect(tally.points).toEqual({ w: 0, b: 0 });
  });

  it('cuenta por bando y calcula la ventaja', () => {
    // 1.e4 d5 2.exd5 Qxd5 3.Nc3 Qxg2 4.Bxg2
    const game = play(createGame(), 'e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qxg2', 'Bxg2');
    const tally = tallyMaterial(game);
    expect(tally.captured.w).toEqual({ p: 1, q: 1 });
    expect(tally.captured.b).toEqual({ p: 2 });
    expect(tally.points).toEqual({ w: 10, b: 2 });
    expect(leadOf(tally, 'w')).toBe(8);
    expect(leadOf(tally, 'b')).toBe(0);
  });

  it('solo cuenta hasta la jugada que se está viendo', () => {
    const game = play(createGame(), 'e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qxg2', 'Bxg2');
    const atThree = tallyMaterial(goTo(game, 3));
    expect(atThree.captured).toEqual({ w: { p: 1 }, b: {} });
    expect(leadOf(atThree, 'w')).toBe(1);
    const atFour = tallyMaterial(goTo(game, 4));
    expect(leadOf(atFour, 'w')).toBe(0);
    expect(leadOf(atFour, 'b')).toBe(0);
  });
});
