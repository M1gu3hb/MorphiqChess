import { useState } from 'react';
import type { GameStore, SettingsStore } from '../../game';
import { isAtEnd, orientationAt } from '../../game';
import { es } from '../../i18n/es';
import logo from '../../assets/brand/logo-morphiqchess-sm.webp';
import { Board } from '../board/Board';
import { Dialogs, type DialogKind } from '../dialogs';
import { useGame, useSettings } from '../hooks';
import { Icon } from '../icons';
import { CapturedTray } from '../panel/CapturedTray';
import { HistoryBar } from '../panel/HistoryBar';
import { MoveList } from '../panel/MoveList';
import { StatusCard } from '../panel/StatusCard';
import { useAnnouncement } from '../useAnnouncement';
import { useHistoryShortcuts } from '../useHistoryShortcuts';

interface GameScreenProps {
  readonly store: GameStore;
  readonly settingsStore: SettingsStore;
  readonly onHome: () => void;
}

export function GameScreen({ store, settingsStore, onHome }: GameScreenProps) {
  const game = useGame(store);
  const settings = useSettings(settingsStore);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const announcement = useAnnouncement(game);
  useHistoryShortcuts(store);

  const atEnd = isAtEnd(game);
  const hasMoves = game.plies.length > 0;
  const over = game.outcome !== null;
  const orientation = orientationAt(game, settings.rotatePieces);

  const requestNewGame = () => {
    if (hasMoves && !over) setDialog('new');
    else store.newGame();
  };

  return (
    <div className="screen game-screen">
      <a className="skip-link" href="#tablero">
        {es.a11y.skip}
      </a>
      <header className="topbar">
        <button type="button" className="brand" onClick={onHome} aria-label={`${es.appName}: ${es.game.actions.home}`}>
          <img src={logo} alt="" width={520} height={154} />
        </button>
        <button type="button" className="btn btn--quiet" onClick={() => setDialog('settings')}>
          <Icon name="settings" />
          <span className="btn__label">{es.game.actions.settings}</span>
        </button>
      </header>

      <main className="game-main">
        <h1 className="visually-hidden" tabIndex={-1}>
          {es.appName}
        </h1>
        <div className="board-col">
          <div className="board-wrap" id="tablero">
            <Board game={game} orientation={orientation} motion={settings.motion} onMove={(move) => store.play(move)} />
            <HistoryBar game={game} store={store} />
          </div>
        </div>

        <div className="side-col">
          <StatusCard
            game={game}
            onBackToEnd={() => store.last()}
            onResume={() => store.resumeFromCursor()}
            onNewGame={() => store.newGame()}
            onReview={() => store.first()}
          />
          <CapturedTray game={game} />
          <MoveList game={game} store={store} />
          <div className="actions" role="group" aria-label={es.game.actions.settings}>
            <button type="button" className="btn" onClick={() => store.undo()} disabled={!hasMoves || !atEnd}>
              <Icon name="undo" />
              {es.game.actions.undo}
            </button>
            <button type="button" className="btn" onClick={() => setDialog('draw')} disabled={over || !atEnd}>
              <Icon name="draw" />
              {es.game.actions.draw}
            </button>
            <button type="button" className="btn" onClick={() => setDialog('resign')} disabled={over || !atEnd}>
              <Icon name="flag" />
              {es.game.actions.resign}
            </button>
            <button type="button" className="btn" onClick={requestNewGame}>
              <Icon name="plus" />
              {es.game.actions.newGame}
            </button>
          </div>
        </div>
      </main>

      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {announcement}
      </div>

      <Dialogs
        kind={dialog}
        onClose={() => setDialog(null)}
        game={game}
        store={store}
        settings={settings}
        settingsStore={settingsStore}
        onNewGame={() => store.newGame()}
      />
    </div>
  );
}
