/**
 * Progreso del entrenamiento: repetición espaciada por cajas (Leitner) y porcentaje de dominio.
 *
 * Una **tarjeta** es una posición en la que la persona tiene que elegir jugada. Cada tarjeta está en
 * una caja de 0 a 5: acertar la sube una caja (cuando ya toca repasarla), fallar la manda a la 0.
 * Cuanto más alta la caja, más tarde vuelve a tocar. El **dominio** de una apertura es la suma de las
 * cajas entre el máximo posible; una tarjeta vencida cuenta una caja menos, así que el dominio
 * «se oxida» si no se repasa. 100 % = todas las tarjetas en la caja 5 y ninguna vencida.
 */

export const MAX_BOX = 5;
export const DAY_MS = 86_400_000;
/** Días que pasan antes de volver a preguntar, según la caja a la que llegó la tarjeta. */
export const INTERVAL_DAYS: readonly number[] = [0, 1, 3, 7, 14, 30];

export interface CardState {
  readonly box: number;
  /** Desde cuándo toca repasarla (ms desde 1970). */
  readonly due: number;
  readonly ok: number;
  readonly bad: number;
  readonly last: number;
}

export const NEW_CARD: CardState = { box: 0, due: 0, ok: 0, bad: 0, last: 0 };

/**
 * `learn` (lecciones) solo saca la tarjeta de la caja 0; `practice` (práctica) también la sube
 * de caja, y solo si ya tocaba repasarla: repetir la misma línea diez veces seguidas no la «domina».
 */
export type ReviewMode = 'learn' | 'practice';

export function review(card: CardState | undefined, ok: boolean, now: number, mode: ReviewMode = 'practice'): CardState {
  const current = card ?? NEW_CARD;
  if (!ok) return { box: 0, due: now, ok: current.ok, bad: current.bad + 1, last: now };

  let box = current.box;
  if (box === 0) box = 1;
  else if (mode === 'practice' && now >= current.due) box = Math.min(MAX_BOX, box + 1);
  const moved = box !== current.box;
  return {
    box,
    due: moved ? now + INTERVAL_DAYS[box]! * DAY_MS : current.due,
    ok: current.ok + 1,
    bad: current.bad,
    last: now,
  };
}

export const isOverdue = (card: CardState | undefined, now: number): boolean =>
  card !== undefined && card.box > 0 && now > card.due;

/** Caja que cuenta para el dominio: una menos si ya venció. */
export const effectiveBox = (card: CardState | undefined, now: number): number =>
  card ? Math.max(0, card.box - (isOverdue(card, now) ? 1 : 0)) : 0;

export interface Summary {
  readonly total: number;
  /** Nunca vistas. */
  readonly fresh: number;
  /** Vistas pero todavía en la caja 0 (falladas o por afianzar). */
  readonly learning: number;
  /** Ya vistas y con el repaso vencido. */
  readonly due: number;
  /** En la caja 5 y al día. */
  readonly mastered: number;
  /** 0 a 1. */
  readonly mastery: number;
  /** 0 a 1: parte de las tarjetas que alguna vez se acertaron. */
  readonly learned: number;
}

export function summarize(cards: readonly (CardState | undefined)[], now: number): Summary {
  let fresh = 0;
  let learning = 0;
  let due = 0;
  let mastered = 0;
  let learned = 0;
  let sum = 0;
  for (const card of cards) {
    if (!card || (card.box === 0 && card.ok + card.bad === 0)) fresh++;
    else if (card.box === 0) learning++;
    else if (now >= card.due) due++;
    if (card && card.box > 0) learned++;
    if (card && card.box === MAX_BOX && !isOverdue(card, now)) mastered++;
    sum += effectiveBox(card, now);
  }
  const total = cards.length;
  return {
    total,
    fresh,
    learning,
    due,
    mastered,
    mastery: total === 0 ? 0 : sum / (MAX_BOX * total),
    learned: total === 0 ? 0 : learned / total,
  };
}

/**
 * Resumen cuando solo se sabe cuántas tarjetas tiene la apertura (el menú no carga sus variantes):
 * las tarjetas guardadas cuentan tal cual y las que faltan, como nuevas.
 */
export function summarizeSaved(saved: Readonly<Record<string, CardState>>, total: number, now: number): Summary {
  const cards: (CardState | undefined)[] = Object.values(saved).slice(0, total);
  while (cards.length < total) cards.push(undefined);
  return summarize(cards, now);
}

/* ---------- lo que se guarda ---------- */

export interface CourseProgress {
  /** Clave de posición → tarjeta. */
  readonly cards: Readonly<Record<string, CardState>>;
  /** Id de lección → cuándo se terminó. */
  readonly lessons: Readonly<Record<string, number>>;
  /** Sesiones de práctica empezadas. */
  readonly sessions: number;
  /** Variantes recorridas hasta el final. */
  readonly lines: number;
  /** Última vez que se estudió (ms). */
  readonly last: number;
}

