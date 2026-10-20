import { useEffect, useId, useMemo, useState } from 'react';
import { prefetchEngine } from '../../bots/engine';
import { PERSONAS, personaById, tierOf, type Persona, type Tier } from '../../bots/personas';
import { EMPTY_TALLY, type BotsStore, type Tally } from '../../bots/records';
import { currentGame, resumable } from '../../bots/session';
import type { Color } from '../../engine';
import type { GameStore } from '../../game';
import { es } from '../../i18n/es';
import { Dialog } from '../Dialog';
import { Icon } from '../icons';
import type { Navigation } from '../route';
import { useBots } from './hooks';
import { BotsBar } from './parts';
import { eloLabel, PersonaAvatar } from './PersonaAvatar';

const TIERS: readonly Tier[] = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];

export type SideChoice = Color | 'random';

interface Props extends Navigation {
  readonly store: BotsStore;
  readonly gameStore: GameStore;
  /** Empieza una partida nueva contra `persona`. */
  readonly onStart: (persona: Persona, choice: SideChoice) => void;
  /** Retoma la partida que quedó en curso. */
  readonly onResume: (bot: string, side: Color) => void;
}

const played = (tally: Tally): boolean => tally.wins + tally.draws + tally.losses > 0;

const recordText = (tally: Tally): string =>
  played(tally) ? es.bots.record(tally.wins, tally.draws, tally.losses) : es.bots.noRecord;

