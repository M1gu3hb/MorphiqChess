import { describe, expect, it } from 'vitest';
import { PERSONAS, personaById, tierOf } from './personas';

describe('los doce rivales', () => {
  it('son doce: seis piezas, blanca y azul', () => {
    expect(PERSONAS).toHaveLength(12);
    const pairs = PERSONAS.map((persona) => `${persona.piece}${persona.color}`);
    expect(new Set(pairs).size).toBe(12);
    expect(PERSONAS.map((persona) => persona.piece).join('')).toBe('ppnnbbrrqqkk');
    for (let i = 0; i < PERSONAS.length; i += 2) {
      expect(PERSONAS[i]!.color).toBe('w');
      expect(PERSONAS[i + 1]!.color).toBe('b');
    }
  });

  it('tienen id único y apto para la dirección de la pantalla', () => {
    const ids = PERSONAS.map((persona) => persona.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(PERSONAS.map((persona) => persona.name)).size).toBe(12);
  });

  it('están ordenados de menor a mayor Elo', () => {
    for (let i = 1; i < PERSONAS.length; i++) {
      expect(PERSONAS[i]!.elo).toBeGreaterThan(PERSONAS[i - 1]!.elo);
    }
    expect(PERSONAS[0]!.elo).toBeLessThanOrEqual(600);
    expect(PERSONAS[PERSONAS.length - 1]!.elo).toBeGreaterThanOrEqual(2800);
  });

  it('la fuerza crece con el Elo', () => {
    let previous: (typeof PERSONAS)[number] | null = null;
    for (const persona of PERSONAS) {
      const { strength } = persona;
      if (previous) {
        const before = previous.strength;
        if (strength.kind === 'sampler') {
          expect(before.kind).toBe('sampler');
          if (before.kind === 'sampler') {
            expect(strength.depth).toBeGreaterThanOrEqual(before.depth);
            expect(strength.temperature).toBeLessThan(before.temperature);
            expect(strength.blunder).toBeLessThan(before.blunder);
          }
        } else if (strength.kind === 'elo' && before.kind === 'elo') {
          expect(strength.elo).toBeGreaterThan(before.elo);
          expect(strength.movetime).toBeGreaterThanOrEqual(before.movetime);
        } else if (strength.kind === 'max') {
          expect(before.kind).not.toBe('sampler');
        }
      }
      previous = persona;
    }
  });

  it('los parámetros caen dentro de lo que admite el motor', () => {
    for (const { strength } of PERSONAS) {
      if (strength.kind === 'sampler') {
        expect(strength.depth).toBeGreaterThanOrEqual(1);
        expect(strength.lines).toBeGreaterThanOrEqual(2);
        expect(strength.lines).toBeLessThanOrEqual(20);
        expect(strength.temperature).toBeGreaterThan(0);
        expect(strength.blunder).toBeGreaterThanOrEqual(0);
        expect(strength.blunder).toBeLessThan(1);
      } else if (strength.kind === 'elo') {
        // Stockfish solo acepta UCI_Elo entre 1320 y 3190.
        expect(strength.elo).toBeGreaterThanOrEqual(1320);
        expect(strength.elo).toBeLessThanOrEqual(3190);
      }
      if (strength.kind !== 'sampler') {
        expect(strength.movetime).toBeGreaterThanOrEqual(100);
        expect(strength.movetime).toBeLessThanOrEqual(3000);
      }
    }
  });

  it('solo el último juega a toda fuerza', () => {
    expect(PERSONAS.filter((persona) => persona.strength.kind === 'max').map((persona) => persona.id)).toEqual(['rey-azul']);
  });

  it('se buscan por id', () => {
    expect(personaById('dama-azul')?.piece).toBe('q');
    expect(personaById('no-existe')).toBeUndefined();
  });

  it('cada uno tiene nombre y descripción', () => {
    for (const persona of PERSONAS) {
      expect(persona.name.length).toBeGreaterThan(3);
      expect(persona.tagline.length).toBeGreaterThan(10);
    }
  });
});

describe('niveles', () => {
  it('agrupa los Elo por nivel', () => {
    expect(tierOf(400)).toBe('beginner');
    expect(tierOf(999)).toBe('beginner');
    expect(tierOf(1000)).toBe('intermediate');
    expect(tierOf(1599)).toBe('intermediate');
    expect(tierOf(1600)).toBe('advanced');
    expect(tierOf(2199)).toBe('advanced');
    expect(tierOf(2200)).toBe('expert');
    expect(tierOf(2799)).toBe('expert');
    expect(tierOf(2800)).toBe('master');
  });
});
