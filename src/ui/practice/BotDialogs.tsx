import { useEffect, useRef, useState } from 'react';
import type { DrawAnswer } from '../../bots/player';
import type { Persona } from '../../bots/personas';
import { resultFor, type Tally } from '../../bots/records';
import type { Color } from '../../engine';
import type { GameSnapshot, GameStore, Settings, SettingsStore } from '../../game';
import { isAtEnd } from '../../game';
import { describeOutcome, es } from '../../i18n/es';
import { Dialog } from '../Dialog';
import { SettingsDialog } from '../dialogs';
import { Icon } from '../icons';
import { MoveList } from '../panel/MoveList';

export type BotDialogKind = 'menu' | 'resign' | 'draw' | 'new' | 'settings' | null;
export type BotMenuAction = 'draw' | 'resign' | 'new' | 'settings' | 'switch' | 'home';

interface BotDialogsProps {
  readonly kind: BotDialogKind;
  /** Cierra ese diálogo; si ya se abrió otro en su lugar (menú → tablas), no toca al nuevo. */
  readonly onClose: (kind: Exclude<BotDialogKind, null>) => void;
  readonly game: GameSnapshot;
  readonly store: GameStore;
  readonly persona: Persona;
  /** Bando de la persona. */
  readonly side: Color;
  readonly settings: Settings;
  readonly settingsStore: SettingsStore;
  readonly onMenuAction: (action: BotMenuAction) => void;
  /** Las tablas se ofrecen en tu turno, no mientras el rival piensa. */
  readonly canOfferDraw: boolean;
  /** Pregunta al rival si acepta tablas. */
  readonly onOfferDraw: () => Promise<DrawAnswer>;
  /** Empieza de nuevo contra el mismo rival. */
  readonly onRestart: () => void;
}

/** Todos los diálogos de una partida contra un rival. Solo uno está abierto a la vez. */
export function BotDialogs({
  kind,
  onClose,
  game,
  store,
  persona,
  side,
  settings,
  settingsStore,
  onMenuAction,
  canOfferDraw,
  onOfferDraw,
  onRestart,
}: BotDialogsProps) {
  const t = es.bots;
  const over = game.outcome !== null;
  const atEnd = isAtEnd(game);

  return (
    <>
      <Dialog open={kind === 'menu'} title={t.menu.title} onClose={() => onClose('menu')}>
        <MoveList game={game} store={store} />
        <div className="menu__actions">
          <button type="button" className="btn" onClick={() => onMenuAction('draw')} disabled={!canOfferDraw}>
            <Icon name="draw" />
            {t.actions.draw}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('resign')} disabled={over || !atEnd}>
            <Icon name="flag" />
            {t.actions.resign}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('new')}>
            <Icon name="rotate" />
            {t.actions.newGame}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('switch')}>
            <Icon name="target" />
            {t.actions.switchBot}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('settings')}>
            <Icon name="settings" />
            {es.game.actions.settings}
          </button>
          <button type="button" className="btn" onClick={() => onMenuAction('home')}>
            <Icon name="home" />
            {es.game.actions.home}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'resign'} title={t.resign.title} onClose={() => onClose('resign')}>
        <p className="dialog__text">{t.resign.body(persona.name)}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => onClose('resign')}>
            {es.dialogs.cancel}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              store.resign(side);
              onClose('resign');
            }}
          >
            {t.resign.confirm}
          </button>
        </div>
      </Dialog>

      <Dialog open={kind === 'draw'} title={t.draw.title} onClose={() => onClose('draw')}>
        <DrawBody persona={persona} game={game} store={store} onOffer={onOfferDraw} onClose={() => onClose('draw')} />
      </Dialog>

      <Dialog open={kind === 'new'} title={t.restart.title} onClose={() => onClose('new')}>
        <p className="dialog__text">{t.restart.body}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => onClose('new')}>
            {es.dialogs.cancel}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onRestart();
              onClose('new');
            }}
          >
            {t.restart.confirm}
          </button>
        </div>
      </Dialog>

      <SettingsDialog
        open={kind === 'settings'}
        onClose={() => onClose('settings')}
        settings={settings}
        settingsStore={settingsStore}
        rotation={false}
      />
    </>
  );
}

