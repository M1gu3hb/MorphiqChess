import type { Color } from '../engine';
import type { GameSnapshot, GameStore, Settings, SettingsStore } from '../game';
import { isAtEnd } from '../game';
import { describeOutcome, es } from '../i18n/es';
import { Dialog } from './Dialog';
import { Icon } from './icons';
import { MoveList } from './panel/MoveList';
import { Switch } from './Switch';
import { fullscreenSupported, isIPhone } from './useFullscreen';

export type DialogKind = 'menu' | 'resign' | 'draw' | 'new' | 'settings' | null;
export type MenuAction = 'draw' | 'resign' | 'new' | 'settings' | 'home';

interface DialogsProps {
  readonly kind: DialogKind;
  /** Cierra ese diálogo; si ya se abrió otro en su lugar (menú → tablas), no toca al nuevo. */
  readonly onClose: (kind: Exclude<DialogKind, null>) => void;
  readonly game: GameSnapshot;
  readonly store: GameStore;
  readonly settings: Settings;
  readonly settingsStore: SettingsStore;
  readonly onNewGame: () => void;
  readonly onMenuAction: (action: MenuAction) => void;
}

/** Todos los diálogos de la partida. Solo uno está abierto a la vez. */
export function Dialogs({ kind, onClose, game, store, settings, settingsStore, onNewGame, onMenuAction }: DialogsProps) {
  const resign = (loser: Color) => {
    store.resign(loser);
    onClose('resign');
  };
  const over = game.outcome !== null;
  const atEnd = isAtEnd(game);

  return (
    <>
      <Dialog open={kind === 'menu'} title={es.menu.title} onClose={() => onClose('menu')}>
        <MoveList game={game} store={store} />
        <div className="menu__actions">
          <button type="button" className="btn" onClick={() => onMenuAction('draw')} disabled={over || !atEnd}>
            <Icon name="draw" />
            {es.game.actions.draw}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('resign')} disabled={over || !atEnd}>
            <Icon name="flag" />
            {es.game.actions.resign}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('new')}>
            <Icon name="plus" />
            {es.game.actions.newGame}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('settings')}>
            <Icon name="settings" />
            {es.game.actions.settings}
          </button>
          <button type="button" className="btn menu__wide" onClick={() => onMenuAction('home')}>
            <Icon name="home" />
            {es.game.actions.home}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'resign'} title={es.dialogs.resign.title} onClose={() => onClose('resign')}>
        <p className="dialog__text">{es.dialogs.resign.body}</p>
        <div className="dialog__actions dialog__actions--stack">
          <button type="button" className="btn btn--danger" onClick={() => resign('w')}>
            {es.sides.w}
          </button>
          <button type="button" className="btn btn--danger" onClick={() => resign('b')}>
            {es.sides.b}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => onClose('resign')}>
            {es.dialogs.cancel}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'draw'} title={es.dialogs.draw.title} onClose={() => onClose('draw')}>
        <p className="dialog__text">{es.dialogs.draw.body}</p>
        {game.claimable && <p className="dialog__note">{es.dialogs.draw.available}</p>}
        <div className="dialog__actions dialog__actions--stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              store.agreeDraw();
              onClose('draw');
            }}
          >
            {es.dialogs.draw.accept}
          </button>
          {game.claimable && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                store.claimDraw();
                onClose('draw');
              }}
            >
              {game.claimable === 'threefold' ? es.dialogs.draw.claimThreefold : es.dialogs.draw.claimFifty}
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => onClose('draw')}>
            {es.dialogs.cancel}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'new'} title={es.dialogs.newGame.title} onClose={() => onClose('new')}>
        <p className="dialog__text">{es.dialogs.newGame.body}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => onClose('new')}>
            {es.dialogs.cancel}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onNewGame();
              onClose('new');
            }}
          >
            {es.dialogs.newGame.confirm}
          </button>
        </div>
      </Dialog>

      <SettingsDialog
        open={kind === 'settings'}
        onClose={() => onClose('settings')}
        settings={settings}
        settingsStore={settingsStore}
      />
    </>
  );
}

interface SettingsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly settings: Settings;
  readonly settingsStore: SettingsStore;
  /** Contra un rival las piezas no giran, así que ese ajuste no aplica. */
  readonly rotation?: boolean;
}

/** Ajustes de la persona y atajos de teclado: los mismos en la partida de dos y contra un rival. */
export function SettingsDialog({ open, onClose, settings, settingsStore, rotation = true }: SettingsDialogProps) {
  return (
    <Dialog open={open} title={es.dialogs.settings.title} onClose={onClose}>
      <div className="dialog__stack">
        {rotation && (
          <Switch
            checked={settings.rotatePieces}
            onChange={(rotatePieces) => settingsStore.update({ rotatePieces })}
            label={es.dialogs.settings.rotate}
            help={es.dialogs.settings.rotateHelp}
          />
        )}
        <Switch
          checked={settings.motion === 'full'}
          onChange={(full) => settingsStore.update({ motion: full ? 'full' : 'reduced' })}
          label={es.dialogs.settings.motion}
          help={es.dialogs.settings.motionHelp}
        />
        {fullscreenSupported() ? (
          <Switch
            checked={settings.autoFullscreen}
            onChange={(autoFullscreen) => settingsStore.update({ autoFullscreen })}
            label={es.dialogs.settings.autoFullscreen}
            help={es.dialogs.settings.autoFullscreenHelp}
          />
        ) : (
          isIPhone() && <p className="dialog__note">{es.dialogs.settings.iphoneTip}</p>
        )}
      </div>
      <h3 className="dialog__subtitle">{es.shortcuts.title}</h3>
      <dl className="shortcuts">
        {es.shortcuts.items.map(([keys, text]) => (
          <div key={keys} className="shortcuts__row">
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{text}</dd>
          </div>
        ))}
      </dl>
      <div className="dialog__actions">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {es.dialogs.settings.close}
        </button>
      </div>
    </Dialog>
  );
}

interface ResultDialogProps {
  readonly open: boolean;
  readonly game: GameSnapshot;
  readonly onClose: () => void;
  readonly onNewGame: () => void;
  readonly onReview: () => void;
}

/** Resultado al terminar la partida: se muestra cuando ya acabaron las animaciones del final. */
export function ResultDialog({ open, game, onClose, onNewGame, onReview }: ResultDialogProps) {
  const text = game.outcome ? describeOutcome(game.outcome) : null;
  return (
    <Dialog open={open && text !== null} title={text?.headline ?? es.gameOver.title} onClose={onClose}>
      <p className="dialog__text">{text?.detail}</p>
      <div className="dialog__actions dialog__actions--stack">
        <button type="button" className="btn btn--primary" onClick={onNewGame}>
          {es.gameOver.newGame}
        </button>
        <button type="button" className="btn" onClick={onReview}>
          {es.gameOver.review}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {es.gameOver.close}
        </button>
      </div>
    </Dialog>
  );
}
