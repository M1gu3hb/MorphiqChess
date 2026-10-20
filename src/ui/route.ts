/**
 * Pantallas de la app y su dirección (en el hash, así funciona en cualquier alojamiento estático).
 *
 *   (vacío)                                      inicio
 *   #/partida                                    la partida
 *   #/entrenamiento                              menú de entrenamiento
 *   #/entrenamiento/<apertura>                   una apertura
 *   #/entrenamiento/<apertura>/aprender/<lección>
 *   #/entrenamiento/<apertura>/practicar         repaso inteligente
 *   #/entrenamiento/<apertura>/practicar/inicio  desde la primera jugada
 */
export type PracticeMode = 'smart' | 'start';

export type TrainingRoute =
  | { readonly name: 'training' }
  | { readonly name: 'course'; readonly course: string }
  | { readonly name: 'lesson'; readonly course: string; readonly lesson: string }
  | { readonly name: 'practice'; readonly course: string; readonly mode: PracticeMode };

export type Route = { readonly name: 'home' } | { readonly name: 'game' } | TrainingRoute;

export const isTrainingRoute = (route: Route): route is TrainingRoute =>
  route.name === 'training' || route.name === 'course' || route.name === 'lesson' || route.name === 'practice';

/** Los ids de las aperturas y lecciones son «palabras-con-guiones»: cualquier otra cosa no es una dirección válida. */
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const HOME: Route = { name: 'home' };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  if (parts.length === 1 && parts[0] === 'partida') return { name: 'game' };
  if (parts[0] !== 'entrenamiento') return HOME;

  const [, course, section, extra, ...rest] = parts;
  if (course === undefined) return { name: 'training' };
  if (!ID.test(course) || rest.length > 0) return HOME;
  if (section === undefined) return { name: 'course', course };
  if (section === 'aprender' && extra !== undefined && ID.test(extra)) return { name: 'lesson', course, lesson: extra };
  if (section === 'practicar' && extra === undefined) return { name: 'practice', course, mode: 'smart' };
  if (section === 'practicar' && extra === 'inicio') return { name: 'practice', course, mode: 'start' };
  return HOME;
}

/** El hash de una pantalla (vacío para el inicio). */
export function routeHash(route: Route): string {
  switch (route.name) {
    case 'home':
      return '';
    case 'game':
      return '#/partida';
    case 'training':
      return '#/entrenamiento';
    case 'course':
      return `#/entrenamiento/${route.course}`;
    case 'lesson':
      return `#/entrenamiento/${route.course}/aprender/${route.lesson}`;
    case 'practice':
      return `#/entrenamiento/${route.course}/practicar${route.mode === 'start' ? '/inicio' : ''}`;
  }
}

export const sameRoute = (a: Route, b: Route): boolean => routeHash(a) === routeHash(b);

/** Cómo se mueven las pantallas entre sí. */
export interface Navigation {
  readonly go: (route: Route) => void;
  /** Vuelve a la pantalla anterior de la app, o va a `fallback` si esta se abrió directamente. */
  readonly back: (fallback: Route) => void;
}