/** Elegir contra quién practicar: los doce rivales, de menor a mayor Elo, agrupados por nivel. */
export function BotsMenu({ store, gameStore, back, onStart, onResume }: Props) {
  const t = es.bots;
  const state = useBots(store);
  const [picked, setPicked] = useState<Persona | null>(null);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // Los archivos del motor (unos 2 MB) se piden con calma mientras se elige rival.
  useEffect(() => prefetchEngine(), []);

  const saved = useMemo(() => currentGame(gameStore), [gameStore]);
  const resume = resumable(state, saved);
  const resumeBot = resume ? personaById(resume.bot) : undefined;

  const beaten = PERSONAS.filter((persona) => (state.records[persona.id]?.wins ?? 0) > 0).length;
  const next = PERSONAS.find((persona) => (state.records[persona.id]?.wins ?? 0) === 0);
  const anyRecord = PERSONAS.some((persona) => played(state.records[persona.id] ?? EMPTY_TALLY));

  return (
    <div className="screen bots">
      <BotsBar title={t.title} backLabel={es.game.actions.home} onBack={() => back({ name: 'home' })} />
      <main className="bots-main">
        <p className="bots-lead">{t.lead}</p>

        {resume && resumeBot && (
          <section className="bots-resume" aria-labelledby="bots-resume-title" data-tier={tierOf(resumeBot.elo)}>
            <PersonaAvatar persona={resumeBot} size="sm" />
            <div className="bots-resume__text">
              <h2 id="bots-resume-title" className="bots-resume__title">
                {t.resume.title}
              </h2>
              <p>{t.resume.body(resumeBot.name, es.sidesOf[resume.side], resume.plies)}</p>
            </div>
            <button type="button" className="btn btn--primary" onClick={() => onResume(resume.bot, resume.side)}>
              <Icon name="play" />
              {t.resume.action}
            </button>
          </section>
        )}

        <p className="bots-progress">{t.progress(beaten, PERSONAS.length)}</p>

        {TIERS.map((tier) => {
          const members = PERSONAS.filter((persona) => tierOf(persona.elo) === tier);
          if (members.length === 0) return null;
          return (
            <section key={tier} className="bots-tier" data-tier={tier} aria-labelledby={`tier-${tier}`}>
              <div className="bots-tier__head">
                <h2 id={`tier-${tier}`} className="bots-tier__title">
                  {t.tiers[tier].title}
                </h2>
                <p className="bots-tier__hint">{t.tiers[tier].hint}</p>
              </div>
              <ul className="bots-list">
                {members.map((persona) => (
                  <li key={persona.id}>
                    <BotCard
                      persona={persona}
                      tally={state.records[persona.id] ?? EMPTY_TALLY}
                      next={persona === next}
                      onPick={() => setPicked(persona)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <p className="bots-note">{t.eloNote}</p>

        <div className="bots-foot">
          <button type="button" className="btn btn--ghost" onClick={() => setCreditsOpen(true)}>
            <Icon name="info" />
            {t.credits.title}
          </button>
          {anyRecord && (
            <button type="button" className="btn btn--ghost" onClick={() => setResetOpen(true)}>
              <Icon name="trash" />
              {t.resetRecords}
            </button>
          )}
        </div>
      </main>

      <Dialog open={picked !== null} title={picked ? t.picker.title(picked.name) : ''} onClose={() => setPicked(null)}>
        {picked && (
          <Picker
            persona={picked}
            tally={state.records[picked.id] ?? EMPTY_TALLY}
            replacing={resume && resumeBot ? resumeBot : null}
            onChoose={(choice) => {
              setPicked(null);
              onStart(picked, choice);
            }}
          />
        )}
      </Dialog>

      <Dialog open={creditsOpen} title={t.credits.title} onClose={() => setCreditsOpen(false)}>
        <p className="dialog__text">{t.credits.body}</p>
        <ul className="bots-links">
          {t.credits.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="dialog__actions">
          <button type="button" className="btn btn--primary" onClick={() => setCreditsOpen(false)}>
            {t.result.close}
          </button>
        </div>
      </Dialog>

      <Dialog open={resetOpen} title={t.resetTitle} onClose={() => setResetOpen(false)}>
        <p className="dialog__text">{t.resetBody}</p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setResetOpen(false)}>
            {es.dialogs.cancel}
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              store.resetRecords();
              setResetOpen(false);
            }}
          >
            {t.resetConfirm}
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function BotCard({
  persona,
  tally,
  next,
  onPick,
}: {
  readonly persona: Persona;
  readonly tally: Tally;
  readonly next: boolean;
  readonly onPick: () => void;
}) {
  const t = es.bots;
  const describedBy = useId();
  const elo = eloLabel(persona, t.elo);
  const won = tally.wins > 0;

  return (
    <button
      type="button"
      className="bcard"
      data-tier={tierOf(persona.elo)}
      data-beaten={won ? '' : undefined}
      data-next={next ? '' : undefined}
      aria-label={t.cardLabel(persona.name, elo)}
      aria-describedby={describedBy}
      onClick={onPick}
    >
      <PersonaAvatar persona={persona} />
      <span className="bcard__body">
        <span className="bcard__head">
          <span className="bcard__name">{persona.name}</span>
          <span className="bcard__elo">{elo}</span>
        </span>
        <span id={describedBy} className="bcard__text">
          <span className="bcard__tag">{persona.tagline}</span>
          <span className="bcard__rec">{recordText(tally)}</span>
        </span>
        {(won || next) && (
          <span className="bcard__badges">
            {won && (
              <span className="badge" data-kind="beaten">
                <Icon name="check" size={15} />
                {t.beaten}
              </span>
            )}
            {next && (
              <span className="badge" data-kind="next">
                <Icon name="target" size={15} />
                {t.nextChallenge}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}

function Picker({
  persona,
  tally,
  replacing,
  onChoose,
}: {
  readonly persona: Persona;
  readonly tally: Tally;
  /** Rival de la partida en curso, que esta reemplazaría. */
  readonly replacing: Persona | null;
  readonly onChoose: (choice: SideChoice) => void;
}) {
  const t = es.bots;
  return (
    <div className="picker" data-tier={tierOf(persona.elo)}>
      <div className="picker__who">
        <PersonaAvatar persona={persona} size="lg" />
        <div className="picker__text">
          <p className="picker__elo">{eloLabel(persona, t.elo)}</p>
          <p>{persona.tagline}</p>
          <p className="picker__rec">{recordText(tally)}</p>
        </div>
      </div>
      {replacing && <p className="dialog__note">{t.picker.replace(replacing.name)}</p>}
      <div className="picker__choices">
        <button type="button" className="pick" onClick={() => onChoose('w')}>
          <span className="chip" data-side="w" aria-hidden="true" />
          <span className="pick__text">
            <b>{t.picker.white}</b>
            <small>{t.picker.whiteHelp}</small>
          </span>
        </button>
        <button type="button" className="pick" onClick={() => onChoose('b')}>
          <span className="chip" data-side="b" aria-hidden="true" />
          <span className="pick__text">
            <b>{t.picker.black}</b>
            <small>{t.picker.blackHelp}</small>
          </span>
        </button>
        <button type="button" className="pick" onClick={() => onChoose('random')}>
          <span className="chip chip--split" aria-hidden="true" />
          <span className="pick__text">
            <b>{t.picker.random}</b>
            <small>{t.picker.randomHelp}</small>
          </span>
        </button>
      </div>
    </div>
  );
}
