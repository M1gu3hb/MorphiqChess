import { describe, expect, it } from 'vitest';
import { cleanText, convertLesson, convertLines, recolor, splitBubbles, translateLineName, wrapMoves } from './convert';

describe('texto de las lecciones', () => {
  it('cambia negras/negro por azules/azul', () => {
    expect(recolor('Las negras juegan; el peón negro y la dama negra. Negras y Negro.')).toBe(
      'Las azules juegan; el peón azul y la dama azul. Azules y Azul.',
    );
    expect(recolor('Una negrura')).toBe('Una negrura');
  });

  it('deja «cinturón negro» como está', () => {
    expect(recolor('La apertura del cinturón negro: las negras')).toBe('La apertura del cinturón negro: las azules');
  });

  it('marca las jugadas de pieza y respeta las ya marcadas', () => {
    expect(wrapMoves('Tras **...Nf6** y 3.Bxh7+ juega {{Nf3}} o Rfe1; e4 y O-O no cambian.')).toBe(
      'Tras **...{{Nf6}}** y 3.{{Bxh7+}} juega {{Nf3}} o {{Rfe1}}; e4 y O-O no cambian.',
    );
    expect(wrapMoves('Beta Rey Nada Be5x')).toBe('Beta Rey Nada Be5x');
  });

  it('cleanText combina ambas cosas', () => {
    expect(cleanText('Las negras: **...Nc6**')).toBe('Las azules: **...{{Nc6}}**');
  });

  it('parte en globos por secciones y citas', () => {
    const bubbles = splitBubbles('Intro\n\nOtra línea\n\n## A\n\n- uno\n- dos\n\n## B\n\nTexto\n\n> Cita');
    expect(bubbles).toEqual(['Intro\n\nOtra línea', '## A\n\n- uno\n- dos', '## B\n\nTexto', '> Cita']);
  });

  it('corta un globo largo entre elementos de lista y deja el encabezado con la primera parte', () => {
    const list = ['- uno uno uno', '- dos dos dos', '- tres tres tres', '- cuatro cuatro'].join('\n');
    expect(splitBubbles(`## Lista\n\n${list}`, 40)).toEqual([
      '## Lista\n\n- uno uno uno\n- dos dos dos',
      '- tres tres tres\n- cuatro cuatro',
    ]);
  });

  it('corta entre párrafos, nunca a mitad de uno, y no deja un encabezado solo', () => {
    const long = 'palabra '.repeat(20).trim();
    expect(splitBubbles(`## T\n\n${long}\n\nFin`, 30)).toEqual([`## T\n\n${long}`, 'Fin']);
  });

  it('mantiene juntos los elementos de una lista numerada con continuación', () => {
    expect(splitBubbles('1. uno\n   sigue\n2. dos')).toEqual(['1. uno\n   sigue\n2. dos']);
  });
});

describe('convertLesson', () => {
  const raw = {
    id: 'demo',
    title: 'Demo de las negras',
    summary: 'Resumen',
    difficulty: 'beginner',
    steps: [
      { type: 'teach', fen: 'x', title: 'Hola', text: 'Texto\n\n## Sección\n\nMás {{Nf3}}' },
      { type: 'play', fen: 'y', prompt: 'Juega **Nf3**', hint: 'Pista', targetSan: ['Nf3+', 'e4'] },
    ],
  };

  it('convierte pasos para leer y para jugar', () => {
    const lesson = convertLesson(raw);
    expect(lesson).toMatchObject({ id: 'demo', title: 'Demo de las azules', level: 'beginner' });
    expect(lesson.steps[0]).toMatchObject({ kind: 'teach', bubbles: ['Texto', '## Sección\n\nMás {{Nf3}}'] });
    expect(lesson.steps[1]).toMatchObject({ kind: 'play', prompt: 'Juega **{{Nf3}}**', accept: ['Nf3', 'e4'] });
  });

  it('acepta una sola jugada como texto', () => {
    const lesson = convertLesson({ ...raw, steps: [{ type: 'play', fen: 'y', prompt: 'p', hint: 'h', targetSan: 'e4' }] });
    expect(lesson.steps[0]).toMatchObject({ accept: ['e4'] });
  });

  it('rechaza datos incompletos', () => {
    expect(() => convertLesson({ ...raw, steps: [] })).toThrow(/pasos/);
    expect(() => convertLesson({ ...raw, difficulty: 'raro' })).toThrow(/Dificultad/);
    expect(() => convertLesson({ ...raw, steps: [{ type: 'otro', fen: 'x' }] })).toThrow(/tipo de paso/);
  });
});

