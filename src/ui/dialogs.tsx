import type { Color } from '../engine';
import type { GameSnapshot, GameStore, Settings, SettingsStore } from '../game';
import { es } from '../i18n/es';
import { Dialog } from './Dialog';
import { Switch } from './Switch';

export type DialogKind = 'resign' | 'draw' | 'new' | 'settings' | null;

interface DialogsProps {
  readonly kind: DialogKind;
  readonly onClose: () => void;
  readonly game: GameSnapshot;
  readonly store: GameStore;
  readonly settings: Settings;
  readonly settingsStore: SettingsStore;
  readonly onNewGame: () => void;
}

/** Todos los diálogos de la partida. Solo uno está abierto a la vez. */
export function Dialogs({ kind, onClose, game, store, settings, settingsStore, onNewGame }: DialogsProps) {
  const resign = (loser: Color) => {
    store.resign(loser);
    onClose();
  };

  return (
    <>
      <Dialog open={kind === 'resign'} title={es.dialogs.resign.title} onClose={onClose}>
        <p className="dialog__text">{es.dialogs.resign.body}</p>
        <div className="dialog__actions dialog__actions--stack">
          <button type="button" className="btn btn--danger" onClick={() => resign('w')}>
            {es.sides.w}
          </button>
          <button type="button" className="btn btn--danger" onClick={() => resign('b')}>
            {es.sides.b}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {es.dialogs.cancel}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'draw'} title={es.dialogs.draw.title} onClose={onClose}>
        <p className="dialog__text">{es.dialogs.draw.body}</p>
        {game.claimable && <p className="dialog__note">{es.dialogs.draw.available}</p>}
        <div className="dialog__actions dialog__actions--stack">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              store.agreeDraw();
              onClose();
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
                onClose();
              }}
            >
              {game.claimable === 'threefold' ? es.dialogs.draw.claimThreefold : es.dialogs.draw.claimFifty}
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {es.dialogs.cancel}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'new'} title={es.dialogs.newGame.title} onClose={onClose}>
        <p className="dialog__text">{es.dialogs.newGame.body}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            {es.dialogs.cancel}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onNewGame();
              onClose();
            }}
          >
            {es.dialogs.newGame.confirm}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'settings'} title={es.dialogs.settings.title} onClose={onClose}>
        <div className="dialog__stack">
          <Switch
            checked={settings.rotatePieces}
            onChange={(rotatePieces) => settingsStore.update({ rotatePieces })}
            label={es.dialogs.settings.rotate}
            help={es.dialogs.settings.rotateHelp}
          />
          <Switch
            checked={settings.motion === 'full'}
            onChange={(full) => settingsStore.update({ motion: full ? 'full' : 'reduced' })}
            label={es.dialogs.settings.motion}
            help={es.dialogs.settings.motionHelp}
          />
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
    </>
  );
}
