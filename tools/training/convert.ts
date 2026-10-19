/**
 * Conversión de las aperturas de KarpaChess y FreeChessTrainer (ambos MIT) al formato de la app.
 * Son funciones puras; `run.ts` las usa para leer los repositorios y escribir `src/training/data`.
 *
 * Adaptaciones que se le hacen al texto de las lecciones (ninguna cambia su contenido):
 *  - «negras/negro» pasa a «azules/azul», que es como se llama ese bando en MorphiqChess.
 *  - Las jugadas con letras inglesas (`Nf6`, `Bxh7+`) se marcan como `{{Nf6}}` para que la interfaz
 *    las muestre en español (Cf6, Axh7+), igual que el resto de la app.
 *  - Cada paso para leer se parte en globos de texto (uno por «Siguiente»).
 */
import type { Color } from '../../src/engine';
import type { Level, Lesson, LessonStep, Line, LinesFile } from '../../src/training/types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function text(value: unknown, what: string): string {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`Falta ${what}`);
  return value;
}

/* ---------- texto de las lecciones ---------- */

/**
 * «negras» → «azules», «negro» → «azul» (con la mayúscula inicial si la tenía). «Cinturón negro» es
 * una expresión, no un bando, y se queda como está.
 */
export function recolor(source: string): string {
  return source.replace(/(?<![\p{L}]|cintur[oó]n )[Nn]egr(?:as|os|a|o)(?![\p{L}])/gu, (match) => {
    const word = match.endsWith('s') ? 'azules' : 'azul';
    return match.startsWith('N') ? `${word[0]!.toUpperCase()}${word.slice(1)}` : word;
  });
}

const PIECE_MOVE = /(?<![\p{L}\d])([KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)(?![\p{L}\d])/gu;

/** Marca como `{{jugada}}` las jugadas de pieza escritas en el texto (las que ya van marcadas no se tocan). */
export function wrapMoves(source: string): string {
  return source
    .split(/(\{\{[^}]*\}\})/)
    .map((part, index) => (index % 2 === 1 ? part : part.replace(PIECE_MOVE, '{{$1}}')))
    .join('');
}

export const cleanText = (source: string): string => wrapMoves(recolor(source));

/** Largo (en caracteres) a partir del cual un globo se corta para que se lea de un vistazo en el teléfono. */
export const BUBBLE_LIMIT = 480;

interface Unit {
  readonly text: string;
  readonly kind: 'heading' | 'item' | 'text';
}

const LIST_MARK = /^(?:[-•]|\d+[.)])\s+/;

/** Un bloque se reparte en sus elementos de lista, o es un solo párrafo. */
function unitsOf(block: string): Unit[] {
  const lines = block.split('\n');
  if (!LIST_MARK.test(lines[0] ?? '')) return [{ text: block, kind: 'text' }];
  const items: string[] = [];
  for (const line of lines) {
    if (LIST_MARK.test(line) || items.length === 0) items.push(line);
    else items[items.length - 1] += `\n${line}`;
  }
  return items.map((text) => ({ text, kind: 'item' as const }));
}

/**
 * Parte un texto en globos, uno por «Siguiente»: la introducción, cada sección que empieza con «## »
 * y cada cita. Un globo largo se corta entre párrafos o elementos de lista (nunca a mitad de una
 * frase) y el encabezado se queda con la primera parte.
 */
export function splitBubbles(source: string, limit: number = BUBBLE_LIMIT): string[] {
  const bubbles: string[] = [];
  let units: Unit[] = [];
  const flush = () => {
    if (units.length > 0) {
      bubbles.push(
        units.reduce(
          (text, unit, index) =>
            index === 0 ? unit.text : `${text}${unit.kind === 'item' && units[index - 1]?.kind === 'item' ? '\n' : '\n\n'}${unit.text}`,
          '',
        ),
      );
    }
    units = [];
  };
  const size = () => units.reduce((sum, unit) => sum + unit.text.length, 0);

  for (const block of source.trim().split(/\n{2,}/)) {
    if (block.startsWith('## ')) {
      flush();
      units.push({ text: block, kind: 'heading' });
    } else if (block.startsWith('> ')) {
      flush();
      bubbles.push(block);
    } else {
      for (const unit of unitsOf(block)) {
        const headingOnly = units.length === 1 && units[0]?.kind === 'heading';
        if (units.length > 0 && !headingOnly && size() + unit.text.length > limit) flush();
        units.push(unit);
      }
    }
  }
  flush();
  return bubbles;
}

