import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { GameStore, SettingsStore } from './game';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { isBotsRoute, isTrainingRoute, parseRoute, routeHash, sameRoute, type Navigation, type Route } from './ui/route';
import { GameScreen } from './ui/screens/GameScreen';
import { Home } from './ui/screens/Home';
import { Loading, LoadError } from './ui/screens/LoadError';
import { enterFullscreen, exitFullscreen } from './ui/useFullscreen';

/* El entrenamiento (lecciones, variantes y sus estilos) se descarga solo cuando se abre. */
const TrainingApp = lazy(() => import('./ui/training/TrainingApp'));
/* Lo mismo con la práctica contra rivales (sus pantallas y estilos; el motor de ajedrez se pide aparte, al jugar). */
const PracticeApp = lazy(() => import('./ui/practice/PracticeApp'));

const TITLES = {
  home: 'MorphiqChess · Juega, aprende y practica ajedrez',
  game: 'Partida · MorphiqChess',
  training: 'Entrenamiento · MorphiqChess',
  practice: 'Práctica · MorphiqChess',
} as const;

const titleOf = (route: Route): string =>
  isTrainingRoute(route) ? TITLES.training : isBotsRoute(route) ? TITLES.practice : TITLES[route.name];

/** Las pantallas de juego (de dos jugadores o contra un rival) ocupan toda la pantalla. */
const isImmersive = (route: Route): boolean => route.name === 'game' || route.name === 'bot';

const routeFromLocation = (): Route => parseRoute(window.location.hash);

/** De dónde vino la pantalla actual, guardado en la entrada del historial: sirve para que «Volver» sea de verdad volver. */
const previousHash = (): string | undefined => {
  const state: unknown = window.history.state;
  if (typeof state === 'object' && state !== null && 'prev' in state && typeof state.prev === 'string') return state.prev;
  return undefined;
};

export function App() {
  const [store] = useState(() => {
    const created = new GameStore();
    // Si se abre directo la partida y hay una guardada, se retoma.
    if (routeFromLocation().name === 'game' && created.hasSavedGame()) created.loadSaved();
    return created;
  });
  const [settingsStore] = useState(() => new SettingsStore());
  const [route, setRoute] = useState<Route>(routeFromLocation);
  const firstRender = useRef(true);

  useEffect(() => {
    const onPop = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.title = titleOf(route);
    // Fuera de la partida (botón «Inicio», atrás del navegador) se vuelve a la ventana normal.
    if (!isImmersive(route)) void exitFullscreen();
    // Al cambiar de pantalla, el foco pasa al título: quien usa lector de pantalla sabe dónde está.
    // (Las pantallas del entrenamiento lo hacen solas al terminar de cargar.)
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [route]);

  /** Ir a otra pantalla. Con `replace` no se agrega una entrada nueva al historial. */
  const go = (next: Route, replace = false) => {
    if (sameRoute(next, route)) return;
    const url = `${window.location.pathname}${window.location.search}${routeHash(next)}`;
    if (replace) window.history.replaceState(window.history.state, '', url);
    else window.history.pushState({ prev: routeHash(route) }, '', url);
    setRoute(next);
    window.scrollTo(0, 0);
  };

  /**
   * Volver a `target`. Si es de donde se vino, se retrocede en el historial (como el botón atrás del
   * navegador); si no —la pantalla se abrió directo, o se llegó por otro camino— se reemplaza la actual.
   */
  const back = (target: Route) => {
    if (previousHash() === routeHash(target)) window.history.back();
    else go(target, true);
  };

  /** El navegador solo concede pantalla completa dentro del toque, así que se pide antes de cambiar de pantalla. */
  const startGame = () => {
    if (settingsStore.getSnapshot().autoFullscreen) void enterFullscreen();
    go({ name: 'game' });
  };

  const navigation: Navigation = { go: (next) => go(next), back };

  if (route.name === 'game') {
    return <GameScreen store={store} settingsStore={settingsStore} onHome={() => back({ name: 'home' })} />;
  }
  if (isTrainingRoute(route)) {
    return (
      <ErrorBoundary fallback={<LoadError onHome={() => back({ name: 'home' })} />}>
        <Suspense fallback={<Loading />}>
          <TrainingApp route={route} settingsStore={settingsStore} {...navigation} />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (isBotsRoute(route)) {
    return (
      <ErrorBoundary fallback={<LoadError onHome={() => back({ name: 'home' })} />}>
        <Suspense fallback={<Loading />}>
          <PracticeApp route={route} settingsStore={settingsStore} {...navigation} />
        </Suspense>
      </ErrorBoundary>
    );
  }
  return (
    <Home
      store={store}
      settingsStore={settingsStore}
      onNew={() => {
        store.newGame();
        startGame();
      }}
      onContinue={() => {
        store.loadSaved();
        startGame();
      }}
      onTraining={() => go({ name: 'training' })}
      onPractice={() => go({ name: 'bots' })}
    />
  );
}