type DrawPhase = 'idle' | 'asking' | 'declined' | 'early' | 'failed';

/** Contenido del diálogo de tablas: vive dentro del diálogo, así su estado se reinicia cada vez que se abre. */
function DrawBody({
  persona,
  game,
  store,
  onOffer,
  onClose,
}: {
  readonly persona: Persona;
  readonly game: GameSnapshot;
  readonly store: GameStore;
  readonly onOffer: () => Promise<DrawAnswer>;
  readonly onClose: () => void;
}) {
  const t = es.bots.draw;
  const [phase, setPhase] = useState<DrawPhase>('idle');
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const offer = () => {
    setPhase('asking');
    onOffer().then(
      (answer) => {
        if (!alive.current) return;
        if (answer === 'accept') {
          store.agreeDraw();
          onClose();
        } else {
          setPhase(answer === 'too-early' ? 'early' : 'declined');
        }
      },
      () => {
        if (alive.current) setPhase('failed');
      },
    );
  };

  const note =
    phase === 'asking'
      ? t.asking(persona.name)
      : phase === 'early'
        ? t.tooEarly
        : phase === 'declined'
          ? t.declined(persona.name)
          : phase === 'failed'
            ? t.failed
            : null;

  return (
    <>
      <p className="dialog__text">{t.body(persona.name)}</p>
      {game.claimable && <p className="dialog__note">{t.available}</p>}
      {note && (
        <p className="dialog__note" role="status">
          {note}
        </p>
      )}
      <div className="dialog__actions dialog__actions--stack">
        <button type="button" className="btn btn--primary" onClick={offer} disabled={phase === 'asking'}>
          {t.offer}
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
            {game.claimable === 'threefold' ? t.claimThreefold : t.claimFifty}
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {es.dialogs.cancel}
        </button>
      </div>
    </>
  );
}

interface BotResultDialogProps {
  readonly open: boolean;
  readonly game: GameSnapshot;
  readonly persona: Persona;
  readonly side: Color;
  /** Resultados contra este rival, ya con esta partida contada. */
  readonly tally: Tally;
  readonly onClose: () => void;
  readonly onRematch: () => void;
  readonly onOtherBot: () => void;
  readonly onReview: () => void;
}

/** Resultado de la partida contra el rival, con el recuento de todas las que lleva contra él. */
export function BotResultDialog({
  open,
  game,
  persona,
  side,
  tally,
  onClose,
  onRematch,
  onOtherBot,
  onReview,
}: BotResultDialogProps) {
  const t = es.bots.result;
  const outcome = game.outcome;
  const result = outcome ? resultFor(outcome, side) : null;
  const text = outcome ? describeOutcome(outcome) : null;
  const title = result === 'win' ? t.win : result === 'loss' ? t.loss : t.draw;
  const detail =
    result === 'win'
      ? t.winBy(persona.name)
      : result === 'loss'
        ? t.lossBy(persona.name)
        : t.drawBy(persona.name, text?.detail ?? '');

  return (
    <Dialog open={open && result !== null} title={title} onClose={onClose}>
      <p className="dialog__text">{detail}</p>
      <p className="dialog__note">{t.record(persona.name, tally.wins, tally.draws, tally.losses)}</p>
      <div className="dialog__actions dialog__actions--stack">
        <button type="button" className="btn btn--primary" onClick={onRematch}>
          {t.rematch}
        </button>
        <button type="button" className="btn" onClick={onOtherBot}>
          {t.other}
        </button>
        <button type="button" className="btn" onClick={onReview}>
          {t.review}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </Dialog>
  );
}
