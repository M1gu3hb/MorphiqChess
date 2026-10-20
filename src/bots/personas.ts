/**
 * Los doce rivales del modo Práctica: cada pieza de Morphiq (seis tipos, blanca y azul) es un
 * personaje, de menor a mayor Elo. El Elo es aproximado y está en la escala de Stockfish, no es un
 * Elo FIDE ni de una plataforma en línea; cómo se obtuvo está en `docs/practica/calibracion.md`.
 */
import type { Color, PieceType } from '../engine';
import type { Strength } from './strength';

export interface Persona {
  /** Palabras con guiones: va en la dirección de la pantalla (`#/practica/caballo-azul/azules`). */
  readonly id: string;
  readonly piece: PieceType;
  /** Color de la pieza que hace de avatar (no tiene que ver con el bando con el que se juega). */
  readonly color: Color;
  readonly name: string;
  readonly elo: number;
  readonly tagline: string;
  readonly strength: Strength;
}

export type Tier = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

/** Nivel de un Elo, para agrupar y rotular. */
export function tierOf(elo: number): Tier {
  if (elo < 1000) return 'beginner';
  if (elo < 1600) return 'intermediate';
  if (elo < 2200) return 'advanced';
  if (elo < 2800) return 'expert';
  return 'master';
}

export const PERSONAS: readonly Persona[] = [
  {
    id: 'peon-blanco',
    piece: 'p',
    color: 'w',
    name: 'Peón Aprendiz',
    elo: 400,
    tagline: 'Acaba de aprender cómo se mueven las piezas.',
    strength: { kind: 'sampler', depth: 1, lines: 8, temperature: 320, blunder: 0.38 },
  },
  {
    id: 'peon-azul',
    piece: 'p',
    color: 'b',
    name: 'Peón Valiente',
    elo: 600,
    tagline: 'Avanza sin miedo y deja piezas sin proteger.',
    strength: { kind: 'sampler', depth: 1, lines: 8, temperature: 215, blunder: 0.27 },
  },
  {
    id: 'caballo-blanco',
    piece: 'n',
    color: 'w',
    name: 'Caballo Saltarín',
    elo: 800,
    tagline: 'Salta de un lado a otro, pero no siempre ve el peligro.',
    strength: { kind: 'sampler', depth: 1, lines: 7, temperature: 170, blunder: 0.18 },
  },
  {
    id: 'caballo-azul',
    piece: 'n',
    color: 'b',
    name: 'Caballo Astuto',
    elo: 1000,
    tagline: 'Ya ve las amenazas más sencillas.',
    strength: { kind: 'sampler', depth: 2, lines: 5, temperature: 200, blunder: 0.15 },
  },
  {
    id: 'alfil-blanco',
    piece: 'b',
    color: 'w',
    name: 'Alfil Curioso',
    elo: 1200,
    tagline: 'Entiende lo básico y mueve con intención.',
    strength: { kind: 'sampler', depth: 3, lines: 5, temperature: 150, blunder: 0.1 },
  },
  {
    id: 'alfil-azul',
    piece: 'b',
    color: 'b',
    name: 'Alfil Sagaz',
    elo: 1400,
    tagline: 'Aprovecha tus descuidos y defiende lo suyo.',
    strength: { kind: 'elo', elo: 1400, movetime: 400 },
  },
  {
    id: 'torre-blanca',
    piece: 'r',
    color: 'w',
    name: 'Torre Firme',
    elo: 1600,
    tagline: 'Juega ordenado: casi nada sale gratis.',
    strength: { kind: 'elo', elo: 1600, movetime: 500 },
  },
  {
    id: 'torre-azul',
    piece: 'r',
    color: 'b',
    name: 'Torre Estratega',
    elo: 1800,
    tagline: 'Piensa varias jugadas adelante y castiga los errores.',
    strength: { kind: 'elo', elo: 1800, movetime: 600 },
  },
  {
    id: 'dama-blanca',
    piece: 'q',
    color: 'w',
    name: 'Dama Veloz',
    elo: 2000,
    tagline: 'Táctica afilada: no perdona un descuido.',
    strength: { kind: 'elo', elo: 2000, movetime: 700 },
  },
  {
    id: 'dama-azul',
    piece: 'q',
    color: 'b',
    name: 'Dama Implacable',
    elo: 2200,
    tagline: 'Nivel de jugador de torneo.',
    strength: { kind: 'elo', elo: 2200, movetime: 800 },
  },
  {
    id: 'rey-blanco',
    piece: 'k',
    color: 'w',
    name: 'Rey Maestro',
    elo: 2500,
    tagline: 'Juega como un maestro internacional.',
    strength: { kind: 'elo', elo: 2500, movetime: 1000 },
  },
  {
    id: 'rey-azul',
    piece: 'k',
    color: 'b',
    name: 'Rey Supremo',
    elo: 3000,
    tagline: 'El motor a toda su fuerza. Mucha suerte.',
    strength: { kind: 'max', movetime: 1500 },
  },
];

export const personaById = (id: string): Persona | undefined => PERSONAS.find((persona) => persona.id === id);
