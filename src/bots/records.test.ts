import { describe, expect, it } from 'vitest';
import type { Outcome } from '../engine';
import { BOTS_STORAGE_KEY, BotsStore, parseBotsState, resultFor } from './records';
import { MemoryStorage } from './testing';

describe('resultado para quien juega', () => {
  it('mate y rendición', () => {
    const mate: Outcome = { type: 'checkmate', winner: 'w' };
    const resigned: Outcome = { type: 'resignation', winner: 'b' };
    expect(resultFor(mate, 'w')).toBe('win');
    expect(resultFor(mate, 'b')).toBe('loss');
    expect(resultFor(resigned, 'b')).toBe('win');
    expect(resultFor(resigned, 'w')).toBe('loss');
  });

  it('cualquier tablas es empate', () => {
    for (const reason of ['stalemate', 'agreement', 'threefold', 'fifty-move', 'fivefold', 'insufficient-material', 'seventy-five-move'] as const) {
      const outcome: Outcome = { type: 'draw', reason };
      expect(resultFor(outcome, 'w')).toBe('draw');
      expect(resultFor(outcome, 'b')).toBe('draw');
    }
  });
});

describe('lectura de lo guardado', () => {
  it('lo que no es un objeto, o tiene otra versión, se descarta', () => {
    const empty = { session: null, records: {} };
    for (const raw of [null, undefined, 3, 'x', [], { v: 2, records: {} }, {}]) {
      expect(parseBotsState(raw)).toEqual(empty);
    }
  });

  it('conserva sesión y resultados válidos', () => {
    const state = parseBotsState({
      v: 1,
      session: { bot: 'caballo-azul', side: 'b', recorded: false },
      records: { 'caballo-azul': { wins: 3, draws: 1, losses: 2 }, 'rey-azul': { wins: 0, draws: 0, losses: 9 } },
    });
    expect(state.session).toEqual({ bot: 'caballo-azul', side: 'b', recorded: false });
    expect(state.records['caballo-azul']).toEqual({ wins: 3, draws: 1, losses: 2 });
    expect(state.records['rey-azul']).toEqual({ wins: 0, draws: 0, losses: 9 });
  });

  it('descarta una sesión dañada pero conserva los resultados', () => {
    const base = { v: 1, records: { 'peon-blanco': { wins: 1, draws: 0, losses: 0 } } };
    for (const session of [
      { bot: 'Peón!', side: 'w', recorded: false },
      { bot: 'peon-blanco', side: 'x', recorded: false },
      { bot: 'peon-blanco', side: 'w', recorded: 'no' },
      { bot: 7, side: 'w', recorded: true },
      'texto',
    ]) {
      const state = parseBotsState({ ...base, session });
      expect(state.session).toBeNull();
      expect(state.records['peon-blanco']).toEqual({ wins: 1, draws: 0, losses: 0 });
    }
  });

  it('descarta resultados absurdos o con ids raros, uno por uno', () => {
    const state = parseBotsState({
      v: 1,
      session: null,
      records: {
        bueno: { wins: 1, draws: 2, losses: 3 },
        'Mayúsculas': { wins: 1, draws: 0, losses: 0 },
        '../x': { wins: 1, draws: 0, losses: 0 },
        negativo: { wins: -1, draws: 0, losses: 0 },
        decimal: { wins: 1.5, draws: 0, losses: 0 },
        enorme: { wins: 1e12, draws: 0, losses: 0 },
        texto: { wins: '3', draws: 0, losses: 0 },
        incompleto: { wins: 1 },
        nulo: null,
      },
    });
    expect(Object.keys(state.records)).toEqual(['bueno']);
  });
});

