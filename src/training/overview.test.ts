import { describe, expect, it } from 'vitest';
import { courseStatus, overview } from './overview';
import { DAY_MS, type CardState, type TrainingProgress } from './progress';
import type { CourseInfo } from './types';

const NOW = 1_700_000_000_000;
const card = (box: number, due = NOW + DAY_MS): CardState => ({ box, due, ok: 1, bad: 0, last: NOW });

const lesson = (id: string) => ({ id, title: id, summary: '', level: 'beginner' as const, steps: 3, plays: 1 });
const italiana: CourseInfo = {
  id: 'italiana',
  name: 'Italiana',
  summary: '',
  group: 'aperturas',
  side: 'w',
  lessons: [lesson('l1'), lesson('l2')],
  lines: { id: 'italiana', count: 4, cards: 4 },
};
const siciliana: CourseInfo = { ...italiana, id: 'siciliana', group: 'defensas', side: 'b', lessons: [lesson('s1')], lines: null };
const vienesa: CourseInfo = { ...italiana, id: 'vienesa', lessons: [], lines: { id: 'vienesa', count: 1, cards: 1 } };

const progress = (courses: TrainingProgress['courses']): TrainingProgress => ({ v: 1, courses });

describe('estado de una apertura', () => {
  it('sin progreso todo está por empezar', () => {
    const status = courseStatus(italiana, progress({}), NOW);
    expect(status).toMatchObject({ lessonsDone: 0, lessonsTotal: 2, review: 0, inProgress: 0 });
    expect(status.summary).toMatchObject({ total: 4, fresh: 4, mastery: 0 });
  });

  it('cuenta las lecciones hechas (ignora ids que ya no existen) y reparte las posiciones', () => {
    const saved = progress({
      italiana: {
        cards: {
          a: card(5),
          b: card(2),
          c: card(3, NOW - 1),
          d: { box: 0, due: NOW, ok: 0, bad: 1, last: NOW },
        },
        lessons: { l1: NOW, viejo: NOW },
        sessions: 0,
        lines: 0,
        last: NOW,
      },
    });
    const status = courseStatus(italiana, saved, NOW);
    expect(status.lessonsDone).toBe(1);
    expect(status.summary).toMatchObject({ fresh: 0, learning: 1, due: 1, mastered: 1 });
    expect(status.review).toBe(2);
    expect(status.inProgress).toBe(1);
  });

  it('una apertura sin variantes no tiene dominio', () => {
    expect(courseStatus(siciliana, progress({}), NOW).summary).toBeNull();
  });
});

describe('resumen general', () => {
  it('suma lecciones y pondera el dominio por posiciones', () => {
    const saved = progress({
      italiana: { cards: { a: card(5), b: card(5), c: card(5), d: card(5) }, lessons: { l1: NOW }, sessions: 0, lines: 0, last: NOW },
      siciliana: { cards: {}, lessons: { s1: NOW }, sessions: 0, lines: 0, last: NOW },
    });
    const all = overview([italiana, siciliana, vienesa], saved, NOW);
    expect(all).toMatchObject({ lessonsDone: 2, lessonsTotal: 3, review: 0, mastered: 4, positions: 5 });
    // 4 posiciones al 100 % y 1 nueva (la de la vienesa): 4/5. Las nuevas no cuentan como «para repasar».
    expect(all.mastery).toBeCloseTo(0.8);
  });

  it('sin nada que practicar el dominio es nulo', () => {
    expect(overview([siciliana], progress({}), NOW).mastery).toBeNull();
  });
});
