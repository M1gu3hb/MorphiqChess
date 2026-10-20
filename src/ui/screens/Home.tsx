import { useEffect, useMemo, useState } from 'react';
import type { GameStore, SettingsStore } from '../../game';
import { createGame } from '../../game';
import { es } from '../../i18n/es';
import logo from '../../assets/brand/logo-morphiqchess.webp';
import { Board } from '../board/Board';
import { Dialog } from '../Dialog';
import { useSettings } from '../hooks';
import { Icon } from '../icons';

interface HomeProps {
  readonly store: GameStore;
  readonly settingsStore: SettingsStore;
  readonly onNew: () => void;
  readonly onContinue: () => void;
  readonly onTraining: () => void;
}

const DEMO_TURN_MS = 3600;

export function Home({ store, settingsStore, onNew, onContinue, onTraining }: HomeProps) {
  const settings = useSettings(settingsStore);
  const canContinue = useMemo(() => store.hasSavedGame(), [store]);
  const [demo] = useState(() => createGame());
  const [turned, setTurned] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);

  // El tablero de muestra gira solo, para enseñar de qué va el juego. Quieto con movimiento reducido.
  useEffect(() => {
    if (settings.motion === 'reduced') {
      setTurned(false);
      return;
    }
    const timer = window.setInterval(() => setTurned((value) => !value), DEMO_TURN_MS);
    return () => window.clearInterval(timer);
  }, [settings.motion]);

  return (
    <div className="screen home">
      <main className="home__main">
        <div className="home__copy">
          <img className="home__logo" src={logo} alt={es.appName} width={1200} height={356} />
          <h1 className="home__title" tabIndex={-1}>
            {es.home.heading}
          </h1>
          <p className="home__lead">{es.home.lead}</p>
          <div className="home__cta">
            {canContinue ? (
              // Con una partida guardada, lo principal es seguir jugándola; empezar de cero pide confirmar.
              <>
                <button type="button" className="btn btn--primary btn--xl" onClick={onContinue}>
                  <Icon name="play" />
                  {es.home.continueGame}
                </button>
                <button type="button" className="btn btn--xl" onClick={() => setConfirmNew(true)}>
                  {es.home.newGame}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--primary btn--xl" onClick={onNew}>
                <Icon name="play" />
                {es.home.newGame}
              </button>
            )}
            <button type="button" className="btn btn--xl" onClick={onTraining}>
              <Icon name="book" />
              {es.home.training}
            </button>
          </div>
          <ul className="home__features">
            {es.home.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="home__board" aria-hidden="true">
          <Board game={demo} orientation={turned ? 180 : 0} motion={settings.motion} interactive={false} />
        </div>
      </main>
      <footer className="home__footer">{es.home.footer}</footer>

      <Dialog open={confirmNew} title={es.dialogs.newGame.title} onClose={() => setConfirmNew(false)}>
        <p className="dialog__text">{es.dialogs.newGame.bodySaved}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmNew(false)}>
            {es.dialogs.cancel}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setConfirmNew(false);
              onNew();
            }}
          >
            {es.dialogs.newGame.confirm}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
