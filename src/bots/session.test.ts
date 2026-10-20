import { describe, expect, it } from 'vitest';
import { createGame, GameStore, legalMovesOf, positionAt, type GameSnapshot } from '../game';
import type { Color } from '../engine';
import { BotsStore } from './records';
import {
  beginSession,
  BOT_GAME_STORAGE_KEY,
  currentGame,
  enterSession,
  pliesToUndo,
  resumable,
} from './session';
import { MemoryStorage } from './testing';
import { findMoveByUci } from './uci';

/** Dos almacenes sobre el mismo almacenamiento; `reopen` simula cerrar y volver a abrir la página. */
function setup() {
  const storage = new MemoryStorage();
  const open = () => ({
    game: new GameStore(createGame(), storage, BOT_GAME_STORAGE_KEY),
    bots: new BotsStore(storage, 'prueba:bots'),
  });
  return { storage, ...open(), reopen: open };
}

function play(game: GameStore, ...moves: string[]): void {
  for (const text of moves) {
    const move = findMoveByUci(legalMovesOf(positionAt(game.getSnapshot())), text);
    if (!move) throw new Error(`jugada ilegal: ${text}`);
    game.play(move);
  }
}

describe('empezar y entrar', () => {
  it('empezar deja una partida nueva y el resultado sin contar', () => {
    const { game, bots } = setup();
    play(game, 'e2e4', 'e7e5');
    beginSession(bots, game, 'caballo-azul', 'b');
    expect(game.getSnapshot().plies).toHaveLength(0);
    expect(bots.getSnapshot().session).toEqual({ bot: 'caballo-azul', side: 'b', recorded: false });
  });

  it('sin partida previa, entrar empieza una', () => {
    const { game, bots } = setup();
    enterSession(bots, game, 'peon-blanco', 'w');
    expect(bots.getSnapshot().session).toEqual({ bot: 'peon-blanco', side: 'w', recorded: false });
    expect(game.getSnapshot().plies).toHaveLength(0);
  });

  it('entrar a otro rival, o con otro bando, reemplaza la partida', () => {
    const { game, bots } = setup();
    beginSession(bots, game, 'peon-blanco', 'w');
    play(game, 'd2d4', 'd7d5');
    enterSession(bots, game, 'rey-azul', 'w');
    expect(game.getSnapshot().plies).toHaveLength(0);
    expect(bots.getSnapshot().session?.bot).toBe('rey-azul');

    play(game, 'd2d4');
    enterSession(bots, game, 'rey-azul', 'b');
    expect(game.getSnapshot().plies).toHaveLength(0);
    expect(bots.getSnapshot().session).toEqual({ bot: 'rey-azul', side: 'b', recorded: false });
  });

  it('entrar a la misma partida, ya cargada, no la toca', () => {
    const { game, bots } = setup();
    beginSession(bots, game, 'alfil-azul', 'w');
    play(game, 'e2e4');
    const before = game.getSnapshot();
    enterSession(bots, game, 'alfil-azul', 'w');
    expect(game.getSnapshot()).toBe(before);
  });

  it('al reabrir la página retoma la partida guardada', () => {
    const first = setup();
    beginSession(first.bots, first.game, 'alfil-azul', 'b');
    play(first.game, 'e2e4', 'e7e5', 'g1f3');

    const second = first.reopen();
    expect(second.game.getSnapshot().plies).toHaveLength(0);
    enterSession(second.bots, second.game, 'alfil-azul', 'b');
    expect(second.game.getSnapshot().plies).toHaveLength(3);
    expect(second.bots.getSnapshot().session).toEqual({ bot: 'alfil-azul', side: 'b', recorded: false });
  });

  it('si la partida terminada ya no está guardada, la siguiente cuenta como nueva', () => {
    const { storage, game, bots } = setup();
    beginSession(bots, game, 'torre-azul', 'w');
    bots.record('loss');
    expect(bots.getSnapshot().session?.recorded).toBe(true);

    storage.removeItem(BOT_GAME_STORAGE_KEY);
    const reopened = new GameStore(createGame(), storage, BOT_GAME_STORAGE_KEY);
    enterSession(bots, reopened, 'torre-azul', 'w');
    expect(bots.getSnapshot().session?.recorded).toBe(false);
    // El resultado ya contado se conserva.
    expect(bots.getSnapshot().records['torre-azul']).toEqual({ wins: 0, draws: 0, losses: 1 });
  });

  it('entrar varias veces seguidas da lo mismo', () => {
    const { game, bots } = setup();
    enterSession(bots, game, 'dama-blanca', 'b');
    enterSession(bots, game, 'dama-blanca', 'b');
    expect(bots.getSnapshot().session).toEqual({ bot: 'dama-blanca', side: 'b', recorded: false });
    expect(game.getSnapshot().plies).toHaveLength(0);
  });
});

