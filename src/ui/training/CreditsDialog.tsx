import { catalog } from '../../training/catalog';
import { es } from '../../i18n/es';
import { Dialog } from '../Dialog';

export function CreditsDialog({ open, onClose }: { readonly open: boolean; readonly onClose: () => void }) {
  const t = es.training.credits;
  return (
    <Dialog open={open} title={t.title} onClose={onClose}>
      <p className="dialog__text">{t.intro}</p>
      <ul className="credits">
        {catalog.credits.map((credit) => (
          <li key={credit.name} className="credits__item">
            <a href={credit.url} target="_blank" rel="noopener noreferrer" className="credits__name">
              {credit.name}
            </a>
            <p className="credits__use">{credit.use}</p>
            <p className="credits__license">{t.license(credit.license, credit.holder)}</p>
          </li>
        ))}
      </ul>
      <p className="credits__cite">{t.cite}</p>
      <p className="credits__note">{t.notices}</p>
      <div className="dialog__actions">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t.close}
        </button>
      </div>
    </Dialog>
  );
}
