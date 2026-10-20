import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { isAbort } from '../../bots/engine';
import type { OpponentStatus } from '../../bots/opponent';
import { situationOf } from '../../bots/opponent';
import type { Persona } from '../../bots/personas';
import { answerDrawOffer, suggestMove, type DrawAnswer } from '../../bots/player';
import { EMPTY_TALLY, resultFor, type BotsStore } from '../../bots/records';
import { pliesToUndo } from '../../bots/session';
import { opposite, squareName, type Color } from '../../engine';
import { isAtEnd, positionAt, type GameStore, type SettingsStore } from '../../game';
import { es } from '../../i18n/es';
import { Board } from '../board/Board';
import { hintSeen, markHintSeen } from '../hints';
import { useGame, useSettings } from '../hooks';
import { Icon } from '../icons';
import { Rail } from '../rail/Rail';
import { PlayerStrip } from '../stage/PlayerStrip';
import { useAnnouncement } from '../useAnnouncement';
import { useFullscreen } from '../useFullscreen';
import { useHistoryShortcuts } from '../useHistoryShortcuts';
import { useResultDialog } from '../useResultDialog';
import { useWakeLock } from '../useWakeLock';
import { BotDialogs, BotResultDialog, type BotDialogKind, type BotMenuAction } from './BotDialogs';
import { useBots } from './hooks';
import { eloLabel, PersonaAvatar } from './PersonaAvatar';
import { useBotOpponent } from './useBotOpponent';

interface Props {
  /** La partida contra el rival (aparte de la de dos jugadores). */
  readonly store: GameStore;
  readonly botsStore: BotsStore;
  readonly settingsStore: SettingsStore;
  readonly persona: Persona;
  /** Bando de la persona; el rival juega el otro. */
  readonly side: Color;
  /** Volver a elegir rival. */
  readonly onMenu: () => void;
  readonly onHome: () => void;
  /** Revancha: partida nueva contra el mismo rival. */
  readonly onRestart: () => void;
}

/**
 * Partida contra un rival: la misma pantalla inmersiva que la de dos jugadores, pero con una sola persona
 * frente al tablero (con Azules, el tablero se ve girado) y el rival «sentado» en la franja de arriba.
 */
