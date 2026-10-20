import { describe, expect, it } from 'vitest';
import { START, bubblesIn, lessonProgress, nextPos, prevPos } from './lesson';
import type { Lesson } from './types';

const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const lesson: Lesson = {
  id: 'demo',
  title: 'Demo',
  summary: '',
  level: 'beginner',
  steps: [
    { kind: 'teach', fen: FEN, title: 'A', bubbles: ['uno', 'dos', 'tres'] },
    { kind: 'play', fen: FEN, prompt: 'p', hint: 'h', accept: ['e4'] },
    { kind: 'teach', fen: FEN, title: 'B', bubbles: ['cuatro', 'cinco'] },
  ],
};

describe('recorrido de una lección', () => {
  it('cuenta los globos de cada paso', () => {
    expect(lesson.steps.map(bubblesIn)).toEqual([3, 1, 2]);
  });

  it('avanza globo a globo, paso a paso, y termina', () => {
    const seen = [START];
    for (let pos = nextPos(lesson, START); pos; pos = nextPos(lesson, pos)) seen.push(pos);
    expect(seen).toEqual([
      { step: 0, bubble: 0 },
      { step: 0, bubble: 1 },
      { step: 0, bubble: 2 },
      { step: 1, bubble: 0 },
      { step: 2, bubble: 0 },
      { step: 2, bubble: 1 },
    ]);
    expect(nextPos(lesson, { step: 2, bubble: 1 })).toBeNull();
    expect(nextPos(lesson, { step: 9, bubble: 0 })).toBeNull();
  });

  it('retrocede para releer, pero no a un paso para jugar', () => {
    expect(prevPos(lesson, START)).toBeNull();
    expect(prevPos(lesson, { step: 0, bubble: 2 })).toEqual({ step: 0, bubble: 1 });
    expect(prevPos(lesson, { step: 2, bubble: 0 })).toBeNull();
    expect(prevPos(lesson, { step: 2, bubble: 1 })).toEqual({ step: 2, bubble: 0 });
    const twoTeach: Lesson = { ...lesson, steps: [lesson.steps[0]!, lesson.steps[2]!] };
    expect(prevPos(twoTeach, { step: 1, bubble: 0 })).toEqual({ step: 0, bubble: 2 });
  });

  it('mide el avance de 0 a 1', () => {
    expect(lessonProgress(lesson, START)).toBe(0);
    expect(lessonProgress(lesson, { step: 1, bubble: 0 })).toBeCloseTo(3 / 6);
    expect(lessonProgress(lesson, { step: 2, bubble: 1 })).toBeCloseTo(5 / 6);
    expect(lessonProgress({ ...lesson, steps: [] }, START)).toBe(0);
  });
});
