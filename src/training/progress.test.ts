import { describe, expect, it } from 'vitest';
import {
  DAY_MS,
  MAX_BOX,
  STORAGE_KEY,
  TrainingStore,
  effectiveBox,
  parseProgress,
  review,
  summarize,
  summarizeSaved,
  type CardState,
  type KeyValueStorage,
} from './progress';

const T0 = 1_700_000_000_000;
const card = (box: number, due = 0): CardState => ({ box, due, ok: 1, bad: 0, last: T0 });

describe('review', () => {
  it('una tarjeta nueva acertada pasa a la caja 1 y vuelve a tocar en un día', () => {
    expect(review(undefined, true, T0)).toEqual({ box: 1, due: T0 + DAY_MS, ok: 1, bad: 0, last: T0 });
  });

  it('fallar la manda a la caja 0 y toca de inmediato', () => {
    expect(review(card(4, T0 + DAY_MS), false, T0)).toMatchObject({ box: 0, due: T0, bad: 1 });
  });

  it('en práctica solo sube de caja cuando ya tocaba repasarla', () => {
    const notDue = review(card(2, T0 + DAY_MS), true, T0);
    expect(notDue.box).toBe(2);
    expect(notDue.due).toBe(T0 + DAY_MS);
    const due = review(card(2, T0 - 1), true, T0);
    expect(due.box).toBe(3);
    expect(due.due).toBe(T0 + 7 * DAY_MS);
  });

  it('la caja 5 es el techo', () => {
    expect(review(card(MAX_BOX, T0 - 1), true, T0).box).toBe(MAX_BOX);
  });

  it('en lecciones solo saca la tarjeta de la caja 0', () => {
    expect(review(undefined, true, T0, 'learn').box).toBe(1);
    expect(review(card(2, T0 - 1), true, T0, 'learn').box).toBe(2);
  });
});

describe('dominio', () => {
  it('es 100 % solo con todo en la caja 5 y al día', () => {
    const cards = [card(5, T0 + DAY_MS), card(5, T0 + DAY_MS)];
    expect(summarize(cards, T0).mastery).toBe(1);
    expect(summarize(cards, T0).mastered).toBe(2);
  });

  it('una tarjeta vencida cuenta una caja menos', () => {
    expect(effectiveBox(card(5, T0 - 1), T0)).toBe(4);
    expect(summarize([card(5, T0 - 1)], T0).mastery).toBeCloseTo(4 / 5);
  });

  it('mezcla tarjetas nuevas, falladas y repasos pendientes', () => {
    const failed: CardState = { box: 0, due: T0, ok: 0, bad: 2, last: T0 };
    const summary = summarize([undefined, failed, card(1, T0 - 1), card(3, T0 + DAY_MS)], T0);
    expect(summary).toMatchObject({ total: 4, fresh: 1, learning: 1, due: 1, mastered: 0 });
    expect(summary.mastery).toBeCloseTo((0 + 0 + 0 + 3) / 20);
    expect(summary.learned).toBeCloseTo(0.5);
  });

  it('sin tarjetas el dominio es 0', () => {
    expect(summarize([], T0).mastery).toBe(0);
  });

  it('con solo el total de tarjetas, las que faltan cuentan como nuevas y nunca pasa del 100 %', () => {
    const saved = { a: card(5, T0 + DAY_MS), b: card(5, T0 + DAY_MS) };
    expect(summarizeSaved(saved, 4, T0)).toMatchObject({ total: 4, fresh: 2, mastered: 2 });
    expect(summarizeSaved(saved, 4, T0).mastery).toBeCloseTo(0.5);
    expect(summarizeSaved(saved, 1, T0)).toMatchObject({ total: 1, mastered: 1, mastery: 1 });
    expect(summarizeSaved({}, 3, T0)).toMatchObject({ total: 3, fresh: 3, mastery: 0 });
  });
});

describe('guardado', () => {
  const memory = (initial?: string): KeyValueStorage & { data: Map<string, string> } => {
    const data = new Map<string, string>(initial ? [[STORAGE_KEY, initial]] : []);
    return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value) };
  };

  it('guarda y recupera el progreso', () => {
    const storage = memory();
    const store = new TrainingStore(storage, () => T0);
    store.reviewCard('italiana', 'k1', true);
    store.completeLesson('italiana', 'italian-game');
    store.startSession('italiana');
    store.completeLine('italiana');
    const again = new TrainingStore(storage, () => T0);
    expect(again.course('italiana')).toMatchObject({
      sessions: 1,
      lines: 1,
      lessons: { 'italian-game': T0 },
      cards: { k1: { box: 1 } },
    });
  });

  it('avisa a quien escucha y puede borrar una apertura', () => {
    const store = new TrainingStore(memory(), () => T0);
    let calls = 0;
    const off = store.subscribe(() => calls++);
    store.reviewCard('a', 'k', true);
    store.resetCourse('a');
    off();
    store.reviewCard('a', 'k', true);
    expect(calls).toBe(2);
    expect(store.getSnapshot().courses.a?.cards.k?.box).toBe(1);
  });

  it('descarta las tarjetas que ya no existen y no guarda de más', () => {
    const store = new TrainingStore(memory(), () => T0);
    store.reviewCard('a', 'k1', true);
    store.reviewCard('a', 'k2', true);
    let calls = 0;
    store.subscribe(() => calls++);
    store.pruneCards('a', new Set(['k1', 'k2', 'k3']));
    store.pruneCards('otra', new Set());
    expect(calls).toBe(0);
    store.pruneCards('a', new Set(['k2']));
    expect(Object.keys(store.course('a').cards)).toEqual(['k2']);
    expect(calls).toBe(1);
  });

  it('descarta datos dañados', () => {
    expect(parseProgress('basura')).toEqual({ v: 1, courses: {} });
    expect(parseProgress({ v: 2, courses: { a: {} } }).courses).toEqual({});
    const parsed = parseProgress({
      v: 1,
      courses: {
        a: {
          cards: { good: card(2), badBox: { ...card(2), box: 9 }, nan: { ...card(1), due: Number.NaN }, junk: 5 },
          lessons: { l1: 5, l2: 'x' },
          sessions: -3,
        },
      },
    });
    expect(Object.keys(parsed.courses.a!.cards)).toEqual(['good']);
    expect(parsed.courses.a!.lessons).toEqual({ l1: 5 });
    expect(parsed.courses.a!.sessions).toBe(0);
  });

  it('arranca vacío si lo guardado no es JSON y funciona sin almacenamiento', () => {
    expect(new TrainingStore(memory('{no es json'), () => T0).getSnapshot().courses).toEqual({});
    const sin = new TrainingStore(null, () => T0);
    sin.reviewCard('a', 'k', true);
    expect(sin.course('a').cards.k?.box).toBe(1);
  });
});
