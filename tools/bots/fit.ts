/**
 * Ajuste de Elo a partir de partidas entre rivales (Bradley–Terry por máxima verosimilitud).
 *
 *   npm run bots:duel -- --a persona:peon-azul --b elo:1320 --games 100 >> resultados.jsonl
 *   npm run bots:fit -- resultados.jsonl --anchor elo:1320=1320
 *
 * Cada línea del archivo es lo que imprime `bots:duel`: `{"a": "...", "b": "...", "games": 100, "score": 0.3}`,
 * con la puntuación de `a` (victoria 1, tablas ½). Un rival que no es de ninguno de los dos lados de una
 * partida no hace falta: el modelo los enlaza a través de los rivales que tienen en común. Sin importaciones
 * relativas para que Node lo ejecute directamente.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export interface Duel {
  readonly a: string;
  readonly b: string;
  readonly games: number;
  /** Puntuación de `a` entre 0 y 1. */
  readonly score: number;
}

export interface Rating {
  readonly name: string;
  readonly elo: number;
  /** Margen aproximado al 95 %. Subestima el error de los rivales enlazados solo por cadenas largas. */
  readonly margin: number;
}

const SCALE = Math.LN10 / 400;
const expected = (a: number, b: number): number => 1 / (1 + 10 ** ((b - a) / 400));

/**
 * Elo de cada rival, con `anchor` fijo como referencia. Una puntuación de 0 o 1 se acerca media partida
 * a la mitad para que el Elo no se vaya al infinito.
 */
export function fitRatings(duels: readonly Duel[], anchor: { readonly name: string; readonly elo: number }): Rating[] {
  const names = [...new Set(duels.flatMap((duel) => [duel.a, duel.b]))].sort();
  const at = new Map(names.map((name, index) => [name, index] as const));
  const anchorAt = at.get(anchor.name);
  if (anchorAt === undefined) throw new Error(`El ancla «${anchor.name}» no aparece en las partidas.`);
  const edges = duels
    .filter((duel) => duel.games > 0)
    .map((duel) => ({
      a: at.get(duel.a) ?? 0,
      b: at.get(duel.b) ?? 0,
      games: duel.games,
      score: Math.min(1 - 0.5 / duel.games, Math.max(0.5 / duel.games, duel.score)),
    }));

  const elo = names.map(() => anchor.elo);
  for (let step = 0; step < 100_000; step++) {
    const gradient = names.map(() => 0);
    for (const edge of edges) {
      const surplus = edge.games * (edge.score - expected(elo[edge.a] ?? 0, elo[edge.b] ?? 0));
      gradient[edge.a] = (gradient[edge.a] ?? 0) + surplus;
      gradient[edge.b] = (gradient[edge.b] ?? 0) - surplus;
    }
    gradient[anchorAt] = 0;
    let largest = 0;
    gradient.forEach((value, index) => {
      elo[index] = (elo[index] ?? 0) + 0.5 * value;
      largest = Math.max(largest, Math.abs(value));
    });
    if (largest < 1e-9) break;
  }

  const information = names.map(() => 0);
  for (const edge of edges) {
    const p = expected(elo[edge.a] ?? 0, elo[edge.b] ?? 0);
    const weight = edge.games * p * (1 - p) * SCALE * SCALE;
    information[edge.a] = (information[edge.a] ?? 0) + weight;
    information[edge.b] = (information[edge.b] ?? 0) + weight;
  }
  return names
    .map((name, index) => ({ name, elo: elo[index] ?? 0, margin: 1.96 / Math.sqrt(information[index] ?? 1) }))
    .sort((x, y) => x.elo - y.elo);
}

/** Lee las líneas JSON de `bots:duel` y se salta las que no son resultados. */
export function parseDuels(text: string): Duel[] {
  const duels: Duel[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('{')) continue;
    const data = JSON.parse(line) as Partial<Duel>;
    if (typeof data.a === 'string' && typeof data.b === 'string' && typeof data.games === 'number' && typeof data.score === 'number') {
      duels.push({ a: data.a, b: data.b, games: data.games, score: data.score });
    }
  }
  return duels;
}

function main(): void {
  const file = process.argv[2];
  const flag = process.argv.indexOf('--anchor');
  const spec = flag === -1 ? undefined : process.argv[flag + 1];
  const split = spec?.lastIndexOf('=') ?? -1;
  if (!file || !spec || split < 1) {
    console.error('Uso: npm run bots:fit -- resultados.jsonl --anchor <rival>=<elo>');
    process.exit(1);
  }
  const anchor = { name: spec.slice(0, split), elo: Number(spec.slice(split + 1)) };
  for (const rating of fitRatings(parseDuels(readFileSync(file, 'utf8')), anchor)) {
    console.log(`${String(Math.round(rating.elo)).padStart(5)} ±${String(Math.round(rating.margin)).padEnd(3)} ${rating.name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
