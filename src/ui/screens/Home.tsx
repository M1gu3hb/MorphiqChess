import { useEffect, useMemo, useState } from 'react';
import type { GameStore, SettingsStore } from '../../game';
import { createGame } from '../../game';
import { es } from '../../i18n/es';
import logo from '../../assets/brand/logo-morphiqchess.webp';
import { Board } from '../board/Board';
import { Dialog } from '../Dialog';
import { useSettings } from '../hooks';
import { Icon, type IconName } from '../icons';

interface HomeProps {
  readonly store: GameStore;
  readonly settingsStore: SettingsStore;
  readonly onNew: () => void;
  readonly onContinue: () => void;
  readonly onTraining: () => void;
  readonly onPractice: () => void;
}

const DEMO_TURN_MS = 3600;

/** Un modo de juego: su nombre y, debajo, una línea que dice de qué va. */
function Mode({ icon, name, hint, primary = false, onClick }: { icon: IconName; name: string; hint: string; primary?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`btn btn--xl mode${primary ? ' btn--primary' : ''}`} onClick={onClick}>
      <Icon name={icon} />
      <span className="mode__text">
        <span className="mode__name">{name}</span>
        <span className="mode__hint">{hint}</span>
      </span>
    </button>
  );
}

export function Home({ store, settingsStore, onNew, onContinue, onTraining, onPractice }: HomeProps) {
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
                <Mode primary icon="play" name={es.home.continueGame} hint={es.home.continueHint} onClick={onContinue} />
                <Mode icon="plus" name={es.home.newGame} hint={es.home.newGameHint} onClick={() => setConfirmNew(true)} />
              </>
            ) : (
              <Mode primary icon="play" name={es.home.newGame} hint={es.home.newGameHint} onClick={onNew} />
            )}
            <Mode icon="book" name={es.home.training} hint={es.home.trainingHint} onClick={onTraining} />
            <Mode icon="target" name={es.home.practice} hint={es.home.practiceHint} onClick={onPractice} />
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
