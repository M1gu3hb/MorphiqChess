import catalogData from './data/catalog.json';
import { buildGraph, type OpeningGraph } from './graph';
import type { Catalog, CourseInfo, Group, Lesson, LinesFile } from './types';

/** Lo que dice `data/catalog.json` (la forma la comprueba `data.test.ts`). */
export const catalog = catalogData as unknown as Catalog;

/** Orden de los grupos en el menú. */
export const GROUPS: readonly Group[] = ['aperturas', 'defensas', 'fundamentos'];

export const courseById = (id: string): CourseInfo | undefined => catalog.courses.find((course) => course.id === id);

export const coursesIn = (group: Group): CourseInfo[] => catalog.courses.filter((course) => course.group === group);

/* Lecciones y variantes se piden al abrir cada apertura: no pesan hasta que se usan. */
const lessonLoaders = import.meta.glob<Lesson>('./data/lessons/*.json', { import: 'default' });
const linesLoaders = import.meta.glob<LinesFile>('./data/lines/*.json', { import: 'default' });

function load<T>(loaders: Readonly<Record<string, () => Promise<T>>>, path: string, what: string): Promise<T> {
  const loader = loaders[path];
  return loader ? loader() : Promise.reject(new Error(`No existe ${what}`));
}

export const loadLesson = (id: string): Promise<Lesson> => load(lessonLoaders, `./data/lessons/${id}.json`, `la lección «${id}»`);

export interface CourseLines {
  readonly file: LinesFile;
  readonly graph: OpeningGraph;
}

const linesCache = new Map<string, Promise<CourseLines>>();

/** Variantes de una apertura ya convertidas en grafo. Se guardan en memoria para no armarlas dos veces. */
export function loadCourseLines(course: CourseInfo): Promise<CourseLines> {
  const info = course.lines;
  if (!info) return Promise.reject(new Error(`«${course.name}» no tiene variantes para practicar`));
  let cached = linesCache.get(info.id);
  if (!cached) {
    cached = load(linesLoaders, `./data/lines/${info.id}.json`, `el archivo de variantes «${info.id}»`).then((file) => ({
      file,
      graph: buildGraph(file.lines, file.side),
    }));
    // Si falla (sin red, por ejemplo) no se queda guardado el error: se puede volver a intentar.
    cached.catch(() => linesCache.delete(info.id));
    linesCache.set(info.id, cached);
  }
  return cached;
}