describe('BotsStore', () => {
  it('cuenta cada partida una sola vez', () => {
    const store = new BotsStore(new MemoryStorage());
    store.startSession('torre-azul', 'w');
    store.record('win');
    store.record('win');
    store.record('loss');
    expect(store.getSnapshot().records['torre-azul']).toEqual({ wins: 1, draws: 0, losses: 0 });
    expect(store.getSnapshot().session?.recorded).toBe(true);
  });

  it('sin partida en curso no cuenta nada', () => {
    const store = new BotsStore(new MemoryStorage());
    store.record('win');
    expect(store.getSnapshot().records).toEqual({});
  });

  it('una partida nueva conserva los resultados y vuelve a poder contarse', () => {
    const store = new BotsStore(new MemoryStorage());
    store.startSession('torre-azul', 'w');
    store.record('draw');
    store.startSession('torre-azul', 'b');
    expect(store.getSnapshot().session).toEqual({ bot: 'torre-azul', side: 'b', recorded: false });
    store.record('loss');
    expect(store.getSnapshot().records['torre-azul']).toEqual({ wins: 0, draws: 1, losses: 1 });
  });

  it('cada rival lleva su cuenta', () => {
    const store = new BotsStore(new MemoryStorage());
    store.startSession('peon-blanco', 'w');
    store.record('win');
    store.startSession('rey-azul', 'w');
    store.record('loss');
    const { records } = store.getSnapshot();
    expect(records['peon-blanco']).toEqual({ wins: 1, draws: 0, losses: 0 });
    expect(records['rey-azul']).toEqual({ wins: 0, draws: 0, losses: 1 });
  });

  it('guarda y recupera entre visitas', () => {
    const storage = new MemoryStorage();
    const first = new BotsStore(storage);
    first.startSession('dama-blanca', 'b');
    first.record('win');
    expect(JSON.parse(storage.getItem(BOTS_STORAGE_KEY)!)).toMatchObject({ v: 1 });
    const second = new BotsStore(storage);
    expect(second.getSnapshot()).toEqual(first.getSnapshot());
  });

  it('avisa a quien está suscrito, y deja de avisar al darse de baja', () => {
    const store = new BotsStore(new MemoryStorage());
    let calls = 0;
    const off = store.subscribe(() => calls++);
    store.startSession('alfil-azul', 'w');
    store.record('win');
    expect(calls).toBe(2);
    off();
    store.resetRecords();
    expect(calls).toBe(2);
  });

  it('el estado cambia de identidad solo cuando cambia de verdad', () => {
    const store = new BotsStore(new MemoryStorage());
    store.startSession('alfil-azul', 'w');
    const before = store.getSnapshot();
    store.record('win');
    store.record('win');
    expect(store.getSnapshot()).not.toBe(before);
    const after = store.getSnapshot();
    store.record('win');
    expect(store.getSnapshot()).toBe(after);
  });

  it('reiniciar borra los resultados pero no la partida en curso', () => {
    const store = new BotsStore(new MemoryStorage());
    store.startSession('alfil-azul', 'w');
    store.record('win');
    store.resetRecords();
    expect(store.getSnapshot().records).toEqual({});
    expect(store.getSnapshot().session).toEqual({ bot: 'alfil-azul', side: 'w', recorded: true });
  });

  it('funciona sin almacenamiento o con el almacenamiento roto', () => {
    const none = new BotsStore(null);
    none.startSession('peon-azul', 'w');
    none.record('win');
    expect(none.getSnapshot().records['peon-azul']?.wins).toBe(1);

    const full = new MemoryStorage();
    full.failWrites = true;
    const store = new BotsStore(full);
    store.startSession('peon-azul', 'w');
    store.record('draw');
    expect(store.getSnapshot().records['peon-azul']?.draws).toBe(1);
  });

  it('ignora un guardado ilegible', () => {
    const storage = new MemoryStorage();
    storage.setItem(BOTS_STORAGE_KEY, '{no es json');
    expect(new BotsStore(storage).getSnapshot()).toEqual({ session: null, records: {} });
  });

  it('usa la clave que se le da', () => {
    const storage = new MemoryStorage();
    const store = new BotsStore(storage, 'otra-clave');
    store.startSession('peon-azul', 'w');
    expect(storage.getItem('otra-clave')).not.toBeNull();
    expect(storage.getItem(BOTS_STORAGE_KEY)).toBeNull();
  });
});
