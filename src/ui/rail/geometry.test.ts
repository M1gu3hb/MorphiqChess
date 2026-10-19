import { describe, expect, it } from 'vitest';
import { FLICK, pushGeometry, scrubFraction, scrubValue, settleOpen } from './geometry';

describe('pushGeometry', () => {
  it('en un teléfono vertical encoge el tablero y lo deja entero a la izquierda del cajón', () => {
    const { scale, shift } = pushGeometry({ viewport: 390, rail: 92, boardLeft: 20, boardWidth: 350, gap: 8 });
    const width = 350 * scale;
    const left = 20 + 175 - width / 2 + shift;
    const right = left + width;
    expect(scale).toBeLessThan(1);
    expect(left).toBeGreaterThanOrEqual(8 - 0.001);
    expect(right).toBeLessThanOrEqual(390 - 92 - 8 + 0.001);
  });

  it('si el tablero ya cabe junto al cajón no lo mueve ni lo encoge', () => {
    expect(pushGeometry({ viewport: 1440, rail: 92, boardLeft: 220, boardWidth: 1000, gap: 8 })).toEqual({
      scale: 1,
      shift: 0,
    });
  });

  it('si casi cabe, solo lo corre un poco', () => {
    const { scale, shift } = pushGeometry({ viewport: 1100, rail: 92, boardLeft: 50, boardWidth: 1000, gap: 8 });
    expect(scale).toBeCloseTo(0.992, 3);
    expect(shift).toBeLessThan(0);
    expect(shift).toBeGreaterThan(-60);
  });

  it('nunca encoge por debajo de la mitad', () => {
    expect(pushGeometry({ viewport: 200, rail: 150, boardLeft: 10, boardWidth: 180, gap: 8 }).scale).toBe(0.5);
  });

  it('ignora un tablero sin ancho', () => {
    expect(pushGeometry({ viewport: 390, rail: 92, boardLeft: 0, boardWidth: 0, gap: 8 })).toEqual({
      scale: 1,
      shift: 0,
    });
  });
});

describe('settleOpen', () => {
  it('un lanzamiento rápido decide, sin importar dónde esté', () => {
    expect(settleOpen(0.1, FLICK * 2)).toBe(true);
    expect(settleOpen(0.9, -FLICK * 2)).toBe(false);
  });

  it('sin lanzamiento, gana el lado más cercano', () => {
    expect(settleOpen(0.6, 0)).toBe(true);
    expect(settleOpen(0.4, 0)).toBe(false);
    expect(settleOpen(0.9, 0.0001)).toBe(true);
    expect(settleOpen(0.1, -0.0001)).toBe(false);
  });
});

describe('guía de jugadas', () => {
  it('convierte la posición del dedo en una jugada', () => {
    // Guía de 200 px con control de 28 px: el recorrido útil va de 14 a 186.
    expect(scrubValue(14, 200, 28, 10)).toBe(0);
    expect(scrubValue(186, 200, 28, 10)).toBe(10);
    expect(scrubValue(100, 200, 28, 10)).toBe(5);
  });

  it('se queda dentro de los extremos', () => {
    expect(scrubValue(-50, 200, 28, 10)).toBe(0);
    expect(scrubValue(900, 200, 28, 10)).toBe(10);
  });

  it('sin jugadas siempre es 0', () => {
    expect(scrubValue(100, 200, 28, 0)).toBe(0);
    expect(scrubFraction(0, 0)).toBe(0);
  });

  it('calcula la fracción del control', () => {
    expect(scrubFraction(5, 10)).toBe(0.5);
    expect(scrubFraction(12, 10)).toBe(1);
  });
});
