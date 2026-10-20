import { useState } from 'react';
import { catalog, coursesIn, GROUPS } from '../../training/catalog';
import { courseStatus, overview } from '../../training/overview';
import { inlineToText } from '../../training/markup';
import type { TrainingStore } from '../../training/progress';
import type { CourseInfo } from '../../training/types';
import { es } from '../../i18n/es';
import { Icon } from '../icons';
import type { Navigation } from '../route';
import { CreditsDialog } from './CreditsDialog';
import { useTraining } from './hooks';
import { displayMove } from './RichText';
import { MasteryBar, RouteLink, TopBar } from './parts';

interface Props extends Navigation {
  readonly store: TrainingStore;
}

export function TrainingMenu({ store, go, back }: Props) {
  const t = es.training;
  const progress = useTraining(store);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const all = overview(catalog.courses, progress, Date.now());

  return (
    <div className="screen trn">
      <TopBar title={t.title} backLabel={es.game.actions.home} onBack={() => back({ name: 'home' })} />
      <main className="trn-main">
        <p className="trn-lead">{t.menu.lead}</p>

        <ul className="trn-stats">
          <li className="stat">
            <span className="stat__label">{t.menu.stats.lessons}</span>
            <span className="stat__value">{t.menu.stats.lessonsValue(all.lessonsDone, all.lessonsTotal)}</span>
          </li>
          <li className="stat">
            <span className="stat__label">{t.menu.stats.mastery}</span>
            <span className="stat__value">{t.percent(all.mastery ?? 0)}</span>
            <span className="stat__note">{t.menu.stats.masteryNote}</span>
          </li>
          <li className="stat">
            <span className="stat__label">{t.menu.stats.review}</span>
            <span className="stat__value">{all.review}</span>
            <span className="stat__note">{t.menu.stats.reviewNote}</span>
          </li>
        </ul>

        {GROUPS.map((group) => (
          <section key={group} className="trn-group" aria-labelledby={`group-${group}`}>
            <div className="trn-group__head">
              <h2 id={`group-${group}`} className="trn-group__title">
                {t.menu.groups[group].title}
              </h2>
              <p className="trn-group__hint">{t.menu.groups[group].hint}</p>
            </div>
            <ul className="trn-list">
              {coursesIn(group).map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} store={store} go={go} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        <button type="button" className="btn btn--ghost trn-credits" onClick={() => setCreditsOpen(true)}>
          <Icon name="info" />
          {t.menu.credits}
        </button>
      </main>
      <CreditsDialog open={creditsOpen} onClose={() => setCreditsOpen(false)} />
    </div>
  );
}

function CourseCard({ course, store, go }: { course: CourseInfo; store: TrainingStore; go: Navigation['go'] }) {
  const t = es.training.menu;
  const progress = useTraining(store);
  const status = courseStatus(course, progress, Date.now());
  const mastery = status.summary?.mastery ?? null;
  const mastered = mastery !== null && mastery >= 1;

  return (
    <RouteLink route={{ name: 'course', course: course.id }} go={go} className="ccard">
      <span className="ccard__head">
        <span className="ccard__name">{course.name}</span>
        {mastered ? (
          <span className="ccard__badge">
            <Icon name="check" size={16} />
            {t.mastered}
          </span>
        ) : (
          mastery !== null && <span className="ccard__pct">{es.training.percent(mastery)}</span>
        )}
      </span>
      <span className="ccard__summary">{inlineToText(course.summary, displayMove)}</span>
      {mastery !== null && <MasteryBar value={mastery} label={`${t.mastery}: ${course.name}`} />}
      <span className="ccard__meta">
        {course.lessons.length > 0 && (
          <span className="chip-meta">
            <Icon name="book" size={15} />
            {status.lessonsDone > 0
              ? t.lessonsDone(status.lessonsDone, course.lessons.length)
              : t.lessons(course.lessons.length)}
          </span>
        )}
        {course.lines && (
          <span className="chip-meta">
            <Icon name="target" size={15} />
            {t.variants(course.lines.count)} · {t.positions(course.lines.cards)}
          </span>
        )}
      </span>
    </RouteLink>
  );
}
