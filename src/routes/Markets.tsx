import { useTranslation } from 'react-i18next';

export default function Markets() {
  const { t } = useTranslation();
  return (
    <div className="page">
      <header className="page-header">
        <h2>{t('markets.title')}</h2>
      </header>
      {/* TODO build step 4: list markets, add/edit, set default, link to /markets/:id layout editor */}
      <p className="muted">No markets yet.</p>
    </div>
  );
}
