import type { Color } from '../../src/engine';
import type { Credit, Group } from '../../src/training/types';

/**
 * Cómo se reparten las lecciones de KarpaChess y las variantes de FreeChessTrainer en el menú de
 * entrenamiento. Es la única parte de los datos que se escribe a mano: nombres cortos, grupo y bando.
 */
export interface CourseSpec {
  readonly id: string;
  readonly name: string;
  /** Si falta, se usa el resumen de la primera lección. */
  readonly summary?: string;
  readonly group: Group;
  /** Bando con el que se entrena (el de las variantes para practicar). */
  readonly side: Color;
  /** Ids de las lecciones de KarpaChess que incluye. */
  readonly lessons: readonly string[];
  /** Nombre del archivo de FreeChessTrainer (sin `.json`) con las variantes para practicar. */
  readonly lines?: string;
}

export const COURSES: readonly CourseSpec[] = [
  // Aperturas (con blancas)
  { id: 'italian-game', name: 'Apertura Italiana', group: 'aperturas', side: 'w', lessons: ['italian-game'], lines: 'italian-game' },
  { id: 'ruy-lopez', name: 'Ruy López', group: 'aperturas', side: 'w', lessons: ['ruy-lopez-basics'], lines: 'ruy-lopez' },
  {
    id: 'vienna-gambit',
    name: 'Gambito Viena',
    summary: 'Cuatro variantes para practicar con blancas tras 1.e4 e5 2.Cc3.',
    group: 'aperturas',
    side: 'w',
    lessons: [],
    lines: 'vienna-gambit',
  },
  { id: 'queens-gambit', name: 'Gambito de Dama', group: 'aperturas', side: 'w', lessons: ['queens-gambit'] },
  { id: 'english', name: 'Apertura Inglesa', group: 'aperturas', side: 'w', lessons: ['english'] },
  { id: 'london-system', name: 'Sistema Londres', group: 'aperturas', side: 'w', lessons: ['london-system'] },
  { id: 'kings-indian-attack', name: 'Ataque India de Rey', group: 'aperturas', side: 'w', lessons: ['kings-indian-attack'] },
  { id: 'catalan', name: 'Catalana', group: 'aperturas', side: 'w', lessons: ['catalan-advanced'] },

  // Defensas (con azules)
  { id: 'sicilian', name: 'Defensa Siciliana', group: 'defensas', side: 'b', lessons: ['sicilian'] },
  { id: 'najdorf', name: 'Siciliana Najdorf', group: 'defensas', side: 'b', lessons: ['najdorf-sicilian'] },
  { id: 'caro-kann', name: 'Defensa Caro-Kann', group: 'defensas', side: 'b', lessons: ['caro-kann'] },
  { id: 'french', name: 'Defensa Francesa', group: 'defensas', side: 'b', lessons: ['french-defense-deep'] },
  { id: 'kings-indian-defense', name: 'Defensa India de Rey', group: 'defensas', side: 'b', lessons: ['kings-indian-advanced'] },
  { id: 'nimzo-indian', name: 'Defensa Nimzo-India', group: 'defensas', side: 'b', lessons: ['nimzo-indian-advanced'] },
  { id: 'gruenfeld', name: 'Defensa Grünfeld', group: 'defensas', side: 'b', lessons: ['gruenfeld-advanced'] },

  // Fundamentos
  { id: 'opening-principles', name: 'Los tres principios', group: 'fundamentos', side: 'w', lessons: ['opening-principles'] },
  { id: 'opening-traps', name: 'Trampas de apertura', group: 'fundamentos', side: 'w', lessons: ['opening-traps'] },
  { id: 'kings-pawn-family', name: '1.e4, el peón de rey', group: 'fundamentos', side: 'w', lessons: ['kings-pawn-family'] },
  { id: 'queens-pawn-family', name: '1.d4, el peón de dama', group: 'fundamentos', side: 'w', lessons: ['queens-pawn-family'] },
];

export const CREDITS: readonly Credit[] = [
  {
    name: 'KarpaChess',
    holder: 'Mourad Ghafiri',
    url: 'https://github.com/mourad-ghafiri/KarpaChess',
    license: 'MIT',
    use: 'Las 18 lecciones de aperturas y defensas, en español.',
  },
  {
    name: 'FreeChessTrainer Opening Dataset',
    holder: 'FreeChessTrainer',
    url: 'https://github.com/freechesstrainer/freechess-trainer-openings',
    license: 'MIT',
    use: 'Las variantes para practicar la Apertura Italiana, la Ruy López y el Gambito Viena.',
  },
];
