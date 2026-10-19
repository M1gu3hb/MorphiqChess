import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { GameStore, SettingsStore } from '../../game';
import { orientationAt } from '../../game';
import { es } from '../../i18n/es';
import { Board } from '../board/Board';
import { Dialogs, ResultDialog, type DialogKind, type MenuAction } from '../dialogs';
import { hintSeen, markHintSeen } from '../hints';
import { useGame, useSettings } from '../hooks';
import { Rail } from '../rail/Rail';
import { PlayerStrip } from '../stage/PlayerStrip';
import { useAnnouncement } from '../useAnnouncement';
import { useFullscreen } from '../useFullscreen';
import { useHistoryShortcuts } from '../useHistoryShortcuts';
import { useWakeLock } from '../useWakeLock';

interface GameScreenProps {
  readonly store: GameStore;
  readonly settingsStore: SettingsStore;
  readonly onHome: () => void;
}

/** Pausa antes de mostrar el resultado, para que se vea primero la animación del final. */
const RESULT_DELAY_MS = { checkmate: 2300, other: 1100 } as const;

/**
 * Pantalla de juego: solo el tablero, una franja pegada a la orilla de cada jugador y un cajón
 * lateral con las herramientas. Nada se desplaza ni cambia de tamaño al jugar o al revisar jugadas.
 */
export function GameScreen({ store, settingsStore, onHome }: GameScreenProps) {
  const game = useGame(store);
  const settings = useSettings(settingsStore);
  const fullscreen = useFullscreen();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [hint, setHint] = useState(() => !hintSeen('rail'));
  const [resultOpen, setResultOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  const announcement = useAnnouncement(game);
  useHistoryShortcuts(store);
  useWakeLock(true);

  const hasMoves = game.plies.length > 0;
  const over = game.outcome !== null;
  const orientation = orientationAt(game, settings.rotatePieces);

  // El resultado solo aparece cuando la partida termina aquí mismo (una jugada, rendición o tablas),
  // no al abrir una partida que ya había terminado ni al revisar jugadas.
  const t = game.transition;
  const endedNow = over && ((t.type === 'forward' && t.source === 'play') || (t.type === 'none' && t.ended === true));
  const resultDelay = game.outcome?.type === 'checkmate' ? RESULT_DELAY_MS.checkmate : RESULT_DELAY_MS.other;
  useEffect(() => {
    if (!over) {
      setResultOpen(false);
      return;
    }
    if (!endedNow) return;
    const timer = window.setTimeout(() => setResultOpen(true), resultDelay);
    return () => window.clearTimeout(timer);
  }, [game.gameId, game.revision, over, endedNow, resultDelay]);

  const changeRail = (next: boolean) => {
    setRailOpen(next);
    if (next) {
      setHint(false);
      markHintSeen('rail');
    }
  };

  const closeDialog = (kind: Exclude<DialogKind, null>) => setDialog((current) => (current === kind ? null : current));

  const requestNewGame = () => {
    if (hasMoves && !over) {
      setDialog('new');
    } else {
      store.newGame();
      setDialog(null);
    }
  };

  const onMenuAction = (action: MenuAction) => {
    switch (action) {
      case 'draw':
      case 'resign':
      case 'settings':
        setDialog(action);
        break;
      case 'new':
        requestNewGame();
        break;
      case 'home':
        setDialog(null);
        onHome();
        break;
    }
  };

  /**
   * Con el cajón abierto, tocar fuera de él solo lo cierra: no debe seleccionar ni mover piezas.
   * Los botones (por ejemplo «Retomar aquí» de las franjas) siguen funcionando con el cajón abierto.
   */
  const closeRailOnOutsideTap = (event: ReactPointerEvent<HTMLElement>) => {
    if (!railOpen || !(event.target instanceof Element)) return;
    if (event.target.closest('.rail, dialog, button, a, [role="slider"]')) return;
    event.stopPropagation();
    changeRail(false);
  };

  const openMenu = () => {
    setRailOpen(false);
    setDialog('menu');
  };

  return (
    <div
      className="screen game-screen"
      data-motion={settings.motion}
      data-rail={railOpen ? 'open' : 'closed'}
      onPointerDownCapture={closeRailOnOutsideTap}
    >
      <a
        className="skip-link"
        href="#tablero"
        onClick={(event) => {
          // Sin cambiar la dirección (#/partida): el foco pasa al tablero y listo.
          event.preventDefault();
          stageRef.current?.querySelector<HTMLElement>('.board-grid')?.focus({ preventScroll: true });
        }}
      >
        {es.a11y.skip}
      </a>

      <main ref={stageRef} className="stage">
        <h1 className="visually-hidden" tabIndex={-1}>
          {es.appName}
        </h1>
        <PlayerStrip side="b" flipped game={game} store={store} />
        <div className="stage__board" id="tablero">
          <Board game={game} orientation={orientation} motion={settings.motion} onMove={(move) => store.play(move)} />
        </div>
        <PlayerStrip side="w" game={game} store={store} />
      </main>

      <Rail
        open={railOpen}
        onOpenChange={changeRail}
        stageRef={stageRef}
        game={game}
        store={store}
        reduced={settings.motion === 'reduced'}
        fullscreen={fullscreen}
        onMenu={openMenu}
        hint={hint}
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {announcement}
      </div>

      <Dialogs
        kind={dialog}
        onClose={closeDialog}
        game={game}
        store={store}
        settings={settings}
        settingsStore={settingsStore}
        onNewGame={() => store.newGame()}
        onMenuAction={onMenuAction}
      />

      <ResultDialog
        open={resultOpen}
        game={game}
        onClose={() => setResultOpen(false)}
        onNewGame={() => {
          setResultOpen(false);
          store.newGame();
        }}
        onReview={() => {
          setResultOpen(false);
          store.first();
        }}
      />
    </div>
  );
}