describe('nombres de variantes', () => {
  const cases: [string, string][] = [
    ['Italian Game: Classical Variation, Albin Gambit', 'Variante clásica, Gambito Albin'],
    ['Italian Game: Evans Gambit Declined, Hicken Variation', 'Gambito Evans rehusado, Variante Hicken'],
    ['Italian Game: Two Knights Defense, Fried Liver Attack', 'Defensa de los Dos Caballos, Ataque del Hígado Frito'],
    ['Italian Game: Scotch Gambit, Max Lange Attack', 'Gambito Escocés, Ataque Max Lange'],
    ['Italian Game: Classical Variation, with d5', 'Variante clásica, con d5'],
    ['Italian Game: Two Knights Defense, Traxler Counterattack, Bishop Sacrifice Line', 'Defensa de los Dos Caballos, Contraataque Traxler, Línea del sacrificio de alfil'],
    ['Ruy Lopez: Open, Berlin Variation', 'Variante abierta, Variante Berlín'],
    ['Ruy Lopez: Closed Showalter Variation'.replace('Closed Showalter', 'Berlin Defense, Closed Showalter'), 'Defensa Berlín, Variante Showalter cerrada'],
    ['Ruy Lopez: Steinitz Defense Deferred, Boleslavsky Variation', 'Defensa Steinitz diferida, Variante Boleslavsky'],
    ['Ruy Lopez: Exchange Variation, Alapin Gambit', 'Variante del cambio, Gambito Alapin'],
    ['Ruy Lopez: Marshall Attack, Original Marshall Attack', 'Ataque Marshall, Ataque Marshall original'],
    ['Ruy Lopez: Closed, Chigorin, Yugoslav System', 'Variante cerrada, Chigorin, Sistema Yugoslavo'],
    ['Ruy Lopez: Open, Main Line', 'Variante abierta, Línea principal'],
    ['Ruy Lopez: Morphy Defense, Wing Attack', 'Defensa Morphy, Ataque del ala'],
    ['Italian Game: Giuoco Pianissimo, Normal', 'Giuoco Pianissimo, Variante normal'],
    ['Hamppe-Allgaier Gambit, Alapin Variation', 'Gambito Hamppe-Allgaier, Variante Alapin'],
    ['Cunningham Defense', 'Defensa Cunningham'],
    ['Ruy Lopez: Open, Motzko Attack, Nenarokov Variation', 'Variante abierta, Ataque Motzko, Variante Nenarokov'],
  ];
  it.each(cases)('%s', (english, spanish) => {
    expect(translateLineName(english)).toBe(spanish);
  });
});

describe('convertLines', () => {
  const entry = (name: string, moves: string[], extra: object = {}) => ({
    variation_name: name,
    eco: 'C50',
    side_to_train: 'white',
    initial_fen: 'startpos',
    moves_san: moves,
    ...extra,
  });

  it('convierte, normaliza el SAN y quita repetidas', () => {
    const file = convertLines({
      opening_slug: 'italian-game',
      variations: [
        entry('Italian Game: Deutz Gambit', ['e4', 'e5', 'Nf3+']),
        entry('Otra', ['e4', 'e5', 'Nf3']),
        entry('Italian Game: Classical Variation', ['e4', 'c5'], { meta: { is_mainline: true } }),
      ],
    });
    expect(file).toMatchObject({ id: 'italian-game', source: 'FreeChessTrainer', side: 'w' });
    expect(file.lines).toHaveLength(2);
    expect(file.lines[0]).toMatchObject({ name: 'Gambito Deutz', nameEn: 'Italian Game: Deutz Gambit', moves: 'e4 e5 Nf3' });
    expect(file.lines[1]).toMatchObject({ moves: 'e4 c5', main: true });
  });

  it('rechaza lo que no sea desde la posición inicial o de otro bando', () => {
    const base = { opening_slug: 'x' };
    expect(() => convertLines({ ...base, variations: [entry('a', ['e4'], { initial_fen: '8/8' })] })).toThrow(/inicial/);
    expect(() => convertLines({ ...base, variations: [entry('a', ['e4'], { side_to_train: 'black' })] })).toThrow(/bando/);
  });
});
