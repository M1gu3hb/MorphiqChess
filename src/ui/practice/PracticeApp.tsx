import '../../styles/practice.css';
import { useEffect, useState } from 'react';
import { personaById, type Persona } from '../../bots/personas';
import { BotsStore } from '../../bots/records';
import { BOT_GAME_STORAGE_KEY, beginSession, enterSession } from '../../bots/session';
import type { Color } from '../../engine';
import { createGame, GameStore, type SettingsStore } from '../../game';
import { es } from '../../i18n/es';
import type { BotsRoute, Navigation } from '../route';
import { enterFullscreen } from '../useFullscreen';
import { BotGameScreen } from './BotGameScreen';
import { BotsMenu, type SideChoice } from './BotsMenu';
import { BotsBar } from './parts';

/** Un solo almacén de resultados y una sola partida contra rivales para toda la app (se crean al abrir la práctica). */
const botsStore = new BotsStore();
const botGame = new GameStore(createGame(), undefined, BOT_GAME_STORAGE_KEY);

interface Props extends Navigation {
  readonly route: BotsRoute;
  readonly settingsStore: SettingsStore;
}

/**
 * Todo el modo Práctica. Se carga aparte (`import()` en App) para que quien solo quiere jugar una partida
 * de dos jugadores no descargue las pantallas de los rivales ni sus estilos.
 */
export default function PracticeApp({ route, settingsStore, go, back }: Props) {
  /** El navegador solo concede pantalla completa dentro del toque, así que se pide antes de cambiar de pantalla. */
  const immersive = () => {
    if (settingsStore.getSnapshot().autoFullscreen) void enterFullscreen();
  };

  const start = (persona: Persona, choice: SideChoice) => {
    const side: Color = choice === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : choice;
    beginSession(botsStore, botGame, persona.id, side);
    immersive();
    go({ name: 'bot', bot: persona.id, side });
  };

  const resume = (bot: string, side: Color) => {
    immersive();
    go({ name: 'bot', bot, side });
  };

  if (route.name === 'bots') {
    return <BotsMenu store={botsStore} gameStore={botGame} go={go} back={back} onStart={start} onResume={resume} />;
  }

  return (
    <BotRoute
      key={`${route.bot}/${route.side}`}
      bot={route.bot}
      side={route.side}
      settingsStore={settingsStore}
      go={go}
      back={back}
    />
  );
}

interface BotRouteProps extends Navigation {
  readonly bot: string;
  readonly side: Color;
  readonly settingsStore: SettingsStore;
}

/** Una partida contra un rival. Al abrirla deja lista la partida: la retoma si es la que quedó a medias, o empieza una nueva. */
function BotRoute({ bot, side, settingsStore, go, back }: BotRouteProps) {
  const persona = personaById(bot);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!persona) return;
    enterSession(botsStore, botGame, persona.id, side);
    setReady(true);
  }, [persona, side]);

  if (!persona) {
    return (
      <div className="screen bots">
        <BotsBar title={es.bots.title} backLabel={es.bots.back} onBack={() => back({ name: 'bots' })} />
        <main className="bots-main">
          <p className="bots-lead" role="alert">
            {es.bots.notFound}
          </p>
          <button type="button" className="btn btn--primary bots-cta" onClick={() => go({ name: 'bots' })}>
            {es.bots.toMenu}
          </button>
        </main>
      </div>
    );
  }
  if (!ready) return <div className="screen" />;

  return (
    <BotGameScreen
      store={botGame}
      botsStore={botsStore}
      settingsStore={settingsStore}
      persona={persona}
      side={side}
      onMenu={() => back({ name: 'bots' })}
      onHome={() => back({ name: 'home' })}
      onRestart={() => beginSession(botsStore, botGame, persona.id, side)}
    />
  );
}
