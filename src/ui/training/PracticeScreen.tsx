import { useEffect, useRef, useState } from 'react';
import type { Move } from '../../engine';
import { createGame, playMove, positionAt, type GameSnapshot, type SettingsStore } from '../../game';
import { announcePly, es } from '../../i18n/es';
import { courseById, loadCourseLines, type CourseLines } from '../../training/catalog';
import { positionKey, type OpeningGraph } from '../../training/graph';
import {
  moveFromSan,
  movesLine,
  pickDrill,
  pickWeighted,
  planSetup,
  replyChoices,
  sanOf,
  suggestMove,
} from '../../training/practice';
import { EMPTY_COURSE, summarizeSaved, type CardState, type TrainingStore } from '../../training/progress';
import type { CourseInfo } from '../../training/types';
import { Board } from '../board/Board';
import { useSettings } from '../hooks';
import { Icon } from '../icons';
import type { Navigation, PracticeMode } from '../route';
import { useWakeLock } from '../useWakeLock';
import { Coach } from './Coach';
import { NotFound } from './CourseScreen';
import { useLoaded, useTraining } from './hooks';
import { displayMove } from './RichText';
import { LoadFailedScreen, LoadingScreen, TopBar } from './parts';
import { useCoachText } from './useCoachText';

/** Pausa entre jugada y jugada mientras se llega a la posición que se va a preguntar. */
const STEP_MS = 560;
/** Pausa antes de que el bot responda (con movimiento reducido, más corta). */
const BOT_MS = 700;
const BOT_REDUCED_MS = 250;

type Phase = 'setup' | 'user' | 'bot' | 'result';
type Note = 'correct' | 'revealed' | 'wrong';

/** Lo que va pasando en la posición que la persona tiene delante. */
interface Attempt {
  readonly wrong: number;
  /** 0 = sin pista; 1 = pieza marcada; 2 = pieza y destino. */
  readonly hints: number;
  /** La jugada que se sugiere (SAN): se fija al pedir la primera pista y no cambia. */
  readonly suggest: string | null;
  /** El fallo de esta posición ya se anotó en esta vuelta (se anota una sola vez). */
  readonly failed: boolean;
}

const FRESH: Attempt = { wrong: 0, hints: 0, suggest: null, failed: false };

/** Una variante en curso, de la primera jugada (o de donde se cae a preguntar) hasta que se acaba. */
interface Run {
  readonly game: GameSnapshot;
  readonly phase: Phase;
  /** Jugadas (SAN) que se juegan solas para llegar a la posición que se pregunta. */
  readonly queue: readonly string[];
  readonly attempt: Attempt;
  readonly note: Note | null;
  /** Posiciones respondidas en esta variante, y cuántas a la primera y sin pistas. */
  readonly asked: number;
  readonly clean: number;
}

/** ¿Qué toca en esta posición? Preguntar, que responda el bot, o ya terminó la variante. */
function phaseAt(graph: OpeningGraph, game: GameSnapshot): Phase {
  const node = graph.nodes.get(positionKey(positionAt(game)));
  if (!node || node.next.size === 0) return 'result';
  return node.turn === graph.userSide ? 'user' : 'bot';
}

function beginRun(
  graph: OpeningGraph,
  cards: Readonly<Record<string, CardState>>,
  mode: PracticeMode,
  instant: boolean,
): Run {
  const drill = mode === 'smart' ? pickDrill(graph, cards, Date.now(), Math.random) : null;
  const plan = drill ? planSetup(drill.path) : { fen: undefined, moves: [] as readonly string[] };
  let game = createGame(plan.fen);
  let queue = plan.moves;
  if (instant) {
    // Sin animaciones no hay nada que ver en el camino: se llega de golpe.
    for (const san of queue) {
      const move = moveFromSan(positionAt(game), san);
      if (move) game = playMove(game, move);
    }
    queue = [];
  }
  return {
    game,
    phase: queue.length > 0 ? 'setup' : phaseAt(graph, game),
    queue,
    attempt: FRESH,
    note: null,
    asked: 0,
    clean: 0,
  };
}

