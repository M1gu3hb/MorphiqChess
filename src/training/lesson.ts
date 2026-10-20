import type { Lesson, LessonStep } from './types';

/** Dónde va la persona en una lección: el paso y, dentro de uno para leer, el globo de texto. */
export interface LessonPos {
  readonly step: number;
  readonly bubble: number;
}

export const START: LessonPos = { step: 0, bubble: 0 };

/** Globos que tiene un paso: los de un paso para leer, y uno solo (la instrucción) en uno para jugar. */
export const bubblesIn = (step: LessonStep): number => (step.kind === 'teach' ? step.bubbles.length : 1);

/** La posición que sigue, o null si ya era la última. */
export function nextPos(lesson: Lesson, pos: LessonPos): LessonPos | null {
  const step = lesson.steps[pos.step];
  if (!step) return null;
  if (pos.bubble + 1 < bubblesIn(step)) return { step: pos.step, bubble: pos.bubble + 1 };
  return pos.step + 1 < lesson.steps.length ? { step: pos.step + 1, bubble: 0 } : null;
}

/**
 * La posición anterior para releer, o null si no hay: no se vuelve a un paso para jugar, porque
 * ese ya está resuelto y el tablero seguiría otro camino.
 */
export function prevPos(lesson: Lesson, pos: LessonPos): LessonPos | null {
  if (pos.bubble > 0) return { step: pos.step, bubble: pos.bubble - 1 };
  const before = lesson.steps[pos.step - 1];
  return before?.kind === 'teach' ? { step: pos.step - 1, bubble: before.bubbles.length - 1 } : null;
}

/** Cuánto de la lección se ha recorrido, de 0 a 1 (para la barra de avance). */
export function lessonProgress(lesson: Lesson, pos: LessonPos): number {
  const total = lesson.steps.reduce((sum, step) => sum + bubblesIn(step), 0);
  if (total === 0) return 0;
  let before = 0;
  for (let i = 0; i < pos.step; i++) before += bubblesIn(lesson.steps[i]!);
  return Math.min(1, (before + pos.bubble) / total);
}
