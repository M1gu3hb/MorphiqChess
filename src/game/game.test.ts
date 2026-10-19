import { describe, expect, it } from 'vitest';
import { parseSquare, sanToMove } from '../engine';
import {
  agreeDraw,
  canPlay,
  claimDraw,
  createGame,
  deserializeGame,
  goTo,
  idsAt,
  inCheckAt,
  isAtEnd,
  orientationAt,
  playMove,
  positionAt,
  resign,
  serializeGame,
  truncateAtCursor,
  undo,
} from './game';
import { GameStore } from './store';
import type { GameSnapshot } from './types';

const sq = (name: string): number => {
  const value = parseSquare(name);
  if (value === null) throw new Error(name);
  return value;
};

function play(game: GameSnapshot, ...sans: string[]): GameSnapshot {
  let current = game;
  for (const san of sans) {
    const move = sanToMove(positionAt(current), san);
    if (!move) throw new Error(`jugada ilegal: ${san}`);
    current = playMove(current, move);
  }
  return current;
}

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('partida', () => {
  it('asigna 32 ids estables a las piezas iniciales', () => {
    const game = createGame();
    const ids = [...idsAt(game)].filter((id) => id >= 0);
    expect(ids).toHaveLength(32);
    expect(new Set(ids).size).toBe(32);
    expect(game.cursor).toBe(0);
    expect(game.outcome).toBeNull();
  });

  it('la pieza conserva su id al moverse y se registra la transición', () => {
    const game = createGame();
    const pawn = idsAt(game)[sq('e2')]!;
    const after = play(game, 'e4');
    expect(idsAt(after)[sq('e4')]).toBe(pawn);
    expect(idsAt(after)[sq('e2')]).toBe(-1);
    expect(after.plies[0]!.san).toBe('e4');
    expect(after.transition).toMatchObject({ type: 'forward', index: 1, source: 'play' });
  });

  it('la captura elimina el id capturado', () => {
    let game = createGame();
    const blackPawn = idsAt(game)[sq('d7')]!;
    const whitePawn = idsAt(game)[sq('e2')]!;
    game = play(game, 'e4', 'd5', 'exd5');
    expect(game.plies[2]!.capturedId).toBe(blackPawn);
    expect(idsAt(game)[sq('d5')]).toBe(whitePawn);
    expect([...idsAt(game)]).not.toContain(blackPawn);
  });

  it('la captura al paso elimina el peón correcto', () => {
    let game = createGame();
    const blackPawn = idsAt(game)[sq('d7')]!;
    game = play(game, 'e4', 'a6', 'e5', 'd5', 'exd6');
    expect(game.plies[4]!.capturedId).toBe(blackPawn);
    expect(idsAt(game)[sq('d5')]).toBe(-1);
  });

  it('en el enroque la torre conserva su id', () => {
    let game = createGame();
    const rook = idsAt(game)[sq('h1')]!;
    game = play(game, 'e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O');
    expect(idsAt(game)[sq('f1')]).toBe(rook);
    expect(idsAt(game)[sq('h1')]).toBe(-1);
  });

  it('la pieza coronada conserva su id y cambia de tipo', () => {
    let game = createGame('8/P7/7k/8/8/8/8/K7 w - - 0 1');
    const pawn = idsAt(game)[sq('a7')]!;
    game = play(game, 'a8=Q');
    expect(idsAt(game)[sq('a8')]).toBe(pawn);
    expect(positionAt(game).board[sq('a8')]).toBe(5);
  });

  it('marca jaque y mate en la jugada', () => {
    const game = play(createGame(), 'f3', 'e5', 'g4', 'Qh4#');
    expect(game.plies[3]!.check).toBe(true);
    expect(game.plies[3]!.mate).toBe(true);
    expect(inCheckAt(game)).toBe(true);
    expect(game.outcome).toEqual({ type: 'checkmate', winner: 'b' });
    expect(canPlay(game)).toBe(false);
  });
});

