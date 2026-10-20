import { describe, expect, it } from 'vitest';
import { localizeSan } from '../engine';
import { blocksLength, blocksToText, inlineToText, parseInline, parseMarkup, revealBlocks } from './markup';

const es = (san: string) => localizeSan(san, 'es');

describe('parseInline', () => {
  it('separa negrita, cursiva y jugadas', () => {
    const runs = parseInline('Juega **{{Nf3}}** y *luego* {{e4}}.');
    expect(runs.map((r) => [r.text, r.bold, r.italic, r.move])).toEqual([
      ['Juega ', false, false, false],
      ['Nf3', true, false, true],
      [' y ', false, false, false],
      ['luego', false, true, false],
      [' ', false, false, false],
      ['e4', false, false, true],
      ['.', false, false, false],
    ]);
  });

  it('deja como texto lo que no cierra', () => {
    expect(parseInline('abre {{e4 sin cerrar').map((r) => r.text).join('')).toBe('abre {{e4 sin cerrar');
  });

  it('no interpreta HTML: llega como texto', () => {
    const [run] = parseInline('<script>alert(1)</script>');
    expect(run).toMatchObject({ text: '<script>alert(1)</script>', move: false });
  });
});

describe('inlineToText', () => {
  it('quita el formato y traduce las jugadas', () => {
    expect(inlineToText('La Clavada {{Bb4}} y **{{Nf3}}**', es)).toBe('La Clavada Ab4 y Cf3');
    expect(inlineToText('Sin formato', es)).toBe('Sin formato');
  });
});

describe('parseMarkup', () => {
  const text = [
    'Intro con **fuerza**',
    'en dos líneas.',
    '',
    '## Un título',
    '',
    '- uno',
    '- dos {{Bc4}}',
    '',
    '1. primero',
    '2. segundo',
    '',
    '> Una cita',
  ].join('\n');

  it('reconoce párrafos, encabezados, listas y citas', () => {
    const blocks = parseMarkup(text);
    expect(blocks.map((b) => b.kind)).toEqual(['p', 'h', 'ul', 'ol', 'quote']);
    const [paragraph, , bullets, numbered] = blocks;
    expect(paragraph && 'runs' in paragraph ? paragraph.runs.map((r) => r.text).join('') : '').toBe(
      'Intro con fuerza en dos líneas.',
    );
    expect(bullets && 'items' in bullets ? bullets.items.length : 0).toBe(2);
    expect(numbered && 'items' in numbered ? numbered.items.length : 0).toBe(2);
  });

  it('da texto plano con las jugadas en español', () => {
    expect(blocksToText(parseMarkup('Mueve {{Nf3}} y {{Bxf7+}}'), es)).toBe('Mueve Cf3 y Axf7+');
  });
});

describe('revealBlocks', () => {
  const blocks = parseMarkup('Hola {{Nf3}} mundo\n\n- uno\n- dos');
  const total = blocksLength(blocks);

  it('cuenta cada jugada como un solo carácter', () => {
    expect(total).toBe('Hola '.length + 1 + ' mundo'.length + 'uno'.length + 'dos'.length);
  });

  it('con 0 no muestra nada y con el total lo muestra todo', () => {
    expect(revealBlocks(blocks, 0)).toEqual([]);
    expect(revealBlocks(blocks, total)).toEqual(blocks);
  });

  it('corta el texto a medias y las jugadas aparecen enteras', () => {
    const partial = revealBlocks(blocks, 3);
    expect(partial).toHaveLength(1);
    expect(blocksToText(partial, es)).toBe('Hol');
    const withMove = revealBlocks(blocks, 6);
    expect(blocksToText(withMove, es)).toBe('Hola Cf3');
  });

  it('corta dentro de una lista', () => {
    const upToList = 'Hola '.length + 1 + ' mundo'.length;
    const partial = revealBlocks(blocks, upToList + 4);
    const list = partial[1];
    expect(list && 'items' in list ? list.items.map((item) => item.map((r) => r.text).join('')) : []).toEqual([
      'uno',
      'd',
    ]);
  });
});
