import { describe, expect, it } from 'vitest';
import { isTrainingRoute, parseRoute, routeHash, sameRoute, type Route } from './route';

const ROUTES: [string, Route][] = [
  ['', { name: 'home' }],
  ['#/partida', { name: 'game' }],
  ['#/entrenamiento', { name: 'training' }],
  ['#/entrenamiento/italian-game', { name: 'course', course: 'italian-game' }],
  [
    '#/entrenamiento/italian-game/aprender/italian-game',
    { name: 'lesson', course: 'italian-game', lesson: 'italian-game' },
  ],
  ['#/entrenamiento/ruy-lopez/practicar', { name: 'practice', course: 'ruy-lopez', mode: 'smart' }],
  ['#/entrenamiento/ruy-lopez/practicar/inicio', { name: 'practice', course: 'ruy-lopez', mode: 'start' }],
];

describe('direcciones', () => {
  it.each(ROUTES)('%s ↔ pantalla', (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
    expect(routeHash(route)).toBe(hash);
  });

  it('acepta el hash vacío o solo con #', () => {
    expect(parseRoute('#')).toEqual({ name: 'home' });
    expect(parseRoute('#/')).toEqual({ name: 'home' });
  });

  it.each([
    '#/otra-cosa',
    '#/partida/extra',
    '#/entrenamiento/',
    '#/entrenamiento/Mayusculas',
    '#/entrenamiento/a b',
    '#/entrenamiento/../partida',
    '#/entrenamiento/italian-game/aprender',
    '#/entrenamiento/italian-game/aprender/UNA',
    '#/entrenamiento/italian-game/practicar/otro',
    '#/entrenamiento/italian-game/otra/cosa',
    '#/entrenamiento/italian-game/practicar/inicio/mas',
    '#/entrenamiento/-italian',
    '#/entrenamiento/ital--ian',
  ])('una dirección rara (%s) lleva al inicio', (hash) => {
    expect(parseRoute(hash)).toEqual({ name: 'home' });
  });

  it('distingue las pantallas de entrenamiento y compara direcciones', () => {
    expect(isTrainingRoute(parseRoute('#/entrenamiento/x'))).toBe(true);
    expect(isTrainingRoute(parseRoute('#/partida'))).toBe(false);
    expect(sameRoute({ name: 'training' }, parseRoute('#/entrenamiento'))).toBe(true);
    expect(sameRoute({ name: 'training' }, { name: 'home' })).toBe(false);
  });
});
