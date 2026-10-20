import { useState } from 'react';
import type { SettingsStore } from '../../game';
import { createGame, playMove, positionAt } from '../../game';
import { sanToMove, type Move } from '../../engine';
import { courseById, loadLesson } from '../../training/catalog';
import { START, bubblesIn, lessonProgress, nextPos, prevPos, type LessonPos } from '../../training/lesson';
import { inlineToText } from '../../training/markup';
import { advanceTo, hintSquares, sanOf } from '../../training/practice';
import type { TrainingStore } from '../../training/progress';
import type { CourseInfo, Lesson } from '../../training/types';
import { es } from '../../i18n/es';
import { Board } from '../board/Board';
import { Icon } from '../icons';
import type { Navigation } from '../route';
import { Coach } from './Coach';
import { NotFound } from './CourseScreen';
import { useLoaded } from './hooks';
import { Inline, Runs, displayMove } from './RichText';
import { LoadFailedScreen, LoadingScreen, RouteLink, TopBar } from './parts';
import { useCoachText } from './useCoachText';
import { useSettings } from '../hooks';
import { parseInline } from '../../training/markup';

interface Props extends Navigation {
  readonly store: TrainingStore;
  readonly settingsStore: SettingsStore;
  readonly courseId: string;
  readonly lessonId: string;
}

export function LessonScreen({ store, settingsStore, courseId, lessonId, go, back }: Props) {
  const course = courseById(courseId);
  const info = course?.lessons.find((lesson) => lesson.id === lessonId);
  const loaded = useLoaded(() => (info ? loadLesson(lessonId) : Promise.reject(new Error('sin lección'))), info ? lessonId : '');
  const t = es.training;
  const toCourse = () => back({ name: 'course', course: courseId });

  if (!course || !info) return <NotFound back={back} />;
  if (loaded.status === 'loading') return <LoadingScreen title={course.name} backLabel={t.back} onBack={toCourse} />;
  if (loaded.status === 'error') return <LoadFailedScreen title={course.name} backLabel={t.back} onBack={toCourse} />;
  return (
    <LessonPlayer
      key={loaded.value.id}
      course={course}
      lesson={loaded.value}
      store={store}
      settingsStore={settingsStore}
      go={go}
      back={back}
    />
  );
}

/** Lo que pasó en el paso para jugar en el que va la persona. */
interface PlayState {
  readonly outcome: { readonly kind: 'right' | 'shown'; readonly san: string } | null;
  readonly wrong: number;
  /** 0 = sin pista; 1 = pieza marcada; 2 = pieza y destino. */
  readonly hints: number;
}

const FRESH_PLAY: PlayState = { outcome: null, wrong: 0, hints: 0 };

