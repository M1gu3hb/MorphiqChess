import { describe, expect, it } from 'vitest';
import { parseFen, sanToMove } from '../engine';
import { catalog, courseById, coursesIn, GROUPS } from './catalog';
import { buildGraph } from './graph';
import { parseInline } from './markup';
import type { Lesson, LinesFile } from './types';

/** Los datos se leen de las mismas carpetas que usa la app, pero aquí todos de una vez. */
const lessonModules = import.meta.glob<Lesson>('./data/lessons/*.json', { import: 'default', eager: true });
const linesModules = import.meta.glob<LinesFile>('./data/lines/*.json', { import: 'default', eager: true });

const lessons = new Map(Object.values(lessonModules).map((lesson) => [lesson.id, lesson]));
const lineFiles = new Map(Object.values(linesModules).map((file) => [file.id, file]));

/** Todos los textos de una lección, con el nombre del campo para señalarlos. */
function textsOf(lesson: Lesson): [string, string][] {
  const texts: [string, string][] = [
    [`${lesson.id}: título`, lesson.title],
    [`${lesson.id}: resumen`, lesson.summary],
  ];
  lesson.steps.forEach((step, index) => {
    const where = `${lesson.id}, paso ${index + 1}`;
    if (step.kind === 'teach') {
      texts.push([`${where}: título`, step.title]);
      step.bubbles.forEach((bubble, at) => texts.push([`${where}, globo ${at + 1}`, bubble]));
    } else {
      texts.push([`${where}: instrucción`, step.prompt], [`${where}: pista`, step.hint]);
    }
  });
  return texts;
}

/** Texto sin las jugadas ya marcadas con {{ }}. */
const withoutMoves = (text: string): string => text.replace(/\{\{[^}]*\}\}/g, '');

describe('datos de entrenamiento', () => {
  it('trae las 18 lecciones y las 127 variantes', () => {
    expect(lessons.size).toBe(18);
    expect(lineFiles.size).toBe(3);
    expect([...lineFiles.values()].reduce((sum, file) => sum + file.lines.length, 0)).toBe(127);
    expect(catalog.courses).toHaveLength(19);
  });

  it('cada lección está en una sola apertura y cada apertura apunta a datos que existen', () => {
    const seen = new Set<string>();
    for (const course of catalog.courses) {
      for (const info of course.lessons) {
        expect(lessons.has(info.id), `${course.id} → ${info.id}`).toBe(true);
        expect(seen.has(info.id), `${info.id} repetida`).toBe(false);
        seen.add(info.id);
        const lesson = lessons.get(info.id)!;
        expect(info).toMatchObject({
          title: lesson.title,
          summary: lesson.summary,
          level: lesson.level,
          steps: lesson.steps.length,
          plays: lesson.steps.filter((step) => step.kind === 'play').length,
        });
      }
      if (course.lines) expect(lineFiles.has(course.lines.id), `${course.id} → ${course.lines.id}`).toBe(true);
    }
    expect([...lessons.keys()].filter((id) => !seen.has(id))).toEqual([]);
  });

  it('los ids son únicos y los grupos conocidos', () => {
    const ids = catalog.courses.map((course) => course.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(catalog.courses.every((course) => GROUPS.includes(course.group))).toBe(true);
    expect(GROUPS.flatMap((group) => coursesIn(group))).toHaveLength(19);
    expect(courseById('italian-game')?.name).toBe('Apertura Italiana');
    expect(courseById('no-existe')).toBeUndefined();
  });

  it('el catálogo declara los créditos de las dos fuentes con su licencia', () => {
    expect(catalog.credits.map((credit) => credit.name)).toEqual(['KarpaChess', 'FreeChessTrainer Opening Dataset']);
    expect(catalog.credits.every((credit) => credit.license === 'MIT' && credit.url.startsWith('https://github.com/'))).toBe(true);
  });
});

describe('lecciones', () => {
  for (const lesson of lessons.values()) {
    describe(lesson.id, () => {
      it('tiene pasos con posiciones válidas y jugadas legales', () => {
        expect(lesson.steps.length).toBeGreaterThan(0);
        lesson.steps.forEach((step, index) => {
          const position = parseFen(step.fen);
          if (step.kind === 'teach') {
            expect(step.bubbles.length, `paso ${index + 1}`).toBeGreaterThan(0);
          } else {
            expect(step.accept.length, `paso ${index + 1}`).toBeGreaterThan(0);
            for (const san of step.accept) expect(sanToMove(position, san), `paso ${index + 1}: ${san}`).not.toBeNull();
          }
        });
      });

      it('está adaptada: azules en lugar de negras y las jugadas de pieza marcadas', () => {
        for (const [where, text] of textsOf(lesson)) {
          // «Cinturón negro» es una expresión, no un bando.
          expect(text.replace(/cintur[oó]n negro/gi, ''), where).not.toMatch(/negr[oa]s?\b/i);
          expect(withoutMoves(text), where).not.toMatch(/(?<![\p{L}\d])[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?(?![\p{L}\d])/u);
        }
      });

      it('los globos son cortos y las llaves de las jugadas están cerradas', () => {
        for (const step of lesson.steps) {
          if (step.kind !== 'teach') continue;
          for (const bubble of step.bubbles) expect(bubble.length).toBeLessThanOrEqual(600);
        }
        for (const [where, text] of textsOf(lesson)) {
          expect(text.split('{{').length, where).toBe(text.split('}}').length);
          for (const run of parseInline(text)) {
            if (run.move) expect(run.text, where).toMatch(/^(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|O-O(?:-O)?|0-0(?:-0)?)[+#!?]*$/);
          }
        }
      });
    });
  }
});

describe('variantes', () => {
  for (const file of lineFiles.values()) {
    describe(file.id, () => {
      it('se juegan completas con el motor desde la posición inicial', () => {
        const graph = buildGraph(file.lines, file.side);
        expect(graph.cards.length).toBeGreaterThan(0);
        const course = catalog.courses.find((entry) => entry.lines?.id === file.id);
        expect(course?.lines).toEqual({ id: file.id, count: file.lines.length, cards: graph.cards.length });
        expect(course?.side).toBe(file.side);
      });

      it('traen nombre en español, nombre original y código ECO', () => {
        const english = /\b(Variation|Gambit|Defen[cs]e|Attack|System|Trap|Line|Counterattack|Hybrid|Declined|Accepted|Deferred|Delayed|Classical|Closed|Open|Modern|Main|Exchange|Double|Norwegian|Center|Holding|Sacrifice|Bishop|Knight|King|March|Castling|with)\b/;
        for (const line of file.lines) {
          expect(line.eco, line.nameEn).toMatch(/^[A-E]\d\d$/);
          expect(line.name, line.nameEn).not.toMatch(english);
          expect(line.name.length, line.nameEn).toBeGreaterThan(2);
          expect(line.name.charAt(0), line.nameEn).toBe(line.name.charAt(0).toUpperCase());
        }
      });

      it('no repite ninguna secuencia de jugadas', () => {
        const moves = file.lines.map((line) => line.moves);
        expect(new Set(moves).size).toBe(moves.length);
      });
    });
  }
});
