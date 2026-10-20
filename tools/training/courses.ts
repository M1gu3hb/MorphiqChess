import type { Color } from '../../src/engine';
import type { Credit, Group } from '../../src/training/types';
import type { LichessSpec } from './lichess';

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
  /** Si no hay archivo de FreeChessTrainer, las variantes salen de la base de nombres de Lichess. */
  readonly lichess?: LichessSpec;
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
  {
    id: 'queens-gambit',
    name: 'Gambito de Dama',
    group: 'aperturas',
    side: 'w',
    lessons: ['queens-gambit'],
    lichess: { names: [/^Queen's Gambit/, /^Slav Defense/, /^Semi-Slav/], prefix: 'd4 d5 c4', own: [] },
  },
  {
    id: 'english',
    name: 'Apertura Inglesa',
    group: 'aperturas',
    side: 'w',
    lessons: ['english'],
    lichess: { names: [/^English Opening/], prefix: 'c4', own: ['English Opening'] },
  },
  {
    id: 'london-system',
    name: 'Sistema Londres',
    group: 'aperturas',
    side: 'w',
    lessons: ['london-system'],
    lichess: { names: [/London System/], prefix: 'd4', own: [] },
  },
  {
    id: 'kings-indian-attack',
    name: 'Ataque India de Rey',
    group: 'aperturas',
    side: 'w',
    lessons: ['kings-indian-attack'],
    lichess: { names: [/^King's Indian Attack/], prefix: 'Nf3', own: ["King's Indian Attack"] },
  },
  {
    id: 'catalan',
    name: 'Catalana',
    group: 'aperturas',
    side: 'w',
    lessons: ['catalan-advanced'],
    lichess: { names: [/^Catalan Opening/], prefix: 'd4', own: ['Catalan Opening'] },
  },

  // Defensas (con azules)
  {
    id: 'sicilian',
    name: 'Defensa Siciliana',
    group: 'defensas',
    side: 'b',
    lessons: ['sicilian'],
    lichess: { names: [/^Sicilian Defense/], prefix: 'e4 c5', own: ['Sicilian Defense'] },
  },
  {
    id: 'najdorf',
    name: 'Siciliana Najdorf',
    group: 'defensas',
    side: 'b',
    lessons: ['najdorf-sicilian'],
    lichess: { names: [/^Sicilian Defense: Najdorf/], prefix: 'e4 c5', own: ['Sicilian Defense'] },
  },
  {
    id: 'caro-kann',
    name: 'Defensa Caro-Kann',
    group: 'defensas',
    side: 'b',
    lessons: ['caro-kann'],
    lichess: { names: [/^Caro-Kann Defense/], prefix: 'e4 c6', own: ['Caro-Kann Defense'] },
  },
  {
    id: 'french',
    name: 'Defensa Francesa',
    group: 'defensas',
    side: 'b',
    lessons: ['french-defense-deep'],
    lichess: { names: [/^French Defense/], prefix: 'e4 e6', own: ['French Defense'] },
  },
  {
    id: 'kings-indian-defense',
    name: 'Defensa India de Rey',
    group: 'defensas',
    side: 'b',
    lessons: ['kings-indian-advanced'],
    lichess: { names: [/^King's Indian Defense/], prefix: 'd4 Nf6', own: ["King's Indian Defense"] },
  },
  {
    id: 'nimzo-indian',
    name: 'Defensa Nimzo-India',
    group: 'defensas',
    side: 'b',
    lessons: ['nimzo-indian-advanced'],
    lichess: { names: [/^Nimzo-Indian Defense/], prefix: 'd4 Nf6 c4 e6 Nc3 Bb4', own: ['Nimzo-Indian Defense'] },
  },
  {
    id: 'gruenfeld',
    name: 'Defensa Grünfeld',
    group: 'defensas',
    side: 'b',
    lessons: ['gruenfeld-advanced'],
    lichess: { names: [/^Gr[uü]nfeld Defense/], prefix: 'd4 Nf6 c4 g6 Nc3 d5', own: ['Grünfeld Defense'] },
  },

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
  {
    name: 'Lichess chess-openings',
    holder: 'los colaboradores de Lichess',
    url: 'https://github.com/lichess-org/chess-openings',
    license: 'CC0',
    use: 'Las variantes para practicar las otras doce aperturas y defensas, con blancas y con azules.',
  },
];