/** SAN sin «+», «#», «!» ni «?». */
const normalizeSan = (san: string): string => san.replace(/[+#!?]/g, '').trim();

const LEVELS: Readonly<Record<string, Level>> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

export function convertLesson(raw: unknown): Lesson {
  if (!isRecord(raw)) throw new Error('La lección no es un objeto');
  const id = text(raw.id, 'el id de la lección');
  const level = LEVELS[text(raw.difficulty, `la dificultad de «${id}»`)];
  if (!level) throw new Error(`Dificultad desconocida en «${id}»`);
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) throw new Error(`«${id}» no tiene pasos`);

  const steps: LessonStep[] = raw.steps.map((step: unknown, index): LessonStep => {
    const where = `«${id}», paso ${index + 1}`;
    if (!isRecord(step)) throw new Error(`${where}: no es un objeto`);
    const fen = text(step.fen, `el FEN de ${where}`);
    if (step.type === 'teach') {
      return {
        kind: 'teach',
        fen,
        title: cleanText(text(step.title, `el título de ${where}`)),
        bubbles: splitBubbles(cleanText(text(step.text, `el texto de ${where}`))),
      };
    }
    if (step.type === 'play') {
      const targets = Array.isArray(step.targetSan) ? step.targetSan : [step.targetSan];
      const accept = targets.map((target: unknown) => normalizeSan(text(target, `una jugada de ${where}`)));
      return {
        kind: 'play',
        fen,
        prompt: cleanText(text(step.prompt, `la instrucción de ${where}`)),
        hint: cleanText(text(step.hint, `la pista de ${where}`)),
        accept,
      };
    }
    throw new Error(`${where}: tipo de paso desconocido`);
  });

  return {
    id,
    title: cleanText(text(raw.title, `el título de «${id}»`)),
    summary: cleanText(text(raw.summary, `el resumen de «${id}»`)),
    level,
    steps,
  };
}

/* ---------- nombres de las variantes ---------- */

type Gender = 'm' | 'f';
const NOUNS: Readonly<Record<string, readonly [string, Gender]>> = {
  Variation: ['Variante', 'f'],
  Gambit: ['Gambito', 'm'],
  Defense: ['Defensa', 'f'],
  Attack: ['Ataque', 'm'],
  System: ['Sistema', 'm'],
  Trap: ['Trampa', 'f'],
  Line: ['Línea', 'f'],
  Counterattack: ['Contraataque', 'm'],
  Hybrid: ['Híbrido', 'm'],
};

/** Adjetivos: masculino, femenino. Los que no cambian llevan el mismo texto dos veces. */
const ADJECTIVES: Readonly<Record<string, readonly [string, string]>> = {
  Classical: ['clásico', 'clásica'],
  Closed: ['cerrado', 'cerrada'],
  Open: ['abierto', 'abierta'],
  Modern: ['moderno', 'moderna'],
  Main: ['principal', 'principal'],
  Normal: ['normal', 'normal'],
  Old: ['antiguo', 'antigua'],
  Original: ['original', 'original'],
  Italian: ['italiano', 'italiana'],
  Norwegian: ['noruego', 'noruega'],
  Double: ['doble', 'doble'],
  Exchange: ['del cambio', 'del cambio'],
  Center: ['del centro', 'del centro'],
  Declined: ['rehusado', 'rehusada'],
  Accepted: ['aceptado', 'aceptada'],
  Deferred: ['diferido', 'diferida'],
  Delayed: ['retrasado', 'retrasada'],
};

/** Nombres propios que sí tienen forma en español. */
const PROPER: Readonly<Record<string, string>> = {
  Scotch: 'Escocés',
  Basque: 'Vasco',
  Yugoslav: 'Yugoslavo',
  Berlin: 'Berlín',
  Lopez: 'López',
};

/** Frases que no siguen la regla general. */
const EXACT: Readonly<Record<string, string>> = {
  'Two Knights Defense': 'Defensa de los Dos Caballos',
  'Fried Liver Attack': 'Ataque del Hígado Frito',
  "King's Bishop Variation": 'Variante del alfil de rey',
  'Center Holding Variation': 'Variante del centro sostenido',
  'Bishop Sacrifice Line': 'Línea del sacrificio de alfil',
  'Knight Sacrifice Line': 'Línea del sacrificio de caballo',
  'King March Line': 'Línea de la marcha del rey',
  'Delayed Castling Line': 'Línea del enroque retrasado',
  'Scotch Invitation Declined': 'Invitación escocesa rehusada',
  'Wing Attack': 'Ataque del ala',
  "Greco's Attack": 'Ataque de Greco',
  'Smyslov-Breyer-Zaitsev Hybrid': 'Híbrido Smyslov-Breyer-Zaitsev',
  Open: 'Variante abierta',
  Closed: 'Variante cerrada',
  Normal: 'Variante normal',
};

const OPENING_PREFIX = /^(?:Italian Game|Ruy Lopez|Vienna Gambit):\s*/;

function translateSegment(segment: string): string {
  const exact = EXACT[segment];
  if (exact) return exact;

  const withMatch = /^with\s+(.+)$/.exec(segment);
  if (withMatch) return `con ${withMatch[1]}`;

  // «Evans Gambit Declined», «Steinitz Defense Deferred»: el estado va al final.
  const tail = /^(.+?)\s+(Declined|Accepted|Deferred)$/.exec(segment);
  if (tail) {
    const base = translateSegment(tail[1]!);
    const noun = Object.values(NOUNS).find(([word]) => base.startsWith(word));
    const [masculine, feminine] = ADJECTIVES[tail[2]!]!;
    return `${base} ${noun?.[1] === 'f' ? feminine : masculine}`;
  }

  const phrase = /^(.*?)\s*(Variation|Gambit|Defense|Attack|System|Trap|Line|Counterattack|Hybrid)$/.exec(segment);
  if (phrase) {
    const [noun, gender] = NOUNS[phrase[2]!]!;
    const names: string[] = [];
    const adjectives: string[] = [];
    for (const word of phrase[1]!.split(/\s+/).filter(Boolean)) {
      const adjective = ADJECTIVES[word];
      if (adjective) adjectives.push(gender === 'f' ? adjective[1] : adjective[0]);
      else names.push(PROPER[word] ?? word);
    }
    return [noun, ...names, ...adjectives].join(' ');
  }
  return segment
    .split(' ')
    .map((word) => PROPER[word] ?? word)
    .join(' ');
}

/** «Italian Game: Classical Variation, Albin Gambit» → «Variante clásica, Gambito Albin». */
export function translateLineName(nameEn: string): string {
  const rest = nameEn.replace(OPENING_PREFIX, '');
  const name = rest
    .split(/,\s*/)
    .map(translateSegment)
    .join(', ');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/* ---------- variantes para practicar ---------- */

export function convertLines(raw: unknown, side: Color = 'w'): LinesFile {
  if (!isRecord(raw)) throw new Error('El archivo de variantes no es un objeto');
  const id = text(raw.opening_slug, 'opening_slug');
  if (!Array.isArray(raw.variations) || raw.variations.length === 0) throw new Error(`«${id}» no tiene variantes`);

  const seen = new Set<string>();
  const lines: Line[] = [];
  raw.variations.forEach((entry: unknown, index) => {
    const where = `«${id}», variante ${index + 1}`;
    if (!isRecord(entry)) throw new Error(`${where}: no es un objeto`);
    if (entry.initial_fen !== 'startpos') throw new Error(`${where}: solo se admiten líneas desde la posición inicial`);
    if (entry.side_to_train !== (side === 'w' ? 'white' : 'black')) throw new Error(`${where}: el bando no coincide`);
    if (!Array.isArray(entry.moves_san) || entry.moves_san.length === 0) throw new Error(`${where}: sin jugadas`);
    const moves = entry.moves_san.map((san: unknown) => normalizeSan(text(san, `una jugada de ${where}`))).join(' ');
    if (seen.has(moves)) return; // la misma secuencia repetida no aporta nada
    seen.add(moves);
    const nameEn = text(entry.variation_name, `el nombre de ${where}`);
    const meta = isRecord(entry.meta) ? entry.meta : {};
    const main = meta.is_mainline === true || meta.isMainline === true;
    lines.push({
      name: translateLineName(nameEn),
      nameEn,
      eco: text(entry.eco, `el ECO de ${where}`),
      moves,
      ...(main ? { main: true as const } : {}),
    });
  });
  return { id, source: 'FreeChessTrainer', side, lines };
}
