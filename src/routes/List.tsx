import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function List() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('list.title')}</h2>
      </header>
      <p className="muted">{t('list.empty')}</p>
      {/* TODO build step 6: items grouped by category, ordered by active market layout, tap-to-check */}
      <div className="fab-row">
        <Link to="/item" className="btn-primary">
          + {t('list.addItem')}
        </Link>
        <Link to="/done-shopping" className="btn-secondary">
          {t('list.doneShopping')}
        </Link>
      </div>
    </div>
  );
}