/** Juega la siguiente jugada del camino. */
function stepSetup(graph: OpeningGraph, run: Run): Run {
  const [san, ...rest] = run.queue;
  const move = san === undefined ? null : moveFromSan(positionAt(run.game), san);
  const game = move ? playMove(run.game, move) : run.game;
  const queue = move ? rest : [];
  return { ...run, game, queue, phase: queue.length > 0 ? 'setup' : phaseAt(graph, game) };
}

/** La respuesta del bot: al azar, con más peso donde más falta por afianzar. */
function botReply(graph: OpeningGraph, cards: Readonly<Record<string, CardState>>, run: Run): Run {
  const position = positionAt(run.game);
  const choice = pickWeighted(replyChoices(graph, positionKey(position), cards, Date.now()), Math.random);
  const move = choice ? moveFromSan(position, choice.san) : null;
  if (!move) return { ...run, phase: 'result' };
  const game = playMove(run.game, move);
  return { ...run, game, phase: phaseAt(graph, game), note: null, attempt: FRESH };
}

interface Props extends Navigation {
  readonly store: TrainingStore;
  readonly settingsStore: SettingsStore;
  readonly courseId: string;
  readonly mode: PracticeMode;
}

export function PracticeScreen({ store, settingsStore, courseId, mode, back }: Props) {
  const course = courseById(courseId);
  const loaded = useLoaded(
    () => (course?.lines ? loadCourseLines(course) : Promise.reject(new Error('sin variantes'))),
    course?.lines ? course.id : '',
  );
  const t = es.training;
  const toCourse = () => back({ name: 'course', course: courseId });

  if (!course?.lines) return <NotFound back={back} />;
  if (loaded.status === 'loading') return <LoadingScreen title={course.name} backLabel={t.back} onBack={toCourse} />;
  if (loaded.status === 'error') {
    return <LoadFailedScreen title={course.name} backLabel={t.back} onBack={toCourse} message={t.practice.loadError} />;
  }
  return (
    <PracticeRun
      key={`${course.id}:${mode}`}
      course={course}
      data={loaded.value}
      mode={mode}
      store={store}
      settingsStore={settingsStore}
      back={back}
    />
  );
}

interface RunProps {
  readonly course: CourseInfo;
  readonly data: CourseLines;
  readonly mode: PracticeMode;
  readonly store: TrainingStore;
  readonly settingsStore: SettingsStore;
  readonly back: Navigation['back'];
}