export function BotGameScreen({ store, botsStore, settingsStore, persona, side, onMenu, onHome, onRestart }: Props) {
  const t = es.bots;
  const game = useGame(store);
  const settings = useSettings(settingsStore);
  const bots = useBots(botsStore);
  const fullscreen = useFullscreen();
  const runtime = useBotOpponent(store, persona, side, true);
  const botSide = opposite(side);

  const [dialog, setDialog] = useState<BotDialogKind>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [railTip, setRailTip] = useState(() => !hintSeen('rail'));
  const [resultOpen, setResultOpen] = useResultDialog(game);
  const [hint, setHint] = useState<{ readonly key: string; readonly cells: readonly number[] } | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const stageRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hintRun = useRef<AbortController | null>(null);
  const announcement = useAnnouncement(game);
  useHistoryShortcuts(store);
  useWakeLock(true);

  const over = game.outcome !== null;
  const atEnd = isAtEnd(game);
  const myTurn = atEnd && !over && positionAt(game).turn === side;
  const gameKey = `${game.gameId}:${game.revision}`;
  const elo = eloLabel(persona, t.elo);
  const tally = bots.records[persona.id] ?? EMPTY_TALLY;
  const undoCount = pliesToUndo(game, side);
  const hintCells = hint && hint.key === gameKey ? hint.cells : undefined;
  const canHint = myTurn && runtime.engine !== null && runtime.status !== 'error' && !hintBusy;

  // Al abrir la pantalla, el foco pasa al título: quien usa lector de pantalla sabe dónde está.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  // El resultado se cuenta en cuanto la partida termina (una sola vez: el almacén ignora los repetidos).
  useEffect(() => {
    if (game.outcome) botsStore.record(resultFor(game.outcome, side));
  }, [game.outcome, side, botsStore]);

  // Una pista (y su búsqueda) solo vale para la posición en que se pidió.
  useEffect(() => {
    hintRun.current?.abort();
    hintRun.current = null;
    setHintBusy(false);
    setNotice('');
  }, [gameKey]);
  useEffect(() => () => hintRun.current?.abort(), []);

  const requestHint = () => {
    const engine = runtime.engine;
    if (!engine || !canHint) return;
    hintRun.current?.abort();
    const controller = new AbortController();
    hintRun.current = controller;
    const key = gameKey;
    setHintBusy(true);
    setNotice('');
    suggestMove(engine, situationOf(game), controller.signal).then(
      (move) => {
        if (controller.signal.aborted) return;
        hintRun.current = null;
        setHintBusy(false);
        if (!move) {
          setNotice(t.a11y.noHint);
          return;
        }
        setHint({ key, cells: [move.from, move.to] });
        setNotice(t.a11y.hintShown(squareName(move.from), squareName(move.to)));
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbort(error)) return;
        hintRun.current = null;
        setHintBusy(false);
        setNotice(t.a11y.noHint);
      },
    );
  };

  const offerDraw = (): Promise<DrawAnswer> => {
    const engine = runtime.engine;
    if (!engine || !engine.usable) return Promise.reject(new Error('El rival no está disponible.'));
    return answerDrawOffer(engine, situationOf(game), botSide, positionAt(game).turn);
  };

  const changeRail = (next: boolean) => {
    setRailOpen(next);
    if (next) {
      setRailTip(false);
      markHintSeen('rail');
    }
  };

  const closeDialog = (kind: Exclude<BotDialogKind, null>) => setDialog((current) => (current === kind ? null : current));

  const restart = () => {
    setResultOpen(false);
    setHint(null);
    onRestart();
  };

  const requestRestart = () => {
    if (game.plies.length > 0 && !over) {
      setDialog('new');
    } else {
      setDialog(null);
      restart();
    }
  };

  const onMenuAction = (action: BotMenuAction) => {
    switch (action) {
      case 'draw':
      case 'resign':
      case 'settings':
        setDialog(action);
        break;
      case 'new':
        requestRestart();
        break;
      case 'switch':
        setDialog(null);
        onMenu();
        break;
      case 'home':
        setDialog(null);
        onHome();
        break;
    }
  };

  /** Con el cajón abierto, tocar fuera de él solo lo cierra: no debe seleccionar ni mover piezas. */
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

  const spoken = runtime.status === 'error' ? t.a11y.failed : runtime.status === 'loading' ? t.a11y.loading : notice;

  return (
    <div
      className="screen game-screen bot-screen"
      data-motion={settings.motion}
      data-rail={railOpen ? 'open' : 'closed'}
      onPointerDownCapture={closeRailOnOutsideTap}
    >
      <a
        className="skip-link"
        href="#tablero"
        onClick={(event) => {
          // Sin cambiar la dirección: el foco pasa al tablero y listo.
          event.preventDefault();
          stageRef.current?.querySelector<HTMLElement>('.board-grid')?.focus({ preventScroll: true });
        }}
      >
        {es.a11y.skip}
      </a>

      <main ref={stageRef} className="stage">
        <h1 className="visually-hidden" tabIndex={-1} ref={titleRef}>
          {t.gameTitle(persona.name)}
        </h1>
        <PlayerStrip
          side={botSide}
          top
          game={game}
          store={store}
          label={`${persona.name}, ${elo}`}
          name={persona.name}
          detail={elo}
          avatar={<PersonaAvatar persona={persona} size="strip" />}
          status={<BotStatus status={runtime.status} onRetry={runtime.retry} />}
          controls={false}
        />
        <div className="stage__board" id="tablero">
          <Board
            game={game}
            orientation={0}
            flipped={side === 'b'}
            motion={settings.motion}
            playAs={side}
            hints={hintCells}
            onMove={(move) => store.play(move)}
          />
        </div>
        <PlayerStrip
          side={side}
          game={game}
          store={store}
          label={`${t.you}, ${es.sides[side]}`}
          name={t.you}
          detail={es.sides[side]}
          canResume={!over}
        />
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
        hint={railTip}
        onUndo={() => store.undoPlies(undoCount)}
        undoDisabled={undoCount === 0}
        tools={
          <button
            type="button"
            className="rail__btn"
            onClick={requestHint}
            disabled={!canHint}
            aria-busy={hintBusy}
            aria-label={hintBusy ? t.actions.hinting : t.actions.hint}
            title={hintBusy ? t.actions.hinting : t.actions.hint}
          >
            <Icon name="bulb" size={22} />
          </button>
        }
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {announcement}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
        {spoken}
      </div>

      <BotDialogs
        kind={dialog}
        onClose={closeDialog}
        game={game}
        store={store}
        persona={persona}
        side={side}
        settings={settings}
        settingsStore={settingsStore}
        onMenuAction={onMenuAction}
        canOfferDraw={myTurn}
        onOfferDraw={offerDraw}
        onRestart={restart}
      />

      <BotResultDialog
        open={resultOpen}
        game={game}
        persona={persona}
        side={side}
        tally={tally}
        onClose={() => setResultOpen(false)}
        onRematch={restart}
        onOtherBot={() => {
          setResultOpen(false);
          onMenu();
        }}
        onReview={() => {
          setResultOpen(false);
          store.first();
        }}
      />
    </div>
  );
}

/** Lo que hace el rival, en su franja: cargando el motor, pensando o, si no cargó, cómo reintentar. */
function BotStatus({ status, onRetry }: { readonly status: OpponentStatus; readonly onRetry: () => void }) {
  const t = es.bots.status;
  if (status === 'error') {
    return (
      <>
        <span className="bot-status" data-kind="error">
          <span className="bot-status__text">{t.failed}</span>
        </span>
        <button type="button" className="btn btn--sm" onClick={onRetry}>
          {t.retry}
        </button>
      </>
    );
  }
  if (status === 'loading' || status === 'thinking') {
    return (
      <span className="bot-status" data-kind={status}>
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="bot-status__text">{status === 'loading' ? t.loading : t.thinking}</span>
      </span>
    );
  }
  return null;
}