describe('navegación e historial', () => {
  const base = play(createGame(), 'e4', 'e5', 'Nf3', 'Nc6');

  it('retroceder y avanzar de a una jugada genera transiciones con la jugada', () => {
    const back = goTo(base, 3);
    expect(back.transition).toMatchObject({ type: 'backward', index: 4, source: 'nav' });
    expect(back.cursor).toBe(3);
    const forward = goTo(back, 4);
    expect(forward.transition).toMatchObject({ type: 'forward', index: 4, source: 'nav' });
  });

  it('un salto de varias jugadas es una transición «jump» y se limita al rango válido', () => {
    expect(goTo(base, 0).transition.type).toBe('jump');
    expect(goTo(base, -5).cursor).toBe(0);
    expect(goTo(base, 99).cursor).toBe(base.plies.length);
    expect(goTo(base, base.cursor)).toBe(base);
  });

  it('no se puede jugar mientras se ve una jugada anterior', () => {
    const viewing = goTo(base, 2);
    expect(isAtEnd(viewing)).toBe(false);
    expect(canPlay(viewing)).toBe(false);
    const move = sanToMove(positionAt(base), 'Bc4')!;
    expect(playMove(viewing, move)).toBe(viewing);
  });

  it('«retomar desde aquí» descarta lo posterior y vuelve a permitir jugar', () => {
    const resumed = truncateAtCursor(goTo(base, 2));
    expect(resumed.plies).toHaveLength(2);
    expect(canPlay(resumed)).toBe(true);
    expect(resumed.keys).toHaveLength(3);
    const again = play(resumed, 'Nf3');
    expect(again.plies).toHaveLength(3);
  });
});

describe('deshacer', () => {
  it('quita la última jugada y la transición es de retroceso', () => {
    const game = play(createGame(), 'e4', 'e5');
    const undone = undo(game);
    expect(undone.plies).toHaveLength(1);
    expect(undone.cursor).toBe(1);
    expect(undone.transition).toMatchObject({ type: 'backward', index: 2, source: 'undo' });
    expect(positionAt(undone).turn).toBe('b');
  });

  it('deshace un mate y reabre la partida', () => {
    const mate = play(createGame(), 'f3', 'e5', 'g4', 'Qh4#');
    expect(mate.outcome).not.toBeNull();
    const reopened = undo(mate);
    expect(reopened.outcome).toBeNull();
    expect(canPlay(reopened)).toBe(true);
  });

  it('sin jugadas no hace nada', () => {
    const game = createGame();
    expect(undo(game)).toBe(game);
  });
});

describe('finales manuales y tablas', () => {
  it('rendirse da la victoria al rival y bloquea el juego', () => {
    const game = resign(play(createGame(), 'e4'), 'b');
    expect(game.outcome).toEqual({ type: 'resignation', winner: 'w' });
    expect(canPlay(game)).toBe(false);
  });

  it('tablas por acuerdo', () => {
    const game = agreeDraw(createGame());
    expect(game.outcome).toEqual({ type: 'draw', reason: 'agreement' });
  });

  it('la triple repetición se puede reclamar, no es automática', () => {
    let game = createGame();
    game = play(game, 'Nf3', 'Nf6', 'Ng1', 'Ng8');
    expect(game.claimable).toBeNull();
    game = play(game, 'Nf3', 'Nf6', 'Ng1', 'Ng8');
    expect(game.claimable).toBe('threefold');
    expect(game.outcome).toBeNull();
    const claimed = claimDraw(game);
    expect(claimed.outcome).toEqual({ type: 'draw', reason: 'threefold' });
  });

  it('la quíntuple repetición termina sola', () => {
    let game = createGame();
    for (let i = 0; i < 4; i++) game = play(game, 'Nf3', 'Nf6', 'Ng1', 'Ng8');
    expect(game.outcome).toEqual({ type: 'draw', reason: 'fivefold' });
  });

  it('la regla de 50 movimientos se puede reclamar', () => {
    const game = createGame('4k3/8/8/8/8/8/R7/4K3 w - - 99 80');
    const next = play(game, 'Ra3');
    expect(next.claimable).toBe('fifty-move');
    expect(claimDraw(next).outcome).toEqual({ type: 'draw', reason: 'fifty-move' });
  });
});

