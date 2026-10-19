import { useEffect, useRef, useState } from 'react';
import { GameStore, SettingsStore } from './game';
import { Home } from './ui/screens/Home';
import { GameScreen } from './ui/screens/GameScreen';

type Screen = 'home' | 'game';

const GAME_HASH = '#/partida';
const screenFromHash = (): Screen => (window.location.hash === GAME_HASH ? 'game' : 'home');

const TITLES: Record<Screen, string> = {
  home: 'MorphiqChess · Ajedrez para 2 jugadores',
  game: 'Partida · MorphiqChess',
};

export function App() {
  const [store] = useState(() => {
    const created = new GameStore();
    // Si se abre directo la partida y hay una guardada, se retoma.
    if (screenFromHash() === 'game' && created.hasSavedGame()) created.loadSaved();
    return created;
  });
  const [settingsStore] = useState(() => new SettingsStore());
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const firstRender = useRef(true);

  useEffect(() => {
    const onPop = () => setScreen(screenFromHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    document.title = TITLES[screen];
    // Al cambiar de pantalla, el foco pasa al título: quien usa lector de pantalla sabe dónde está.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true });
  }, [screen]);

  const go = (next: Screen) => {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.pushState(null, '', next === 'game' ? `${base}${GAME_HASH}` : base);
    setScreen(next);
    window.scrollTo(0, 0);
  };

  if (screen === 'game') {
    return <GameScreen store={store} settingsStore={settingsStore} onHome={() => go('home')} />;
  }
  return (
    <Home
      store={store}
      settingsStore={settingsStore}
      onNew={() => {
        store.newGame();
        go('game');
      }}
      onContinue={() => {
        store.loadSaved();
        go('game');
      }}
    />
  );
}