export interface TrainingProgress {
  readonly v: 1;
  readonly courses: Readonly<Record<string, CourseProgress>>;
}

export const EMPTY_COURSE: CourseProgress = { cards: {}, lessons: {}, sessions: 0, lines: 0, last: 0 };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

function parseCard(value: unknown): CardState | null {
  if (!isRecord(value)) return null;
  const box = count(value.box);
  const due = count(value.due);
  const ok = count(value.ok);
  const bad = count(value.bad);
  const last = count(value.last);
  if (box === null || !Number.isInteger(box) || box > MAX_BOX) return null;
  if (due === null || ok === null || bad === null || last === null) return null;
  return { box, due, ok, bad, last };
}

function parseCourse(value: unknown): CourseProgress {
  if (!isRecord(value)) return EMPTY_COURSE;
  const cards: Record<string, CardState> = {};
  if (isRecord(value.cards)) {
    for (const [key, raw] of Object.entries(value.cards)) {
      const card = parseCard(raw);
      if (card) cards[key] = card;
    }
  }
  const lessons: Record<string, number> = {};
  if (isRecord(value.lessons)) {
    for (const [key, raw] of Object.entries(value.lessons)) {
      const at = count(raw);
      if (at !== null) lessons[key] = at;
    }
  }
  return {
    cards,
    lessons,
    sessions: count(value.sessions) ?? 0,
    lines: count(value.lines) ?? 0,
    last: count(value.last) ?? 0,
  };
}

/** Lee lo guardado y descarta lo que no tenga la forma esperada: un guardado dañado nunca entra. */
export function parseProgress(raw: unknown): TrainingProgress {
  const courses: Record<string, CourseProgress> = {};
  if (isRecord(raw) && raw.v === 1 && isRecord(raw.courses)) {
    for (const [id, value] of Object.entries(raw.courses)) courses[id] = parseCourse(value);
  }
  return { v: 1, courses };
}

/* ---------- almacén ---------- */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_KEY = 'morphiqchess:training:v1';

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Progreso de la persona: se guarda solo y se lee con `useSyncExternalStore`. */
export class TrainingStore {
  private current: TrainingProgress;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly storage: KeyValueStorage | null = defaultStorage(),
    private readonly clock: () => number = Date.now,
  ) {
    this.current = this.load();
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): TrainingProgress => this.current;

  course(id: string): CourseProgress {
    return this.current.courses[id] ?? EMPTY_COURSE;
  }

  /** Anota un acierto o un fallo en la tarjeta de esa posición. */
  reviewCard(courseId: string, key: string, ok: boolean, mode: ReviewMode = 'practice'): void {
    const now = this.clock();
    this.update(courseId, (course) => ({
      ...course,
      cards: { ...course.cards, [key]: review(course.cards[key], ok, now, mode) },
      last: now,
    }));
  }

  completeLesson(courseId: string, lessonId: string): void {
    const now = this.clock();
    this.update(courseId, (course) => ({ ...course, lessons: { ...course.lessons, [lessonId]: now }, last: now }));
  }

  startSession(courseId: string): void {
    const now = this.clock();
    this.update(courseId, (course) => ({ ...course, sessions: course.sessions + 1, last: now }));
  }

  completeLine(courseId: string): void {
    const now = this.clock();
    this.update(courseId, (course) => ({ ...course, lines: course.lines + 1, last: now }));
  }

  /** Descarta las tarjetas guardadas que ya no existen en la apertura (si sus variantes cambiaron). */
  pruneCards(courseId: string, keep: ReadonlySet<string>): void {
    const course = this.current.courses[courseId];
    if (!course) return;
    const kept = Object.entries(course.cards).filter(([key]) => keep.has(key));
    if (kept.length === Object.keys(course.cards).length) return;
    this.update(courseId, (current) => ({ ...current, cards: Object.fromEntries(kept) }));
  }

  /** Borra todo el progreso de una apertura. */
  resetCourse(courseId: string): void {
    const { [courseId]: _removed, ...rest } = this.current.courses;
    this.current = { v: 1, courses: rest };
    this.save();
  }

  private update(courseId: string, change: (course: CourseProgress) => CourseProgress): void {
    this.current = { v: 1, courses: { ...this.current.courses, [courseId]: change(this.course(courseId)) } };
    this.save();
  }

  private load(): TrainingProgress {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      return parseProgress(raw ? (JSON.parse(raw) as unknown) : null);
    } catch {
      return parseProgress(null);
    }
  }

  private save(): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.current));
    } catch {
      /* sin almacenamiento: el progreso vale solo para esta sesión */
    }
    for (const listener of this.listeners) listener();
  }
}