describe('orientación de las piezas', () => {
  it('derechas para quien tiene el turno, y fijas si el giro está desactivado', () => {
    const start = createGame();
    expect(orientationAt(start, true)).toBe(0);
    const afterE4 = play(start, 'e4');
    expect(orientationAt(afterE4, true)).toBe(180);
    expect(orientationAt(afterE4, false)).toBe(0);
    expect(orientationAt(goTo(afterE4, 0), true)).toBe(0);
  });

  it('tras un mate se quedan mirando al ganador; al rendirse, también', () => {
    const blueWins = play(createGame(), 'f3', 'e5', 'g4', 'Qh4#');
    expect(orientationAt(blueWins, true)).toBe(180);
    const whiteWins = resign(play(createGame(), 'e4', 'e5'), 'b');
    expect(orientationAt(whiteWins, true)).toBe(0);
  });
});

describe('guardado', () => {
  it('ida y vuelta con coronación y cursor', () => {
    const game = goTo(play(createGame('8/P7/7k/8/8/8/R7/K7 w - - 0 1'), 'a8=N', 'Kg6'), 1);
    const restored = deserializeGame(JSON.parse(JSON.stringify(serializeGame(game))));
    expect(restored).not.toBeNull();
    expect(restored!.plies.map((ply) => ply.san)).toEqual(['a8=N', 'Kg6']);
    expect(restored!.cursor).toBe(1);
  });

  it('conserva el final manual', () => {
    const game = resign(play(createGame(), 'e4'), 'b');
    const restored = deserializeGame(serializeGame(game));
    expect(restored!.outcome).toEqual({ type: 'resignation', winner: 'w' });
  });

  it('rechaza datos dañados o manipulados', () => {
    expect(deserializeGame(null)).toBeNull();
    expect(deserializeGame({ v: 2 })).toBeNull();
    expect(deserializeGame({ v: 1, startFen: 'x', moves: [] })).toBeNull();
    const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    expect(deserializeGame({ v: 1, startFen, moves: ['e2e5'] })).toBeNull();
    expect(
      deserializeGame({
        v: 1,
        startFen,
        moves: ['e2e4'],
        manualOutcome: { type: 'checkmate', winner: 'w' },
      })!.outcome,
    ).toBeNull();
  });
});

describe('GameStore', () => {
  it('guarda cada jugada y puede continuar una partida guardada', () => {
    const storage = new MemoryStorage();
    const store = new GameStore(createGame(), storage);
    let notified = 0;
    store.subscribe(() => notified++);
    store.play(sanToMove(positionAt(store.getSnapshot()), 'e4')!);
    store.play(sanToMove(positionAt(store.getSnapshot()), 'e5')!);
    expect(notified).toBe(2);

    const other = new GameStore(createGame(), storage);
    expect(other.hasSavedGame()).toBe(true);
    expect(other.loadSaved()).toBe(true);
    expect(other.getSnapshot().plies).toHaveLength(2);
  });

  it('una partida nueva sin jugadas borra el guardado', () => {
    const storage = new MemoryStorage();
    const store = new GameStore(createGame(), storage);
    store.play(sanToMove(positionAt(store.getSnapshot()), 'e4')!);
    expect(storage.length).toBe(1);
    store.newGame();
    expect(storage.length).toBe(0);
  });

  it('funciona sin almacenamiento', () => {
    const store = new GameStore(createGame(), null);
    store.play(sanToMove(positionAt(store.getSnapshot()), 'e4')!);
    expect(store.hasSavedGame()).toBe(false);
    expect(store.getSnapshot().plies).toHaveLength(1);
  });
});
