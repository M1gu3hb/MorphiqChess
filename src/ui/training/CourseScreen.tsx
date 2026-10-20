import { useState } from 'react';
import { courseById } from '../../training/catalog';
import { courseStatus } from '../../training/overview';
import { inlineToText } from '../../training/markup';
import { EMPTY_COURSE, type TrainingStore } from '../../training/progress';
import type { CourseInfo } from '../../training/types';
import { es } from '../../i18n/es';
import { Dialog } from '../Dialog';
import { Icon } from '../icons';
import { routeHash, type Navigation, type Route } from '../route';
import { useTraining } from './hooks';
import { Inline, displayMove } from './RichText';
import { MasteryRing, RouteLink, TopBar } from './parts';

interface Props extends Navigation {
  readonly store: TrainingStore;
  readonly courseId: string;
}

export function CourseScreen({ store, courseId, go, back }: Props) {
  const course = courseById(courseId);
  if (!course) return <NotFound back={back} />;
  return <CourseView course={course} store={store} go={go} back={back} />;
}

export function NotFound({ back }: { readonly back: Navigation['back'] }) {
  const t = es.training;
  return (
    <div className="screen trn">
      <TopBar title={t.title} backLabel={t.back} onBack={() => back({ name: 'training' })} />
      <main className="trn-main">
        <p className="trn-lead">{t.notFound}</p>
        <a className="btn btn--primary" href={routeHash({ name: 'training' })}>
          {t.toMenu}
        </a>
      </main>
    </div>
  );
}

function CourseView({ course, store, go, back }: Navigation & { course: CourseInfo; store: TrainingStore }) {
  const t = es.training;
  const c = t.course;
  const progress = useTraining(store);
  const saved = progress.courses[course.id] ?? EMPTY_COURSE;
  const status = courseStatus(course, progress, Date.now());
  const summary = status.summary;
  const [resetOpen, setResetOpen] = useState(false);
  const practice = (mode: 'smart' | 'start'): Route => ({ name: 'practice', course: course.id, mode });
  const hasProgress = Object.keys(saved.cards).length > 0 || Object.keys(saved.lessons).length > 0;

  return (
    <div className="screen trn">
      <TopBar
        title={course.name}
        subtitle={course.group === 'fundamentos' ? undefined : t.sideLong[course.side]}
        backLabel={t.back}
        onBack={() => back({ name: 'training' })}
      />
      <main className="trn-main">
        <p className="trn-lead">{inlineToText(course.summary, displayMove)}</p>

        {course.lines && summary && (
          <section className="trn-card practice-card" aria-labelledby="practice-title">
            <div className="practice-card__top">
              <MasteryRing value={summary.mastery} label={t.menu.mastery} />
              <div>
                <h2 id="practice-title" className="trn-card__title">
                  {c.practice}
                </h2>
                <p className="trn-card__text">
                  {t.menu.variants(course.lines.count)} · {t.menu.positions(course.lines.cards)}
                </p>
              </div>
            </div>
            <p className="trn-card__text">{c.practiceLead}</p>

            <ul className="breakdown">
              <li>
                <span className="breakdown__n">{summary.fresh}</span>
                <span className="breakdown__l">{c.breakdown.fresh}</span>
              </li>
              <li>
                <span className="breakdown__n">{status.review}</span>
                <span className="breakdown__l">{c.breakdown.review}</span>
              </li>
              <li>
                <span className="breakdown__n">{status.inProgress}</span>
                <span className="breakdown__l">{c.breakdown.progress}</span>
              </li>
              <li>
                <span className="breakdown__n">{summary.mastered}</span>
                <span className="breakdown__l">{c.breakdown.mastered}</span>
              </li>
            </ul>
            <p className="trn-card__note">{c.masteryLead}</p>
            {summary.mastery >= 1 && <p className="trn-card__banner">{c.masteredBanner}</p>}

            <div className="trn-card__actions">
              <button type="button" className="btn btn--primary btn--xl" onClick={() => go(practice('smart'))}>
                <Icon name="play" />
                {c.start}
              </button>
              <button type="button" className="btn btn--xl" onClick={() => go(practice('start'))}>
                {c.fromStart}
              </button>
            </div>
            <p className="trn-card__note">{c.startNote}</p>
          </section>
        )}

        {course.lessons.length > 0 && (
          <section className="trn-group" aria-labelledby="learn-title">
            <div className="trn-group__head">
              <h2 id="learn-title" className="trn-group__title">
                {c.learn}
              </h2>
              <p className="trn-group__hint">{c.learnLead}</p>
            </div>
            <ul className="trn-list">
              {course.lessons.map((lesson) => {
                const done = saved.lessons[lesson.id] !== undefined;
                return (
                  <li key={lesson.id}>
                    <RouteLink route={{ name: 'lesson', course: course.id, lesson: lesson.id }} go={go} className="lrow">
                      <span className="lrow__main">
                        <span className="lrow__title">
                          <Inline text={lesson.title} />
                        </span>
                        <span className="lrow__summary">
                          <Inline text={lesson.summary} />
                        </span>
                        <span className="lrow__meta">
                          <span className="chip-meta" data-level={lesson.level}>
                            {t.levels[lesson.level]}
                          </span>
                          <span className="chip-meta">{c.lessonSteps(lesson.steps)}</span>
                        </span>
                      </span>
                      <span className="lrow__state" data-done={done ? '' : undefined}>
                        {done ? <Icon name="check" size={18} /> : <Icon name="forward" size={18} />}
                        <span>{done ? c.lessonDone : c.open}</span>
                      </span>
                    </RouteLink>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {hasProgress && (
          <button type="button" className="btn btn--ghost btn--sm trn-reset" onClick={() => setResetOpen(true)}>
            <Icon name="trash" size={16} />
            {c.reset}
          </button>
        )}
      </main>

      <Dialog open={resetOpen} title={c.resetTitle} onClose={() => setResetOpen(false)}>
        <p className="dialog__text">{c.resetBody(course.name)}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setResetOpen(false)}>
            {c.cancel}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              store.resetCourse(course.id);
              setResetOpen(false);
            }}
          >
            {c.resetConfirm}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
