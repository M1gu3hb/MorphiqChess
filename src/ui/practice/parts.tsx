import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '../icons';

interface BotsBarProps {
  readonly title: ReactNode;
  readonly subtitle?: ReactNode;
  readonly backLabel: string;
  readonly onBack: () => void;
}

/** Barra de arriba del menú de rivales: volver y título. El foco pasa al título al abrir la pantalla. */
export function BotsBar({ title, subtitle, backLabel, onBack }: BotsBarProps) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header className="bots-bar">
      <button type="button" className="icon-btn" onClick={onBack} aria-label={backLabel}>
        <Icon name="back" />
      </button>
      <div className="bots-bar__text">
        <h1 className="bots-bar__title" tabIndex={-1} ref={heading}>
          {title}
        </h1>
        {subtitle && <p className="bots-bar__sub">{subtitle}</p>}
      </div>
    </header>
  );
}