describe('partida en curso', () => {
  it('currentGame usa la de memoria y, si no hay, la guardada', () => {
    const first = setup();
    expect(currentGame(first.game)).toBeNull();
    play(first.game, 'e2e4');
    expect(currentGame(first.game)).toBe(first.game.getSnapshot());

    const second = first.reopen();
    expect(second.game.getSnapshot().plies).toHaveLength(0);
    expect(currentGame(second.game)?.plies).toHaveLength(1);
  });

  it('solo se puede retomar una partida sin terminar y con jugadas', () => {
    const { game, bots } = setup();
    expect(resumable(bots.getSnapshot(), null)).toBeNull();

    beginSession(bots, game, 'caballo-blanco', 'w');
    expect(resumable(bots.getSnapshot(), game.getSnapshot())).toBeNull();

    play(game, 'e2e4', 'e7e5');
    expect(resumable(bots.getSnapshot(), game.getSnapshot())).toEqual({ bot: 'caballo-blanco', side: 'w', plies: 2 });

    game.resign('w');
    expect(resumable(bots.getSnapshot(), game.getSnapshot())).toBeNull();
  });

  it('una partida ya contada no se puede retomar', () => {
    const { game, bots } = setup();
    beginSession(bots, game, 'caballo-blanco', 'w');
    play(game, 'e2e4');
    bots.record('draw');
    expect(resumable(bots.getSnapshot(), game.getSnapshot())).toBeNull();
  });
});

describe('deshacer tu última jugada', () => {
  const after = (side: Color, ...moves: string[]): GameSnapshot => {
    const { game } = setup();
    play(game, ...moves);
    expect(side === 'w' || side === 'b').toBe(true);
    return game.getSnapshot();
  };

  it('con Blancas: tu turno quita tu jugada y la respuesta; el turno del rival, solo la tuya', () => {
    expect(pliesToUndo(after('w'), 'w')).toBe(0);
    expect(pliesToUndo(after('w', 'e2e4'), 'w')).toBe(1);
    expect(pliesToUndo(after('w', 'e2e4', 'e7e5'), 'w')).toBe(2);
    expect(pliesToUndo(after('w', 'e2e4', 'e7e5', 'g1f3'), 'w')).toBe(1);
  });

  it('con Azules: nunca se deshace la primera jugada del rival', () => {
    expect(pliesToUndo(after('b'), 'b')).toBe(0);
    expect(pliesToUndo(after('b', 'e2e4'), 'b')).toBe(0);
    expect(pliesToUndo(after('b', 'e2e4', 'e7e5'), 'b')).toBe(1);
    expect(pliesToUndo(after('b', 'e2e4', 'e7e5', 'g1f3'), 'b')).toBe(2);
  });

  it('tras deshacer vuelve a ser tu turno, en cualquier caso', () => {
    for (const side of ['w', 'b'] as const) {
      const { game } = setup();
      play(game, 'e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4');
      const count = pliesToUndo(game.getSnapshot(), side);
      expect(count).toBeGreaterThan(0);
      game.undoPlies(count);
      expect(positionAt(game.getSnapshot()).turn).toBe(side);
    }
  });

  it('no se deshace con la partida terminada ni revisando jugadas anteriores', () => {
    const { game } = setup();
    play(game, 'e2e4', 'e7e5');
    game.back();
    expect(pliesToUndo(game.getSnapshot(), 'w')).toBe(0);
    game.last();
    expect(pliesToUndo(game.getSnapshot(), 'w')).toBe(2);
    game.resign('w');
    expect(pliesToUndo(game.getSnapshot(), 'w')).toBe(0);
  });
});