function LessonPlayer({
  course,
  lesson,
  store,
  settingsStore,
  go,
  back,
}: Navigation & { course: CourseInfo; lesson: Lesson; store: TrainingStore; settingsStore: SettingsStore }) {
  const t = es.training;
  const L = t.lesson;
  const settings = useSettings(settingsStore);
  const [pos, setPos] = useState<LessonPos>(START);
  const [game, setGame] = useState(() => createGame(lesson.steps[0]!.fen));
  const [play, setPlay] = useState<PlayState>(FRESH_PLAY);
  const [finished, setFinished] = useState(false);
  const [clean, setClean] = useState(0);

  const step = lesson.steps[pos.step]!;
  const playSteps = lesson.steps.filter((entry) => entry.kind === 'play').length;
  const position = positionAt(game);
  const solved = play.outcome;

  // El texto del profesor: un globo, la instrucción del paso para jugar o la reacción a la jugada.
  let source: string;
  if (step.kind === 'teach') source = step.bubbles[pos.bubble]!;
  else if (solved?.kind === 'right') source = L.correct(`{{${solved.san}}}`);
  else if (solved?.kind === 'shown') source = L.shown(`{{${solved.san}}}`);
  else source = step.prompt;
  const key = `${lesson.id}:${pos.step}:${pos.bubble}:${solved?.kind ?? ''}`;
  const text = useCoachText(source, key, settings.motion === 'reduced');

  const previous = prevPos(lesson, pos);
  const marks = step.kind === 'play' && !solved && play.hints > 0 ? hintSquares(position, step.accept) : null;
  const hintCells = marks ? (play.hints >= 2 ? [marks.from, marks.to] : [marks.from]) : undefined;

  const goTo = (next: LessonPos) => {
    if (next.step !== pos.step) {
      setGame(advanceTo(game, lesson.steps[next.step]!.fen));
      setPlay(FRESH_PLAY);
    }
    setPos(next);
  };

  const advance = () => {
    // Si el texto aún se está escribiendo, el primer toque lo muestra completo.
    if (!text.done) {
      text.skip();
      return;
    }
    const next = nextPos(lesson, pos);
    if (next) {
      goTo(next);
    } else {
      store.completeLesson(course.id, lesson.id);
      setFinished(true);
    }
  };

  const restart = () => {
    setPos(START);
    setGame(createGame(lesson.steps[0]!.fen));
    setPlay(FRESH_PLAY);
    setClean(0);
    setFinished(false);
  };

  const onMove = (move: Move): boolean => {
    if (step.kind !== 'play' || solved) return false;
    const san = sanOf(position, move);
    if (!step.accept.includes(san)) {
      const wrong = play.wrong + 1;
      setPlay({ ...play, wrong, hints: wrong >= 2 ? Math.max(play.hints, 1) : play.hints });
      return false;
    }
    setGame(playMove(game, move));
    setPlay({ ...play, outcome: { kind: 'right', san } });
    if (play.wrong === 0 && play.hints === 0) setClean((count) => count + 1);
    return true;
  };

  const hint = () => {
    if (step.kind !== 'play' || solved) return;
    if (play.hints < 2) {
      setPlay({ ...play, hints: play.hints + 1 });
      return;
    }
    for (const san of step.accept) {
      const move = sanToMove(position, san);
      if (!move) continue;
      setGame(playMove(game, move));
      setPlay({ ...play, outcome: { kind: 'shown', san } });
      return;
    }
  };

  const last = nextPos(lesson, pos) === null;
  const toCourse = () => back({ name: 'course', course: course.id });
  const nextLesson = course.lessons[course.lessons.findIndex((entry) => entry.id === lesson.id) + 1];
  const playing = step.kind === 'play' && !solved;

  return (
    <div className="screen trn-play" data-motion={settings.motion}>
      <TopBar
        title={course.name}
        subtitle={<Inline text={lesson.title} />}
        backLabel={t.back}
        onBack={toCourse}
        progress={finished ? 1 : lessonProgress(lesson, pos)}
        progressLabel={L.step(pos.step + 1, lesson.steps.length)}
        end={<span className="trn-bar__step">{L.step(pos.step + 1, lesson.steps.length)}</span>}
      />
      <main className="trn-play__main">
        <div className="trn-play__board">
          <Board
            game={game}
            orientation={0}
            motion={settings.motion}
            interactive={step.kind === 'play' && !finished}
            playAs={playing && !finished ? position.turn : null}
            hints={hintCells}
            onMove={onMove}
          />
        </div>

        <section className="trn-play__panel" aria-label={inlineToText(lesson.title, displayMove)}>
          {finished ? (
            <div className="trn-card done-card">
              <div className="done-card__icon" aria-hidden="true">
                <Icon name="check" size={28} />
              </div>
              <h2 className="trn-card__title">{L.done.title}</h2>
              <p className="trn-card__text">{L.done.body(inlineToText(lesson.title, displayMove))}</p>
              {playSteps > 0 && <p className="trn-card__text">{L.done.clean(clean, playSteps)}</p>}
              <div className="trn-card__actions">
                {nextLesson ? (
                  <RouteLink
                    route={{ name: 'lesson', course: course.id, lesson: nextLesson.id }}
                    go={go}
                    className="btn btn--primary"
                  >
                    {L.done.nextLesson}
                  </RouteLink>
                ) : course.lines ? (
                  <RouteLink route={{ name: 'practice', course: course.id, mode: 'smart' }} go={go} className="btn btn--primary">
                    {L.done.practice}
                  </RouteLink>
                ) : (
                  <button type="button" className="btn btn--primary" onClick={toCourse}>
                    {t.backToCourse}
                  </button>
                )}
                <button type="button" className="btn" onClick={restart}>
                  {L.done.again}
                </button>
                {(nextLesson || course.lines) && (
                  <button type="button" className="btn btn--ghost" onClick={toCourse}>
                    {t.backToCourse}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <Coach
                title={step.kind === 'teach' ? step.title : L.yourTurn}
                text={text}
                tone={solved ? 'good' : play.wrong > 0 ? 'bad' : 'neutral'}
              >
                <div aria-live="polite">
                  {play.hints > 0 && !solved && step.kind === 'play' && (
                    <p className="bubble__note" data-tone="hint">
                      <Icon name="bulb" size={16} />
                      <span>
                        <Runs runs={parseInline(step.hint)} />
                      </span>
                    </p>
                  )}
                  {play.wrong > 0 && !solved && (
                    <p className="bubble__note" data-tone="bad">
                      {L.wrong}
                    </p>
                  )}
                </div>
              </Coach>

              <div className="trn-actions">
                {step.kind === 'teach' || solved ? (
                  <>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => previous && goTo(previous)}
                      disabled={!previous || !!solved}
                      aria-label={L.prev}
                    >
                      <Icon name="back" />
                    </button>
                    <button type="button" className="btn btn--primary btn--grow" onClick={advance}>
                      {last ? L.finish : L.next}
                      <Icon name="forward" size={18} />
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn--grow" onClick={hint}>
                    <Icon name="bulb" size={18} />
                    {play.hints === 0 ? L.hint : play.hints === 1 ? L.moreHint : L.showMove}
                  </button>
                )}
              </div>
              {step.kind === 'teach' && bubblesIn(step) > 1 && (
                <ol className="dots" aria-hidden="true">
                  {step.bubbles.map((_, at) => (
                    <li key={at} data-on={at <= pos.bubble ? '' : undefined} />
                  ))}
                </ol>
              )}
            </>
          )}
        </section>
      </main>
      <div role="status" aria-live="polite" className="visually-hidden">
        {finished ? L.done.title : text.plain}
      </div>
    </div>
  );
}