function PracticeRun({ course, data, mode, store, settingsStore, back }: RunProps) {
  const t = es.training;
  const P = t.practice;
  const { graph, file } = data;
  const settings = useSettings(settingsStore);
  const progress = useTraining(store);
  const saved = progress.courses[course.id] ?? EMPTY_COURSE;
  const reduced = settings.motion === 'reduced';
  const [run, setRun] = useState(() => beginRun(graph, saved.cards, mode, reduced));
  const [tally, setTally] = useState({ ok: 0, bad: 0 });
  const opened = useRef(false);
  useWakeLock(true);

  useEffect(() => {
    // Una sola vez al abrir: se descartan las tarjetas de variantes que ya no existen y se cuenta la sesión.
    if (opened.current) return;
    opened.current = true;
    store.pruneCards(course.id, new Set(graph.cards));
    store.startSession(course.id);
  }, [store, course.id, graph]);

  const enter = (next: Run): Run => {
    if (next.phase === 'result') store.completeLine(course.id);
    return next;
  };

  // Mientras se llega a la posición o responde el bot, el tiempo lo lleva un temporizador por jugada.
  useEffect(() => {
    if (run.phase === 'setup') {
      const timer = window.setTimeout(() => setRun(stepSetup(graph, run)), reduced ? 0 : STEP_MS);
      return () => window.clearTimeout(timer);
    }
    if (run.phase === 'bot') {
      const timer = window.setTimeout(
        () => setRun(enter(botReply(graph, saved.cards, run))),
        reduced ? BOT_REDUCED_MS : BOT_MS,
      );
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // Cada jugada cambia `run.game`: ese es el momento de programar la siguiente.
  }, [run.phase, run.game]);

  const position = positionAt(run.game);
  const key = positionKey(position);
  const node = graph.nodes.get(key);
  const asking = run.phase === 'user';
  const side = graph.userSide;
  const summary = summarizeSaved(saved.cards, graph.cards.length, Date.now());

  /** Anota el fallo de esta posición, una sola vez por vuelta. */
  const fail = (attempt: Attempt): Attempt => {
    if (attempt.failed) return attempt;
    store.reviewCard(course.id, key, false);
    return { ...attempt, failed: true };
  };

  const withSuggestion = (attempt: Attempt): Attempt =>
    attempt.suggest ? attempt : { ...attempt, suggest: suggestMove(graph, key, saved.cards, Date.now()) };

  /** Juega la jugada de la persona (o la que se le mostró) y deja que siga la variante. */
  const commit = (move: Move, shown: boolean) => {
    const failed = shown || run.attempt.failed;
    if (shown) fail(run.attempt);
    else store.reviewCard(course.id, key, true);
    setTally((current) => (failed ? { ...current, bad: current.bad + 1 } : { ...current, ok: current.ok + 1 }));
    const game = playMove(run.game, move);
    setRun(
      enter({
        ...run,
        game,
        queue: [],
        phase: phaseAt(graph, game),
        attempt: FRESH,
        note: shown ? 'revealed' : 'correct',
        asked: run.asked + 1,
        clean: run.clean + (failed ? 0 : 1),
      }),
    );
  };

  const onMove = (move: Move): boolean => {
    if (!asking || !node) return false;
    const san = sanOf(position, move);
    if (!node.next.has(san)) {
      const wrong = run.attempt.wrong + 1;
      const noted = fail(run.attempt);
      // Tras dos intentos fallidos se marca la pieza, para que nadie se atasque.
      const attempt =
        wrong >= 2 && noted.hints === 0 ? { ...withSuggestion(noted), wrong, hints: 1 } : { ...noted, wrong };
      setRun({ ...run, attempt, note: 'wrong' });
      return false;
    }
    commit(move, false);
    return true;
  };

  const hint = () => {
    if (!asking || !node) return;
    const attempt = withSuggestion(fail(run.attempt));
    if (attempt.hints < 2) {
      setRun({ ...run, attempt: { ...attempt, hints: attempt.hints + 1 }, note: null });
      return;
    }
    const move = attempt.suggest ? moveFromSan(position, attempt.suggest) : null;
    if (move) commit(move, true);
  };

  const again = () => setRun(beginRun(graph, saved.cards, mode, reduced));
  const toCourse = () => back({ name: 'course', course: course.id });

  // Casillas de la pista.
  let hintCells: number[] | undefined;
  if (asking && run.attempt.hints > 0 && run.attempt.suggest) {
    const suggested = moveFromSan(position, run.attempt.suggest);
    if (suggested) hintCells = run.attempt.hints >= 2 ? [suggested.from, suggested.to] : [suggested.from];
  }

  // Lo que dice el profesor.
  const parts: string[] = [];
  if (run.note === 'correct') parts.push(P.correct);
  if (run.note === 'revealed') parts.push(P.revealed);
  if (asking) {
    if (run.note === 'wrong') parts.push(P.wrong);
    if (run.attempt.hints === 1) parts.push(P.hint1);
    if (run.attempt.hints === 2) parts.push(P.hint2);
    if (parts.length === 0) parts.push(P.yourTurn(t.sideShort[side]));
  }
  if (run.phase === 'setup') parts.push(P.setup);
  if (run.phase === 'bot') parts.push(P.bot);
  const source = parts.join(' ');
  const text = useCoachText(source, `${run.game.gameId}:${run.game.revision}:${run.phase}:${run.note ?? ''}:${run.attempt.hints}`, true);
  const tone = run.note === 'wrong' && asking ? 'bad' : run.note === 'correct' || run.note === 'revealed' ? 'good' : 'neutral';

  const finished = run.phase === 'result';
  const ended = finished && node ? node.ends.map((index) => file.lines[index]!) : [];
  const possible = node && node.through.length === 1 ? file.lines[node.through[0]!]!.name : P.possible(node?.through.length ?? 0);
  const lastPly = run.game.plies[run.game.plies.length - 1];
  const moves = movesLine(run.game, displayMove, finished ? 60 : 10);

  return (
    <div className="screen trn-play" data-motion={settings.motion}>
      <TopBar
        title={course.name}
        subtitle={`${P.title} · ${t.sideLong[side]}`}
        backLabel={t.back}
        onBack={toCourse}
        progress={summary.mastery}
        progressLabel={P.mastery}
        end={
          <span className="trn-bar__step">
            {P.mastery} {t.percent(summary.mastery)}
          </span>
        }
      />
      <main className="trn-play__main">
        <div className="trn-play__board">
          <Board
            game={run.game}
            orientation={0}
            flipped={side === 'b'}
            motion={settings.motion}
            interactive={!finished}
            playAs={asking ? side : null}
            hints={hintCells}
            onMove={onMove}
          />
        </div>

        <section className="trn-play__panel" aria-label={P.title}>
          {finished ? (
            <div className="trn-card done-card">
              <div className="done-card__icon" aria-hidden="true">
                <Icon name="check" size={28} />
              </div>
              <h2 className="trn-card__title">{P.result.title}</h2>
              {ended.length > 0 && (
                <ul className="done-card__lines">
                  {ended.slice(0, 3).map((line) => (
                    <li key={line.moves}>
                      <span>{line.name}</span>
                      <span className="chip-meta">{line.eco}</span>
                    </li>
                  ))}
                </ul>
              )}
              {ended.length > 3 && <p className="trn-card__note">{P.result.more(ended.length - 3)}</p>}
              {run.asked > 0 && <p className="trn-card__text">{P.result.clean(run.clean, run.asked)}</p>}
              {summary.mastery >= 1 && <p className="trn-card__banner">{t.course.masteredBanner}</p>}
              <div className="trn-card__actions">
                <button type="button" className="btn btn--primary" onClick={again}>
                  {P.result.next}
                  <Icon name="forward" size={18} />
                </button>
                <button type="button" className="btn btn--ghost" onClick={toCourse}>
                  {P.result.exit}
                </button>
              </div>
            </div>
          ) : (
            <>
              <Coach text={text} tone={tone} />
              <div className="trn-actions">
                <button type="button" className="btn btn--grow" onClick={hint} disabled={!asking}>
                  <Icon name="bulb" size={18} />
                  {run.attempt.hints === 0 ? P.hint : run.attempt.hints === 1 ? P.moreHint : P.showMove}
                </button>
              </div>
              <ul className="trn-chips">
                <li className="chip-meta">
                  <Icon name="target" size={14} />
                  {possible}
                </li>
                <li className="chip-meta">{P.session(tally.ok, tally.bad)}</li>
              </ul>
            </>
          )}
          <p className="trn-moves">
            <span className="trn-moves__label">{P.moves}</span>
            <span className="trn-moves__list">{moves || P.noMoves}</span>
          </p>
        </section>
      </main>
      <div role="status" aria-live="polite" className="visually-hidden">
        {lastPly ? `${announcePly(lastPly)} ` : ''}
        {finished ? P.result.title : text.plain}
      </div>
    </div>
  );
}
