import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { es } from '../../i18n/es';
import { routeHash, type Route } from '../route';
import { Icon } from '../icons';

/** Enlace a otra pantalla: es un enlace de verdad (se puede abrir en otra pestaña), pero navega sin recargar. */
export function RouteLink({
  route,
  go,
  className,
  children,
}: {
  readonly route: Route;
  readonly go: (route: Route) => void;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    go(route);
  };
  return (
    <a className={className} href={routeHash(route) || '#'} onClick={onClick}>
      {children}
    </a>
  );
}

interface TopBarProps {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly backLabel: string;
  readonly onBack: () => void;
  /** De 0 a 1: una raya fina de avance al pie de la barra. */
  readonly progress?: number;
  readonly progressLabel?: string;
  readonly end?: ReactNode;
}

/** Barra de arriba de las pantallas de entrenamiento: volver, título y, si aplica, avance. */
export function TopBar({ title, subtitle, backLabel, onBack, progress, progressLabel, end }: TopBarProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  // Al cambiar de pantalla el foco pasa al título: quien usa lector de pantalla sabe dónde está.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header className="trn-bar">
      <button type="button" className="icon-btn" onClick={onBack} aria-label={backLabel}>
        <Icon name="back" />
      </button>
      <div className="trn-bar__text">
        <h1 className="trn-bar__title" tabIndex={-1} ref={heading}>
          {title}
        </h1>
        {subtitle && <p className="trn-bar__sub">{subtitle}</p>}
      </div>
      {end}
      {progress !== undefined && (
        <div
          className="trn-progress"
          role="progressbar"
          aria-label={progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span style={{ '--p': Math.round(progress * 100) } as CSSProperties} />
        </div>
      )}
    </header>
  );
}

/** Barra de dominio (0 a 1). */
export function MasteryBar({ value, label }: { readonly value: number; readonly label: string }) {
  const percent = Math.round(value * 100);
  return (
    <div
      className="mbar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-full={value >= 1 ? '' : undefined}
    >
      <span style={{ '--p': percent } as CSSProperties} />
    </div>
  );
}

/** Anillo con el porcentaje de dominio en el centro. */
export function MasteryRing({ value, label }: { readonly value: number; readonly label: string }) {
  const percent = Math.round(value * 100);
  return (
    <div className="ring" role="img" aria-label={`${label}: ${percent} %`} data-full={value >= 1 ? '' : undefined}>
      <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <circle className="ring__track" cx="18" cy="18" r="15.5" pathLength="100" />
        <circle
          className="ring__fill"
          cx="18"
          cy="18"
          r="15.5"
          pathLength="100"
          strokeDasharray={`${percent} 100`}
          // Con el trazo redondeado, un 0 % se dibujaría como un puntito.
          strokeLinecap={percent > 0 ? 'round' : 'butt'}
        />
      </svg>
      <span className="ring__value" aria-hidden="true">
        {percent}
        <small>%</small>
      </span>
    </div>
  );
}

/** Pantalla mientras llega lo que falta (la lección, las variantes). */
export function LoadingScreen({ title, backLabel, onBack }: { title: ReactNode; backLabel: string; onBack: () => void }) {
  return (
    <div className="screen trn">
      <TopBar title={title} backLabel={backLabel} onBack={onBack} />
      <main className="trn-main">
        <p className="trn-lead" role="status">
          {es.training.loading}
        </p>
      </main>
    </div>
  );
}

/** Si algo no llegó (sin conexión, o la app se actualizó mientras estaba abierta), recargar lo arregla. */
export function LoadFailedScreen({
  title,
  backLabel,
  onBack,
  message = es.training.loadError,
}: {
  title: ReactNode;
  backLabel: string;
  onBack: () => void;
  message?: string;
}) {
  return (
    <div className="screen trn">
      <TopBar title={title} backLabel={backLabel} onBack={onBack} />
      <main className="trn-main">
        <p className="trn-lead" role="alert">
          {message}
        </p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          {es.training.reload}
        </button>
      </main>
    </div>
  );
}
