import type { Color } from '../engine';

/**
 * Tipos del modo entrenamiento. Todo lo que hay en `src/training` es lógica pura (sin DOM ni React),
 * igual que `engine` y `game`: se puede probar sola y la interfaz solo la usa.
 */

export type Level = 'beginner' | 'intermediate' | 'advanced';

/** Cómo se agrupan las aperturas en el menú. */
export type Group = 'aperturas' | 'defensas' | 'fundamentos';

/* ---------- lecciones ---------- */

/** Paso para leer: el tablero muestra `fen` y la persona avanza con «Siguiente». */
export interface TeachStep {
  readonly kind: 'teach';
  readonly fen: string;
  readonly title: string;
  /**
   * Globos de texto, uno por «Siguiente». Cada uno usa el formato mínimo de `markup.ts`
   * (`## título`, `**negrita**`, `*cursiva*`, listas, `> cita` y `{{Nf3}}` para jugadas).
   */
  readonly bubbles: readonly string[];
}

/** Paso para jugar: hay que hacer una de las jugadas de `accept` sobre `fen`. */
export interface PlayStep {
  readonly kind: 'play';
  readonly fen: string;
  readonly prompt: string;
  readonly hint: string;
  /** SAN canónico (letras inglesas) de las jugadas aceptadas, sin «+» ni «#». */
  readonly accept: readonly string[];
}

export type LessonStep = TeachStep | PlayStep;

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly level: Level;
  readonly steps: readonly LessonStep[];
}

/* ---------- líneas para practicar ---------- */

/** Una variante: la secuencia completa desde la posición inicial. */
export interface Line {
  /** Nombre en español. */
  readonly name: string;
  /** Nombre original (inglés), tal como lo publica la fuente. */
  readonly nameEn: string;
  readonly eco: string;
  /** SAN canónico separado por espacios: «e4 e5 Nf3 Nc6 Bc4». */
  readonly moves: string;
  /** La fuente la marca como línea principal. */
  readonly main?: true;
}

export interface LinesFile {
  readonly id: string;
  readonly source: string;
  /** Bando que entrena la persona. */
  readonly side: Color;
  readonly lines: readonly Line[];
}

/* ---------- catálogo (se carga junto con la pantalla del menú) ---------- */

export interface LessonInfo {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly level: Level;
  readonly steps: number;
  /** Pasos en los que hay que mover una pieza. */
  readonly plays: number;
}

export interface LinesInfo {
  /** Nombre del archivo en `data/lines`. */
  readonly id: string;
  readonly count: number;
  /** Posiciones distintas en las que le toca decidir a la persona (cada una es una tarjeta). */
  readonly cards: number;
}

export interface CourseInfo {
  readonly id: string;
  readonly name: string;
  readonly summary: string;
  readonly group: Group;
  /** Bando con el que se entrena. */
  readonly side: Color;
  readonly lessons: readonly LessonInfo[];
  readonly lines: LinesInfo | null;
}

export interface Credit {
  readonly name: string;
  readonly holder: string;
  readonly url: string;
  readonly license: string;
  readonly use: string;
}

export interface Catalog {
  readonly courses: readonly CourseInfo[];
  readonly credits: readonly Credit[];
}
