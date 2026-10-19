import { useEffect, useId, useRef, type ReactNode } from 'react';
import { es } from '../i18n/es';
import { Icon } from './icons';

interface DialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

/**
 * Diálogo modal con el elemento nativo `<dialog>`: el navegador atrapa el foco, bloquea el resto de
 * la página, cierra con Escape y devuelve el foco a quien lo abrió.
 */
export function Dialog({ open, title, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clic en el fondo oscuro (el propio <dialog>, no su contenido).
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="dialog__body">
          <div className="dialog__head">
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label={es.dialogs.settings.close}>
              <Icon name="close" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
