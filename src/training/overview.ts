import { EMPTY_COURSE, summarizeSaved, type Summary, type TrainingProgress } from './progress';
import type { CourseInfo } from './types';

/** Lo que el menú y la pantalla de una apertura muestran de su progreso. */
export interface CourseStatus {
  readonly lessonsDone: number;
  readonly lessonsTotal: number;
  /** Solo las aperturas con variantes para practicar tienen dominio. */
  readonly summary: Summary | null;
  /** Posiciones que conviene repasar ya: falladas o con el repaso vencido. */
  readonly review: number;
  /** Aprendidas pero todavía no dominadas ni vencidas. */
  readonly inProgress: number;
}

export function courseStatus(course: CourseInfo, progress: TrainingProgress, now: number): CourseStatus {
  const saved = progress.courses[course.id] ?? EMPTY_COURSE;
  const lessonsDone = course.lessons.filter((lesson) => saved.lessons[lesson.id] !== undefined).length;
  const summary = course.lines ? summarizeSaved(saved.cards, course.lines.cards, now) : null;
  const review = summary ? summary.learning + summary.due : 0;
  const inProgress = summary ? Math.max(0, summary.total - summary.fresh - review - summary.mastered) : 0;
  return { lessonsDone, lessonsTotal: course.lessons.length, summary, review, inProgress };
}

export interface Overview {
  readonly lessonsDone: number;
  readonly lessonsTotal: number;
  /** Dominio de todo lo que se practica (0 a 1), ponderado por posiciones; null si nada se practica. */
  readonly mastery: number | null;
  readonly review: number;
  readonly mastered: number;
  readonly positions: number;
}

export function overview(courses: readonly CourseInfo[], progress: TrainingProgress, now: number): Overview {
  let lessonsDone = 0;
  let lessonsTotal = 0;
  let review = 0;
  let mastered = 0;
  let positions = 0;
  let weighted = 0;
  for (const course of courses) {
    const status = courseStatus(course, progress, now);
    lessonsDone += status.lessonsDone;
    lessonsTotal += status.lessonsTotal;
    if (status.summary) {
      review += status.review;
      mastered += status.summary.mastered;
      positions += status.summary.total;
      weighted += status.summary.mastery * status.summary.total;
    }
  }
  return { lessonsDone, lessonsTotal, mastery: positions > 0 ? weighted / positions : null, review, mastered, positions };
}
