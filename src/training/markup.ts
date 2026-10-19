/**
 * Formato mínimo de los textos de las lecciones. No es Markdown completo: solo lo que usan las
 * lecciones, y se convierte en datos (nunca en HTML), así que un texto no puede inyectar nada.
 *
 *   ## Título          encabezado
 *   - elemento         lista con viñetas          1. elemento   lista numerada
 *   > cita             cita
 *   **negrita**  *cursiva*  {{Nf3}}   (la jugada va en SAN canónico y la interfaz la traduce)
 */

/** Trozo de texto con un mismo estilo. En las jugadas, `text` es el SAN canónico (letras inglesas). */
export interface Run {
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly move: boolean;
}

export type Block =
  | { readonly kind: 'p'; readonly runs: readonly Run[] }
  | { readonly kind: 'h'; readonly runs: readonly Run[] }
  | { readonly kind: 'quote'; readonly runs: readonly Run[] }
  | { readonly kind: 'ul'; readonly items: readonly (readonly Run[])[] }
  | { readonly kind: 'ol'; readonly items: readonly (readonly Run[])[] };

/** Cómo se muestra una jugada (p. ej. `Nf3` → `Cf3`). */
export type MoveText = (san: string) => string;

export function parseInline(source: string): Run[] {
  const runs: Run[] = [];
  let bold = false;
  let italic = false;
  let buffer = '';
  const flush = () => {
    if (buffer) runs.push({ text: buffer, bold, italic, move: false });
    buffer = '';
  };
  let i = 0;
  while (i < source.length) {
    if (source.startsWith('{{', i)) {
      const end = source.indexOf('}}', i + 2);
      if (end > i + 2) {
        flush();
        runs.push({ text: source.slice(i + 2, end).trim(), bold, italic, move: true });
        i = end + 2;
        continue;
      }
    }
    if (source.startsWith('**', i)) {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (source[i] === '*') {
      flush();
      italic = !italic;
      i += 1;
      continue;
    }
    buffer += source[i];
    i += 1;
  }
  flush();
  return runs;
}

const HEADING = /^#{1,6}\s+/;
const BULLET = /^[-•]\s+/;
const NUMBERED = /^\d+[.)]\s+/;
const QUOTE = /^>\s?/;

export function parseMarkup(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;

  const closeParagraph = () => {
    if (paragraph.length > 0) blocks.push({ kind: 'p', runs: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };
  const closeList = () => {
    if (list) blocks.push({ kind: list.kind, items: list.items.map(parseInline) });
    list = null;
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '') {
      closeParagraph();
      closeList();
      continue;
    }
    if (HEADING.test(line)) {
      closeParagraph();
      closeList();
      blocks.push({ kind: 'h', runs: parseInline(line.replace(HEADING, '')) });
    } else if (QUOTE.test(line)) {
      closeParagraph();
      closeList();
      blocks.push({ kind: 'quote', runs: parseInline(line.replace(QUOTE, '')) });
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      closeParagraph();
      const kind = BULLET.test(line) ? 'ul' : 'ol';
      if (list && list.kind !== kind) closeList();
      list ??= { kind, items: [] };
      list.items.push(line.replace(kind === 'ul' ? BULLET : NUMBERED, ''));
    } else {
      closeList();
      paragraph.push(line);
    }
  }
  closeParagraph();
  closeList();
  return blocks;
}

/* ---------- texto plano y aparición letra por letra ---------- */

const runText = (run: Run, display: MoveText): string => (run.move ? display(run.text) : run.text);

const runsText = (runs: readonly Run[], display: MoveText): string =>
  runs.map((run) => runText(run, display)).join('');

/** Texto plano de los bloques (para lectores de pantalla). */
export function blocksToText(blocks: readonly Block[], display: MoveText): string {
  return blocks
    .map((block) =>
      block.kind === 'ul' || block.kind === 'ol'
        ? block.items.map((item) => runsText(item, display)).join('. ')
        : runsText(block.runs, display),
    )
    .join('\n');
}

/** Cantidad de caracteres que «escribe» la animación. Cada jugada cuenta como uno solo (aparece entera). */
export function blocksLength(blocks: readonly Block[]): number {
  const runs = (list: readonly Run[]) => list.reduce((sum, run) => sum + (run.move ? 1 : run.text.length), 0);
  return blocks.reduce(
    (sum, block) =>
      sum + (block.kind === 'ul' || block.kind === 'ol' ? block.items.reduce((s, item) => s + runs(item), 0) : runs(block.runs)),
    0,
  );
}

/** Los bloques tal como se ven cuando se han «escrito» `count` caracteres (las jugadas aparecen enteras). */
export function revealBlocks(blocks: readonly Block[], count: number): Block[] {
  let left = Math.max(0, count);
  const take = (runs: readonly Run[]): Run[] => {
    const out: Run[] = [];
    for (const run of runs) {
      if (left <= 0) break;
      if (run.move) {
        out.push(run);
        left -= 1;
      } else if (run.text.length <= left) {
        out.push(run);
        left -= run.text.length;
      } else {
        out.push({ ...run, text: run.text.slice(0, left) });
        left = 0;
      }
    }
    return out;
  };

  const out: Block[] = [];
  for (const block of blocks) {
    if (left <= 0) break;
    if (block.kind === 'ul' || block.kind === 'ol') {
      const items: Run[][] = [];
      for (const item of block.items) {
        if (left <= 0) break;
        items.push(take(item));
      }
      out.push({ kind: block.kind, items });
    } else {
      out.push({ kind: block.kind, runs: take(block.runs) });
    }
  }
  return out;
}
