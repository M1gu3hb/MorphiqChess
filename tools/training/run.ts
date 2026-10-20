/**
 * Genera `src/training/data` a partir de tres repositorios clonados aparte: KarpaChess y FreeChessTrainer
 * (licencia MIT) y la base de nombres de aperturas de Lichess (dominio público, CC0). Valida todo con
 * el motor de la app: un FEN mal escrito o una jugada ilegal detienen la conversión con el lugar exacto.
 *
 *   npm run training:convert -- --karpa <KarpaChess> --fct <freechess-trainer-openings> --lichess <chess-openings>
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseFen, sanToMove } from '../../src/engine';
import { buildGraph } from '../../src/training/graph';
import type { Catalog, CourseInfo, Lesson, LinesFile } from '../../src/training/types';
import { convertLesson, convertLines } from './convert';
import { COURSES, CREDITS } from './courses';
import { convertLichess, parseOpeningsTsv, selectRows, type OpeningRow } from './lichess';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8')) as unknown;

function option(name: string): string | undefined {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? undefined : process.argv[at + 1];
}

function lessonFiles(karpa: string): string[] {
  const index = readJson(join(karpa, 'data/lessons/index.json'));
  const categories = isRecord(index) && Array.isArray(index.categories) ? index.categories : [];
  const openings = categories.find((category): category is Record<string, unknown> => isRecord(category) && category.id === 'openings');
  const files = openings?.lessons;
  if (!Array.isArray(files) || files.length === 0 || !files.every((file) => typeof file === 'string')) {
    throw new Error('No encuentro la categoría «openings» en data/lessons/index.json');
  }
  return files as string[];
}

/** Cada FEN debe leerse bien y cada jugada pedida debe ser legal en su posición. */
function checkLesson(lesson: Lesson): void {
  lesson.steps.forEach((step, index) => {
    const where = `«${lesson.id}», paso ${index + 1}`;
    let position;
    try {
      position = parseFen(step.fen);
    } catch (error) {
      throw new Error(`${where}: ${(error as Error).message}`, { cause: error });
    }
    if (step.kind === 'play') {
      for (const san of step.accept) {
        if (!sanToMove(position, san)) throw new Error(`${where}: la jugada «${san}» no es legal en ${step.fen}`);
      }
    }
  });
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** Todas las filas de la base de Lichess (`a.tsv` … `e.tsv`), en el orden de la base. */
function openingRows(lichess: string): OpeningRow[] {
  return ['a', 'b', 'c', 'd', 'e'].flatMap((volume) => parseOpeningsTsv(readFileSync(join(lichess, `${volume}.tsv`), 'utf8')));
}

function main(): void {
  const karpaArg = option('karpa');
  const fctArg = option('fct');
  const lichessArg = option('lichess');
  if (!karpaArg || !fctArg || !lichessArg) {
    console.error(
      'Uso: npm run training:convert -- --karpa <carpeta de KarpaChess> --fct <carpeta de freechess-trainer-openings> --lichess <carpeta de chess-openings> [--out <carpeta>]',
    );
    process.exit(1);
  }
  const karpa = resolve(karpaArg);
  const fct = resolve(fctArg);
  const lichess = resolve(lichessArg);
  const out = resolve(option('out') ?? 'src/training/data');

  // Lecciones
  const lessons = new Map<string, Lesson>();
  for (const file of lessonFiles(karpa)) {
    const lesson = convertLesson(readJson(join(karpa, 'data/lessons/es', file)));
    if (lessons.has(lesson.id)) throw new Error(`Lección repetida: ${lesson.id}`);
    checkLesson(lesson);
    lessons.set(lesson.id, lesson);
  }

  // Cada lección tiene que quedar en exactamente una apertura del menú.
  const used = new Set<string>();
  for (const course of COURSES) {
    for (const id of course.lessons) {
      if (!lessons.has(id)) throw new Error(`«${course.id}» pide la lección «${id}», que no existe`);
      if (used.has(id)) throw new Error(`La lección «${id}» está en dos aperturas`);
      used.add(id);
    }
  }
  const missing = [...lessons.keys()].filter((id) => !used.has(id));
  if (missing.length > 0) throw new Error(`Lecciones sin apertura asignada: ${missing.join(', ')}`);

  // Variantes
  const rows = COURSES.some((spec) => spec.lichess) ? openingRows(lichess) : [];
  const lineFiles = new Map<string, LinesFile>();
  const courses: CourseInfo[] = COURSES.map((spec) => {
    if (spec.lines && spec.lichess) throw new Error(`«${spec.id}» tiene variantes de dos fuentes`);
    let file: LinesFile | null = null;
    if (spec.lines) file = convertLines(readJson(join(fct, 'openings', `${spec.lines}.json`)), spec.side);
    if (spec.lichess) {
      const chosen = selectRows(rows, spec.lichess, spec.side);
      if (chosen.length === 0) throw new Error(`«${spec.id}»: la base de Lichess no tiene ninguna línea que cumpla`);
      file = convertLichess(spec.id, chosen, spec.lichess, spec.side);
    }
    let linesInfo: CourseInfo['lines'] = null;
    if (file) {
      const graph = buildGraph(file.lines, file.side);
      lineFiles.set(file.id, file);
      linesInfo = { id: file.id, count: file.lines.length, cards: graph.cards.length };
    }
    const own = spec.lessons.map((id) => lessons.get(id)!);
    return {
      id: spec.id,
      name: spec.name,
      summary: spec.summary ?? own[0]?.summary ?? '',
      group: spec.group,
      side: spec.side,
      lessons: own.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        level: lesson.level,
        steps: lesson.steps.length,
        plays: lesson.steps.filter((step) => step.kind === 'play').length,
      })),
      lines: linesInfo,
    };
  });

  // Se escribe solo al final: si algo falló arriba, los datos anteriores quedan intactos.
  rmSync(join(out, 'lessons'), { recursive: true, force: true });
  rmSync(join(out, 'lines'), { recursive: true, force: true });
  mkdirSync(join(out, 'lessons'), { recursive: true });
  mkdirSync(join(out, 'lines'), { recursive: true });
  for (const lesson of lessons.values()) writeJson(join(out, 'lessons', `${lesson.id}.json`), lesson);
  for (const file of lineFiles.values()) writeJson(join(out, 'lines', `${file.id}.json`), file);
  const catalog: Catalog = { courses, credits: CREDITS };
  writeJson(join(out, 'catalog.json'), catalog);

  const steps = [...lessons.values()].reduce((sum, lesson) => sum + lesson.steps.length, 0);
  const variants = [...lineFiles.values()].reduce((sum, file) => sum + file.lines.length, 0);
  console.log(`${courses.length} aperturas · ${lessons.size} lecciones (${steps} pasos) · ${variants} variantes → ${out}`);
}

main();
