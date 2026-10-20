import { useEffect, useRef } from 'react';
import { es } from '../../i18n/es';

/** Pantalla de aviso cuando no llegó el código de una sección de la app (sin conexión, o la app se actualizó). */
export function LoadError({ onHome }: { readonly onHome: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="screen load-error">
      <main className="load-error__main">
        <h1 className="load-error__title" tabIndex={-1} ref={heading}>
          {es.training.title}
        </h1>
        <p className="load-error__text" role="alert">
          {es.training.loadError}
        </p>
        <div className="load-error__actions">
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            {es.training.reload}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onHome}>
            {es.game.actions.home}
          </button>
        </div>
      </main>
    </div>
  );
}

/** Mientras llega el código de una sección: una pantalla en blanco con aviso para lectores de pantalla. */
export function Loading() {
  return (
    <div className="screen load-error" aria-busy="true">
      <p className="visually-hidden" role="status">
        {es.training.loading}
      </p>
    </div>
  );
}
